"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShoppingBag, CreditCard, MapPin, Check } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DEFAULT_MERCHANT_WILAYA_ID,
  fetchYalidineResource,
  findWilayaByName,
  findCommuneByName,
  getDeliveryFeeFromYalidineFees,
  buildWilayaLabel,
} from "@/lib/yalidine";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { resolveClientUserId } from "@/lib/clientUserId";

type CartProduct = {
  _id: string;
  title?: { fr?: string; ar?: string };
  price?: number;
  reduction?: { reduction?: number; quantite?: number }[];
  array_ProductImg?: { secure_url?: string }[];
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

type RelayCenter = {
  center_id: number | string;
  name: string;
  address: string;
  commune_id?: number;
  commune_name?: string;
  wilaya_id?: number;
  wilaya_name?: string;
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

type CheckoutStep = "cart" | "shipping" | "payment";

const steps: { id: CheckoutStep; label: string; icon: React.ElementType }[] = [
  { id: "cart", label: "Panier", icon: ShoppingBag },
  { id: "shipping", label: "Livraison", icon: MapPin },
  { id: "payment", label: "Paiement", icon: CreditCard },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { refreshCartCount } = useCart();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("cart");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dataCart, setDataCart] = useState<CartItemApi[]>([]);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [deliveryFees, setDeliveryFees] = useState(0);
  const [centers, setCenters] = useState<RelayCenter[]>([]);
  const [isLoadingCenters, setIsLoadingCenters] = useState(false);
  const [wilayas, setWilayas] = useState<{ id: number; name: string; zone: string; is_deliverable: boolean }[]>([]);
  const [communesFetched, setCommunesFetched] = useState<{ id: number; name: string; wilaya_id: number; has_stop_desk: boolean }[]>([]);
  const [feesData, setFeesData] = useState<any>(null);
  const [isLoadingWilayas, setIsLoadingWilayas] = useState(true);
  const [isLoadingShippingData, setIsLoadingShippingData] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoResult, setPromoResult] = useState<{
    code: string;
    type: string;
    value: number;
    discountAmount: number;
    freeShipping?: boolean;
  } | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [shippingData, setShippingData] = useState({
    fullName: "",
    email: "",
    phone: "",
    confirmedPhone: "",
    address: "",
    wilaya: "",
    deliveryType: "relayPoint",
    commune: "",
    relayPoint: null as RelayCenter | null,
    note: "",
  });

  const loadCart = useCallback(async () => {
    const id_user = resolveClientUserId(user?.id);
    if (!id_user) return;
    setIsLoadingCart(true);
    try {
      const res = await fetch("/api/client/get_cart_client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_user }),
      });
      if (!res.ok) throw new Error("load");
      const data: CartItemApi[] = await res.json();
      setDataCart(data || []);
      await refreshCartCount();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger le panier");
      setDataCart([]);
    } finally {
      setIsLoadingCart(false);
    }
  }, [refreshCartCount, user?.id]);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedCode = localStorage.getItem("promo_code");
    if (storedCode) {
      setPromoInput(storedCode);
    }
  }, []);

  const handleDeleteItem = async (id_item: string) => {
    try {
      const res = await fetch("/api/client/delete_item_cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_item }),
      });
      if (!res.ok) throw new Error("delete");
      setDataCart((prev) => prev.filter((item) => item._id !== id_item));
      await refreshCartCount();
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
      setDataCart((prev) =>
        prev.map((cartItem) =>
          cartItem._id === item._id ? { ...cartItem, quantite: nextQuantity } : cartItem,
        ),
      );
      await refreshCartCount();
    } catch (error) {
      console.error(error);
      toast.error("Mise à jour impossible");
    }
  };

  const selectedWilaya = useMemo(
    () => findWilayaByName(wilayas, shippingData.wilaya),
    [shippingData.wilaya, wilayas],
  );

  const selectedCommune = useMemo(
    () => findCommuneByName(communesFetched, shippingData.commune),
    [communesFetched, shippingData.commune],
  );

  useEffect(() => {
    const loadWilayas = async () => {
      setIsLoadingWilayas(true);
      try {
        const data = await fetchYalidineResource("wilayas", {
          fields: "id,name,zone,is_deliverable",
          order_by: "id",
        });
        setWilayas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching wilayas:", error);
      } finally {
        setIsLoadingWilayas(false);
      }
    };
    loadWilayas();
  }, []);

  useEffect(() => {
    if (!selectedWilaya?.id) {
      setCommunesFetched([]);
      setFeesData(null);
      setCenters([]);
      setDeliveryFees(0);
      return;
    }

    const loadShippingData = async () => {
      setIsLoadingShippingData(true);
      try {
        const [communesData, feesResponse, centersData] = await Promise.all([
          fetchYalidineResource("communes", {
            wilaya_id: selectedWilaya.id,
            fields: "id,name,wilaya_id,wilaya_name,has_stop_desk,is_deliverable",
            order_by: "id",
          }),
          fetchYalidineResource("fees", {
            from_wilaya_id: DEFAULT_MERCHANT_WILAYA_ID,
            to_wilaya_id: selectedWilaya.id,
          }),
          fetchYalidineResource("centers", {
            wilaya_id: selectedWilaya.id,
          }),
        ]);

        setCommunesFetched(Array.isArray(communesData) ? communesData : []);
        setFeesData(feesResponse || null);

        const normalizedCenters = Array.isArray(centersData) ? centersData : [];
        if (selectedWilaya.id === DEFAULT_MERCHANT_WILAYA_ID) {
          const annabaCenter = {
            center_id: 230101,
            name: "Ateliers Henna & Traditions",
            address: "Ateliers Henna & Traditions - Annaba",
            commune_id: 2301,
            commune_name: "Annaba",
            wilaya_id: DEFAULT_MERCHANT_WILAYA_ID,
            wilaya_name: "Annaba",
          };
          const mergedCenters = [annabaCenter, ...normalizedCenters].filter(
            (center, index, array) =>
              index === array.findIndex((item) => `${item.center_id}` === `${center.center_id}`)
          );
          setCenters(mergedCenters);
        } else {
          setCenters(normalizedCenters);
        }
      } catch (error) {
        console.error("Error fetching shipping data:", error);
        toast.error("Erreur de chargement des données de livraison");
      } finally {
        setIsLoadingShippingData(false);
      }
    };

    loadShippingData();
  }, [selectedWilaya?.id]);

  useEffect(() => {
    if (!selectedWilaya || !feesData) {
      setDeliveryFees(0);
      return;
    }
    const fees = getDeliveryFeeFromYalidineFees({
      feesData,
      deliveryType: shippingData.deliveryType,
      communeName: selectedCommune?.name || shippingData.commune,
      communeId: selectedCommune?.id,
    });
    setDeliveryFees(fees);
  }, [feesData, shippingData.deliveryType, shippingData.commune, selectedCommune?.id, selectedWilaya]);

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
  const effectiveDeliveryFees = promoResult?.freeShipping ? 0 : deliveryFees;
  const total = Math.max(subtotalAfterDiscount - promoDiscount, 0) + effectiveDeliveryFees;

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

  const isShippingValid = (() => {
    if (currentStep !== "shipping") return true;
    const d = shippingData;
    if (!d.fullName || !d.phone || !d.confirmedPhone || !d.wilaya || !d.deliveryType) return false;
    if (d.phone !== d.confirmedPhone) return false;
    if (d.deliveryType === "relayPoint" && !d.relayPoint?.center_id) return false;
    if (d.deliveryType === "homeDelivery" && (!d.address?.trim() || !d.commune)) return false;
    return true;
  })();

  const handleNextStep = () => {
    if (currentStep === "cart") {
      setCurrentStep("shipping");
      return;
    }
    if (currentStep === "shipping") {
      if (!isShippingValid) {
        toast.error("Veuillez remplir tous les champs obligatoires de livraison");
        return;
      }
      setCurrentStep("payment");
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      if (dataCart.length === 0) {
        toast.error("Votre panier est vide");
        return;
      }

      if (!shippingData.fullName || !shippingData.phone || !shippingData.confirmedPhone || !shippingData.wilaya || !shippingData.deliveryType) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        return;
      }

      if (shippingData.phone !== shippingData.confirmedPhone) {
        toast.error("Les numéros de téléphone ne correspondent pas");
        return;
      }

      if (shippingData.deliveryType === "relayPoint" && !shippingData.relayPoint?.center_id) {
        toast.error("Veuillez sélectionner un point relais");
        return;
      }

      if (shippingData.deliveryType === "homeDelivery") {
        if (!shippingData.address.trim() || !shippingData.commune) {
          toast.error("Veuillez renseigner votre adresse complète");
          return;
        }
      }

      const minPriceRes = await fetch("/api/client/get_min_price");
      if (!minPriceRes.ok) throw new Error("min_price");
      const minPriceData = await minPriceRes.json();
      const minPrice = Number(minPriceData?.price_min ?? minPriceData?.price_minimum ?? minPriceData?.price ?? 0);
      if (minPrice && subtotalAfterDiscount < minPrice) {
        toast.error(`Le minimum de commande est ${minPrice} DZD`);
        return;
      }

      const id_user = resolveClientUserId(user?.id);
      if (!id_user) {
        toast.error("Session utilisateur invalide");
        return;
      }
      const orderData = {
        id_user,
        array_product: dataCart.map((item) => ({
          id_product: item.id_product?._id,
          quantite: item.quantite,
          price: item.priceData?.unitPrice ?? item.id_product?.price ?? 0,
          caracteristique: item.caracteristique || {},
          caracteristique_couleur: {
            type: item.caracteristique_couleur?.type || "",
            img: item.caracteristique_couleur?.img || "",
          },
        })),
        status: "en attente",
        createdAt: new Date(),
        customerDetails: {
          fullName: shippingData.fullName.trim(),
          email: shippingData.email,
          phoneNumber: shippingData.phone,
          wilaya: shippingData.wilaya,
          deliveryType: shippingData.deliveryType,
          commune: shippingData.commune,
          note: shippingData.note?.trim() || "",
          ...(shippingData.deliveryType === "homeDelivery" && {
            address: shippingData.address.trim(),
          }),
          ...(shippingData.deliveryType === "relayPoint" && shippingData.relayPoint && {
            relayPoint: {
              center_id: shippingData.relayPoint.center_id,
              name: shippingData.relayPoint.name,
              address: shippingData.relayPoint.address,
              commune_id: shippingData.relayPoint.commune_id,
              commune_name: shippingData.relayPoint.commune_name,
              wilaya_id: shippingData.relayPoint.wilaya_id,
              wilaya_name: shippingData.relayPoint.wilaya_name,
            },
          }),
        },
        deliveryFees: effectiveDeliveryFees,
        total,
        promoCode: promoResult?.code || "",
        promoType: promoResult?.type || "",
        promoValue: promoResult?.value || 0,
        promoDiscount: promoDiscount,
        promoFreeShipping: !!promoResult?.freeShipping,
        subtotalBeforePromo: subtotalAfterDiscount,
      };

      const orderRes = await fetch("/api/client/addOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
    
      if (!orderRes.ok) throw new Error("order");
      const orderResult = await orderRes.json();

      await Promise.all(
        dataCart.map((item) =>
          fetch("/api/client/update_Product_PurchaseCount", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_product: item.id_product?._id, quantite: item.quantite }),
          }),
        ),
      );

      await Promise.all(
        dataCart.map((item) =>
          fetch("/api/client/delete_cart_client", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_item: item._id }),
          }),
        ),
      );

      setDataCart([]);
      await refreshCartCount();

      const orderNumber = orderResult?.orderNumber;
      if (orderNumber && typeof window !== "undefined") {
        const storageKey = `elegance_orders_${id_user}`;
        const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
        existing.push({
          orderNumber,
          status: "en attente",
          createdAt: new Date().toISOString(),
          trackingNumber: orderResult?.trackingNumber || "",
        });
        localStorage.setItem(storageKey, JSON.stringify(existing));
      }

      toast.success("Commande confirmée !", {
        description: orderNumber ? `Numéro: ${orderNumber}` : "Merci pour votre confiance",
      });

      if (orderNumber) {
        router.push(`/track-order?order=${encodeURIComponent(orderNumber)}`);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error(error);
      toast.error("Impossible de finaliser la commande");
    } finally {
      setIsProcessing(false);
    }
  };

  const stepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-28 sm:pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(stepIndex / (steps.length - 1)) * 100}%` }}
                />
              </div>

              {steps.map((step, index) => (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      index <= stepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index < stepIndex ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                  </div>
                  <span
                    className={`mt-2 text-sm font-medium ${
                      index <= stepIndex ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {currentStep === "cart" && (
                <div className="space-y-4">
                  <h2 className="font-display text-2xl font-semibold text-foreground">Votre Panier</h2>
                  {isLoadingCart ? (
                    <div className="text-sm text-muted-foreground bg-card rounded-2xl border border-border p-6">
                      Chargement du panier...
                    </div>
                  ) : dataCart.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-2xl border border-border">
                      <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-display text-xl text-foreground mb-2">Votre panier est vide</h3>
                      <p className="text-muted-foreground mb-6">Découvrez nos collections et ajoutez vos articles préférés</p>
                      <Link href="/">
                        <Button variant="gold">Continuer mes achats</Button>
                      </Link>
                    </div>
                  ) : (
                    dataCart.map((item) => (
                      <div key={item._id} className="flex gap-4 p-4 bg-card rounded-xl border border-border">
                        <Link href={`/product/${item.id_product?._id}`} className="shrink-0">
                          <img
                            src={item.caracteristique_couleur?.img || item.id_product?.array_ProductImg?.[0]?.secure_url}
                            alt={item.id_product?.title?.fr || "Produit"}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/product/${item.id_product?._id}`}>
                            <h3 className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1">
                              {item.id_product?.title?.fr || "Produit"}
                            </h3>
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
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center border border-border rounded-lg">
                              <button
                                onClick={() => handleUpdateQuantity(item, item.quantite - 1)}
                                className="p-2 hover:bg-muted transition-colors"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-medium">{item.quantite}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item, item.quantite + 1)}
                                className="p-2 hover:bg-muted transition-colors"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => handleDeleteItem(item._id)}
                              className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-lg font-bold text-foreground">
                            {((item.priceData?.unitPrice ?? item.id_product?.price ?? 0) * item.quantite).toLocaleString()} DZD
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {currentStep === "shipping" && (
                <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                  <h2 className="font-display text-2xl font-semibold text-foreground">Adresse de livraison</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      placeholder="Nom complet *"
                      value={shippingData.fullName}
                      onChange={(e) => setShippingData((s) => ({ ...s, fullName: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm sm:col-span-2"
                    />
                    <input
                      placeholder="Email"
                      value={shippingData.email}
                      onChange={(e) => setShippingData((s) => ({ ...s, email: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                    />
                    <input
                      placeholder="Téléphone *"
                      value={shippingData.phone}
                      onChange={(e) => setShippingData((s) => ({ ...s, phone: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                    />
                    <input
                      placeholder="Confirmer le téléphone *"
                      value={shippingData.confirmedPhone}
                      onChange={(e) => setShippingData((s) => ({ ...s, confirmedPhone: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                    />
                    <select
                      value={shippingData.wilaya}
                      onChange={(e) =>
                        setShippingData((s) => ({
                          ...s,
                          wilaya: e.target.value,
                          commune: "",
                          relayPoint: null,
                        }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                      disabled={isLoadingWilayas}
                    >
                      <option value="">{isLoadingWilayas ? "Chargement..." : "Sélectionnez la wilaya *"}</option>
                      {wilayas.map((wilaya) => (
                        <option key={wilaya.id} value={wilaya.name}>
                          {buildWilayaLabel(wilaya)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={shippingData.deliveryType}
                      onChange={(e) =>
                        setShippingData((s) => ({
                          ...s,
                          deliveryType: e.target.value,
                          commune: "",
                          relayPoint: null,
                        }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                    >
                      <option value="relayPoint">Point relais</option>
                      <option value="homeDelivery">Livraison à domicile</option>
                    </select>

                    {shippingData.deliveryType === "relayPoint" && (
                      <select
                        value={shippingData.relayPoint?.center_id ?? ""}
                        onChange={(e) => {
                          const selected = centers.find((c) => String(c.center_id) === e.target.value);
                          setShippingData((s) => ({
                            ...s,
                            relayPoint: selected || null,
                            commune: selected?.commune_name || "",
                          }));
                        }}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm sm:col-span-2"
                        disabled={!shippingData.wilaya || isLoadingCenters || isLoadingShippingData}
                      >
                        <option value="">Choisir un point relais</option>
                        {isLoadingCenters || isLoadingShippingData ? (
                          <option value="" disabled>
                            Chargement...
                          </option>
                        ) : (
                          centers.map((center) => (
                            <option key={center.center_id} value={center.center_id}>
                              {center.center_id} - {center.address}
                            </option>
                          ))
                        )}
                      </select>
                    )}

                    {shippingData.deliveryType === "homeDelivery" && (
                      <>
                        <select
                          value={shippingData.commune}
                          onChange={(e) => setShippingData((s) => ({ ...s, commune: e.target.value }))}
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                          disabled={!shippingData.wilaya || isLoadingShippingData}
                        >
                          <option value="">{isLoadingShippingData ? "Chargement..." : "Sélectionnez la commune *"}</option>
                          {communesFetched.map((commune) => (
                            <option key={commune.id} value={commune.name}>
                              {commune.name}
                            </option>
                          ))}
                        </select>
                        <input
                          placeholder="Adresse *"
                          value={shippingData.address}
                          onChange={(e) => setShippingData((s) => ({ ...s, address: e.target.value }))}
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                        />
                      </>
                    )}
                    <textarea
                      placeholder="Note (optionnelle)"
                      value={shippingData.note}
                      onChange={(e) => setShippingData((s) => ({ ...s, note: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm sm:col-span-2 min-h-[80px]"
                    />
                  </div>
                </div>
              )}

              {currentStep === "payment" && (
                <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                  <h2 className="font-display text-2xl font-semibold text-foreground">Paiement</h2>
                  <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
                    Paiement à la livraison disponible. Vous serez contacté pour confirmer votre commande.
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Link href="/cart" className="text-sm text-muted-foreground hover:text-foreground">
                  Retour au panier
                </Link>
                <Button
                  onClick={currentStep === "payment" ? handlePlaceOrder : handleNextStep}
                  className="gap-2"
                  disabled={isLoadingCart || (currentStep === "cart" && dataCart.length === 0) || (currentStep === "shipping" && !isShippingValid) || isProcessing}
                >
                  {currentStep === "payment" ? "Confirmer" : "Continuer"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-2xl p-6 sticky top-32">
                <h3 className="font-display text-xl font-semibold text-foreground mb-4">Résumé</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Sous-total</span>
                    <span>{subtotalAfterDiscount.toLocaleString()} DZD</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Livraison</span>
                    <span>{promoResult?.freeShipping ? "Gratuite" : `${effectiveDeliveryFees.toLocaleString()} DZD`}</span>
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
                    <span>{total.toLocaleString()} DZD</span>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="text-sm font-medium text-foreground mb-2 block">Code promo</label>
                  <div className="flex gap-2">
                    <input
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Entrez un code"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm"
                    />
                    <Button variant="outline" onClick={() => applyPromoCode()} disabled={isApplyingPromo}>
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
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
