"use client";

import { Suspense, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCardModern from "@/components/product/ProductCardModern";
import { categories } from "@/data/products";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Product } from "@/data/products";

const sortOptions = [
  { value: "default", label: "Par défaut" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "name", label: "Nom A-Z" },
  { value: "rating", label: "Meilleures notes" },
];

type ProductApi = {
  _id: string;
  title?: { fr?: string; ar?: string };
  price?: number;
  ancien_price?: number;
  categorie?: string;
  array_ProductImg?: { secure_url?: string }[];
  purchaseCount?: number;
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=1000&fit=crop";

type SortOption = "default" | "price-asc" | "price-desc" | "name" | "rating";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [pageProducts, setPageProducts] = useState<ProductApi[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setQuery(q);
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [query, selectedCategory, priceRange, sortBy]);

  useEffect(() => {
    const controller = new AbortController();
    const delay = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
          sortBy,
          minPrice: String(priceRange[0]),
          maxPrice: String(priceRange[1]),
        });

        if (query.trim()) {
          params.set("q", query.trim());
        }

        if (selectedCategory) {
          params.set("category", selectedCategory);
        }

        const res = await fetch(`/api/client/get_Products?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("load");
        const data = await res.json();

        if (Array.isArray(data)) {
          setPageProducts(data);
          setTotalResults(data.length);
        } else {
          setPageProducts(Array.isArray(data.products) ? data.products : []);
          setTotalResults(typeof data.total === "number" ? data.total : 0);
        }
      } catch (error) {
        if ((error instanceof Error ? error.name !== "AbortError" : true)) {
          console.error(error);
          setPageProducts([]);
          setTotalResults(0);
        }
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(delay);
      controller.abort();
    };
  }, [query, selectedCategory, priceRange, sortBy, page, pageSize]);

  const handleSearch = useCallback((e: FormEvent) => {
    e.preventDefault();
    const next = query ? `/search?q=${encodeURIComponent(query)}` : "/search";
    router.replace(next);
  }, [query, router]);

  const clearFilters = useCallback(() => {
    setSelectedCategory(null);
    setPriceRange([0, 10000]);
    setSortBy("default");
  }, []);

  const activeFiltersCount = [
    selectedCategory,
    priceRange[0] > 0 || priceRange[1] < 10000,
    sortBy !== "default",
  ].filter(Boolean).length;

  const totalPages = Math.max(Math.ceil(totalResults / pageSize), 1);

  const mappedProducts = useMemo(() => {
    return pageProducts.map((item) => {
      const images = (item.array_ProductImg || []).map((img) => img.secure_url).filter(Boolean);
      return {
        id: item._id,
        title: { fr: item.title?.fr || "Produit", ar: item.title?.ar || "" },
        price: item.price || 0,
        ancien_price: item.ancien_price || 0,
        category: item.categorie || "",
        images: images.length > 0 ? images : [FALLBACK_IMAGE],
        rating: 4.7,
      } as Product;
    });
  }, [pageProducts]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-28 sm:pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-8">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher des produits..."
                  className="w-full pl-12 pr-4 py-6 text-lg rounded-full border-2 border-border focus:border-primary"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      router.replace("/search");
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
                {query ? `Résultats pour "${query}"` : "Tous les produits"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {totalResults} produit{totalResults !== 1 ? "s" : ""} trouvé{totalResults !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="hidden sm:flex gap-2">
                    Trier par
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setSortBy(option.value as SortOption)}
                      className={sortBy === option.value ? "bg-primary/10 text-primary" : ""}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filtres
                    {activeFiltersCount > 0 && (
                      <span className="w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[90vw] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="font-display text-2xl">Filtres</SheetTitle>
                  </SheetHeader>

                  <div className="mt-6 space-y-6">
                    <div className="sm:hidden">
                      <h3 className="font-medium text-foreground mb-3">Trier par</h3>
                      <div className="flex flex-wrap gap-2">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setSortBy(option.value as SortOption)}
                            className={`px-3 py-2 rounded-full text-sm transition-all ${
                              sortBy === option.value
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-foreground mb-3">Catégories</h3>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                          <button
                            key={cat.name_search}
                            onClick={() =>
                              setSelectedCategory(
                                selectedCategory === cat.name_search ? null : cat.name_search,
                              )
                            }
                            className={`px-3 py-2 rounded-full text-sm transition-all ${
                              selectedCategory === cat.name_search
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-foreground mb-3">Prix</h3>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
                          placeholder="Min"
                          className="w-full"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          type="number"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                          placeholder="Max"
                          className="w-full"
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">DZD</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-border">
                      <Button variant="outline" onClick={clearFilters} className="flex-1">
                        Réinitialiser
                      </Button>
                      <Button variant="gold" onClick={() => setIsFiltersOpen(false)} className="flex-1">
                        Appliquer
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-sm text-muted-foreground">Filtres actifs:</span>
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                  {categories.find((c) => c.name_search === selectedCategory)?.name}
                  <button onClick={() => setSelectedCategory(null)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(priceRange[0] > 0 || priceRange[1] < 10000) && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                  {priceRange[0]} - {priceRange[1]} DZD
                  <button onClick={() => setPriceRange([0, 10000])}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button onClick={clearFilters} className="text-sm text-muted-foreground hover:text-foreground underline">
                Tout effacer
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: pageSize }).map((_, index) => (
                <div key={`skeleton-${index}`} className="rounded-2xl bg-muted animate-pulse h-[260px] sm:h-[320px]" />
              ))}
            </div>
          ) : totalResults > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {mappedProducts.map((product, index) => (
                <ProductCardModern key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-3">Aucun résultat trouvé</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Nous n&apos;avons pas trouvé de produits correspondant à votre recherche. Essayez avec d&apos;autres mots-clés
                ou explorez nos catégories.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {categories.slice(0, 4).map((cat) => (
                  <Link key={cat.name_search} href={`/category/${cat.name_search}`}>
                    <Button variant="outline">{cat.name}</Button>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!isLoading && totalResults > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SearchContent />
    </Suspense>
  );
}













