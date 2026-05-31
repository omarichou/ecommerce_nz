"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminData } from "@/contexts/AdminDataContext";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ExternalLink, LogOut, Package, Search, Settings, ShoppingCart, X, Bell } from "lucide-react";

export default function AdminTopbar() {
  const router = useRouter();
  const { adminLogout } = useAdminAuth();
  const { orders, stats, globalSearch } = useAdminData();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ReturnType<typeof globalSearch> | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const pendingOrders = orders
    .filter((o) => o.status === "pending")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  useEffect(() => {
    if (searchQuery.trim()) {
      setSearchResults(globalSearch(searchQuery));
    } else {
      setSearchResults(null);
    }
  }, [searchQuery, globalSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    adminLogout();
    router.replace("/admin/login");
  };

  const hasResults =
    searchResults &&
    (searchResults.products.length > 0 || searchResults.orders.length > 0);

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-border/50 px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <div ref={searchRef} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher produits, commandes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className="pl-10 pr-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults(null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {isSearchFocused && hasResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl border border-border shadow-xl overflow-hidden z-50">
              {searchResults.products.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                    <Package className="w-3 h-3" />
                    Produits
                  </div>
                  {searchResults.products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        router.push(`/admin/products?edit=${product.id}`);
                        setSearchQuery("");
                        setIsSearchFocused(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <Image src={product.images[0]} alt={product.title.fr} width={32} height={32} className="w-8 h-8 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.title.fr}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                      <span className="text-sm font-medium text-primary">{product.price.toLocaleString()} DA</span>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.orders.length > 0 && (
                <div className="p-2 border-t border-border">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                    <ShoppingCart className="w-3 h-3" />
                    Commandes
                  </div>
                  {searchResults.orders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => {
                        router.push(`/admin/orders?view=${order.id}`);
                        setSearchQuery("");
                        setIsSearchFocused(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">{order.customerName}</p>
                      </div>
                      <span className="text-sm font-medium">{order.total.toLocaleString()} DA</span>
                    </button>
                  ))}
                </div>
              )}


            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open("/", "_blank")} className="hidden md:flex gap-2">
            <ExternalLink className="w-4 h-4" />
            
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <button className="relative p-2 rounded-xl hover:bg-muted transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                {stats.pendingOrders > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
                    {stats.pendingOrders > 9 ? "9+" : stats.pendingOrders}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="px-4 py-3 border-b border-border">
                <h4 className="font-semibold">Notifications</h4>
                <p className="text-xs text-muted-foreground">{stats.pendingOrders} commande(s) en attente</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {pendingOrders.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">Aucune notification</div>
                ) : (
                  pendingOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => router.push(`/admin/orders?view=${order.id}`)}
                      className="w-full flex items-start gap-3 p-3 hover:bg-muted transition-colors text-left border-b border-border/50 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Nouvelle commande {order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground truncate">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-primary">{order.total.toLocaleString()} DA</span>
                    </button>
                  ))
                )}
              </div>
              {pendingOrders.length > 0 && (
                <div className="p-2 border-t border-border">
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => router.push("/admin/orders")}
                  >
                    Voir toutes les commandes
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted transition-colors">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  A
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">Admin</p>
                  <p className="text-xs text-muted-foreground">Administrateur</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open("/", "_blank")}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Voir le site
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
