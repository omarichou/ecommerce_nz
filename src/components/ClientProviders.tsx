"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import QueryProvider from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { CartProvider } from "@/contexts/CartContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { AdminDataProvider } from "@/contexts/AdminDataContext";

const ClientProviders = ({ children }: { children: ReactNode }) => {
  return (
    <SessionProvider>
      <QueryProvider>
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>
              <AdminAuthProvider>
                <AdminDataProvider>
                  <Toaster richColors />
                  {children}
                </AdminDataProvider>
              </AdminAuthProvider>
            </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </QueryProvider>
    </SessionProvider>
  );
};

export default ClientProviders;
