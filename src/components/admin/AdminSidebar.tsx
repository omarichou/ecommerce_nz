"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useAdminData } from "@/contexts/AdminDataContext";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  History,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import Image from "next/image";

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { adminLogout } = useAdminAuth();
  const { stats } = useAdminData();

  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
    {
      path: "/admin/products",
      label: "Produits",
      icon: Package,
      badge: stats.totalProducts > 0 ? stats.totalProducts : null,
      badgeVariant: "secondary" as const,
    },
    {
      path: "/admin/orders",
      label: "Commandes",
      icon: ShoppingCart,
      badge: stats.pendingOrders > 0 ? stats.pendingOrders : null,
      badgeVariant: "default" as const,
    },
    { path: "/admin/comments", label: "Commentaires", icon: MessageSquare, badge: null },
    { path: "/admin/historique", label: "Historique", icon: History, badge: null },
    { path: "/admin/marketing", label: "Marketing", icon: Megaphone, badge: null },
    { path: "/admin/statistics", label: "Statistiques", icon: BarChart3, badge: null },
    // { path: "/admin/categories", label: "Catégories", icon: Tag, badge: null },
    { path: "/admin/settings", label: "Paramètres", icon: Settings, badge: null },
  ];

  const handleLogout = () => {
    adminLogout();
    router.replace("/admin/login");
  };

  const NavItem = ({ item }: { item: (typeof navItems)[0] }) => {
    const isActive = pathname === item.path;
    const content = (
      <button
        onClick={() => router.push(item.path)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
          isActive
            ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary-foreground")} />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <Badge
                variant={item.badgeVariant}
                className={cn("h-5 min-w-5 flex items-center justify-center text-xs", isActive && "bg-white/20 text-white hover:bg-white/30")}
              >
                {item.badge}
              </Badge>
            )}
          </>
        )}
        {collapsed && item.badge && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
            {item.badge}
          </span>
        )}
      </button>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.label}
            {item.badge && (
              <Badge variant={item.badgeVariant} className="h-5">
                {item.badge}
              </Badge>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-[#1a1a1a] border-r border-white/10 shadow-2xl transition-all duration-300 flex flex-col",
        collapsed ? "w-[100px]" : "w-64",
      )}
    >
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-white/10", collapsed ? "justify-center" : "px-6")}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground font-display font-bold text-lg">H</span>
        </div>
          {/* <Image
          src={"/img_logo/logo-henna-traditions.webp"}
          width={50}
          height={50}
          className="w-[90px] h-[90px] md:w-150 md:h-150"
          alt={""}
           unoptimized={true} 
        /> */}
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-display font-bold text-white text-lg">HENNA</h1>
            <p className="text-xs text-white/50">Ateliers & Traditions</p>
          </div>
        )}
      </div>

      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-[#1a1a1a] border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-primary transition-all shadow-lg"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => window.open("/", "_blank")}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all",
                collapsed && "justify-center",
              )}
            >
              <ExternalLink className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>Voir le site</span>}
            </button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Voir le site</TooltipContent>}
        </Tooltip>

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all",
                collapsed && "justify-center",
              )}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>Déconnexion</span>}
            </button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Déconnexion</TooltipContent>}
        </Tooltip>
      </div>
    </aside>
  );
}
