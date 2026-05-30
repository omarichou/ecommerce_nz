"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  FileText,
  Mail,
  MapPin,
  Phone,
  Search,
  ShoppingCart,
  Truck,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import type { Order } from "@/contexts/AdminDataContext";

type ApiOrder = {
  _id: string;
  status?: string;
  createdAt?: string;
  array_product?: {
    id_product?: {
      _id?: string;
      title?: { fr?: string; ar?: string };
      price?: number;
      array_ProductImg?: { secure_url?: string }[];
    };
    quantite?: number;
    price?: number;
    caracteristique?: Record<string, string>;
    caracteristique_couleur?: { type?: string; img?: string };
  }[];
  customerDetails?: {
    fullName?: string;
    phoneNumber?: string;
    wilaya?: string;
    commune?: string;
    address?: string;
    deliveryType?: string;
  };
  deliveryFees?: number;
  total?: number;
};

const statusFromApi = (status?: string): Order["status"] => {
  switch ((status || "").toLowerCase()) {
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
      return "shipped";
    case "recu":
    case "reçu":
    case "livré":
    case "livre":
      return "delivered";
    case "refusé":
    case "refuse":
    case "annulé":
    case "annule":
      return "cancelled";
    case "remboursé":
    case "rembourse":
      return "refunded";
    default:
      return "pending";
  }
};

const generateSku = (name: string) => {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "X");
  return `${prefix}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

const mapApiOrderToOrder = (order: ApiOrder, index: number): Order => {
  const items = (order.array_product || []).map((item) => {
    const product = item.id_product;
    const productName = product?.title?.fr || "Produit";
    const productId = product?._id || "";
    const colorName = item.caracteristique_couleur?.type || "";
    const colorImage = item.caracteristique_couleur?.img || "";
    return {
      productId,
      productName,
      sku: generateSku(productName || productId || `PROD-${index}`),
      quantity: item.quantite || 0,
      price: item.price || product?.price || 0,
      image: colorImage || product?.array_ProductImg?.[0]?.secure_url,
      variantInfo: item.caracteristique ? Object.values(item.caracteristique).join(" / ") : undefined,
      colorName: colorName || undefined,
      colorImage: colorImage || undefined,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = order.deliveryFees || 0;
  const total = order.total || subtotal + shippingCost;
  const createdAt = order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString();
  const status = statusFromApi(order.status);

  return {
    id: order._id,
    orderNumber: `ORD-${order._id?.slice(-6) || String(1000 + index).padStart(5, "0")}`,
    customerName: order.customerDetails?.fullName || "",
    customerEmail: "",
    customerPhone: order.customerDetails?.phoneNumber || "",
    shippingAddress: {
      street: order.customerDetails?.address || "",
      city: order.customerDetails?.commune || order.customerDetails?.wilaya || "",
      wilaya: order.customerDetails?.wilaya || "",
      postalCode: "",
      country: "Algérie",
    },
    items,
    subtotal,
    shippingCost,
    tax: 0,
    discount: 0,
    total,
    status,
    paymentStatus: status === "pending" ? "pending" : status === "cancelled" ? "refunded" : "paid",
    paymentMethod: "Paiement à la livraison",
    notes: "",
    internalNotes: "",
    statusHistory: [{ status, date: createdAt }],
    createdAt,
    updatedAt: new Date().toISOString(),
  };
};

export default function AdminHistoriquePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    let isMounted = true;
    const loadOrders = async () => {
      setIsLoadingOrders(true);
      try {
        const response = await fetch("/api/admin/get_historique", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Chargement impossible");
        }
        const data = await response.json();
        const items = Array.isArray(data) ? data : [];
        if (isMounted) {
          setOrders(items.map((item, index) => mapApiOrderToOrder(item, index)));
        }
      } catch (err) {
        console.error(err);
        toast.error("Erreur", { description: "Impossible de charger l'historique" });
      } finally {
        if (isMounted) setIsLoadingOrders(false);
      }
    };
    void loadOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  const statusOptions: { value: Order["status"]; label: string; icon: typeof Clock; color: string }[] = [
    { value: "shipped", label: "En cours de livraison", icon: Truck, color: "bg-cyan-500/10 text-cyan-600 border-cyan-200" },
    { value: "delivered", label: "Reçue", icon: CheckCircle, color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
    { value: "cancelled", label: "Refusée", icon: XCircle, color: "bg-red-500/10 text-red-600 border-red-200" },
  ];

  const getStatusInfo = (status: string) => {
    return statusOptions.find((s) => s.value === status) || statusOptions[0];
  };

  const filteredOrders = useMemo(() => {
    const result = orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesDate = dateFilter ? new Date(order.createdAt).toISOString().split("T")[0] === dateFilter : true;
      return matchesSearch && matchesStatus && matchesDate;
    });
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [orders, searchQuery, statusFilter, dateFilter]);

  const totalPages = Math.max(Math.ceil(filteredOrders.length / pageSize), 1);
  const pagedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = async (orderId: string) => {
    if (!confirm("Supprimer cette commande ?")) return;
    try {
      const response = await fetch("/api/admin/delete_order", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId }),
      });
      if (!response.ok) throw new Error("delete");
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
      toast.success("Commande supprimée");
    } catch (err) {
      console.error(err);
      toast.error("Erreur", { description: "Suppression impossible" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Historique</h1>
            <p className="text-muted-foreground mt-1">{orders.length} commandes archivées</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter("all");
              setPage(1);
            }}
          >
            Toutes ({orders.length})
          </Button>
          {statusOptions.map((status) => (
            <Button
              key={status.value}
              variant={statusFilter === status.value ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter(status.value);
                setPage(1);
              }}
              className="gap-1"
            >
              <status.icon className="w-3 h-3" />
              {status.label}
            </Button>
          ))}
        </div>

        <Card className="border-border/50 bg-white dark:bg-slate-900">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par N° commande ou client..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                className="sm:w-48"
              />
            </div>
            {isLoadingOrders && (
              <p className="text-sm text-muted-foreground mt-3">Chargement de l&apos;historique...</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-white dark:bg-slate-900 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-4 px-4 text-xs font-medium text-muted-foreground">N° Commande</th>
                    <th className="text-left py-4 px-4 text-xs font-medium text-muted-foreground">Client</th>
                    <th className="text-left py-4 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Date</th>
                    <th className="text-left py-4 px-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">Articles</th>
                    <th className="text-left py-4 px-4 text-xs font-medium text-muted-foreground">Total</th>
                    <th className="text-left py-4 px-4 text-xs font-medium text-muted-foreground">Statut</th>
                    <th className="text-left py-4 px-4 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedOrders.map((order) => {
                    const statusInfo = getStatusInfo(order.status);
                    return (
                      <tr key={order.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-sm">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">{order.shippingAddress.wilaya}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">
                          {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-4 text-sm hidden lg:table-cell">
                          {order.items.length} article{order.items.length > 1 ? "s" : ""}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-sm">{order.total.toLocaleString()} DA</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={`${statusInfo.color} border`}>{statusInfo.label}</Badge>
                        </td>
                        <td className="py-3 px-4 flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            className="gap-1 h-8"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">Détails</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 text-red-600" onClick={() => handleDelete(order.id)}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagedOrders.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Aucune commande trouvée</p>
              </div>
            )}

            <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 text-sm">
              <span className="text-muted-foreground">{filteredOrders.length > 0 ? `Page ${page} sur ${totalPages}` : ""}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => (p <= 1 ? totalPages : p - 1))}
                  disabled={totalPages <= 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => (p >= totalPages ? 1 : p + 1))}
                  disabled={totalPages <= 1}
                >
                  Suivant
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Commande {selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Informations Client
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary">{selectedOrder.customerName[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium">{selectedOrder.customerName}</p>
                        <p className="text-sm text-muted-foreground">{selectedOrder.customerEmail}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {selectedOrder.customerPhone}
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p>{selectedOrder.shippingAddress.street}</p>
                        <p>
                          {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.wilaya}
                        </p>
                        <p>{selectedOrder.shippingAddress.postalCode}</p>
                      </div>
                    </div>
                    {selectedOrder.notes && (
                      <div className="flex items-start gap-2 text-sm">
                        <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Note du client</p>
                          <p className="text-muted-foreground">{selectedOrder.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Détails Commande
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Date</span>
                      <span>
                        {new Date(selectedOrder.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Statut</span>
                      <Badge variant="outline" className={getStatusInfo(selectedOrder.status).color}>
                        {getStatusInfo(selectedOrder.status).label}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Paiement</span>
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {selectedOrder.paymentMethod}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Articles commandés</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.productName}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded object-cover"
                          unoptimized
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.productName}</p>
                        {item.variantInfo && <p className="text-xs text-muted-foreground">{item.variantInfo}</p>}
                        {item.colorName && <p className="text-xs text-muted-foreground">Couleur: {item.colorName}</p>}
                        <p className="text-xs text-muted-foreground">
                          SKU: {item.sku} • Qté: {item.quantity}
                        </p>
                      </div>
                      <span className="font-semibold">{(item.price * item.quantity).toLocaleString()} DA</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{selectedOrder.subtotal.toLocaleString()} DA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Livraison</span>
                  <span>
                    {selectedOrder.shippingCost === 0 ? "Gratuite" : `${selectedOrder.shippingCost.toLocaleString()} DA`}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{selectedOrder.total.toLocaleString()} DA</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="destructive" onClick={() => handleDelete(selectedOrder.id)}>
                  Supprimer la commande
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
