"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import ProductCardModern from "@/components/product/ProductCardModern";
import type { Product } from "@/data/products";

type ApiProduct = {
  _id: string;
  title?: { fr?: string; ar?: string };
  price?: number;
  ancien_price?: number;
  categorie?: string;
  array_ProductImg?: { secure_url?: string }[];
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400";

const collections = {
  nouveautes: {
    name: "Nouveautés",
    description: "Les derniers arrivages sélectionnés pour vous.",
    image: "/collection/nouveautes.png",
  },
  populaires: {
    name: "Populaires",
    description: "Les articles préférés de nos clients.",
    image: "/collection/populaires.png",
  },
  promotions: {
    name: "Promotions",
    description: "Les meilleures remises du moment.",
    image: "/collection/promotions.png",
  },
  "top-ventes": {
    name: "Top Ventes",
    description: "Les articles les plus vendus en ce moment.",
    image: "/collection/top-ventes.png",
  },
};

export default function CollectionDetailPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "nouveautes";
  const collection = collections[slug as keyof typeof collections] || collections.nouveautes;
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const apiUrl = useMemo(() => {
    switch (slug) {
      case "nouveautes":
        return "/api/client/get_new_products";
      case "populaires":
        return "/api/client/get_popular_products";
      case "promotions":
        return "/api/client/get_discount_products";
      case "top-ventes":
        return "/api/client/get_Products_plus_vendus";
      default:
        return "/api/client/get_new_products";
    }
  }, [slug]);

  useEffect(() => {
    let isMounted = true;
    const mapApiProducts = (data: ApiProduct[]): Product[] =>
      (data || []).map((item) => {
        const images = (item.array_ProductImg || [])
          .map((img) => img.secure_url)
          .filter(Boolean) as string[];
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
      });

    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(apiUrl, { cache: "no-store" });
        if (!res.ok) throw new Error("load");
        const data = await res.json();
        if (!isMounted) return;
        setProducts(mapApiProducts(Array.isArray(data) ? data : data?.products || []));
      } catch (error) {
        console.error(error);
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadProducts();
    return () => {
      isMounted = false;
    };
  }, [apiUrl]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-28 sm:pt-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-luxury">
            <div className="relative h-[40vh] sm:h-[50vh]">
              <Image
                src={collection.image}
                alt={collection.name}
                fill
                sizes="(max-width: 1024px) 100vw, 1200px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/40 to-transparent" />

              <Link
                href="/collections"
                className="absolute top-5 left-5 z-20 inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-lg hover:text-primary"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour aux collections
              </Link>

              <div className="absolute inset-0 flex items-end">
                <div className="p-6 sm:p-10 lg:p-12 max-w-3xl">
                  <span className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                    Collection
                  </span>
                  <h1 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-white drop-shadow">
                    {collection.name}
                  </h1>
                  <p className="mt-3 text-sm sm:text-base text-white/80">
                    {collection.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-muted-foreground">{products.length} produits</span>
            <Link href="/collections" className="text-sm text-muted-foreground hover:text-primary">
              Voir toutes les collections
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="h-64 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-sm text-muted-foreground">Aucun produit disponible.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product, index) => (
                <ProductCardModern key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
