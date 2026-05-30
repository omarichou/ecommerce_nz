"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Filter, Search, SlidersHorizontal } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import ProductCardModern from "@/components/product/ProductCardModern";
import { Button } from "@/components/ui/button";
import { categories, Product } from "@/data/products";

type ApiProduct = {
  _id: string;
  title?: { fr?: string; ar?: string };
  price?: number;
  ancien_price?: number;
  categorie?: string;
  array_ProductImg?: { secure_url?: string }[];
};

type Pagination = {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  hasNext: boolean;
  hasPrev: boolean;
};

type ApiResponse = {
  products?: ApiProduct[];
  pagination?: Pagination;
};

const ITEMS_PER_PAGE = 12;
const CATEGORY_PAGE_CACHE_PREFIX = "category-page-cache-v1";
const CATEGORY_PAGE_CACHE_TTL = 60 * 60 * 1000;

type CategoryPageCacheEntry = {
  timestamp: number;
  products: Product[];
  pagination: Pagination;
};

const getCategoryPageCacheKey = (categoryId: string, page: number, sortBy: string, search: string) =>
  `${CATEGORY_PAGE_CACHE_PREFIX}:${categoryId}:${page}:${sortBy}:${search.toLowerCase()}`;

const readCategoryPageCache = (cacheKey: string): CategoryPageCacheEntry | null => {
  if (typeof window === "undefined") return null;

  try {
    const cachedValue = window.localStorage.getItem(cacheKey);
    if (!cachedValue) return null;

    const parsedValue = JSON.parse(cachedValue) as CategoryPageCacheEntry;
    if (!parsedValue?.timestamp || !parsedValue.products || !parsedValue.pagination) return null;

    if (Date.now() - parsedValue.timestamp > CATEGORY_PAGE_CACHE_TTL) {
      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
};

const writeCategoryPageCache = (cacheKey: string, entry: Omit<CategoryPageCacheEntry, "timestamp">) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(cacheKey, JSON.stringify({ ...entry, timestamp: Date.now() }));
  } catch {
    // Ignore storage quota or serialization errors.
  }
};

const mapApiProduct = (product: ApiProduct): Product => {
  const images = (product.array_ProductImg || [])
    .map((img) => img.secure_url)
    .filter(Boolean) as string[];

  return {
    id: product._id,
    title: {
      fr: product.title?.fr || "Produit",
      ar: product.title?.ar || "",
    },
    price: product.price || 0,
    ancien_price: product.ancien_price || 0,
    category: product.categorie || "",
    images: images.length ? images : ["/placeholder.svg"],
    rating: 4.7,
  };
};

export default function CategoryPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [filters, setFilters] = useState({
    priceRange: [0, 10000] as [number, number],
    searchTerm: "",
    sortBy: "name",
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentCategory = categories.find((c) => c.name_search === id) || categories[0];
  const otherCategories = categories.filter((c) => c.name_search !== currentCategory.name_search);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.searchTerm), 300);
    return () => clearTimeout(timer);
  }, [filters.searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [id, debouncedSearch, filters.sortBy]);

  const fetchProducts = useCallback(async () => {
    if (!id) return;

    const cacheKey = getCategoryPageCacheKey(id, currentPage, filters.sortBy, debouncedSearch);
    const cachedEntry = readCategoryPageCache(cacheKey);
    if (cachedEntry) {
      setProducts(cachedEntry.products);
      setPagination(cachedEntry.pagination);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams({
        id,
        page: String(currentPage),
        limit: String(ITEMS_PER_PAGE),
        sortBy: filters.sortBy,
      });
      if (debouncedSearch) {
        searchParams.set("search", debouncedSearch);
      }

      const res = await fetch(`/api/client/get_product_by_category?${searchParams.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("fetch");
      const data: ApiResponse = await res.json();

      const mapped = (data.products || []).map(mapApiProduct);
      setProducts(mapped);
      if (data.pagination) {
        setPagination(data.pagination);
        writeCategoryPageCache(cacheKey, {
          products: mapped,
          pagination: data.pagination,
        });
      } else {
        const fallbackPagination = {
          currentPage,
          totalPages: 1,
          totalProducts: mapped.length,
          hasNext: false,
          hasPrev: false,
        };
        setPagination(fallbackPagination);
        writeCategoryPageCache(cacheKey, {
          products: mapped,
          pagination: fallbackPagination,
        });
      }
    } catch (error) {
      console.error(error);
      setProducts([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalProducts: 0,
        hasNext: false,
        hasPrev: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, currentPage, filters.sortBy, debouncedSearch]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1],
    );
  }, [products, filters.priceRange]);

  const scrollContainer = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 280;
      container.scrollTo({
        left: direction === "left" ? container.scrollLeft - scrollAmount : container.scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const displayCount =
    filters.priceRange[0] !== 0 || filters.priceRange[1] !== 10000
      ? filteredProducts.length
      : pagination.totalProducts;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-28 sm:pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="relative mb-10">
            <div className="relative h-56 sm:h-72 lg:h-80 overflow-hidden rounded-2xl">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${currentCategory.img_url})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-charcoal/80 via-charcoal/60 to-charcoal/40" />

              <Link
                href="/"
                className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/90 hover:text-white transition-colors font-body text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Link>

              <div className="relative z-10 h-full flex items-center justify-center">
                <div className="text-center px-6">
                  <div className="mx-auto mb-5 relative">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20 ring-offset-2 ring-offset-primary/30">
                      <Image
                        src={currentCategory.img_url}
                        alt={currentCategory.name}
                        fill
                        sizes="96px"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                    {currentCategory.name}
                  </h1>
                  <p className="text-white/80 text-base sm:text-lg font-body max-w-md mx-auto">
                    Découvrez notre sélection premium
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" />
                  Autres Catégories
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollContainer("left")}
                    className="p-2.5 rounded-full bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                    aria-label="Défiler à gauche"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => scrollContainer("right")}
                    className="p-2.5 rounded-full bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                    aria-label="Défiler à droite"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div
                ref={scrollContainerRef}
                className="flex gap-4 sm:gap-5 lg:gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-2 snap-x snap-mandatory"
              >
                {otherCategories.map((category, index) => (
                  <Link
                    key={category.name_search}
                    href={`/category/${category.name_search}`}
                    className="flex-shrink-0 group/card cursor-pointer snap-start"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="relative w-32 sm:w-44 lg:w-52 bg-card rounded-3xl overflow-hidden shadow-luxury hover:shadow-elevated transition-all duration-500 border border-border/60 hover:border-primary/30">
                      <div className="relative aspect-square overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent z-10" />
                        <Image
                          src={category.img_url || "/placeholder.svg"}
                          alt={category.name}
                          fill
                          sizes="208px"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                        />
                        <div className="absolute bottom-3 left-3 right-3 z-20">
                          <div className="inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1 text-[9px] sm:text-xs font-semibold text-foreground shadow-lg">
                            {category.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mb-6 sm:mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={filters.searchTerm}
                onChange={(e) => setFilters((f) => ({ ...f, searchTerm: e.target.value }))}
                className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body text-sm"
              />
            </div>

            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-hide">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 rounded-full shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtres
              </Button>

              <select
                value={filters.sortBy}
                onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
                className="text-sm bg-card border border-border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="name">Nom A-Z</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
              </select>

              <span className="text-xs sm:text-sm text-muted-foreground font-body ml-auto sm:ml-0 shrink-0">
                {displayCount} produit{displayCount > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {showFilters && (
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-card rounded-2xl border border-border animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground font-body">
                    Fourchette de prix (DZD)
                  </label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange[0]}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          priceRange: [+e.target.value, f.priceRange[1]],
                        }))
                      }
                      className="flex-1 px-4 py-3 rounded-xl bg-background border border-input focus:border-primary text-sm font-body"
                    />
                    <span className="text-muted-foreground">—</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange[1]}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          priceRange: [f.priceRange[0], +e.target.value],
                        }))
                      }
                      className="flex-1 px-4 py-3 rounded-xl bg-background border border-input focus:border-primary text-sm font-body"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      setFilters({
                        priceRange: [0, 10000],
                        searchTerm: "",
                        sortBy: "name",
                      })
                    }
                  >
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="rounded-2xl border border-border bg-card p-4 animate-pulse">
                  <div className="aspect-square rounded-xl bg-muted" />
                  <div className="mt-4 h-4 w-3/4 rounded bg-muted" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product, index) => (
                <ProductCardModern key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
              Aucun produit trouvé pour cette catégorie.
            </div>
          )}

          {pagination.totalPages > 1 && !isLoading && (
            <div className="flex justify-center items-center gap-2 mt-12">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="p-3 rounded-xl border border-border bg-card text-foreground hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: pagination.totalPages }).slice(0, 5).map((_, idx) => {
                const page = idx + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-11 h-11 rounded-xl border font-body text-sm font-medium transition-all ${
                      currentPage === page
                        ? "bg-gradient-gold text-primary-foreground border-primary shadow-gold"
                        : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNext}
                className="p-3 rounded-xl border border-border bg-card text-foreground hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
/*





































































































































































































}  );    </div>      <MobileBottomNav />      <Footer />      </main>        </div>          </div>            ))}              <ProductCardModern key={product.id} product={product} index={index} />            {filteredProducts.map((product, index) => (          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">          </div>            </div>              </span>                {filteredProducts.length} produit{filteredProducts.length > 1 ? "s" : ""}              <span className="text-xs sm:text-sm text-muted-foreground font-body ml-auto sm:ml-0 shrink-0">              </select>                <option value="price-desc">Prix décroissant</option>                <option value="price-asc">Prix croissant</option>                <option value="name">Nom A-Z</option>              >                className="text-sm bg-background border border-border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"                onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}                value={filters.sortBy}              <select              </Button>                Filtres                <SlidersHorizontal className="w-4 h-4" />              >                className="gap-2 rounded-full shrink-0"                onClick={() => setShowFilters(!showFilters)}                size="sm"                variant={showFilters ? "default" : "outline"}              <Button            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-hide">            </div>              />                className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body text-sm"                onChange={(e) => setFilters((f) => ({ ...f, searchTerm: e.target.value }))}                value={filters.searchTerm}                placeholder="Rechercher un produit..."                type="text"              <input              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />            <div className="relative">          <div className="flex flex-col gap-3 mb-6 sm:mb-8">          </div>            </div>              </div>                ))}                  </Link>                    </div>                      </span>                        {category.name}                      <span className="font-body text-sm text-muted-foreground group-hover:text-primary transition-colors text-center">                      </div>                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-2 ring-card" />                        </div>                          />                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"                            alt={category.name}                            src={category.img_url}                          <img                        <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-border group-hover:ring-primary/40 transition-all duration-300">                      <div className="relative">                    <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-background border border-border transition-all duration-300 min-w-[120px] hover:border-primary/40 hover:shadow-lg hover:-translate-y-1">                  >                    className="flex-shrink-0 group"                    key={category.name_search}                    href={`/category/${category.name_search}`}                  <Link                {otherCategories.map((category) => (              <div id="category-scroll" className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">              </div>                </div>                  </button>                    <ChevronRight className="w-5 h-5" />                  >                    className="p-2.5 rounded-full bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"                    }}                      el?.scrollBy({ left: 200, behavior: "smooth" });                      const el = document.getElementById("category-scroll");                    onClick={() => {                  <button                  </button>                    <ChevronLeft className="w-5 h-5" />                  >                    className="p-2.5 rounded-full bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"                    }}                      el?.scrollBy({ left: -200, behavior: "smooth" });                      const el = document.getElementById("category-scroll");                    onClick={() => {                  <button                <div className="flex gap-2">                <h2 className="font-display text-lg font-semibold text-foreground">Autres Catégories</h2>              <div className="flex items-center justify-between mb-5">            <div className="mt-8 bg-card rounded-2xl border border-border p-6">            </div>              </div>                </div>                  </p>                    Découvrez notre sélection premium                  <p className="text-white/80 text-base sm:text-lg font-body max-w-md mx-auto">                  </h1>                    {currentCategory.name}                  <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg">                  </div>                    </div>                      <img src={currentCategory.img_url} alt={currentCategory.name} className="w-full h-full object-cover" />                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20 ring-offset-2 ring-offset-primary/30">                  <div className="mx-auto mb-5 relative">                <div className="text-center px-6">              <div className="relative z-10 h-full flex items-center justify-center">              </Link>                Retour                <ArrowLeft className="w-4 h-4" />              >                className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/90 hover:text-white transition-colors font-body text-sm"                href="/"              <Link              <div className="absolute inset-0 bg-gradient-to-r from-charcoal/80 via-charcoal/60 to-charcoal/40" />              />                style={{ backgroundImage: `url(${currentCategory.img_url})` }}                className="absolute inset-0 bg-cover bg-center"              <div            <div className="relative h-56 sm:h-72 lg:h-80 overflow-hidden rounded-2xl">          <div className="relative mb-10">        <div className="container mx-auto px-4 sm:px-6 lg:px-12">      <main className="pt-28 sm:pt-32 pb-20">      <Header />    <div className="min-h-screen bg-background">  return (  }, [currentCategory.name_search, filters]);    return result;    }        break;        result.sort((a, b) => a.title.fr.localeCompare(b.title.fr));      default:      case "name":        break;        result.sort((a, b) => b.price - a.price);      case "price-desc":        break;        result.sort((a, b) => a.price - b.price);      case "price-asc":    switch (filters.sortBy) {    }      );        (p) => p.title.fr.toLowerCase().includes(search) || p.title.ar.includes(search),      result = result.filter(      const search = filters.searchTerm.toLowerCase();    if (filters.searchTerm) {    let result = mockProducts.filter((p) => p.category === currentCategory.name_search);  const filteredProducts = useMemo(() => {  const otherCategories = categories.filter((c) => c.name_search !== currentCategory.name_search);  const currentCategory = categories.find((c) => c.name_search === id) || categories[0];  const [showFilters, setShowFilters] = useState(false);  });    sortBy: "name",    searchTerm: "",  const [filters, setFilters] = useState({  const id = typeof params?.id === "string" ? params.id : "";  const params = useParams();export default function CategoryPage() {import ProductCardModern from "@/components/product/ProductCardModern";import { mockProducts, categories } from "@/data/products";import { Button } from "@/components/ui/button";import MobileBottomNav from "@/components/layout/MobileBottomNav";import Footer from "@/components/home/Footer";import Header from "@/components/layout/Header";import { ChevronLeft, ChevronRight, ArrowLeft, Search, SlidersHorizontal } from "lucide-react";import { useParams } from "next/navigation";import Link from "next/link";import { useMemo, useState } from "react";
/*
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Filter, Search, SlidersHorizontal } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import ProductCardModern from "@/components/product/ProductCardModern";
import { Button } from "@/components/ui/button";
import { categories, mockProducts } from "@/data/products";

interface PageProps {
  params: { id: string };
}

"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Filter, Search, SlidersHorizontal } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import ProductCardModern from "@/components/product/ProductCardModern";
import { Button } from "@/components/ui/button";
import { categories, mockProducts } from "@/data/products";

interface PageProps {
  params: { id: string };
}

/*
export default function CategoryPage({ params }: PageProps) {
  const [filters, setFilters] = useState({
    priceRange: [0, 10000] as [number, number],
    searchTerm: "",
    sortBy: "name",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentCategory = categories.find((c) => c.name_search === params.id) || categories[0];
  const otherCategories = categories.filter((c) => c.name_search !== currentCategory.name_search);

  const filteredProducts = useMemo(() => {
    let result = mockProducts.filter((p) => p.category === currentCategory.name_search);

    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      result = result.filter(
        (p) => p.title.fr.toLowerCase().includes(search) || p.title.ar.includes(search),
      );
    }

    result = result.filter(
      (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1],
    );

    switch (filters.sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name":
        result.sort((a, b) => a.title.fr.localeCompare(b.title.fr));
        break;
    }

    return result;
  }, [currentCategory.name_search, filters]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const scrollContainer = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollTo({
        left: direction === "left" ? container.scrollLeft - scrollAmount : container.scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-28 sm:pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="relative mb-10">
            <div className="relative h-56 sm:h-72 lg:h-80 overflow-hidden rounded-2xl">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${currentCategory.img_url})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-charcoal/80 via-charcoal/60 to-charcoal/40" />

              <Link
                href="/"
                className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/90 hover:text-white transition-colors font-body text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Link>

              <div className="relative z-10 h-full flex items-center justify-center">
                <div className="text-center px-6">
                  <div className="mx-auto mb-5 relative">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20 ring-offset-2 ring-offset-primary/30">
                      <img src={currentCategory.img_url} alt={currentCategory.name} className="w-full h-full object-cover" />
                    </div>
                  </div>

                  <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                    {currentCategory.name}
                  </h1>
                  <p className="text-white/80 text-base sm:text-lg font-body max-w-md mx-auto">
                    Découvrez notre sélection premium
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" />
                  Autres Catégories
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollContainer("left")}
                    className="p-2.5 rounded-full bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => scrollContainer("right")}
                    className="p-2.5 rounded-full bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                {otherCategories.map((category) => (
                  <Link
                    href={`/category/${category.name_search}`}
                    key={category.name_search}
                    className="flex-shrink-0 group"
                  >
                    <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-background border border-border transition-all duration-300 min-w-[120px] hover:border-primary/40 hover:shadow-lg hover:-translate-y-1">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-border group-hover:ring-primary/40 transition-all duration-300">
                          <img
                            src={category.img_url}
                            alt={category.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-2 ring-card" />
                      </div>
                      <span className="font-body text-sm text-muted-foreground group-hover:text-primary transition-colors text-center">
                        {category.name}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mb-6 sm:mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={filters.searchTerm}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, searchTerm: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body text-sm"
              />
            </div>

            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-hide">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 rounded-full shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtres
              </Button>

              <select
                value={filters.sortBy}
                onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
                className="text-sm bg-card border border-border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="name">Nom A-Z</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
              </select>

              <span className="text-xs sm:text-sm text-muted-foreground font-body ml-auto sm:ml-0 shrink-0">
                {filteredProducts.length} produit{filteredProducts.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {showFilters && (
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-card rounded-2xl border border-border animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground font-body">
                    Fourchette de prix (DZD)
                  </label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange[0]}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          priceRange: [+e.target.value, f.priceRange[1]],
                        }))
                      }
                      className="flex-1 px-4 py-3 rounded-xl bg-background border border-input focus:border-primary text-sm font-body"
                    />
                    <span className="text-muted-foreground">—</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange[1]}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          priceRange: [f.priceRange[0], +e.target.value],
                        }))
                      }
                      className="flex-1 px-4 py-3 rounded-xl bg-background border border-input focus:border-primary text-sm font-body"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      setFilters({
                        priceRange: [0, 10000],
                        searchTerm: "",
                        sortBy: "name",
                      })
                    }
                  >
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {paginatedProducts.map((product, index) => (
              <ProductCardModern key={product.id} product={product} index={index} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-3 rounded-xl border border-border bg-card text-foreground hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }).slice(0, 5).map((_, idx) => {
                const page = idx + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-11 h-11 rounded-xl border font-body text-sm font-medium transition-all ${
                      currentPage === page
                        ? "bg-gradient-gold text-primary-foreground border-primary shadow-gold"
                        : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-3 rounded-xl border border-border bg-card text-foreground hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}

export default function CategoryPage({ params }: PageProps) {
  const [filters, setFilters] = useState({
    priceRange: [0, 10000] as [number, number],
    searchTerm: "",
    sortBy: "name",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentCategory = categories.find((c) => c.name_search === params.id) || categories[0];
  const otherCategories = categories.filter((c) => c.name_search !== currentCategory.name_search);

  const filteredProducts = useMemo(() => {
    let result = mockProducts.filter((p) => p.category === currentCategory.name_search);

    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      result = result.filter(
        (p) => p.title.fr.toLowerCase().includes(search) || p.title.ar.includes(search),
      );
    }

    result = result.filter(
      (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1],
    );

    switch (filters.sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name":
        result.sort((a, b) => a.title.fr.localeCompare(b.title.fr));
        break;
    }

    return result;
  }, [currentCategory.name_search, filters]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const scrollContainer = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollTo({
        left: direction === "left" ? container.scrollLeft - scrollAmount : container.scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-28 sm:pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="relative mb-10">
            <div className="relative h-56 sm:h-72 lg:h-80 overflow-hidden rounded-2xl">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${currentCategory.img_url})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-charcoal/80 via-charcoal/60 to-charcoal/40" />
              <Link
                href="/"
                className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/90 hover:text-white transition-colors font-body text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Link>
              <div className="relative z-10 h-full flex items-center justify-center">
                <div className="text-center px-6">
                  <div className="mx-auto mb-5 relative">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20 ring-offset-2 ring-offset-primary/30">
                      <img
                        src={currentCategory.img_url}
                        alt={currentCategory.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                    {currentCategory.name}
                  </h1>
                  <p className="text-white/80 text-base sm:text-lg font-body max-w-md mx-auto">
                    Découvrez notre sélection premium
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" />
                  Autres Catégories
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollContainer("left")}
                    className="p-2.5 rounded-full bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => scrollContainer("right")}
                    className="p-2.5 rounded-full bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                {otherCategories.map((category) => (
                  <Link
                    href={`/category/${category.name_search}`}
                    key={category.name_search}
                    className="flex-shrink-0 group"
                  >
                    <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-background border border-border transition-all duration-300 min-w-[120px] hover:border-primary/40 hover:shadow-lg hover:-translate-y-1">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-border group-hover:ring-primary/40 transition-all duration-300">
                          <img
                            src={category.img_url}
                            alt={category.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-2 ring-card" />
                      </div>
                      <span className="font-body text-sm text-muted-foreground group-hover:text-primary transition-colors text-center">
                        {category.name}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mb-6 sm:mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={filters.searchTerm}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, searchTerm: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body text-sm"
              />
            </div>

            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-hide">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 rounded-full shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtres
              </Button>

              <select
                value={filters.sortBy}
                onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
                className="text-sm bg-card border border-border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="name">Nom A-Z</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
              </select>

              <span className="text-xs sm:text-sm text-muted-foreground font-body ml-auto sm:ml-0 shrink-0">
                {filteredProducts.length} produit{filteredProducts.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {showFilters && (
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-card rounded-2xl border border-border animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground font-body">
                    Fourchette de prix (DZD)
                  </label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange[0]}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          priceRange: [+e.target.value, f.priceRange[1]],
                        }))
                      }
                      className="flex-1 px-4 py-3 rounded-xl bg-background border border-input focus:border-primary text-sm font-body"
                    />
                    <span className="text-muted-foreground">—</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange[1]}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          priceRange: [f.priceRange[0], +e.target.value],
                        }))
                      }
                      className="flex-1 px-4 py-3 rounded-xl bg-background border border-input focus:border-primary text-sm font-body"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      setFilters({
                        priceRange: [0, 10000],
                        searchTerm: "",
                        sortBy: "name",
                      })
                    }
                  >
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {paginatedProducts.map((product, index) => (
              <ProductCardModern key={product.id} product={product} index={index} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-3 rounded-xl border border-border bg-card text-foreground hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).slice(0, 5).map((_, idx) => {
                const page = idx + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-11 h-11 rounded-xl border font-body text-sm font-medium transition-all ${
                      currentPage === page
                        ? "bg-gradient-gold text-primary-foreground border-primary shadow-gold"
                        : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-3 rounded-xl border border-border bg-card text-foreground hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
*/
