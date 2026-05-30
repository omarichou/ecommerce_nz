"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductCardModern from "@/components/product/ProductCardModern";
import type { Product } from "@/data/products";

const FALLBACK_IMAGE = "/products/tabaq-henna-base.png";
const PRODUCT_GRID_CACHE_KEY = "product-grid-cache-v1";
const PRODUCT_GRID_CACHE_TTL = 60 * 60 * 1000;

type ProductGridCache = {
  timestamp: number;
  newProducts: Product[];
  popularProducts: Product[];
  bestSellerProducts: Product[];
  discountProducts: Product[];
};

const readProductGridCache = (): ProductGridCache | null => {
  if (typeof window === "undefined") return null;

  try {
    const rawCache = window.localStorage.getItem(PRODUCT_GRID_CACHE_KEY);
    if (!rawCache) return null;

    const parsedCache = JSON.parse(rawCache) as ProductGridCache;
    if (!parsedCache?.timestamp) return null;

    if (Date.now() - parsedCache.timestamp > PRODUCT_GRID_CACHE_TTL) {
      return null;
    }

    return parsedCache;
  } catch {
    return null;
  }
};

const writeProductGridCache = (cache: Omit<ProductGridCache, "timestamp">) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(PRODUCT_GRID_CACHE_KEY, JSON.stringify({ ...cache, timestamp: Date.now() }));
  } catch {
    // Ignore quota and serialization issues.
  }
};

export const ProductGrid = () => {
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [bestSellerProducts, setBestSellerProducts] = useState<Product[]>([]);
  const [discountProducts, setDiscountProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const mapApiProducts = (data: any[]): Product[] =>
      (data || []).map((item: any) => {
        const images = (item.array_ProductImg || [])
          .map((img: { secure_url?: string }) => img.secure_url)
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
          rating: 4.6,
        } as Product;
      });

    const loadProducts = async () => {
      const cachedProducts = readProductGridCache();
      if (cachedProducts) {
        setNewProducts(cachedProducts.newProducts);
        setPopularProducts(cachedProducts.popularProducts);
        setBestSellerProducts(cachedProducts.bestSellerProducts);
        setDiscountProducts(cachedProducts.discountProducts);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [newRes, popularRes, bestRes, discountRes] = await Promise.all([
          fetch("/api/client/get_new_products?limit=16"),
          fetch("/api/client/get_popular_products?limit=16"),
          fetch("/api/client/get_Products_plus_vendus?limit=16"),
          fetch("/api/client/get_discount_products?limit=16"),
        ]);

        if (!newRes.ok || !popularRes.ok || !bestRes.ok || !discountRes.ok) throw new Error("load");

        const [newData, popularData, bestData, discountData] = await Promise.all([
          newRes.json(),
          popularRes.json(),
          bestRes.json(),
          discountRes.json(),
        ]);
        if (!isMounted) return;
        const mappedNewProducts = mapApiProducts(newData);
        const mappedPopularProducts = mapApiProducts(popularData);
        const mappedBestSellerProducts = mapApiProducts(bestData);
        const mappedDiscountProducts = mapApiProducts(discountData);

        setNewProducts(mappedNewProducts);
        setPopularProducts(mappedPopularProducts);
        setBestSellerProducts(mappedBestSellerProducts);
        setDiscountProducts(mappedDiscountProducts);

        writeProductGridCache({
          newProducts: mappedNewProducts,
          popularProducts: mappedPopularProducts,
          bestSellerProducts: mappedBestSellerProducts,
          discountProducts: mappedDiscountProducts,
        });
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setNewProducts([]);
          setPopularProducts([]);
          setBestSellerProducts([]);
          setDiscountProducts([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const sections = useMemo(
    () => [
      {
        key: "new",
        badge: "Nouveau",
        title: "Nouveautés",
        description: "Les dernières créations préparées en atelier.",
        products: newProducts,
      },
      {
        key: "popular",
        badge: "Populaire",
        title: "Demandés cette semaine",
        description: "Les plateaux, coffrets et packs les plus choisis.",
        products: popularProducts,
      },
      {
        key: "discount",
        badge: "- %",
        title: "Promotions",
        description: "Les offres du moment pour vos préparatifs.",
        products: discountProducts,
      },
      {
        key: "best",
        badge: "Top",
        title: "Packs incontournables",
        description: "Les formules pratiques pour une fête complète.",
        products: bestSellerProducts,
      },
    ],
    [newProducts, popularProducts, bestSellerProducts, discountProducts],
  );

  return (
    <section className="py-10 sm:py-14 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-14">
        {sections.map((section) => (
          <div key={section.key} className="rounded-3xl border border-border/60 bg-background/70 p-5 sm:p-7 lg:p-8 shadow-luxury">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-primary">
                  {section.badge}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground">
                  {section.title}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground font-body max-w-2xl">
                  {section.description}
                </p>
              </div>
              <Link
                href="/collections"
                className="text-sm font-medium text-primary hover:text-primary/80 inline-flex items-center gap-2"
              >
                Voir tout <span aria-hidden>→</span>
              </Link>
            </div>

            <div className="mt-6">
              {isLoading ? (
                <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide">
                  {[...Array(4)].map((_, index) => (
                    <div
                      key={`skeleton-${section.key}-${index}`}
                      className="min-w-[64%] sm:min-w-[240px] md:min-w-0 h-64 rounded-2xl bg-muted animate-pulse"
                    />
                  ))}
                </div>
              ) : section.products.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aucun produit disponible.</div>
              ) : (
                <div
                  className={`flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory md:grid md:overflow-visible md:snap-none md:grid-cols-3 lg:grid-cols-4 ${
                    section.products.length === 1 ? "justify-center" : ""
                  }`}
                >
                  {section.products.map((product, index) => (
                    <div
                      key={product.id}
                      className={
                        section.products.length === 1
                          ? "min-w-[220px] max-w-[260px] w-[240px] sm:min-w-[260px] md:min-w-0 snap-start"
                          : "min-w-[64%] sm:min-w-[240px] md:min-w-0 snap-start"
                      }
                    >
                      <ProductCardModern product={product} index={index} variant="compact" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
