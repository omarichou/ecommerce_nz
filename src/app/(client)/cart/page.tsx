"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck, ChevronLeft, Shield, CreditCard, Star } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { resolveClientUserId } from "@/lib/clientUserId";
import { cartQueryKey, useCartItemsQuery } from "@/hooks/useCartItemsQuery";

type CartProduct = {
  _id: string;
  title?: { fr?: string; ar?: string };
  price?: number;
  ancien_price?: number;
  array_ProductImg?: { secure_url?: string }[];
  reduction?: { reduction?: number; quantite?: number }[];
};

type CartItemApi = {
  _id: string;
  id_product: CartProduct;
  quantite: number;
  caracteristique?: Record<string, string>;
  caracteristique_couleur?: { type?: string; img?: string };
  priceData?: {
    basePrice?: number;
    priceAdjustment?: number;
    unitPrice?: number;
    totalPrice?: number;
  };
};

const calculateTotalPricev2 = (
  reductions: { quantite?: number; reduction?: number }[] = [],
  totalQuantity: number,
  totalPrice: number,
) => {
  if (!reductions || reductions.length === 0) return totalPrice;
  const sortedReductions = [...reductions].sort((a, b) => (b.quantite || 0) - (a.quantite || 0));
  let remainingQuantity = totalQuantity;
  let finalPrice = totalPrice;

  for (const reduction of sortedReductions) {
    if (remainingQuantity <= 0) break;
    const reductionQuantity = reduction.quantite || 0;
    const reductionAmount = reduction.reduction || 0;
    if (reductionQuantity <= 0) continue;

    if (remainingQuantity >= reductionQuantity) {
      const reductionCount = Math.floor(remainingQuantity / reductionQuantity);
      finalPrice -= reductionCount * reductionAmount;
      remainingQuantity -= reductionCount * reductionQuantity;
    }
  }

  return finalPrice;
};

export const dynamic = "force-dynamic";

export default function CartPage() {
  const { refreshCartCount } = useCart();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const id_user = resolveClientUserId(user?.id);
  const [mounted, setMounted] = useState(false);
  const [dataCart, setDataCart] = useState<CartItemApi[]>([]);
  const [promoInput, setPromoInput] = useState("");
  const [promoResult, setPromoResult] = useState<{
    code: string;
    type: string;
    value: number;
    discountAmount: number;
    freeShipping?: boolean;
  } | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const { data: cartItems = [], isLoading } = useCartItemsQuery(id_user);

  useEffect(() => {
    setDataCart((cartItems as CartItemApi[]) || []);
  }, [cartItems]);

  useEffect(() => {
    if (!id_user) return;
    void refreshCartCount();
  }, [id_user, refreshCartCount, dataCart.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedCode = localStorage.getItem("promo_code");
    if (storedCode) {
      setPromoInput(storedCode);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDeleteItem = async (id_item: string) => {
    try {
      const res = await fetch("/api/client/delete_item_cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_item }),
      });
      if (!res.ok) throw new Error("delete");
      const next = dataCart.filter((item) => item._id !== id_item);
      setDataCart(next);
      if (id_user) queryClient.setQueryData(cartQueryKey(id_user), next);
      await refreshCartCount();
      toast.success("Produit supprimé du panier");
    } catch (error) {
      console.error(error);
      toast.error("Suppression impossible");
    }
  };

  const handleUpdateQuantity = async (item: CartItemApi, nextQuantity: number) => {
    if (nextQuantity <= 0) {
      await handleDeleteItem(item._id);
      return;
    }

    try {
      const res = await fetch("/api/client/update_cart_quantite", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: item._id, quantite: nextQuantity }),
      });
      if (!res.ok) throw new Error("update");
      const next = dataCart.map((cartItem) =>
        cartItem._id === item._id ? { ...cartItem, quantite: nextQuantity } : cartItem,
      );
      setDataCart(next);
      if (id_user) queryClient.setQueryData(cartQueryKey(id_user), next);
      await refreshCartCount();
    } catch (error) {
      console.error(error);
      toast.error("Mise à jour impossible");
    }
  };

  const handleClearCart = async () => {
    const id_user = resolveClientUserId(user?.id);
    if (!id_user) return;
    try {
      const res = await fetch("/api/client/clear_cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_user }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body?.error || "Impossible de vider le panier");
        return;
      }
      setDataCart([]);
      if (id_user) queryClient.setQueryData(cartQueryKey(id_user), []);
      await refreshCartCount();
      toast.success("Panier vidé");
    } catch (error) {
      console.error(error);
      toast.error("Impossible de vider le panier");
    }
  };

  const { subtotal, subtotalAfterDiscount } = useMemo(() => {
    const grouped: Record<string, { product: CartProduct; totalQuantity: number; totalPrice: number }> = {};
    let rawSubtotal = 0;

    dataCart.forEach((item) => {
      const product = item.id_product;
      const productId = product?._id || item._id;
      const unitPrice = item.priceData?.unitPrice ?? product?.price ?? 0;
      const itemTotal = unitPrice * item.quantite;
      rawSubtotal += itemTotal;

      if (!grouped[productId]) {
        grouped[productId] = { product, totalQuantity: 0, totalPrice: 0 };
      }
      grouped[productId].totalQuantity += item.quantite;
      grouped[productId].totalPrice += itemTotal;
    });

    const discountedSubtotal = Object.values(grouped).reduce((sum, group) => {
      const reductions = group.product?.reduction || [];
      const reducedTotal = calculateTotalPricev2(reductions, group.totalQuantity, group.totalPrice);
      return sum + reducedTotal;
    }, 0);

    return {
      subtotal: rawSubtotal,
      subtotalAfterDiscount: discountedSubtotal,
    };
  }, [dataCart]);

  const reductionAmount = Math.max(subtotal - subtotalAfterDiscount, 0);
  const promoDiscount = Math.min(promoResult?.discountAmount || 0, subtotalAfterDiscount);
  const totalAfterPromo = Math.max(subtotalAfterDiscount - promoDiscount, 0);

  const applyPromoCode = useCallback(
    async (silent = false) => {
      if (!promoInput.trim()) return;
      const id_user = resolveClientUserId(user?.id);
      if (!id_user) return;
      setIsApplyingPromo(true);
      try {
        const res = await fetch("/api/client/apply_promo_code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: promoInput.trim(), id_user }),
        });
        if (!res.ok) throw new Error("apply");
        const data = await res.json();
        if (!data.valid) {
          setPromoResult(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("promo_code");
          }
          if (!silent) toast.error(data.message || "Code promo invalide");
          return;
        }
        setPromoResult({
          code: data.code,
          type: data.type,
          value: data.value,
          discountAmount: data.discountAmount,
          freeShipping: data.freeShipping,
        });
        if (typeof window !== "undefined") {
          localStorage.setItem("promo_code", data.code);
        }
        if (!silent) toast.success("Code promo appliqué !");
      } catch (error) {
        console.error(error);
        if (!silent) toast.error("Code promo invalide");
      } finally {
        setIsApplyingPromo(false);
      }
    },
    [promoInput, user?.id],
  );

  useEffect(() => {
    if (dataCart.length > 0 && promoInput.trim()) {
      void applyPromoCode(true);
    }
    if (dataCart.length === 0) {
      setPromoResult(null);
    }
  }, [dataCart, promoInput, applyPromoCode]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-28 sm:pt-32 pb-20">
          <div className="container mx-auto px-4 max-w-6xl" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isLoading && dataCart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-muted-foreground" />
              </div>
              <h1 className="font-display text-3xl font-semibold text-foreground mb-4">
                Votre panier est vide
              </h1>
              <p className="text-muted-foreground mb-8">
                Découvrez notre collection et ajoutez des articles à votre panier.
              </p>
              <Link href="/">
                <Button variant="gold" size="lg" className="gap-2">
                  Continuer mes achats
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-28 sm:pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-primary transition-colors">
              Accueil
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Panier</span>
          </nav>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              Mon Panier ({dataCart.length} article{dataCart.length > 1 ? "s" : ""})
            </h1>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" />
              Paiement sécurisé à la livraison
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground mb-8">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-primary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-primary" />
                ))}
              </div>
              4.9/5 par 2 300 clients
            </div>
            <span className="hidden sm:inline-block h-3 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              Livraison estimée : 24–48h
            </div>
            <span className="hidden sm:inline-block h-3 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Retours faciles 7 jours
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary font-body">
              <span className="h-1 w-6 rounded-full bg-primary" />
              Étape 1/3
            </div>
            <div className="mt-3 flex items-center gap-3 text-sm">
              <span className="rounded-full bg-primary text-primary-foreground px-3 py-1">Panier</span>
              <span className="text-muted-foreground">Livraison</span>
              <span className="text-muted-foreground">Paiement</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {isLoading ? (
                <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
                  Chargement du panier...
                </div>
              ) : (
                dataCart.map((item) => (
                  <div
                    key={item._id}
                    className="bg-card border border-border rounded-xl p-4 sm:p-6 flex gap-4 sm:gap-6 animate-fade-in"
                  >
                    <Link href={`/product/${item.id_product?._id}`} className="shrink-0">
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={item.caracteristique_couleur?.img || item.id_product?.array_ProductImg?.[0]?.secure_url || "/placeholder.svg"}
                          alt={item.id_product?.title?.fr || "Produit"}
                          fill
                          sizes="(max-width: 640px) 96px, 128px"
                          className="object-cover hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <Link
                            href={`/product/${item.id_product?._id}`}
                            className="font-display text-lg sm:text-xl font-semibold text-foreground hover:text-primary transition-colors line-clamp-2"
                          >
                            {item.id_product?.title?.fr || "Produit"}
                          </Link>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.caracteristique &&
                              Object.entries(item.caracteristique).map(([key, value]) => (
                                <span key={key} className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                                  {key}: {value}
                                </span>
                              ))}
                            {item.caracteristique_couleur?.type && (
                              <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                                Couleur: {item.caracteristique_couleur.type}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                          <button
                            onClick={() => handleUpdateQuantity(item, item.quantite - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background transition-colors"
                            aria-label="Diminuer la quantité"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-medium">{item.quantite}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item, item.quantite + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background transition-colors"
                            aria-label="Augmenter la quantité"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="font-display text-xl font-semibold text-foreground">
                            {((item.priceData?.unitPrice ?? item.id_product?.price ?? 0) * item.quantite).toLocaleString()} DZD
                          </p>
                          {item.quantite > 1 && (
                            <p className="text-xs text-muted-foreground">
                              {(item.priceData?.unitPrice ?? item.id_product?.price ?? 0).toLocaleString()} DZD / unité
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Continuer mes achats
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCart}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Vider le panier
                </Button>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-2xl p-6 sticky top-32 shadow-luxury">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-semibold text-foreground">Récapitulatif</h2>
                  <span className="text-xs text-muted-foreground">{dataCart.length} article{dataCart.length > 1 ? "s" : ""}</span>
                </div>

                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-2 block">Code promo</label>
                  <div className="flex gap-2">
                    <input
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Entrez un code"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                    <Button onClick={() => applyPromoCode()} disabled={isApplyingPromo}>
                      {isApplyingPromo ? "..." : "Appliquer"}
                    </Button>
                  </div>
                  {promoResult && (
                    <p className="mt-2 text-xs text-primary">
                      Code {promoResult.code} appliqué
                      {promoResult.type === "free_shipping" ? " • Livraison offerte" : ""}
                    </p>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Sous-total</span>
                    <span>{subtotalAfterDiscount.toLocaleString()} DZD</span>
                  </div>
                  {reductionAmount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Remise</span>
                      <span>-{reductionAmount.toLocaleString()} DZD</span>
                    </div>
                  )}
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Code promo</span>
                      <span>-{promoDiscount.toLocaleString()} DZD</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-3 flex justify-between font-semibold text-foreground">
                    <span>Total</span>
                    <span>{totalAfterPromo.toLocaleString()} DZD</span>
                  </div>
                </div>

                <Link href="/checkout">
                  <Button variant="gold" size="lg" className="w-full mt-6 gap-2" disabled={dataCart.length === 0}>
                    <CreditCard className="w-4 h-4" />
                    Passer à la caisse
                  </Button>
                </Link>

                <div className="mt-5 space-y-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />
                    Livraison suivie partout en Algérie
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Garantie satisfait ou remboursé 7 jours
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
