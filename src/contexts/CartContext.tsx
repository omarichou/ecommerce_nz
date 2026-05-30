"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { resolveClientUserId } from "@/lib/clientUserId";

export interface CartItem {
  productId: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  price: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  cartCount: number;
  refreshCartCount: () => Promise<void>;
  promoCode: string;
  setPromoCode: (code: string) => void;
  discount: number;
  applyPromoCode: (code: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const PROMO_CODES: Record<string, number> = {
  WELCOME10: 10,
  CRYSTAL20: 20,
  VIP30: 30,
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const { user } = useAuth();
  const storageKey = `cart_${user?.id || "guest"}`;

  const refreshCartCount = useCallback(async () => {
    const id_user = resolveClientUserId(user?.id);
    if (!id_user) return;
    try {
      const res = await fetch("/api/client/get_cart_client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_user }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        const serverItems = data
          .filter((item) => item?.id_product)
          .map((item) => ({
            productId: item.id_product._id || item.id_product,
            quantity: item.quantite || 0,
            selectedSize: item.caracteristique
              ? Object.entries(item.caracteristique)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(" • ")
              : undefined,
            selectedColor: item.caracteristique_couleur?.type,
            price: item.priceData?.unitPrice || item.id_product?.price || 0,
          }));
        setItems(serverItems);
      }
    } catch (error) {
      console.error(error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setItems(JSON.parse(stored));
    } else {
      setItems([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  useEffect(() => {
    setCartCount(items.reduce((total, item) => total + item.quantity, 0));
  }, [items]);

  useEffect(() => {
    void refreshCartCount();
  }, [refreshCartCount]);

  const addToCart = (item: CartItem) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) =>
          i.productId === item.productId &&
          i.selectedSize === item.selectedSize &&
          i.selectedColor === item.selectedColor,
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += item.quantity;
        return updated;
      }

      return [...prev, item];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const clearCart = () => {
    setItems([]);
    setPromoCode("");
    setDiscount(0);
  };

  const getCartTotal = () => {
    const subtotal = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
    return subtotal - (subtotal * discount) / 100;
  };

  const applyPromoCode = (code: string): boolean => {
    const discountPercent = PROMO_CODES[code.toUpperCase()];
    if (discountPercent) {
      setDiscount(discountPercent);
      setPromoCode(code.toUpperCase());
      return true;
    }
    return false;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        cartCount,
        refreshCartCount,
        promoCode,
        setPromoCode,
        discount,
        applyPromoCode,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
