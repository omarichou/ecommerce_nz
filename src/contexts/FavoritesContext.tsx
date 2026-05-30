"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { resolveClientUserId } from "@/lib/clientUserId";

interface FavoritesContextType {
  favorites: string[];
  addFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  favoritesCount: number;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const { user } = useAuth();
  const storageKey = `favorites_${user?.id || "guest"}`;

  const refreshFavorites = useCallback(async () => {
    const id_user = resolveClientUserId(user?.id);
    if (!id_user) return;
    try {
      const res = await fetch("/api/client/get_favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_user }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const ids = Array.isArray(data)
        ? data.map((item) => (typeof item.id_product === "string" ? item.id_product : item.id_product?._id))
        : [];
      setFavorites(Array.from(new Set(ids.filter(Boolean))));
    } catch (error) {
      console.error(error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setFavorites(JSON.parse(stored));
    } else {
      setFavorites([]);
    }
  }, [storageKey]);

  useEffect(() => {
    void  refreshFavorites();
  }, [refreshFavorites]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey, JSON.stringify(favorites));
  }, [favorites, storageKey]);

  const addFavorite = (productId: string) => {
    setFavorites((prev) => [...new Set([...prev, productId])]);
    const id_user = resolveClientUserId(user?.id);
    if (!id_user) return;
    fetch("/api/client/add_favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_user, id_product: productId }),
    }).then(() => refreshFavorites()).catch(console.error);
  };

  const removeFavorite = (productId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== productId));
    const id_user = resolveClientUserId(user?.id);
    if (!id_user) return;
    fetch("/api/client/remove_favorite", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_user, id_product: productId }),
    }).then(() => refreshFavorites()).catch(console.error);
  };

  const toggleFavorite = (productId: string) => {
    if (favorites.includes(productId)) {
      removeFavorite(productId);
    } else {
      addFavorite(productId);
    }
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        favoritesCount: favorites.length,
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
};
