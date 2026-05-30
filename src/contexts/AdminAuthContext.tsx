"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSession, signIn, signOut } from "next-auth/react";

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  isAdminLoading: boolean;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      setIsAdminLoading(true);
      try {
        const session = await getSession();
        setIsAdminAuthenticated(session?.user?.role === "admin");
      } finally {
        setIsAdminLoading(false);
      }
    };

    void loadSession();
  }, []);

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    setIsAdminLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (!res?.ok) {
        setIsAdminAuthenticated(false);
        return false;
      }
      const session = await getSession();
      const ok = session?.user?.role === "admin";
      setIsAdminAuthenticated(ok);
      if (!ok) {
        await signOut({ redirect: false });
      }
      return ok;
    } finally {
      setIsAdminLoading(false);
    }
  };

  const adminLogout = () => {
    signOut({ redirect: false }).catch(() => null);
    setIsAdminAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAdminAuthenticated, isAdminLoading, adminLogin, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
