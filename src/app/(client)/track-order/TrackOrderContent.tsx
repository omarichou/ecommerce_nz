"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Clock, Copy, MapPin, Package, Phone, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { toast } from "sonner";

interface TrackingStep {
  status: string;
  label: string;
  description: string;
  date?: string;
  completed: boolean;
  current: boolean;
}

interface OrderData {
  orderNumber: string;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  steps: TrackingStep[];
}

type TrackOrderResponse = {
  orderNumber: string;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  createdAt?: string;
  yalidineHistory?: { date?: string; status?: string; description?: string }[];
};

const normalizeStatus = (raw?: string) => {
  const value = (raw || "").toLowerCase();
  switch (value) {
    case "en attente":
      return "pending";
    case "confirmé":
    case "confirme":
      return "confirmed";
    case "en préparation":
    case "preparation":
      return "processing";
    case "en cours de livraison":
    case "expédié":
    case "expedie":
    case "envoyé":
    case "envoye":
      return "shipped";
    case "recu":
    case "reçu":
    case "livré":
    case "livre":
      return "delivered";
    case "annulé":
    case "annule":
    case "refusé":
    case "refuse":
      return "cancelled";
    case "remboursé":
    case "rembourse":
      return "refunded";
    default:
      return "pending";
  }
};

const buildSteps = (status: string, createdAt?: string) => {
  const normalized = normalizeStatus(status);
  const statusOrder = ["pending", "confirmed", "processing", "shipped", "delivered"];
  const baseIndex = statusOrder.indexOf(normalized);
  const currentIndex = Math.max(baseIndex, 0);
  const created = createdAt ? Date.parse(createdAt) : Date.now();

  const steps: TrackingStep[] = [
    {
      status: "pending",
      label: "Commande reçue",
      description: "Votre commande a été enregistrée",
      date: new Date(created).toISOString(),
      completed: currentIndex >= 0,
      current: currentIndex === 0,
    },
    {
      status: "confirmed",
      label: "Commande confirmée",
      description: "Votre paiement a été validé",
      date: currentIndex >= 1 ? new Date(created + 3600000).toISOString() : undefined,
      completed: currentIndex >= 1,
      current: currentIndex === 1,
    },
    {
      status: "processing",
      label: "En préparation",
      description: "Votre colis est en cours de préparation",
      date: currentIndex >= 2 ? new Date(created + 86400000).toISOString() : undefined,
      completed: currentIndex >= 2,
      current: currentIndex === 2,
    },
    {
      status: "shipped",
      label: "Expédié",
      description: "Votre colis est en route",
      date: currentIndex >= 3 ? new Date(created + 172800000).toISOString() : undefined,
      completed: currentIndex >= 3,
      current: currentIndex === 3,
    },
    {
      status: "delivered",
      label: "Livré",
      description: "Votre colis a été livré",
      date: currentIndex >= 4 ? new Date(created + 259200000).toISOString() : undefined,
      completed: currentIndex >= 4,
      current: currentIndex === 4,
    },
  ];

  if (normalized === "cancelled") {
    steps.forEach((step, index) => {
      step.completed = index === 0;
      step.current = false;
    });
    steps.push({
      status: "cancelled",
      label: "Commande refusée",
      description: "La commande a été refusée ou annulée",
      date: new Date(created + 7200000).toISOString(),
      completed: true,
      current: true,
    });
  }

  if (normalized === "refunded") {
    steps.forEach((step, index) => {
      step.completed = index <= 1;
      step.current = false;
    });
    steps.push({
      status: "refunded",
      label: "Commande remboursée",
      description: "Le remboursement a été effectué",
      date: new Date(created + 7200000).toISOString(),
      completed: true,
      current: true,
    });
  }

  return steps;
};

const getStatusIcon = (status: string, completed: boolean, current: boolean) => {
  const iconClass = completed ? "text-primary" : current ? "text-primary" : "text-muted-foreground";

  switch (status) {
    case "pending":
      return <Clock className={`w-5 h-5 ${iconClass}`} />;
    case "confirmed":
      return <CheckCircle className={`w-5 h-5 ${iconClass}`} />;
    case "processing":
      return <Package className={`w-5 h-5 ${iconClass}`} />;
    case "shipped":
      return <Truck className={`w-5 h-5 ${iconClass}`} />;
    case "delivered":
      return <MapPin className={`w-5 h-5 ${iconClass}`} />;
    case "cancelled":
    case "refunded":
      return <XCircle className={`w-5 h-5 ${iconClass}`} />;
    default:
      return <Clock className={`w-5 h-5 ${iconClass}`} />;
  }
};

export default function TrackOrderContent({ initialOrderNumber }: { initialOrderNumber?: string }) {
  const [searchQuery, setSearchQuery] = useState(initialOrderNumber || "");
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const trackOrder = async (number: string) => {
    setIsLoading(true);
    setNotFound(false);

    let apiOrder: TrackOrderResponse | null = null;

    try {
      const res = await fetch(`/api/client/track_order?order=${encodeURIComponent(number)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        apiOrder = (await res.json()) as TrackOrderResponse;
      }
    } catch (error) {
      console.error(error);
    }

    let fallbackOrder: any | null = null;
    if (!apiOrder && typeof window !== "undefined") {
      const allOrders: any[] = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key?.startsWith("elegance_orders_")) {
          const orders = JSON.parse(localStorage.getItem(key) || "[]");
          allOrders.push(...orders);
        }
      }
      fallbackOrder = allOrders.find((o) => o.orderNumber === number) || null;
    }

    const resolved = apiOrder || fallbackOrder;
    if (resolved) {
      const createdAt = resolved.createdAt || new Date().toISOString();
      const steps = buildSteps(resolved.status || "en attente", createdAt);

      setOrderData({
        orderNumber: resolved.orderNumber || number,
        status: resolved.status || "en attente",
        trackingNumber: resolved.trackingNumber || "",
        trackingUrl: resolved.trackingUrl || "",
        estimatedDelivery: new Date(Date.parse(createdAt) + 345600000).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
        steps,
      });
    } else {
      setNotFound(true);
      setOrderData(null);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (initialOrderNumber) {
      trackOrder(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      trackOrder(searchQuery.trim());
    }
  };

  const copyTrackingNumber = () => {
    const value = orderData?.trackingNumber || orderData?.trackingUrl;
    if (value) {
      navigator.clipboard.writeText(value);
      toast.success("Numéro de suivi copié");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-28 pb-24 lg:pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Link href="/account" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Retour à mon compte
          </Link>

          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Suivre ma commande</h1>
            <p className="text-muted-foreground">Entrez votre numéro de commande pour voir son statut</p>
          </div>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-3">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: ELG-12345678"
                className="h-12"
              />
              <Button type="submit" variant="gold" className="h-12 px-6" disabled={isLoading}>
                {isLoading ? "Recherche..." : "Suivre"}
              </Button>
            </div>
          </form>

          {notFound && (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">Commande introuvable</h3>
              <p className="text-muted-foreground">Vérifiez le numéro et réessayez</p>
            </div>
          )}

          {orderData && (
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Commande</p>
                    <p className="font-display text-xl font-bold">{orderData.orderNumber}</p>
                  </div>
                  {orderData.estimatedDelivery && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Livraison estimée</p>
                      <p className="font-medium text-primary">{orderData.estimatedDelivery}</p>
                    </div>
                  )}
                </div>

                {(orderData.trackingNumber || orderData.trackingUrl) && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Truck className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Numéro de suivi</p>
                      <p className="font-mono font-medium">{orderData.trackingNumber || orderData.trackingUrl}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={copyTrackingNumber}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-display text-lg font-semibold mb-6">Statut de la livraison</h3>

                <div className="space-y-0">
                  {orderData.steps.map((step, index) => (
                    <div key={step.status} className="relative flex gap-4">
                      {index < orderData.steps.length - 1 && (
                        <div
                          className={`absolute left-[18px] top-10 w-0.5 h-[calc(100%-10px)] ${
                            step.completed ? "bg-primary" : "bg-border"
                          }`}
                        />
                      )}

                      <div
                        className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                          step.completed
                            ? "bg-primary text-primary-foreground"
                            : step.current
                            ? "bg-primary/20 text-primary border-2 border-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {getStatusIcon(step.status, step.completed, step.current)}
                      </div>

                      <div className={`flex-1 pb-8 ${!step.completed && !step.current ? "opacity-50" : ""}`}>
                          <p
                          className={`font-medium ${
                            step.status === "cancelled" || step.status === "refunded"
                              ? "text-red-600"
                              : step.current
                              ? "text-primary"
                              : ""
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                        {step.date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(step.date).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-muted/50 rounded-2xl p-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">Besoin d'aide avec votre commande ?</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/contact" className="gap-2">
                      <Phone className="w-4 h-4" />
                      Nous contacter
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
