"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSession, signIn, signOut } from "next-auth/react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

interface Address {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

interface OrderItem {
  productId: string;
  productName: string;
  variant?: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  trackingNumber?: string;
  createdAt: string;
  shippingAddress: Address;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (callbackUrl?: string) => Promise<boolean>;
  loginWithFacebook: () => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  addresses: Address[];
  addAddress: (address: Omit<Address, "id">) => void;
  updateAddress: (id: string, address: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
  orders: Order[];
  addOrder: (order: Omit<Order, "id" | "orderNumber" | "createdAt">) => string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = "elegance_current_user";
const MOCK_USERS_KEY = "elegance_mock_users";
const ADDRESSES_KEY = "elegance_addresses";
const ORDERS_KEY = "elegance_orders";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      if (typeof window === "undefined") return;
      setIsLoading(true);
      try {
        const session = await getSession();
        if (session?.user?.id) {
          const sessionUser: User = {
            id: session.user.id,
            email: session.user.email || "",
            firstName: session.user.firstName || "",
            lastName: session.user.lastName || "",
            role: session.user.role || "user",
            phone: session.user.phoneNumber || "",
            createdAt: new Date().toISOString(),
          };
          setUser(sessionUser);
          loadUserData(sessionUser.id);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadSession();
  }, []);

  const loadUserData = (userId: string) => {
    if (typeof window === "undefined") return;
    const savedAddresses = localStorage.getItem(`${ADDRESSES_KEY}_${userId}`);
    if (savedAddresses) {
      setAddresses(JSON.parse(savedAddresses));
    }

    const savedOrders = localStorage.getItem(`${ORDERS_KEY}_${userId}`);
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  };

  const saveAddresses = (userId: string, newAddresses: Address[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(`${ADDRESSES_KEY}_${userId}`, JSON.stringify(newAddresses));
    setAddresses(newAddresses);
  };

  const saveOrders = (userId: string, newOrders: Order[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(`${ORDERS_KEY}_${userId}`, JSON.stringify(newOrders));
    setOrders(newOrders);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (!res?.ok) {
        toast.error("Mot de passe incorrect");
        return false;
      }

      const session = await getSession();
      if (session?.user?.id) {
        const sessionUser: User = {
          id: session.user.id,
          email: session.user.email || "",
          firstName: session.user.firstName || "",
          lastName: session.user.lastName || "",
          role: session.user.role || "user",
          phone: session.user.phoneNumber || "",
          createdAt: new Date().toISOString(),
        };
        setUser(sessionUser);
        loadUserData(sessionUser.id);
        toast.success("Connexion réussie", { description: `Bienvenue ${sessionUser.firstName || ""} !` });
        return true;
      }

      toast.error("Connexion échouée");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (callbackUrl?: string): Promise<boolean> => {
    await signIn("google", { callbackUrl: callbackUrl || "/account" });
    return true;
  };

  const loginWithFacebook = async (): Promise<boolean> => {
    toast.error("Connexion Facebook non configurée");
    return false;
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/client/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          emailVerified: false,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err?.message || "Inscription échouée");
        return false;
      }

      toast.success("Compte créé avec succès", { description: "Veuillez vérifier votre email." });
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    signOut({ redirect: false }).catch(() => null);
    setUser(null);
    setAddresses([]);
    setOrders([]);
    toast.success("Déconnexion réussie");
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    await new Promise((resolve) => setTimeout(resolve, 500));

    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    if (typeof window !== "undefined") {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

      const usersData = localStorage.getItem(MOCK_USERS_KEY);
      if (usersData) {
        const users: (User & { password: string })[] = JSON.parse(usersData);
        const index = users.findIndex((u) => u.id === updatedUser.id);
        if (index >= 0) {
          users[index] = { ...users[index], ...updatedUser } as User & { password: string };
          localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
        }
      }
    }

    toast.success("Profil mis à jour");
    return true;
  };

  const addAddress = (address: Omit<Address, "id">) => {
    if (!user) return;
    const newAddress: Address = { ...address, id: "addr_" + Date.now() };
    saveAddresses(user.id, [...addresses, newAddress]);
  };

  const updateAddress = (id: string, address: Partial<Address>) => {
    if (!user) return;
    const updated = addresses.map((addr) => (addr.id === id ? { ...addr, ...address } : addr));
    saveAddresses(user.id, updated);
  };

  const deleteAddress = (id: string) => {
    if (!user) return;
    const updated = addresses.filter((addr) => addr.id !== id);
    saveAddresses(user.id, updated);
  };

  const addOrder = (order: Omit<Order, "id" | "orderNumber" | "createdAt">): string => {
    if (!user) return "";
    const newOrder: Order = {
      ...order,
      id: "order_" + Date.now(),
      orderNumber: "CR" + Math.floor(100000 + Math.random() * 900000),
      createdAt: new Date().toISOString(),
    };
    saveOrders(user.id, [...orders, newOrder]);
    return newOrder.orderNumber;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        loginWithFacebook,
        register,
        logout,
        updateProfile,
        addresses,
        addAddress,
        updateAddress,
        deleteAddress,
        orders,
        addOrder,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
