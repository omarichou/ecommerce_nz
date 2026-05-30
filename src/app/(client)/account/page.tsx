"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Package, MapPin, Heart, LogOut, Phone, Mail, Clock, CheckCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { mockProducts } from "@/data/products";
import ProductCardModern from "@/components/product/ProductCardModern";

const tabs = [
  { id: "profile", label: "Profil", icon: User },
  { id: "orders", label: "Commandes", icon: Package },
  { id: "addresses", label: "Adresses", icon: MapPin },
  { id: "wishlist", label: "Favoris", icon: Heart },
];

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, orders, addresses } = useAuth();
  const { favorites } = useFavorites();
  const [activeTab, setActiveTab] = useState("profile");

  const favoriteProducts = useMemo(() => mockProducts.filter((p) => favorites.includes(p.id)), [favorites]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-28 pb-24 lg:pb-12">
          <div className="container mx-auto px-4 max-w-md text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-4">Connectez-vous</h1>
            <p className="text-muted-foreground mb-6">
              Accédez à votre compte pour voir vos commandes et gérer vos informations.
            </p>
            <div className="flex flex-col gap-3">
              <Button variant="gold" onClick={() => router.push("/login")}>Se connecter</Button>
              <Button variant="outline" onClick={() => router.push("/register")}>Créer un compte</Button>
            </div>
          </div>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-28 pb-24 lg:pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-2xl font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Déconnexion
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-border mb-6">
            {tabs.map((tab, i) => (
              <button
                key={tab.id || i}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "profile" && (
            <section className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-display text-xl font-semibold mb-4">Informations personnelles</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Prénom</p>
                  <p className="font-medium text-foreground">{user?.firstName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Nom</p>
                  <p className="font-medium text-foreground">{user?.lastName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user?.email}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Téléphone</p>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {user?.phone || "Non renseigné"}
                  </p>
                </div>
              </div>
            </section>
          )}

          {activeTab === "orders" && (
            <section className="space-y-4">
              {orders.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-6 text-center text-muted-foreground">
                  Aucune commande pour le moment.
                </div>
              ) : (
                orders.map((order, i) => (
                  <div key={order.id || i} className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-foreground">Commande #{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {order.status === "delivered" ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                        {order.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>
          )}

          {activeTab === "addresses" && (
            <section className="space-y-4">
              {addresses.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-6 text-center text-muted-foreground">
                  Aucune adresse enregistrée.
                </div>
              ) : (
                addresses.map((address, i) => (
                  <div key={address.id || i} className="bg-card border border-border rounded-2xl p-6">
                    <p className="font-medium text-foreground">{address.label}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {address.firstName} {address.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.street}, {address.city}
                    </p>
                  </div>
                ))
              )}
            </section>
          )}

          {activeTab === "wishlist" && (
            <section>
              {favoriteProducts.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-6 text-center text-muted-foreground">
                  Aucun produit en favoris.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {favoriteProducts.map((product, index) => (
                    <ProductCardModern key={product.id || index} product={product} index={index} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
