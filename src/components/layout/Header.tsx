"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Heart,
  Menu,
  X,
  ChevronDown,
  User,
  Globe,
  Home,
  Sparkles,
  Book,
  Phone,
  Truck,
  LogOut,
} from "lucide-react";
import { categories } from "@/data/products";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
 
type SearchProduct = {
  _id: string;
  title?: { fr?: string; ar?: string };
  categorie?: string;
  price?: number;
  array_ProductImg?: { secure_url?: string }[];
};

const navLinks = [
  { href: "/", label: "Accueil", labelAr: "الرئيسية", icon: Home },
  { href: "/about", label: "À Propos", labelAr: "من نحن", icon: Book },
  { href: "/contact", label: "Contact", labelAr: "اتصل بنا", icon: Phone },
  { href: "/track-order", label: "Suivi", labelAr: "التتبع", icon: Truck },
];

const collections = [
  { href: "/collections/nouveautes", name: "Nouveautés", name_ar: "الجديد" },
  { href: "/collections/populaires", name: "Populaires", name_ar: "الأكثر طلبًا" },
  { href: "/collections/promotions", name: "Promotions", name_ar: "العروض" },
  { href: "/collections/top-ventes", name: "Top ventes", name_ar: "الأكثر مبيعًا" },
];

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const { favoritesCount } = useFavorites();

  const [locale, setLocale] = useState<"fr" | "ar">("fr");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categorySelected, setCategorySelected] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searchResultCount, setSearchResultCount] = useState(0);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultLimit = 6;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedLocale = window.localStorage.getItem("site_locale");
    if (savedLocale === "fr" || savedLocale === "ar") {
      setLocale(savedLocale);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("site_locale", locale);
    }
  }, [locale]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (pathname === "/search") {
      const urlQuery = searchParams.get("q") || "";
      setSearchQuery(urlQuery);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    if (isSearchModalOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchModalOpen]);

  useEffect(() => {
    const controller = new AbortController();
    const delay = setTimeout(async () => {
      if (!isSearchModalOpen || !searchQuery.trim()) {
        setSearchResults([]);
        setSearchResultCount(0);
        return;
      }

      setIsLoadingSearch(true);
      try {
        const params = new URLSearchParams({
          q: searchQuery.trim(),
          limit: String(searchResultLimit),
        });

        if (categorySelected) {
          params.set("category", categorySelected);
        }

        const res = await fetch(`/api/client/get_Products?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("load");

        const data = await res.json();
        if (Array.isArray(data)) {
          setSearchResults(data.slice(0, searchResultLimit));
          setSearchResultCount(data.length);
        } else {
          setSearchResults(Array.isArray(data.products) ? data.products : []);
          setSearchResultCount(typeof data.total === "number" ? data.total : 0);
        }
      } catch (error) {
        if ((error as any).name !== "AbortError") {
          console.error(error);
          setSearchResults([]);
          setSearchResultCount(0);
        }
      } finally {
        setIsLoadingSearch(false);
      }
    }, 250);

    return () => {
      clearTimeout(delay);
      controller.abort();
    };
  }, [isSearchModalOpen, searchQuery, categorySelected, searchResultLimit]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchModalOpen(true);
  }, [searchQuery]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-[#fff7ef]/98 backdrop-blur-xl shadow-elevated border-b border-[#e7d1b3]"
            : "bg-[#fff3e9]/92 backdrop-blur-lg border-b border-[#efdcc3]/70"
        }`}
      >
        <div className="bg-gradient-to-r from-[#b77a30] via-[#d9b26a] to-[#aa722c] text-[#fff7ef] text-center py-1.5 sm:py-2 px-3 sm:px-4">
          <p className="text-[10px] sm:text-xs lg:text-sm font-medium tracking-wide">
            {locale === "fr"
              ? "Ateliers henné, broderie et articles de fête • Paiement à la livraison"
              : "ورش الحنة والتطريز ولوازم المناسبات • الدفع عند الاستلام"}
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-12 sm:h-14 lg:h-16">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-[#3b2a20] hover:text-[#b4792e] active:scale-95 transition-all"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <Link
              href="/"
              className="flex items-center gap-2 group absolute left-1/2 -translate-x-1/2 lg:relative lg:left-0 lg:translate-x-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-11 lg:h-11 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold group-hover:scale-105 transition-transform duration-300">
                <span className="font-display text-base sm:text-lg lg:text-xl font-bold text-primary-foreground">
                  H
                </span>
              </div>
                  {/* <Image
          src={"/img_logo/logo-henna-traditions.webp"}
          width={50}
          height={50}
          className="w-[90px] h-[90px] md:w-150 md:h-150"
          alt={""}
           unoptimized={true} 
        /> */}
              <div className="hidden lg:block">
                <h1 className="font-display text-xl font-semibold text-[#2a1a12] group-hover:text-[#b4792e] transition-colors">
                  Ateliers Henna
                </h1>
                <p className="text-[10px] text-[#8a6a52] tracking-widest uppercase -mt-0.5">
                  Traditions
                </p>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              <Link
                href="/"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover-underline ${
                  pathname === "/" ? "text-[#b4792e]" : "text-[#3a2a20] hover:text-[#b4792e]"
                }`}
              >
                {locale === "fr" ? "Accueil" : "الرئيسية"}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-[#3a2a20] hover:text-[#b4792e] transition-all">
                    {locale === "fr" ? "Collections" : "مجموعات"}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56 bg-[#fffaf4] border border-[#e7d1b3] shadow-elevated">
                  {collections.map((col) => (
                    <DropdownMenuItem key={col.href} asChild>
                      <Link href={col.href} className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm">{locale === "fr" ? col.name : col.name_ar}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-[#3a2a20] hover:text-[#b4792e] transition-all">
                    {locale === "fr" ? "Catégories" : "الفئات"}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56 bg-[#fffaf4] border border-[#e7d1b3] shadow-elevated">
                  {categories.map((cat) => (
                    <DropdownMenuItem key={cat.name_search} asChild>
                      <Link
                        href={`/category/${cat.name_search}`}
                        className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#f3e7d6] relative">
                          <Image
                            src={cat.img_url || "/placeholder.svg"}
                            alt={cat.name}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </div>
                        <span className="text-sm">{locale === "fr" ? cat.name : cat.name_ar}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

            

              <Link
                href="/about"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover-underline ${
                  pathname === "/about" ? "text-[#b4792e]" : "text-[#3a2a20] hover:text-[#b4792e]"
                }`}
              >
                {locale === "fr" ? "À Propos" : "من نحن"}
              </Link>

              <Link
                href="/contact"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover-underline ${
                  pathname === "/contact" ? "text-[#b4792e]" : "text-[#3a2a20] hover:text-[#b4792e]"
                }`}
              >
                Contact
              </Link>
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchModalOpen(true)}
                className="text-[#3a2a20] hover:text-[#b4792e] h-9 w-9 sm:h-10 sm:w-10"
                aria-label="Ouvrir la recherche"
              >
                <Search className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-[#3a2a20] hover:text-[#b4792e] hidden sm:flex h-9 w-9 sm:h-10 sm:w-10"
                  >
                    <Globe className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#fffaf4] border border-[#e7d1b3]">
                  <DropdownMenuItem
                    onClick={() => setLocale("fr")}
                    className={locale === "fr" ? "bg-[#f1e1cc] text-[#b4792e]" : ""}
                  >
                    🇫🇷 Français
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLocale("ar")}
                    className={locale === "ar" ? "bg-[#f1e1cc] text-[#b4792e]" : ""}
                  >
                    🇩🇿 العربية
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/favorites">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[#3a2a20] hover:text-[#b4792e] relative h-9 w-9 sm:h-10 sm:w-10"
                >
                  <Heart className="h-5 w-5" />
                  {favoritesCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#b4792e] text-[#fff7ef] text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
                      {favoritesCount}
                    </span>
                  )}
                </Button>
              </Link>

              <Link href="/cart">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[#3a2a20] hover:text-[#b4792e] relative h-9 w-9 sm:h-10 sm:w-10"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#b4792e] text-[#fff7ef] text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="gold" size="sm" className="hidden lg:flex items-center gap-2 h-9">
                      <User className="h-4 w-4" />
                      <span className="text-sm">{user?.firstName || (locale === "fr" ? "Mon Compte" : "حسابي")}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-[#fffaf4] border border-[#e7d1b3]">
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" />
                        {locale === "fr" ? "Mon Compte" : "حسابي"}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout} className="flex items-center gap-2 cursor-pointer text-destructive">
                      <LogOut className="w-4 h-4" />
                      {locale === "fr" ? "Déconnexion" : "تسجيل الخروج"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button variant="gold" size="sm" className="hidden lg:flex items-center gap-2 h-9">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{locale === "fr" ? "Connexion" : "تسجيل"}</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 bg-[#1a120d]/55 backdrop-blur-sm z-[60] transition-opacity duration-300 lg:hidden ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {isSearchModalOpen && (
        <div
          className="fixed inset-0 z-[80] bg-[#1a120d]/65 backdrop-blur-lg px-4 py-6 sm:py-8 overflow-y-auto"
          onClick={() => setIsSearchModalOpen(false)}
        >
          <div
            className="max-w-4xl mx-auto bg-gradient-to-b from-[#2a1b12]/96 via-[#2f1f16]/96 to-[#1a120d]/96 backdrop-blur-xl rounded-[28px] border border-[#e3caa5]/30 shadow-[0_30px_90px_rgba(0,0,0,0.45)] overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#f7e7d1]/95 via-[#fff7ec]/98 to-[#e7c89b]/85 px-5 sm:px-8 py-5 sm:py-6 border-b border-[#e7d0b1]/70">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] sm:text-xs tracking-[0.35em] uppercase text-[#9a5b3b] font-semibold">
                    Recherche rapide
                  </p>
                  <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#2a1a12] mt-2">
                    Trouvez un produit ou une catégorie
                  </h3>
                  <p className="text-sm text-[#7a5a43] mt-2 max-w-2xl">
                    Explorez les nouveautés, les packs et les catégories sans quitter le header.
                  </p>
                </div>
                <button
                  onClick={() => setIsSearchModalOpen(false)}
                  className="p-2.5 rounded-full border border-[#e1cfb6] bg-white/92 text-[#3d2b20] hover:bg-[#f7eddf] transition-colors shadow-sm"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-8 space-y-5">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b6b51]" />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={locale === "fr" ? "Rechercher un produit, une catégorie..." : "بحث عن منتج أو فئة..."}
                    className="w-full rounded-2xl border border-[#e4d3bb] bg-[#fffdf8] pl-12 pr-12 py-4 text-base text-[#2a1a12] shadow-[0_10px_25px_rgba(0,0,0,0.08)] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-[#9d8a78]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-[#8b6b51] hover:text-[#2d1b12] hover:bg-[#f5eadb] transition-colors"
                      aria-label="Effacer la recherche"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={categorySelected}
                    onChange={(e) => setCategorySelected(e.target.value)}
                    className="w-full sm:w-64 rounded-2xl border border-[#e4d3bb] bg-[#fffdf8] px-4 py-3 text-sm text-[#2a1a12] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
                  >
                    <option value="">Toutes catégories</option>
                    {categories.map((cat) => (
                      <option key={cat.name_search} value={cat.name_search}>
                        {locale === "fr" ? cat.name : cat.name_ar}
                      </option>
                    ))}
                  </select>

                  <Button variant="gold" type="submit" className="rounded-2xl px-6 py-3 h-auto">
                    {locale === "fr" ? "Rechercher" : "بحث"}
                  </Button>

                    <Button
                variant="gold"
                 className="rounded-2xl px-6 py-3 h-auto"
                onClick={() => {
                  if (searchQuery.trim()) {
                    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                    setIsSearchModalOpen(false);
                    // setIsSearchOpen(false);
                  }
                }}
              >
                {locale === "fr" ? "Voir tout" : "عرض الكل"}
              </Button>
                </div>
              </form>

              <div className="flex flex-wrap gap-2">
                {collections.map((collection) => (
                  <button
                    key={collection.href}
                    type="button"
                    onClick={() => {
                      router.push(collection.href);
                      setIsSearchModalOpen(false);
                    }}
                    className="rounded-full border border-[#e2c4a0] bg-[#fff1e3] px-4 py-2 text-sm text-[#5c3f2a] hover:border-primary hover:text-primary-foreground hover:bg-primary transition-all shadow-sm"
                  >
                    {locale === "fr" ? collection.name : collection.name_ar}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-[#e6caa3] bg-[#fff7ee] p-4 sm:p-5 shadow-[0_18px_40px_rgba(0,0,0,0.1)]">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h4 className="font-semibold text-[#2a1a12]">Suggestions</h4>
                    <p className="text-xs text-[#7a5a43]">Produits populaires et résultats récents</p>
                  </div>
                  <span className="text-xs text-[#85624b]">
                    {searchQuery.trim() ? `${searchResultCount} résultat${searchResultCount > 1 ? "s" : ""}` : "Top collections"}
                  </span>
                </div>

                {isLoadingSearch ? (
                  <div className="py-8 text-sm text-[#7a5a43] text-center">Chargement...</div>
                ) : searchResults.length === 0 ? (
                  <div className="py-8 text-sm text-[#7a5a43] text-center">
                    {searchQuery.trim() ? "Aucun produit trouvé" : "Commencez à saisir pour afficher les produits"}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {searchResults.map((product) => (
                      <Link
                        key={product._id}
                        href={`/product/${product._id}`}
                        className="group flex items-center gap-3 rounded-2xl border border-[#e6caa3] bg-[#fffdf8] p-3.5 hover:border-primary/40 hover:shadow-lg transition-all"
                        onClick={() => setIsSearchModalOpen(false)}
                      >
                        <div className="w-16 h-16 rounded-xl bg-[#f6efe5] overflow-hidden flex-shrink-0 ring-1 ring-[#e7d1b3] relative">
                          <Image
                            src={product.array_ProductImg?.[0]?.secure_url || "/placeholder.svg"}
                            alt={product.title?.fr || "Produit"}
                            fill
                            sizes="64px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#24150e] truncate">
                            {product.title?.fr || "Produit"}
                          </p>
                          <p className="text-xs text-[#7d5b46] mt-1 truncate">
                            {product.categorie || (locale === "fr" ? "Catégorie" : "الفئة")}
                          </p>
                          <p className="text-sm text-primary font-semibold mt-1">
                            {product.price?.toLocaleString()} DZD
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={`fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-[#fff7ef] border-r border-[#e7d1b3] z-[70] transform transition-transform duration-300 ease-out lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-[#e7d1b3]">
            <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
                <span className="font-display text-xl font-bold text-primary-foreground">H</span>
              </div>
                  {/* <Image
          src={"/img_logo/logo-henna-traditions.webp"}
          width={50}
          height={50}
          className="w-[90px] h-[90px] md:w-150 md:h-150"
          alt={""}
           unoptimized={true} 
        /> */}
              <div>
                <h2 className="font-display text-xl font-semibold text-gradient-gold">Ateliers Henna</h2>
                <p className="text-[10px] text-[#8a6a52] tracking-widest uppercase">Traditions</p>
              </div>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-[#3a2a20] hover:text-[#b4792e] transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    pathname === link.href
                      ? "bg-[#f1e1cc] text-[#b4792e]"
                      : "text-[#3a2a20] hover:bg-[#f5e8d7]"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-[#e7d1b3]">
              <p className="px-4 text-xs font-medium text-[#8a6a52] uppercase tracking-wider mb-3">Collections</p>
              <div className="space-y-1">
                {collections.map((col) => (
                  <Link
                    key={col.href}
                    href={col.href}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-[#3a2a20] hover:text-[#b4792e] hover:bg-[#f5e8d7] transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                    {locale === "fr" ? col.name : col.name_ar}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[#e7d1b3]">
              <p className="px-4 text-xs font-medium text-[#8a6a52] uppercase tracking-wider mb-3">
                {locale === "fr" ? "Catégories" : "الفئات"}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.name_search}
                    href={`/category/${cat.name_search}`}
                    className="group/card rounded-2xl bg-[#fffaf4] border border-[#e7d1b3] overflow-hidden shadow-luxury hover:shadow-elevated transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="relative aspect-square">
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent z-10" />
                      <Image
                        src={cat.img_url || "/placeholder.svg"}
                        alt={cat.name}
                        fill
                        sizes="160px"
                        className="object-cover transition-transform duration-700 group-hover/card:scale-110"
                      />
                      <div className="absolute bottom-2 left-2 right-2 z-20">
                        <div className="inline-flex items-center rounded-full bg-[#fff7ef]/95 px-2.5 py-1 text-[10px] font-semibold text-[#2a1a12] shadow-lg">
                          {locale === "fr" ? cat.name : cat.name_ar}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          <div className="p-4 border-t border-[#e7d1b3] space-y-3">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link href="/account" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="gold" className="w-full gap-2">
                    <User className="h-4 w-4" />
                    {user?.firstName || (locale === "fr" ? "Mon Compte" : "حسابي")}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  {locale === "fr" ? "Déconnexion" : "تسجيل الخروج"}
                </Button>
              </div>
            ) : (
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="gold" className="w-full gap-2">
                  <User className="h-4 w-4" />
                  {locale === "fr" ? "Connexion" : "تسجيل الدخول"}
                </Button>
              </Link>
            )}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setLocale("fr")}
                className={`text-sm font-medium transition-colors ${
                  locale === "fr" ? "text-[#b4792e]" : "text-[#8a6a52] hover:text-[#3a2a20]"
                }`}
              >
                🇫🇷 Français
              </button>
              <div className="w-px h-4 bg-[#e7d1b3]" />
              <button
                onClick={() => setLocale("ar")}
                className={`text-sm font-medium transition-colors ${
                  locale === "ar" ? "text-[#b4792e]" : "text-[#8a6a52] hover:text-[#3a2a20]"
                }`}
              >
                🇩🇿 العربية
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
