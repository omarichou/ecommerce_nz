"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect } from "react";
import { useAdminData } from "@/contexts/AdminDataContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { stats, orders, refreshOrders, refreshProducts } = useAdminData();

  useEffect(() => {
    void refreshOrders({ page: 1, limit: 200 });
    void refreshProducts({ page: 1, limit: 200 });
  }, [refreshOrders, refreshProducts]);

  const recentOrders = orders
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const statCards = [
    {
      title: "Revenus du mois",
      value: `${stats.monthRevenue.toLocaleString()} DA`,
      icon: DollarSign,
      change: `${stats.revenueChange >= 0 ? "+" : ""}${stats.revenueChange}%`,
      positive: stats.revenueChange >= 0,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      title: "Commandes en cours",
      value: stats.pendingOrders.toString(),
      icon: ShoppingCart,
      change: `${stats.totalOrders} total`,
      positive: true,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Nouveaux clients",
      value: stats.newCustomersThisMonth.toString(),
      icon: Users,
      change: `${stats.totalCustomers} total`,
      positive: true,
      color: "from-violet-500 to-violet-600",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "confirmed":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "processing":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "shipped":
        return "bg-cyan-500/10 text-cyan-600 border-cyan-500/20";
      case "delivered":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "En attente",
      confirmed: "Confirmée",
      processing: "En préparation",
      shipped: "Expédiée",
      delivered: "Livrée",
      cancelled: "Annulée",
      refunded: "Remboursée",
    };
    return labels[status] || status;
  };

  const COLORS = ["#c9a961", "#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Tableau de Bord</h1>
          <p className="text-muted-foreground mt-1">Bienvenue ! Voici un aperçu de votre boutique.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden border-border/50 bg-white dark:bg-slate-900 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1 text-foreground">{stat.value}</p>
                    <div className={`flex items-center gap-1 mt-2 text-xs ${stat.positive ? "text-emerald-600" : "text-red-600"}`}>
                      {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {stat.change}
                    </div>
                  </div>
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/50 bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                Ventes des 7 derniers jours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.dailyRevenue}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c9a961" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#c9a961" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value: number, name: string) => [
                        `${value.toLocaleString()} DA`,
                        name === "revenue" ? "Revenu" : "Commandes",
                      ]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#c9a961" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-primary" />
                Top 5 Produits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Pas encore de ventes</p>
                ) : (
                  stats.topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sold} vendus</p>
                      </div>
                      <span className="text-sm font-semibold text-primary">{product.revenue.toLocaleString()} DA</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-border/50 bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Répartition par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.revenueByCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Pas de données</p>
              ) : (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.revenueByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="revenue" nameKey="category">
                        {stats.revenueByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value.toLocaleString()} DA`, "Revenu"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="mt-4 space-y-2">
                {stats.revenueByCategory.slice(0, 4).map((cat, index) => (
                  <div key={cat.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-muted-foreground">{cat.category}</span>
                    </div>
                    <span className="font-medium">{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-border/50 bg-white dark:bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Dernières commandes
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push("/admin/orders")}>
                Voir tout →
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">N° Commande</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Client</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Wilaya</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Total</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 text-sm font-mono">{order.orderNumber}</td>
                        <td className="py-2.5 px-3">
                          <div>
                            <p className="text-sm font-medium">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-sm">{order.shippingAddress.wilaya}</td>
                        <td className="py-2.5 px-3 text-sm font-semibold">{order.total.toLocaleString()} DA</td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {recentOrders.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Aucune commande</p>}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </AdminLayout>
  );
}
