"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingBag, X } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { mockProducts, type Product } from "@/data/products";


interface Hotspot {
  x: number;
  y: number;
  productId?: string;
  productIndex?: number;
} 

interface Look {
  id: string;
  image: string;
  title: string;
  description: string;
  hotspots: Hotspot[];
}

const looks: Look[] = [
  {
    id: "1",
    image: "/hero/henna-hero.jpg",
    title: "Plateau henné doré",
    description: "Une mise en scène chaleureuse pour la soirée henné",
    hotspots: [
      { x: 45, y: 30, productIndex: 0 },
      { x: 60, y: 55, productIndex: 3 },
    ],
  },
  {
    id: "2",
    image: "/hero/fiancailles-hero.jpg",
    title: "Table de fiançailles",
    description: "Coffret alliance, bougie et détails ivoire bordeaux",
    hotspots: [
      { x: 35, y: 40, productIndex: 4 },
      { x: 55, y: 65, productIndex: 8 },
    ],
  },
  {
    id: "3",
    image: "/hero/qaada-hero.jpg",
    title: "Qaada complète",
    description: "Lanternes, rideau pailleté, coussins et nappe traditionnelle",
    hotspots: [
      { x: 50, y: 35, productIndex: 1 },
      { x: 40, y: 60, productIndex: 5 },
    ],
  },
];

type ApiProduct = {
  _id: string;
  title?: { fr?: string; ar?: string };
  price?: number;
  ancien_price?: number;
  categorie?: string;
  array_ProductImg?: { secure_url?: string }[];
};

const FALLBACK_IMAGE = "/products/tabaq-henna-base.png";

export default function LookbookPage() {
  const [currentLook, setCurrentLook] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const nextLook = () => {
    setCurrentLook((prev) => (prev + 1) % looks.length);
    setActiveHotspot(null);
  };

  const prevLook = () => {
    setCurrentLook((prev) => (prev - 1 + looks.length) % looks.length);
    setActiveHotspot(null);
  };

  const look = looks[currentLook];

  const activeProducts = useMemo(() => (products.length ? products : mockProducts), [products]);

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
      setIsLoadingProducts(true);
      try {
        const res = await fetch("/api/client/get_Products", { cache: "no-store" });
        if (!res.ok) throw new Error("load");
        const data = await res.json();
        if (!isMounted) return;
        setProducts(mapApiProducts(Array.isArray(data) ? data : data?.products || []));
      } catch (error) {
        console.error(error);
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setIsLoadingProducts(false);
      }
    };

    void loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const getProduct = (hotspot: Hotspot) => {
    if (hotspot.productId) {
      return activeProducts.find((p) => p.id === hotspot.productId) || null;
    }
    if (typeof hotspot.productIndex === "number") {
      return activeProducts[hotspot.productIndex] || null;
    }
    return null;
  };

  const handleSelectLook = (index: number) => {
    setCurrentLook(index);
    setActiveHotspot(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-charcoal">
      <Header />

      <div className="h-[100px] sm:h-[120px]" />

      <main className="relative">
        <div className="relative h-[calc(100vh-120px)] overflow-hidden">
          {looks.map((l, index) => (
            <div
              key={l.id}
              className={`absolute inset-0 transition-all duration-700 ${
                index === currentLook
                  ? "opacity-100 scale-100"
                  : index < currentLook
                  ? "opacity-0 -translate-x-full scale-95"
                  : "opacity-0 translate-x-full scale-95"
              }`}
            >
              <img src={l.image} alt={l.title} className="w-full h-full object-cover" />

              <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-charcoal/60 via-transparent to-charcoal/60" />

              {index === currentLook &&
                l.hotspots.map((hotspot, hIndex) => {
                  const product = getProduct(hotspot);
                  if (!product) return null;

                  return (
                    <div key={hIndex} className="absolute group" style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}>
                      <button
                        onClick={() =>
                          setActiveHotspot(activeHotspot === product.id ? null : product.id)
                        }
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                          activeHotspot === product.id
                            ? "bg-primary scale-125"
                            : "bg-background/80 backdrop-blur-sm hover:bg-primary hover:scale-110"
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4 text-foreground" />
                      </button>

                      <div className="absolute inset-0 rounded-full bg-primary/50 animate-ping" />

                      {activeHotspot === product.id && (
                        <div className="absolute left-10 top-0 w-64 bg-background rounded-xl shadow-elevated border border-border overflow-hidden animate-scale-in z-20">
                          <button
                            onClick={() => setActiveHotspot(null)}
                            className="absolute top-2 right-2 p-1 rounded-full bg-muted hover:bg-muted/80 z-10"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <Link href={`/product/${product.id}`}>
                            <img src={product.images[0]} alt={product.title.fr} className="w-full h-40 object-cover" />
                            <div className="p-4">
                              <h4 className="font-medium text-foreground line-clamp-1">{product.title.fr}</h4>
                              <p className="font-display text-lg font-bold text-primary mt-1">
                                {product.price.toLocaleString()} DZD
                              </p>
                              <Button variant="gold" size="sm" className="w-full mt-3">
                                Voir le produit
                              </Button>
                            </div>
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}

              <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
                <div className="max-w-xl">
                  <p className="text-primary font-medium mb-2">Look {index + 1}</p>
                  <h2 className="font-display text-4xl sm:text-5xl font-semibold text-cream mb-4">
                    {l.title}
                  </h2>
                  <p className="text-cream/80 text-lg mb-6">{l.description}</p>
                  <p className="text-sm text-cream/60">Cliquez sur les points pour découvrir les articles</p>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={prevLook}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-background/10 backdrop-blur-sm border border-cream/20 text-cream hover:bg-background/20 transition-all duration-300 hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextLook}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-background/10 backdrop-blur-sm border border-cream/20 text-cream hover:bg-background/20 transition-all duration-300 hover:scale-110"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-8 right-8 sm:right-12 flex gap-2 z-30">
            {looks.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentLook(index);
                  setActiveHotspot(null);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentLook ? "w-8 bg-primary" : "bg-cream/50 hover:bg-cream/70"
                }`}
              />
            ))}
          </div>
        </div>
      </main>

      <section className="bg-background text-foreground py-14 sm:py-18">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
            <div className="space-y-2">
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-primary">
                Inspirations
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold">Inspirations henna & traditions</h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
                Des mises en scène pensées pour vos plateaux, coffrets, décors et packs de fête.
              </p>
            </div>
            <Link
              href="/collections"
              className="text-sm font-medium text-primary hover:text-primary/80 inline-flex items-center gap-2"
            >
              Explorer les collections <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {looks.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleSelectLook(index)}
                className="group text-left rounded-3xl overflow-hidden border border-border/60 bg-card shadow-luxury hover:shadow-elevated transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-primary">Look {index + 1}</p>
                  <h3 className="mt-2 font-display text-xl font-semibold group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-12 grid lg:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-luxury">
              <h3 className="font-display text-xl font-semibold mb-3">Conseils de style</h3>
              <p className="text-sm text-muted-foreground">
                Associez bougies, rubans, lanternes et ornements dorés pour une ambiance équilibrée et élégante.
              </p>
            </div>
            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-luxury">
              <h3 className="font-display text-xl font-semibold mb-3">Sélections cérémonie</h3>
              <p className="text-sm text-muted-foreground">
                Des palettes bordeaux, ivoire et dorées adaptées aux soirées henné, fiançailles et remises de diplôme.
              </p>
            </div>
            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-luxury">
              <h3 className="font-display text-xl font-semibold mb-3">Look complet</h3>
              <p className="text-sm text-muted-foreground">
                Repérez les produits sur les hotspots et ajoutez-les facilement à votre panier.
              </p>
            </div>
          </div>

          <div className="mt-12 rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-luxury">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold">Prêt à créer votre look ?</h3>
                <p className="text-sm sm:text-base text-muted-foreground mt-2">
                Découvrez les nouveautés, promotions et packs complets pour préparer votre cérémonie.
                </p>
              </div>
              <Link
                href="/collections"
                className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium shadow-gold hover:shadow-elevated transition-all"
              >
                Voir les collections
              </Link>
            </div>
          </div>

          {isLoadingProducts ? null : (
            <div className="mt-12 text-xs text-muted-foreground">
              {products.length > 0
                ? "Produits chargés depuis la boutique."
                : "Aucun produit trouvé, affichage du lookbook de démonstration."}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
