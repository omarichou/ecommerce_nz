"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminData, type Order } from "@/contexts/AdminDataContext";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Eye,
  FileText,
  Mail,
  MapPin,
  Package,
  Phone,
  Printer,
  RefreshCw,
  Search,
  ShoppingCart,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { orders, updateOrderStatus, refreshOrders } = useAdminData();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateSort, setDateSort] = useState<"asc" | "desc">("desc");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadOrders = async () => {
      setIsLoadingOrders(true);
      const statusParam = statusFilter === "all" ? undefined : statusFilter;
      const meta = await refreshOrders({ page, limit: pageSize, status: statusParam });
      if (isMounted && meta) {
        setTotal(meta.total);
      }
      if (isMounted) setIsLoadingOrders(false);
    };
    void loadOrders();
    return () => {
      isMounted = false;
    };
  }, [page, pageSize, refreshOrders, statusFilter]);

  const viewOrder = useMemo(() => {
    const viewId = searchParams.get("view");
    if (!viewId) return null;
    return orders.find((o) => o.id === viewId) || null;
  }, [orders, searchParams]);

  const activeOrder = selectedOrder ?? viewOrder;

  const filteredOrders = useMemo(() => {
    const result = orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesDate = dateFilter
        ? new Date(order.createdAt).toISOString().split("T")[0] === dateFilter
        : true;
      return matchesSearch && matchesStatus && matchesDate;
    });

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateSort === "desc" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [orders, searchQuery, statusFilter, dateFilter, dateSort]);

  const statusOptions: { value: Order["status"]; label: string; icon: typeof Clock; color: string }[] = [
    { value: "pending", label: "En attente", icon: Clock, color: "bg-amber-500/10 text-amber-600 border-amber-200" },
    { value: "confirmed", label: "Confirmée", icon: CheckCircle, color: "bg-blue-500/10 text-blue-600 border-blue-200" },
    { value: "processing", label: "En préparation", icon: Package, color: "bg-purple-500/10 text-purple-600 border-purple-200" },
    { value: "shipped", label: "En cours de livraison", icon: Truck, color: "bg-cyan-500/10 text-cyan-600 border-cyan-200" },
    { value: "delivered", label: "Reçue", icon: CheckCircle, color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
    { value: "cancelled", label: "Refusée", icon: XCircle, color: "bg-red-500/10 text-red-600 border-red-200" },
  ];

  const getStatusInfo = (status: string) => {
    return statusOptions.find((s) => s.value === status) || statusOptions[0];
  };

  const handleStatusChange = (orderId: string, newStatus: Order["status"], note?: string) => {
    updateOrderStatus(orderId, newStatus, note);
    toast.success("Statut mis à jour", {
      description: `La commande est maintenant "${getStatusInfo(newStatus).label}"`,
    });
    if (newStatus === "confirmed") {
      void (async () => {
        try {
          const response = await fetch("/api/admin/yalidine", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId }),
          });
          const result = await response.json();
          if (response.ok) {
            toast.success("Colis envoyé", { description: `Numéro: ${result.parcel_id}` });
          } else {
            toast.error("Erreur Yalidine", { description: result.error || "Inconnue" });
          }
        } catch (err) {
          console.error(err);
          toast.error("Erreur Yalidine", { description: "Erreur réseau" });
        }
      })();
    }
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const pendingCount = statusCounts.pending || 0;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const totalLabel = total > 0 ? total : orders.length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Commandes</h1>
            <p className="text-muted-foreground mt-1">{totalLabel} commandes au total</p>
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Vous avez {pendingCount} nouvelle(s) commande(s) en attente de traitement.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter("all");
              setPage(1);
            }}
          >
            Toutes ({statusCounts.all})
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
              {status.label} ({statusCounts[status.value] || 0})
            </Button>
          ))}
        </div>

        <Card className="border-border/50 bg-white dark:bg-slate-900">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par N° commande, client, email..."
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateSort(dateSort === "desc" ? "asc" : "desc")}
                className="gap-2"
              >
                Date
                {dateSort === "desc" ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
            </div>
            {isLoadingOrders && <p className="text-sm text-muted-foreground mt-3">Chargement des commandes...</p>}
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
                  {filteredOrders.map((order) => {
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className={`h-7 px-2 text-xs gap-1 ${statusInfo.color} border`}>
                                <statusInfo.icon className="w-3 h-3" />
                                {statusInfo.label}
                                <ChevronDown className="w-3 h-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {statusOptions.map((status) => (
                                <DropdownMenuItem
                                  key={status.value}
                                  onClick={() => handleStatusChange(order.id, status.value)}
                                  className="gap-2"
                                >
                                  <status.icon className="w-4 h-4" />
                                  {status.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                            }}
                            className="gap-1 h-8"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">Détails</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Aucune commande trouvée</p>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 text-sm">
              <span className="text-muted-foreground">{total > 0 ? `Page ${page} sur ${totalPages}` : ""}</span>
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

      <Dialog
        open={!!activeOrder}
        onOpenChange={() => {
          setSelectedOrder(null);
          const params = new URLSearchParams(searchParams.toString());
          if (params.has("view")) {
            params.delete("view");
            const query = params.toString();
            router.replace(query ? `/admin/orders?${query}` : "/admin/orders");
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Commande {activeOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {activeOrder && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Printer className="w-4 h-4" />
                  Imprimer facture
                </Button>
                {activeOrder.status !== "cancelled" && activeOrder.status !== "refunded" && (
                  <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700">
                    <RefreshCw className="w-4 h-4" />
                    Rembourser
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Informations Client
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary">{activeOrder.customerName[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium">{activeOrder.customerName}</p>
                        <p className="text-sm text-muted-foreground">{activeOrder.customerEmail}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {activeOrder.customerPhone}
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p>{activeOrder.shippingAddress.street}</p>
                        <p>
                          {activeOrder.shippingAddress.city}, {activeOrder.shippingAddress.wilaya}
                        </p>
                        <p>{activeOrder.shippingAddress.postalCode}</p>
                      </div>
                    </div>
                    {activeOrder.notes && (
                      <div className="flex items-start gap-2 text-sm">
                        <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Note du client</p>
                          <p className="text-muted-foreground">{activeOrder.notes}</p>
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
                        {new Date(activeOrder.createdAt).toLocaleDateString("fr-FR", {
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
                      <Badge variant="outline" className={getStatusInfo(activeOrder.status).color}>
                        {getStatusInfo(activeOrder.status).label}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Paiement</span>
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {activeOrder.paymentMethod}
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-xs">Numéro de commande</Label>
                      <Input value={activeOrder.orderNumber} readOnly className="h-8 text-sm bg-muted/40" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Articles commandés</h4>
                <div className="space-y-2">
                  {activeOrder.items.map((item, index) => (
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
                  <span>{activeOrder.subtotal.toLocaleString()} DA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Livraison</span>
                  <span>
                    {activeOrder.shippingCost === 0 ? "Gratuite" : `${activeOrder.shippingCost.toLocaleString()} DA`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TVA</span>
                  <span>{activeOrder.tax.toLocaleString()} DA</span>
                </div>
                {activeOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Réduction</span>
                    <span>-{activeOrder.discount.toLocaleString()} DA</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{activeOrder.total.toLocaleString()} DA</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Historique des statuts</h4>
                <div className="relative pl-4 space-y-4">
                  <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-border" />
                  {activeOrder.statusHistory.map((history, index) => {
                    const statusInfo = getStatusInfo(history.status);
                    return (
                      <div key={index} className="relative flex gap-3">
                        <div
                          className={`w-3 h-3 rounded-full mt-1 ${
                            index === activeOrder.statusHistory.length - 1 ? "bg-primary" : "bg-muted-foreground/30"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium">{statusInfo.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(history.date).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {history.note && <p className="text-xs text-muted-foreground mt-1">{history.note}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>


            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AdminOrdersContent />
    </Suspense>
  );
}
