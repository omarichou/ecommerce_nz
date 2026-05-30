"use client";

import Link from "next/link";
import { Heart, ShoppingBag, Share2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/contexts/FavoritesContext";
import type { Product } from "@/data/products";
import ProductCardModern from "@/components/product/ProductCardModern";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";

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

export default function FavoritesPage() {
  const { favorites, refreshFavorites } = useFavorites();
  const [products, setProducts] = useState<ProductApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void refreshFavorites();
  }, [refreshFavorites]);

  useEffect(() => {
    const loadFavorites = async () => {
      if (favorites.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch("/api/client/get_products_by_ids", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: favorites }),
        });
        if (!res.ok) throw new Error("load");
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadFavorites();
  }, [favorites]);

  const favoriteProducts = useMemo(() => {
    return products.map((item) => {
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
  }, [products]);

  const handleShareWishlist = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    toast.success("Lien de la wishlist copié !");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-28 sm:pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">Mes Favoris</h1>
              <p className="text-muted-foreground mt-1">
                {favoriteProducts.length} article{favoriteProducts.length !== 1 ? "s" : ""} sauvegardé
                {favoriteProducts.length !== 1 ? "s" : ""}
              </p>
            </div>

            {favoriteProducts.length > 0 && (
              <Button variant="outline" className="gap-2" onClick={handleShareWishlist}>
                <Share2 className="w-4 h-4" />
                Partager ma wishlist
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="rounded-2xl bg-muted animate-pulse h-[260px] sm:h-[320px]" />
              ))}
            </div>
          ) : favoriteProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Heart className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="font-display text-2xl text-foreground mb-2">Votre liste de favoris est vide</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Explorez notre collection et cliquez sur le cœur pour sauvegarder vos articles préférés.
              </p>
              <Link href="/">
                <Button variant="gold" size="lg" className="gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Découvrir nos produits
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {favoriteProducts.map((product, index) => (
                <ProductCardModern key={product.id} product={product} index={index} />
              ))}
            </div>
          )}

          {favoriteProducts.length > 0 && (
            <div className="text-center mt-12">
              <Link href="/">
                <Button variant="outline" size="lg" className="gap-2">
                  Continuer mes achats
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
