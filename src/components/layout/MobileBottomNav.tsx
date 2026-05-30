"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, ShoppingBag, User } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

const MobileBottomNav = () => {
  const pathname = usePathname();
  const { favoritesCount } = useFavorites();
  const { cartCount } = useCart();

  const navItems = [
    {
      icon: Home,
      label: "Accueil",
      href: "/",
      isActive: pathname === "/",
    },
    {
      icon: Search,
      label: "Chercher",
      href: "/search",
      isActive: pathname === "/search",
    },
    {
      icon: Heart,
      label: "Favoris",
      href: "/favorites",
      isActive: pathname === "/favorites",
      badge: favoritesCount,
    },
    {
      icon: ShoppingBag,
      label: "Panier",
      href: "/cart",
      isActive: pathname === "/cart",
      badge: cartCount,
    },
    {
      icon: User,
      label: "Compte",
      href: "/account",
      isActive: pathname === "/account",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14 sm:h-16 px-1 sm:px-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl transition-all duration-300 relative group min-w-0 flex-1",
              item.isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.isActive && (
              <div className="absolute -top-0.5 sm:-top-1 left-1/2 -translate-x-1/2 w-5 sm:w-6 h-0.5 sm:h-1 bg-primary rounded-full" />
            )}

            <div className="relative flex-shrink-0">
              <item.icon
                className={cn(
                  "w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200",
                  item.isActive && "scale-110",
                )}
              />

              {typeof item.badge === "number" && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 min-w-[14px] sm:min-w-[16px] h-3.5 sm:h-4 bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 sm:px-1 animate-scale-in">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </div>

            <span
              className={cn(
                "text-[9px] sm:text-[10px] font-medium transition-all truncate max-w-full",
                item.isActive && "text-primary",
              )}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
