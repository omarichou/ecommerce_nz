"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminData } from "@/contexts/AdminDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, DollarSign, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";

export default function AdminStatisticsPage() {
  const { stats, orders, products, refreshOrders, refreshProducts } = useAdminData();

  useEffect(() => {
    void refreshOrders({ page: 1, limit: 200 });
    void refreshProducts({ page: 1, limit: 200 });
  }, [refreshOrders, refreshProducts]);
  const [period, setPeriod] = useState<"7d" | "30d" | "6m">("7d");

  const COLORS = ["#c9a961", "#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

  const completedOrders = useMemo(
    () => orders.filter((o) => o.status !== "cancelled" && o.status !== "refunded"),
    [orders],
  );

  const periodRange = useMemo(() => {
    const now = new Date();
    if (period === "6m") {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return { start, end: now };
    }
    const days = period === "30d" ? 29 : 6;
    const start = new Date(now);
    start.setDate(now.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }, [period]);

  const periodOrders = useMemo(
    () => completedOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= periodRange.start && d <= periodRange.end;
    }),
    [completedOrders, periodRange],
  );

  const dailyData = useMemo(() => {
    if (period === "6m") return [] as { date: string; revenue: number; orders: number }[];
    const days = period === "30d" ? 30 : 7;
    const result: { date: string; revenue: number; orders: number }[] = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayOrders = periodOrders.filter((o) => o.createdAt.startsWith(dateStr));
      result.push({
        date: date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
        orders: dayOrders.length,
      });
    }
    return result;
  }, [period, periodOrders]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const result: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthOrders = completedOrders.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= start && d <= end;
      });
      result.push({
        month: start.toLocaleDateString("fr-FR", { month: "short" }),
        revenue: monthOrders.reduce((sum, o) => sum + o.total, 0) / 1000,
      });
    }
    return result;
  }, [completedOrders]);

  const orderStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    periodOrders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name:
        status === "pending"
          ? "En attente"
          : status === "confirmed"
            ? "Confirmée"
            : status === "processing"
              ? "En préparation"
              : status === "shipped"
                ? "Expédiée"
                : status === "delivered"
                  ? "Livrée"
                  : status === "cancelled"
                    ? "Annulée"
                    : status,
      value: count,
    }));
  }, [periodOrders]);

  const topProducts = useMemo(() => {
    const productSales: Record<string, { sold: number; revenue: number; name: string }> = {};
    periodOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { sold: 0, revenue: 0, name: item.productName };
        }
        productSales[item.productId].sold += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });
    return Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [periodOrders]);

  const revenueByCategory = useMemo(() => {
    const categoryRevenue: Record<string, number> = {};
    periodOrders.forEach((order) => {
      order.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        const cat = product?.category || "Autre";
        categoryRevenue[cat] = (categoryRevenue[cat] || 0) + item.price * item.quantity;
      });
    });
    const total = Object.values(categoryRevenue).reduce((a, b) => a + b, 0);
    return Object.entries(categoryRevenue).map(([category, revenue]) => ({
      category,
      revenue,
      percentage: total ? Math.round((revenue / total) * 100) : 0,
    }));
  }, [periodOrders, products]);

  const deliveredCount = periodOrders.filter((o) => o.status === "delivered").length;
  const deliveryRate = periodOrders.length ? Math.round((deliveredCount / periodOrders.length) * 100) : 0;
  const avgCart = periodOrders.length ? Math.round(periodOrders.reduce((sum, o) => sum + o.total, 0) / periodOrders.length) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Statistiques</h1>
            <p className="text-muted-foreground mt-1">Analyse détaillée des performances</p>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as "7d" | "30d" | "6m")}
          >
            <TabsList>
              <TabsTrigger value="7d">7 jours</TabsTrigger>
              <TabsTrigger value="30d">30 jours</TabsTrigger>
              <TabsTrigger value="6m">6 mois</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-slate-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenus du mois</p>
                  <p className="text-3xl font-bold mt-1">{(stats.monthRevenue / 1000).toFixed(0)}K</p>
                  <p className="text-sm text-muted-foreground">DA</p>
                </div>
                <div className={`flex items-center gap-1 text-sm ${stats.revenueChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {stats.revenueChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {Math.abs(stats.revenueChange)}%
                </div>
              </div>
              <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.min(100, (stats.monthRevenue / (stats.totalRevenue || 1)) * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Commandes ce mois</p>
                  <p className="text-3xl font-bold mt-1">
                    {orders.filter((o) => new Date(o.createdAt) >= new Date(new Date().setDate(1))).length}
                  </p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-500/50" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">{stats.pendingOrders} en attente</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Panier moyen</p>
                  <p className="text-3xl font-bold mt-1">{avgCart.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">DA</p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Nouveaux clients</p>
                  <p className="text-3xl font-bold mt-1">{stats.newCustomersThisMonth}</p>
                  <p className="text-sm text-muted-foreground">ce mois</p>
                </div>
                <Users className="w-8 h-8 text-violet-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Évolution des revenus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={period === "6m" ? monthlyData : dailyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c9a961" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#c9a961" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey={period === "6m" ? "month" : "date"} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="#94a3b8"
                      tickFormatter={(v) => `${v}${period === "6m" ? "K" : ""}`}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value.toLocaleString()} ${period === "6m" ? "K " : ""}DA`, "Revenus"]}
                      contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#c9a961" strokeWidth={2} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Top 5 produits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      formatter={(value: number) => [`${value.toLocaleString()} DA`, "Revenus"]}
                      contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                    />
                    <Bar dataKey="revenue" fill="#c9a961" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle>Répartition par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="revenue"
                      nameKey="category"
                    >
                      {revenueByCategory.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value.toLocaleString()} DA`, "Revenus"]}
                      contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle>Statuts des commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderStatusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {orderStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.name === "Livrée"
                              ? "#22c55e"
                              : entry.name === "Annulée"
                                ? "#ef4444"
                                : entry.name === "En attente"
                                  ? "#f59e0b"
                                  : entry.name === "Expédiée"
                                    ? "#06b6d4"
                                    : "#6366f1"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-base">Taux de livraison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-8 border-primary flex items-center justify-center">
                  <span className="text-xl font-bold">{deliveryRate}%</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Commandes livrées</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-base">Revenus totaux</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{(stats.totalRevenue / 1000).toFixed(0)}K DA</p>
              <p className="text-sm text-muted-foreground mt-2">Depuis le début</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Commandes</p>
                  <p className="font-semibold">{stats.totalOrders}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Clients</p>
                  <p className="font-semibold">{stats.totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
