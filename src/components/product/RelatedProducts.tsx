"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCardModern from "@/components/product/ProductCardModern";
import type { Product } from "@/data/products";

interface RelatedProductsProps {
  currentProductId: string;
  category: string;
  locale?: "fr" | "ar";
}

type RelatedProductApi = {
  _id: string;
  title?: { fr?: string; ar?: string };
  price?: number;
  ancien_price?: number;
  array_ProductImg?: { secure_url?: string }[];
  categorie?: string;
  purchaseCount?: number;
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop";
const RELATED_PRODUCTS_CACHE_PREFIX = "related-products-cache-v1";
const RELATED_PRODUCTS_CACHE_TTL = 60 * 60 * 1000;

type RelatedProductsCacheEntry = {
  timestamp: number;
  products: RelatedProductApi[];
};

const getRelatedProductsCacheKey = (productId: string, limit: number) =>
  `${RELATED_PRODUCTS_CACHE_PREFIX}:${productId}:${limit}`;

const readRelatedProductsCache = (cacheKey: string): RelatedProductsCacheEntry | null => {
  if (typeof window === "undefined") return null;

  try {
    const cachedValue = window.localStorage.getItem(cacheKey);
    if (!cachedValue) return null;

    const parsedValue = JSON.parse(cachedValue) as RelatedProductsCacheEntry;
    if (!parsedValue?.timestamp || !Array.isArray(parsedValue.products)) return null;

    if (Date.now() - parsedValue.timestamp > RELATED_PRODUCTS_CACHE_TTL) {
      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
};

const writeRelatedProductsCache = (cacheKey: string, products: RelatedProductApi[]) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(cacheKey, JSON.stringify({ products, timestamp: Date.now() }));
  } catch {
    // Ignore storage quota or serialization errors.
  }
};

export default function RelatedProducts({ currentProductId, category, locale = "fr" }: RelatedProductsProps) {
  const limit = 8;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProductApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadRelated = async () => {
      const cacheKey = getRelatedProductsCacheKey(currentProductId, limit);
      const cachedEntry = readRelatedProductsCache(cacheKey);
      if (cachedEntry) {
        if (isMounted) {
          setRelatedProducts(cachedEntry.products || []);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/client/get_related_products?id=${currentProductId}&limit=${limit}`);
        if (!response.ok) throw new Error("load");
        const data: RelatedProductApi[] = await response.json();
        if (isMounted) {
          setRelatedProducts(data || []);
          writeRelatedProductsCache(cacheKey, data || []);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) setRelatedProducts([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (currentProductId) {
      void loadRelated();
    }

    return () => {
      isMounted = false;
    };
  }, [currentProductId]);

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener("scroll", updateScrollButtons);
      return () => scrollEl.removeEventListener("scroll", updateScrollButtons);
    }
  }, [relatedProducts]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const mapApiProduct = (item: RelatedProductApi): Product => {
    const images = (item.array_ProductImg || [])
      .map((img) => img.secure_url)
      .filter(Boolean);
    return {
      id: item._id,
      title: {
        fr: item.title?.fr || "Produit",
        ar: item.title?.ar || "",
      },
      price: item.price || 0,
      ancien_price: item.ancien_price || 0,
      category: item.categorie || "",
      images: images.length > 0 ? images : [FALLBACK_IMAGE],
      rating: 4.7,
    } as Product;
  };

  if (!isLoading && relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="relative">
      <div className="flex items-end justify-between mb-8">
        <div>
          <span className="inline-block text-primary font-body text-sm tracking-[0.25em] uppercase mb-2">
            {locale === "fr" ? "Vous aimerez aussi" : "ستحب أيضا"}
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
            {locale === "fr" ? "Produits Similaires" : "منتجات مشابهة"}
          </h2>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`p-3 rounded-full border transition-all ${
              canScrollLeft
                ? "border-border hover:border-primary hover:bg-primary/5 text-foreground hover:text-primary"
                : "border-border/50 text-muted-foreground cursor-not-allowed"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`p-3 rounded-full border transition-all ${
              canScrollRight
                ? "border-border hover:border-primary hover:bg-primary/5 text-foreground hover:text-primary"
                : "border-border/50 text-muted-foreground cursor-not-allowed"
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className={`flex gap-3 sm:gap-6 overflow-x-auto scrollbar-hide pb-4  px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory ${
          relatedProducts.length === 1 ? "justify-center" : ""
        }`}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="flex-shrink-0 min-w-[42%] max-w-[190px] sm:min-w-[220px] md:min-w-[260px] md:max-w-[280px]">
                <div className="h-52 sm:h-64 md:h-72 rounded-2xl bg-muted animate-pulse" />
              </div>
            ))
          : relatedProducts.map((product, index) => {
              const mappedProduct = mapApiProduct(product);
              return (
                <div
                  key={product._id}
                  className={
                    relatedProducts.length === 1
                      ? "flex-shrink-0 min-w-[180px] max-w-[210px] w-[190px] sm:min-w-[240px] md:min-w-[260px] md:max-w-[280px] group"
                      : "flex-shrink-0 min-w-[42%] max-w-[190px] sm:min-w-[220px] md:min-w-[260px] md:max-w-[280px] group"
                  }
                  style={{ scrollSnapAlign: "start", animationDelay: `${index * 100}ms` }}
                >
                  <ProductCardModern product={mappedProduct} index={index} variant="compact" />
                </div>
              );
            })}
      </div>

      <div className="flex justify-center mt-8">
        <Link href={`/category/${category}`}>
          <Button variant="outline" className="gap-2">
            {locale === "fr" ? "Voir tous les produits" : "عرض كل المنتجات"}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
