"use client";

import { useQuery } from "@tanstack/react-query";

export const cartQueryKey = (id_user: string) => ["cart-items", id_user] as const;

export const fetchCartItems = async (id_user: string) => {
  const res = await fetch("/api/client/get_cart_client", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_user }),
  });
  if (!res.ok) throw new Error("load");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const useCartItemsQuery = (id_user?: string) => {
  return useQuery({
    queryKey: id_user ? cartQueryKey(id_user) : ["cart-items", "guest"],
    queryFn: () => fetchCartItems(id_user as string),
    enabled: !!id_user,
  });
};
