"use client";

import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Product, Category, categories as initialCategories } from "@/data/products";

export interface ProductVariant {
  id: string;
  sku: string;
  options: Record<string, string>;
  price: number;
  stock: number;
  weight: number;
  image?: string;
  active: boolean;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface AdminProduct extends Product {
  sku: string;
  descriptionShort: string;
  descriptionLong: string;
  brand: string;
  tags: string[];
  status: "published" | "draft" | "scheduled";
  collections: string[];
  options: ProductOption[];
  variants: ProductVariant[];
  weight: number;
  dimensions: { length: number; width: number; height: number };
  requiresShipping: boolean;
  specialShipping: number;
  costPrice: number;
  taxRate: number;
  onSale: boolean;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  visibility: "public" | "private" | "password";
  publishDate?: string;
  featured: boolean;
  isNew: boolean;
  isPopular: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  imageMeta?: { secure_url: string; public_id_url?: string }[];
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    street: string;
    city: string;
    wilaya: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    wilaya: string;
    postalCode: string;
    country: string;
  };
  items: {
    productId: string;
    productName: string;
    variantInfo?: string;
    sku: string;
    quantity: number;
    price: number;
    image?: string;
    colorName?: string;
    colorImage?: string;
  }[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
  paymentStatus: "pending" | "paid" | "refunded" | "failed";
  paymentMethod: string;
  trackingNumber?: string;
  notes: string;
  internalNotes: string;
  statusHistory: { status: string; date: string; note?: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  addresses: {
    id: string;
    type: "shipping" | "billing";
    isDefault: boolean;
    street: string;
    city: string;
    wilaya: string;
    postalCode: string;
    country: string;
  }[];
  totalOrders: number;
  totalSpent: number;
  wishlist: string[];
  notes: string;
  tags: string[];
  createdAt: string;
  lastOrderAt?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  applicableCategories: string[];
  applicableProducts: string[];
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  firstName?: string;
  subscribedAt: string;
  active: boolean;
}

export interface StoreSettings {
  storeName: string;
  logo: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  timezone: string;
  taxRates: { name: string; rate: number; categories: string[] }[];
  shippingZones: { name: string; regions: string[]; cost: number; freeAbove?: number; deliveryDays: string }[];
  paymentMethods: { id: string; name: string; enabled: boolean; config?: Record<string, string> }[];
}

interface AdminDataContextType {
  products: AdminProduct[];
  categories: Category[];
  orders: Order[];
  customers: Customer[];
  promoCodes: PromoCode[];
  subscribers: NewsletterSubscriber[];
  settings: StoreSettings;
  refreshProducts: (options?: { page?: number; limit?: number; q?: string; category?: string; status?: string }) => Promise<
    | {
        total: number;
        page: number;
        limit: number;
      }
    | undefined
  >;
  refreshOrders: (options?: { page?: number; limit?: number; status?: string }) => Promise<
    | {
        total: number;
        page: number;
        limit: number;
      }
    | undefined
  >;
  refreshPromoCodes: () => Promise<void>;
  refreshSubscribers: () => Promise<void>;
  addProduct: (product: Omit<AdminProduct, "id" | "createdAt" | "updatedAt">) => void;
  updateProduct: (id: string, product: Partial<AdminProduct>) => void;
  deleteProduct: (id: string) => void;
  duplicateProduct: (id: string) => void;
  bulkUpdateProducts: (ids: string[], updates: Partial<AdminProduct>) => void;
  bulkDeleteProducts: (ids: string[]) => void;
  addCategory: (category: Omit<Category, "name_search">) => void;
  updateCategory: (nameSearch: string, category: Partial<Category>) => void;
  deleteCategory: (nameSearch: string) => void;
  updateOrderStatus: (id: string, status: Order["status"], note?: string) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  addOrderNote: (id: string, note: string) => void;
  addCustomer: (customer: Omit<Customer, "id" | "createdAt">) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addPromoCode: (promo: Omit<PromoCode, "id" | "createdAt" | "usedCount">) => void;
  updatePromoCode: (id: string, promo: Partial<PromoCode>) => void;
  deletePromoCode: (id: string) => void;
  addSubscriber: (email: string, firstName?: string) => void;
  removeSubscriber: (id: string) => void;
  exportSubscribers: () => string;
  updateSettings: (settings: Partial<StoreSettings>) => void;
  stats: {
    totalRevenue: number;
    monthRevenue: number;
    revenueChange: number;
    totalOrders: number;
    pendingOrders: number;
    totalProducts: number;
    totalCustomers: number;
    newCustomersThisMonth: number;
    averageOrderValue: number;
    topProducts: { id: string; name: string; sold: number; revenue: number }[];
    revenueByCategory: { category: string; revenue: number; percentage: number }[];
    dailyRevenue: { date: string; revenue: number; orders: number }[];
    monthlyRevenue: { month: string; revenue: number }[];
    ordersByStatus: Record<string, number>;
  };
  globalSearch: (query: string) => {
    products: AdminProduct[];
    orders: Order[];
  };
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

const CATEGORIES_KEY = "admin_categories";
const CUSTOMERS_KEY = "admin_customers";
const PROMO_KEY = "admin_promos";
const SUBSCRIBERS_KEY = "admin_subscribers";
const SETTINGS_KEY = "admin_settings";

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  const stored = localStorage.getItem(key);
  return stored ? (JSON.parse(stored) as T) : fallback;
};

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const generateSku = (name: string) => {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "X");
  return `${prefix}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

type ApiProduct = {
  _id: string;
  categorie?: string;
  title?: { fr?: string; ar?: string };
  price?: number;
  ancien_price?: number;
  array_ProductImg?: { secure_url?: string; public_id_url?: string }[];
  disponible?: string;
  description?: { fr?: string; ar?: string };
  reduction?: { reduction?: number; quantite?: number; dateDebut?: string; dateFin?: string }[];
  createdAt?: string;
  isNew?: boolean;
  isPopular?: boolean;
  featured?: boolean;
  sku?: string;
  status?: string;
};

type ApiOrder = {
  _id: string;
  orderNumber?: string;
  status?: string;
  createdAt?: string;
  trackingNumber?: string;
  array_product?: {
    id_product?: {
      _id?: string;
      title?: { fr?: string; ar?: string };
      price?: number;
      array_ProductImg?: { secure_url?: string }[];
    };
    quantite?: number;
    price?: number;
    caracteristique?: Record<string, string>;
    caracteristique_couleur?: { type?: string; img?: string };
  }[];
  customerDetails?: {
    fullName?: string;
    phoneNumber?: string;
    email?: string;
    wilaya?: string;
    commune?: string;
    address?: string;
    deliveryType?: string;
    note?: string;
  };
  deliveryFees?: number;
  total?: number;
};

type ApiPromoCode = {
  _id: string;
  code?: string;
  type?: "percentage" | "fixed" | "free_shipping";
  value?: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount?: number;
  applicableCategories?: string[];
  applicableProducts?: string[];
  startDate?: string;
  endDate?: string;
  active?: boolean;
  createdAt?: string;
};

type ApiSubscriber = {
  _id: string;
  email?: string;
  firstName?: string;
  subscribedAt?: string;
  active?: boolean;
};

const statusFromApi = (status?: string): Order["status"] => {
  switch ((status || "").toLowerCase()) {
    case "en attente":
      return "pending";
    case "confirmé":
    case "confirme":
      return "confirmed";
    case "en préparation":
    case "preparation":
      return "processing";
    case "en cours de livraison":
    case "expédié":
    case "expedie":
      return "shipped";
    case "recu":
    case "reçu":
    case "livré":
    case "livre":
      return "delivered";
    case "refusé":
    case "refuse":
    case "annulé":
    case "annule":
      return "cancelled";
    case "remboursé":
    case "rembourse":
      return "refunded";
    default:
      return "pending";
  }
};

const statusToApi = (status: Order["status"]) => {
  switch (status) {
    case "pending":
      return "en attente";
    case "confirmed":
      return "confirmé";
    case "processing":
      return "en préparation";
    case "shipped":
      return "en cours de livraison";
    case "delivered":
      return "recu";
    case "cancelled":
      return "refusé";
    case "refunded":
      return "remboursé";
    default:
      return "en attente";
  }
};

const mapApiProductToAdminProduct = (product: ApiProduct, fallbackIndex: number): AdminProduct => {
  const titleFr = product.title?.fr || "";
  const titleAr = product.title?.ar || "";
  const images = (product.array_ProductImg || []).map((img) => img.secure_url || "").filter(Boolean);
  const price = product.price || 0;

  return {
    id: product._id,
    title: { fr: titleFr, ar: titleAr },
    price,
    ancien_price: product.ancien_price || 0,
    category: product.categorie || "Autre",
    images,
    rating: 4.5,
    sku: product.sku || generateSku(titleFr || product._id),
    descriptionShort: product.description?.fr || "",
    descriptionLong: product.description?.fr || "",
    brand: "Ateliers Henna",
    tags: product.categorie ? [product.categorie.toLowerCase()] : [],
    status: (product.status === "published" || product.status === "draft" || product.status === "scheduled" ? product.status : "published") as "published" | "draft" | "scheduled",
    collections: [],
    options: [],
    variants: [],
    weight: 0.2,
    dimensions: { length: 10, width: 5, height: 2 },
    requiresShipping: true,
    specialShipping: 0,
    costPrice: Math.round(price * 0.4),
    taxRate: 19,
    onSale: (product.ancien_price || 0) > 0,
    metaTitle: titleFr,
    metaDescription: titleFr ? `Achetez ${titleFr} chez Ateliers Henna & Traditions - Livraison rapide` : "",
    slug: titleFr.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || `produit-${fallbackIndex}`,
    visibility: "public",
    featured: product.featured === true,
    isNew: product.isNew === true,
    isPopular: product.isPopular === true,
    sortOrder: fallbackIndex,
    createdAt: product.createdAt ? new Date(product.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    imageMeta: (product.array_ProductImg || [])
      .filter((img) => Boolean(img?.secure_url))
      .map((img) => ({ secure_url: img.secure_url || "", public_id_url: img.public_id_url })),
  };
};

const mapApiOrderToOrder = (order: ApiOrder, index: number): Order => {
  const items = (order.array_product || []).map((item) => {
    const product = item.id_product;
    const productName = product?.title?.fr || "Produit";
    const productId = product?._id || "";
    const colorName = item.caracteristique_couleur?.type || "";
    const colorImage = item.caracteristique_couleur?.img || "";
    return {
      productId,
      productName,
      sku: generateSku(productName || productId || `PROD-${index}`),
      quantity: item.quantite || 0,
      price: item.price || product?.price || 0,
      image: colorImage || product?.array_ProductImg?.[0]?.secure_url,
      variantInfo: item.caracteristique ? Object.values(item.caracteristique).join(" / ") : undefined,
      colorName: colorName || undefined,
      colorImage: colorImage || undefined,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = order.deliveryFees || 0;
  const total = order.total || subtotal + shippingCost;
  const createdAt = order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString();
  const status = statusFromApi(order.status);

  return {
    id: order._id,
    orderNumber: order.orderNumber || `ORD-${order._id?.slice(-6) || String(1000 + index).padStart(5, "0")}`,
    customerName: order.customerDetails?.fullName || "",
    customerEmail: order.customerDetails?.email || "",
    customerPhone: order.customerDetails?.phoneNumber || "",
    shippingAddress: {
      street: order.customerDetails?.address || "",
      city: order.customerDetails?.commune || order.customerDetails?.wilaya || "",
      wilaya: order.customerDetails?.wilaya || "",
      postalCode: "",
      country: "Algérie",
    },
    items,
    subtotal,
    shippingCost,
    tax: 0,
    discount: 0,
    total,
    status,
    paymentStatus: status === "pending" ? "pending" : status === "cancelled" ? "refunded" : "paid",
    paymentMethod: "Paiement à la livraison",
    trackingNumber: order.trackingNumber || "",
    notes: order.customerDetails?.note || "",
    internalNotes: "",
    statusHistory: [{ status, date: createdAt }],
    createdAt,
    updatedAt: new Date().toISOString(),
  };
};

const mapApiPromoToPromo = (promo: ApiPromoCode, index: number): PromoCode => {
  return {
    id: promo._id || `PROMO-${index}`,
    code: promo.code || "",
    type: promo.type || "percentage",
    value: promo.value || 0,
    minOrderAmount: promo.minOrderAmount || 0,
    maxUses: promo.maxUses || 0,
    usedCount: promo.usedCount || 0,
    applicableCategories: promo.applicableCategories || [],
    applicableProducts: promo.applicableProducts || [],
    startDate: promo.startDate || new Date().toISOString(),
    endDate: promo.endDate || new Date().toISOString(),
    active: promo.active ?? true,
    createdAt: promo.createdAt || new Date().toISOString(),
  };
};

const mapApiSubscriber = (subscriber: ApiSubscriber, index: number): NewsletterSubscriber => {
  return {
    id: subscriber._id || `SUB-${index}`,
    email: subscriber.email || "",
    firstName: subscriber.firstName || "",
    subscribedAt: subscriber.subscribedAt || new Date().toISOString(),
    active: subscriber.active ?? true,
  };
};

const generateMockCustomers = (): Customer[] => {
  const names = [
    { first: "Ahmed", last: "Benali" },
    { first: "Fatima", last: "Zohra" },
    { first: "Karim", last: "Hadj" },
    { first: "Samira", last: "Khelifi" },
    { first: "Yacine", last: "Mebarki" },
    { first: "Amina", last: "Boudiaf" },
    { first: "Mohamed", last: "Larbi" },
    { first: "Nadia", last: "Cherif" },
    { first: "Rachid", last: "Brahimi" },
    { first: "Leila", last: "Mansouri" },
  ];

  return names.map((name, i) => ({
    id: generateId("CUST"),
    firstName: name.first,
    lastName: name.last,
    email: `${name.first.toLowerCase()}@example.com`,
    phone: `0${5 + Math.floor(Math.random() * 3)}${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`,
    addresses: [
      {
        id: generateId("ADDR"),
        type: "shipping",
        isDefault: true,
        street: `${Math.floor(Math.random() * 200) + 1} Rue Principale`,
        city: ["Alger", "Oran", "Constantine", "Blida", "Sétif"][i % 5],
        wilaya: ["Alger", "Oran", "Constantine", "Blida", "Sétif"][i % 5],
        postalCode: String(10000 + Math.floor(Math.random() * 90000)),
        country: "Algérie",
      },
    ],
    totalOrders: Math.floor(Math.random() * 10) + 1,
    totalSpent: Math.floor(Math.random() * 100000) + 5000,
    wishlist: [],
    notes: "",
    tags: i % 3 === 0 ? ["VIP"] : [],
    createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
    lastOrderAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

const generateMockPromoCodes = (): PromoCode[] => [
  {
    id: generateId("PROMO"),
    code: "WELCOME10",
    type: "percentage",
    value: 10,
    minOrderAmount: 3000,
    maxUses: 100,
    usedCount: 45,
    applicableCategories: [],
    applicableProducts: [],
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: generateId("PROMO"),
    code: "HENNA20",
    type: "percentage",
    value: 20,
    minOrderAmount: 10000,
    maxUses: 50,
    usedCount: 12,
    applicableCategories: ["tabaq-henna"],
    applicableProducts: [],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId("PROMO"),
    code: "LIVRAISON",
    type: "free_shipping",
    value: 0,
    minOrderAmount: 5000,
    maxUses: 200,
    usedCount: 89,
    applicableCategories: [],
    applicableProducts: [],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    createdAt: new Date().toISOString(),
  },
];

const generateMockSubscribers = (): NewsletterSubscriber[] => [
  { id: generateId("SUB"), email: "ahmed@example.com", firstName: "Ahmed", subscribedAt: new Date().toISOString(), active: true },
  { id: generateId("SUB"), email: "fatima@example.com", firstName: "Fatima", subscribedAt: new Date().toISOString(), active: true },
  { id: generateId("SUB"), email: "karim@example.com", firstName: "Karim", subscribedAt: new Date().toISOString(), active: true },
  { id: generateId("SUB"), email: "samira@example.com", firstName: "Samira", subscribedAt: new Date().toISOString(), active: true },
  { id: generateId("SUB"), email: "nadia@example.com", firstName: "Nadia", subscribedAt: new Date().toISOString(), active: false },
];

const defaultSettings: StoreSettings = {
  storeName: "Ateliers Henna & Traditions",
  logo: "",
  email: "Zinejod454@gmail com",
  phone: "0772 11 87 70",
  address: "Nedroma, Tlemcen, Algérie",
  currency: "DZD",
  timezone: "Africa/Algiers",
  taxRates: [{ name: "TVA Standard", rate: 19, categories: [] }],
  shippingZones: [
    { name: "Alger", regions: ["Alger"], cost: 400, freeAbove: 10000, deliveryDays: "1-2 jours" },
    { name: "Grandes villes", regions: ["Oran", "Constantine", "Annaba"], cost: 600, freeAbove: 15000, deliveryDays: "2-3 jours" },
    { name: "Reste du pays", regions: [], cost: 800, deliveryDays: "3-5 jours" },
  ],
  paymentMethods: [
    { id: "cod", name: "Paiement à la livraison", enabled: true },
    { id: "cib", name: "Carte CIB/Edahabia", enabled: true },
  ],
};

export const AdminDataProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>(() => readStorage(CATEGORIES_KEY, initialCategories));
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>(() => readStorage(CUSTOMERS_KEY, generateMockCustomers()));
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(() => readStorage(PROMO_KEY, generateMockPromoCodes()));
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>(() => readStorage(SUBSCRIBERS_KEY, generateMockSubscribers()));
  const [settings, setSettings] = useState<StoreSettings>(() => readStorage(SETTINGS_KEY, defaultSettings));

  const fetchProducts = useCallback(async (options?: { page?: number; limit?: number; q?: string; category?: string; status?: string }) => {
    try {
      const params = new URLSearchParams();
      if (options?.page) params.set("page", String(options.page));
      if (options?.limit) params.set("limit", String(options.limit));
      if (options?.q) params.set("q", options.q);
      if (options?.category) params.set("category", options.category);
      if (options?.status && options.status !== "all") params.set("status", options.status);

      const response = await fetch(`/api/admin/get_Products_admin?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const items: ApiProduct[] = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];
      const mapped = items.map((item: ApiProduct, index: number) => mapApiProductToAdminProduct(item, index));
      setProducts(mapped);
      if (data?.total !== undefined) {
        setProductsTotal(Number(data.total) || mapped.length);
        return {
          total: Number(data.total) || mapped.length,
          page: Number(data.page) || 1,
          limit: Number(data.limit) || mapped.length,
        };
      }
      setProductsTotal(mapped.length);
      return {
        total: mapped.length,
        page: options?.page || 1,
        limit: options?.limit || mapped.length,
      };
    } catch (error) {
      console.error("Erreur lors du chargement des produits", error);
    }
  }, []);

  const fetchOrders = useCallback(async (options?: { page?: number; limit?: number; status?: string }) => {
    try {
      const params = new URLSearchParams();
      if (options?.page) params.set("page", String(options.page));
      if (options?.limit) params.set("limit", String(options.limit));
      if (options?.status) params.set("status", statusToApi(options.status as Order["status"]));

      const response = await fetch(`/api/admin/get_order?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const items: ApiOrder[] = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];
      const mapped = items.map((item: ApiOrder, index: number) => mapApiOrderToOrder(item, index));
      setOrders(mapped);
      if (data?.total !== undefined) {
        return {
          total: Number(data.total) || mapped.length,
          page: Number(data.page) || 1,
          limit: Number(data.limit) || mapped.length,
        };
      }
      return {
        total: mapped.length,
        page: options?.page || 1,
        limit: options?.limit || mapped.length,
      };
    } catch (error) {
      console.error("Erreur lors du chargement des commandes", error);
    }
  }, []);

  const fetchPromoCodes = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/get_promos", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const items = Array.isArray(data) ? data : [];
      setPromoCodes(items.map((item, index) => mapApiPromoToPromo(item, index)));
    } catch (error) {
      console.error("Erreur lors du chargement des codes promo", error);
    }
  }, []);

  const fetchSubscribers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/get_subscribers", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const items = Array.isArray(data) ? data : [];
      setSubscribers(items.map((item, index) => mapApiSubscriber(item, index)));
    } catch (error) {
      console.error("Erreur lors du chargement des abonnés", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  }, [customers]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(PROMO_KEY, JSON.stringify(promoCodes));
  }, [promoCodes]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(subscribers));
  }, [subscribers]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const addProduct = useCallback(
    (product: Omit<AdminProduct, "id" | "createdAt" | "updatedAt">) => {
      void (async () => {
        try {
          const payload = {
            Categorie: product.category,
            title: product.title.fr,
            title_en_arabe: product.title.ar,
            Price: product.price,
            Ancien_price: product.ancien_price || 0,
            description: product.descriptionLong || product.descriptionShort || product.title.fr,
            description_en_arabe: "",
            reductions: [],
            array_machinImg: product.images.map((url) => ({ img_url: { secure_url: url, public_id: "" } })),
            array_variant: [],
            variant_color: [],
          };

          const response = await fetch("/api/admin/addProduct", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            await fetchProducts();
          }
        } catch (error) {
          console.error("Erreur lors de l'ajout du produit", error);
        }
      })();
    },
    [fetchProducts],
  );

  const updateProduct = useCallback(
    (id: string, updates: Partial<AdminProduct>) => {
      const existing = products.find((p) => p.id === id);
      if (!existing) return;

      const merged: AdminProduct = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      setProducts((prev) => prev.map((p) => (p.id === id ? merged : p)));

      void (async () => {
        try {
          const payload = {
            _id: id,
            categorie: merged.category,
            title: merged.title,
            price: merged.price,
            ancien_price: merged.ancien_price || 0,
            disponible: "disponible",
            description: {
              fr: merged.descriptionLong || merged.descriptionShort || merged.title.fr,
              ar: merged.title.ar || "",
            },
            variant: [],
            variant_color: [],
            reduction: [],
            array_ProductImg: (merged.imageMeta && merged.imageMeta.length > 0)
              ? merged.imageMeta
              : merged.images.map((url) => ({ secure_url: url, public_id_url: "" })),
          };

          const response = await fetch("/api/admin/update_Product", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            await fetchProducts();
          }
        } catch (error) {
          console.error("Erreur lors de la mise à jour du produit", error);
        }
      })();
    },
    [fetchProducts, products],
  );

  const deleteProduct = useCallback(
    (id: string) => {
      const existing = products.find((p) => p.id === id);
      setProducts((prev) => prev.filter((p) => p.id !== id));

      void (async () => {
        try {
          const payload = {
            _id: id,
            array_ProductImg: existing?.imageMeta || [],
          };

          const response = await fetch("/api/admin/delete_Product", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            await fetchProducts();
          }
        } catch (error) {
          console.error("Erreur lors de la suppression du produit", error);
        }
      })();
    },
    [fetchProducts, products],
  );

  const duplicateProduct = useCallback(
    (id: string) => {
      const product = products.find((p) => p.id === id);
      if (product) {
        const duplicate: Omit<AdminProduct, "id" | "createdAt" | "updatedAt"> = {
          ...product,
          sku: generateSku(product.title.fr),
          title: { fr: `${product.title.fr} (copie)`, ar: product.title.ar },
          slug: `${product.slug}-copie`,
          status: "draft",
        };
        addProduct(duplicate);
      }
    },
    [addProduct, products],
  );

  const bulkUpdateProducts = useCallback(
    (ids: string[], updates: Partial<AdminProduct>) => {
      ids.forEach((id) => updateProduct(id, updates));
    },
    [updateProduct],
  );

  const bulkDeleteProducts = useCallback(
    (ids: string[]) => {
      ids.forEach((id) => deleteProduct(id));
    },
    [deleteProduct],
  );

  const addCategory = useCallback((category: Omit<Category, "name_search">) => {
    const nameSearch = category.name.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");
    setCategories((prev) => [...prev, { ...category, name_search: nameSearch }]);
  }, []);

  const updateCategory = useCallback((nameSearch: string, updates: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.name_search === nameSearch ? { ...c, ...updates } : c)));
  }, []);

  const deleteCategory = useCallback((nameSearch: string) => {
    setCategories((prev) => prev.filter((c) => c.name_search !== nameSearch));
  }, []);

  const updateOrderStatus = useCallback(
    (id: string, status: Order["status"], note?: string) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === id) {
            return {
              ...o,
              status,
              statusHistory: [...o.statusHistory, { status, date: new Date().toISOString(), note }],
              updatedAt: new Date().toISOString(),
            };
          }
          return o;
        }),
      );

      void (async () => {
        try {
          await fetch("/api/admin/update_status", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ _id: id, status: statusToApi(status) }),
          });
        } catch (error) {
          console.error("Erreur lors de la mise à jour du statut", error);
        }
      })();
    },
    [],
  );

  const updateOrder = useCallback((id: string, updates: Partial<Order>) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o)));
  }, []);

  const addOrderNote = useCallback((id: string, note: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, internalNotes: `${o.internalNotes}\n[${new Date().toLocaleString("fr-FR")}] ${note}`.trim() } : o,
      ),
    );
  }, []);

  const addCustomer = useCallback((customer: Omit<Customer, "id" | "createdAt">) => {
    setCustomers((prev) => [...prev, { ...customer, id: generateId("CUST"), createdAt: new Date().toISOString() }]);
  }, []);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addPromoCode = useCallback((promo: Omit<PromoCode, "id" | "createdAt" | "usedCount">) => {
    void (async () => {
      try {
        const response = await fetch("/api/admin/add_promo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...promo, usedCount: 0 }),
        });
        if (response.ok) {
          await fetchPromoCodes();
        }
      } catch (error) {
        console.error("Erreur lors de l'ajout du code promo", error);
      }
    })();
  }, [fetchPromoCodes]);

  const updatePromoCode = useCallback((id: string, updates: Partial<PromoCode>) => {
    setPromoCodes((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    void (async () => {
      try {
        await fetch("/api/admin/update_promo", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: id, ...updates }),
        });
      } catch (error) {
        console.error("Erreur lors de la mise à jour du code promo", error);
      }
    })();
  }, []);

  const deletePromoCode = useCallback((id: string) => {
    setPromoCodes((prev) => prev.filter((p) => p.id !== id));
    void (async () => {
      try {
        await fetch("/api/admin/delete_promo", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: id }),
        });
      } catch (error) {
        console.error("Erreur lors de la suppression du code promo", error);
      }
    })();
  }, []);

  const addSubscriber = useCallback(
    (email: string, firstName?: string) => {
      if (!subscribers.find((s) => s.email === email)) {
        setSubscribers((prev) => [
          ...prev,
          { id: generateId("SUB"), email, firstName, subscribedAt: new Date().toISOString(), active: true },
        ]);
      }
    },
    [subscribers],
  );

  const removeSubscriber = useCallback((id: string) => {
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
    void (async () => {
      try {
        await fetch("/api/admin/delete_subscriber", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: id }),
        });
      } catch (error) {
        console.error("Erreur lors de la suppression de l'abonné", error);
      }
    })();
  }, []);

  const exportSubscribers = useCallback(() => {
    const activeSubscribers = subscribers.filter((s) => s.active);
    const csv = [
      "Email,Prénom,Date inscription",
      ...activeSubscribers.map(
        (s) => `${s.email},${s.firstName || ""},${new Date(s.subscribedAt).toLocaleDateString("fr-FR")}`,
      ),
    ].join("\n");
    return csv;
  }, [subscribers]);

  const updateSettings = useCallback((updates: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const stats = React.useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const completedOrders = orders.filter((o) => o.status !== "cancelled" && o.status !== "refunded");
    const thisMonthOrders = completedOrders.filter((o) => new Date(o.createdAt) >= startOfMonth);
    const lastMonthOrders = completedOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= startOfLastMonth && d < startOfMonth;
    });

    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const monthRevenue = thisMonthOrders.reduce((sum, o) => sum + o.total, 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + o.total, 0);
    const revenueChange = lastMonthRevenue ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 100;

    const productSales: Record<string, { sold: number; revenue: number; name: string }> = {};
    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { sold: 0, revenue: 0, name: item.productName };
        }
        productSales[item.productId].sold += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });
    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const categoryRevenue: Record<string, number> = {};
    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        const cat = product?.category || "Autre";
        categoryRevenue[cat] = (categoryRevenue[cat] || 0) + item.price * item.quantity;
      });
    });
    const totalCatRevenue = Object.values(categoryRevenue).reduce((a, b) => a + b, 0);
    const revenueByCategory = Object.entries(categoryRevenue).map(([category, revenue]) => ({
      category,
      revenue,
      percentage: totalCatRevenue ? Math.round((revenue / totalCatRevenue) * 100) : 0,
    }));

    const dailyRevenue: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayOrders = completedOrders.filter((o) => o.createdAt.startsWith(dateStr));
      dailyRevenue.push({
        date: date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
        orders: dayOrders.length,
      });
    }

    const monthlyRevenue: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthOrders = completedOrders.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= date && d <= monthEnd;
      });
      monthlyRevenue.push({
        month: date.toLocaleDateString("fr-FR", { month: "short" }),
        revenue: monthOrders.reduce((sum, o) => sum + o.total, 0),
      });
    }

    const ordersByStatus: Record<string, number> = {};
    orders.forEach((o) => {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    });

    const customerFirstOrder: Record<string, Date> = {};
    completedOrders.forEach((order) => {
      const key = order.customerPhone || order.customerName || order.id;
      const orderDate = new Date(order.createdAt);
      if (!customerFirstOrder[key] || orderDate < customerFirstOrder[key]) {
        customerFirstOrder[key] = orderDate;
      }
    });
    const totalCustomers = Object.keys(customerFirstOrder).length;
    const newCustomersThisMonth = Object.values(customerFirstOrder).filter((date) => date >= startOfMonth).length;

    return {
      totalRevenue,
      monthRevenue,
      revenueChange,
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) => o.status === "pending").length,
      totalProducts: productsTotal,
      totalCustomers,
      newCustomersThisMonth,
      averageOrderValue: completedOrders.length ? Math.round(totalRevenue / completedOrders.length) : 0,
      topProducts,
      revenueByCategory,
      dailyRevenue,
      monthlyRevenue,
      ordersByStatus,
    };
  }, [orders, products, productsTotal]);

  const globalSearch = useCallback(
    (query: string) => {
      const q = query.toLowerCase().trim();
      if (!q) return { products: [], orders: [] };

      return {
        products: products
          .filter(
            (p) => p.title.fr.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
          )
          .slice(0, 5),
        orders: orders
          .filter(
            (o) => o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.customerEmail.toLowerCase().includes(q),
          )
          .slice(0, 5),
      };
    },
    [products, orders],
  );

  return (
    <AdminDataContext.Provider
      value={{
        products,
        categories,
        orders,
        customers,
        promoCodes,
        subscribers,
        settings,
        refreshProducts: fetchProducts,
        refreshOrders: fetchOrders,
        refreshPromoCodes: fetchPromoCodes,
        refreshSubscribers: fetchSubscribers,
        addProduct,
        updateProduct,
        deleteProduct,
        duplicateProduct,
        bulkUpdateProducts,
        bulkDeleteProducts,
        addCategory,
        updateCategory,
        deleteCategory,
        updateOrderStatus,
        updateOrder,
        addOrderNote,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addPromoCode,
        updatePromoCode,
        deletePromoCode,
        addSubscriber,
        removeSubscriber,
        exportSubscribers,
        updateSettings,
        stats,
        globalSearch,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error("useAdminData must be used within an AdminDataProvider");
  }
  return context;
};
