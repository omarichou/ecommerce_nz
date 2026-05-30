"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Heart,
  Home,
  Link as LinkIcon,
  MessageCircle,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  Shield,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  Twitter,
  X,
  ZoomIn,
} from "lucide-react";
import { categories } from "@/data/products";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import RelatedProducts from "@/components/product/RelatedProducts";
import { resolveClientUserId } from "@/lib/clientUserId";

const calculateTotalPricev2 = (
  reductions: { quantite?: number; reduction?: number }[] = [],
  totalQuantity: number,
  totalPrice: number,
) => {
  if (!reductions || reductions.length === 0) return totalPrice;
  const sortedReductions = [...reductions].sort((a, b) => (b.quantite || 0) - (a.quantite || 0));
  let remainingQuantity = totalQuantity;
  let finalPrice = totalPrice;
  for (const reduction of sortedReductions) {
    if (remainingQuantity <= 0) break;
    const reductionQuantity = reduction.quantite || 0;
    const reductionAmount = reduction.reduction || 0;
    if (reductionQuantity <= 0) continue;
    if (remainingQuantity >= reductionQuantity) {
      const reductionCount = Math.floor(remainingQuantity / reductionQuantity);
      finalPrice -= reductionCount * reductionAmount;
      remainingQuantity -= reductionCount * reductionQuantity;
    }
  }
  return finalPrice;
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=1200&fit=crop";
const PRODUCT_DETAIL_CACHE_PREFIX = "product-detail-cache-v1";
const PRODUCT_DETAIL_CACHE_TTL = 60 * 1000;

type ProductDetailCacheEntry = {
  timestamp: number;
  product: ProductApi;
  comments: CommentItem[];
};

const getProductDetailCacheKey = (id: string) => `${PRODUCT_DETAIL_CACHE_PREFIX}:${id}`;

const readProductDetailCache = (cacheKey: string): ProductDetailCacheEntry | null => {
  if (typeof window === "undefined") return null;

  try {
    const cachedValue = window.localStorage.getItem(cacheKey);
    if (!cachedValue) return null;

    const parsedValue = JSON.parse(cachedValue) as ProductDetailCacheEntry;
    if (!parsedValue?.timestamp || !parsedValue.product) return null;

    if (Date.now() - parsedValue.timestamp > PRODUCT_DETAIL_CACHE_TTL) {
      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
};

const writeProductDetailCache = (cacheKey: string, entry: Omit<ProductDetailCacheEntry, "timestamp">) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(cacheKey, JSON.stringify({ ...entry, timestamp: Date.now() }));
  } catch {
    // Ignore storage quota or serialization errors.
  }
};

const sizeGuide = [
  { size: "XS", chest: "76-81", waist: "61-66", hips: "84-89" },
  { size: "S", chest: "81-86", waist: "66-71", hips: "89-94" },
  { size: "M", chest: "86-91", waist: "71-76", hips: "94-99" },
  { size: "L", chest: "91-96", waist: "76-81", hips: "99-104" },
  { size: "XL", chest: "96-101", waist: "81-86", hips: "104-109" },
];

type VariantValue = { value?: string; priceAdjustment?: number; isActive?: boolean };
type Variant = { _id?: string; isActive?: boolean; type?: { fr?: string; ar?: string }; array_value?: VariantValue[] };
type VariantColor = { _id?: string; isActive?: boolean; type?: string; img?: { secure_url?: string }; priceAdjustment?: number };
type CommentItem = { _id?: string; name?: string; email?: string; avis?: string; createdAt?: string };
type ProductApi = {
  _id: string;
  title?: { fr?: string; ar?: string };
  price?: number;
  ancien_price?: number;
  categorie?: string;
  description?: { fr?: string; ar?: string };
  array_ProductImg?: { secure_url?: string }[];
  variant?: Variant[];
  variant_color?: VariantColor[];
  comments?: CommentItem[];
  reduction?: { reduction?: number; quantite?: number; dateDebut?: string; dateFin?: string }[];
  purchaseCount?: number;
};

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = typeof params?.id === "string" ? params.id : "";
  const router = useRouter();

  const [product, setProduct] = useState<ProductApi | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, { value: string; priceAdjustment?: number }>>({});
  const [selectedColor, setSelectedColor] = useState<VariantColor | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentName, setCommentName] = useState("");
  const [commentEmail, setCommentEmail] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCart, refreshCartCount } = useCart();
  const { user } = useAuth();
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
      setShareUrl(window.location.href);
    }
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [productId]);

  useEffect(() => {
    let isMounted = true;
    const loadProduct = async () => {
      if (!productId) return;

      const cacheKey = getProductDetailCacheKey(productId);
      const cachedEntry = readProductDetailCache(cacheKey);
      if (cachedEntry) {
        if (!isMounted) return;
        setProduct(cachedEntry.product);
        setComments(cachedEntry.comments || []);
        const firstActiveColor = (cachedEntry.product.variant_color || []).find((c) => c.isActive !== false);
        setSelectedColor(firstActiveColor || cachedEntry.product.variant_color?.[0] || null);
        setSelectedVariants({});
        setSelectedImage(0);
        setQuantity(1);
        setLoadError(null);
        setIsLoadingProduct(false);
        return;
      }

      setIsLoadingProduct(true);
      setLoadError(null);
      try {
        const response = await fetch(`/api/client/get_one_product?id=${productId}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("load");
        }
        const data: ProductApi = await response.json();
        if (!isMounted) return;
        setProduct(data);
        setComments(data.comments || []);
        const firstActiveColor = (data.variant_color || []).find((c) => c.isActive !== false);
        setSelectedColor(firstActiveColor || data.variant_color?.[0] || null);
        setSelectedVariants({});
        setSelectedImage(0);
        setQuantity(1);
        writeProductDetailCache(cacheKey, {
          product: data,
          comments: data.comments || [],
        });
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setLoadError("Impossible de charger ce produit.");
          setProduct(null);
        }
      } finally {
        if (isMounted) setIsLoadingProduct(false);
      }
    };

    void loadProduct();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  const category = product
    ? categories.find((c) => c.name === product.categorie || c.name_search === product.categorie)
    : undefined;
  const discount = product?.ancien_price && product.ancien_price > 0 && product.price
    ? Math.round(((product.ancien_price - product.price) / product.ancien_price) * 100)
    : 0;

  const hasSizeGuide = useMemo(() => {
    if (!product?.variant) return false;
    return product.variant.some((variant) => {
      const typeLabel = (variant.type?.fr || "").toLowerCase();
      return typeLabel.includes("taille") || typeLabel.includes("size");
    });
  }, [product?.variant]);

  const missingVariants = useMemo(() => {
    const missing: string[] = [];
    (product?.variant || []).forEach((variant) => {
      const key = variant.type?.fr || "Option";
      if (!selectedVariants[key]) {
        missing.push(variant.type?.fr || "Option");
      }
    });
    if ((product?.variant_color || []).length > 0 && !selectedColor) {
      missing.push("Couleur");
    }
    return missing;
  }, [product?.variant, product?.variant_color, selectedVariants, selectedColor]);

  const variantSummary = useMemo(() => {
    if (!product?.variant?.length) return undefined;
    return product.variant
      .map((variant) => {
        const key = variant.type?.fr || "Option";
        const selected = selectedVariants[key];
        return selected ? `${key}: ${selected.value}` : null;
      })
      .filter(Boolean)
      .join(" • ");
  }, [product?.variant, selectedVariants]);

  const unitPrice = useMemo(() => {
    const basePrice = product?.price || 0;
    const variantAdjustment = Object.values(selectedVariants).reduce(
      (sum, variant) => sum + (variant.priceAdjustment || 0),
      0,
    );
    const colorAdjustment = selectedColor?.priceAdjustment || 0;
    return basePrice + variantAdjustment + colorAdjustment;
  }, [product?.price, selectedVariants, selectedColor]);

  const totalPrice = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);
  const discountedTotalPrice = useMemo(
    () => calculateTotalPricev2(product?.reduction, quantity, totalPrice),
    [product?.reduction, quantity, totalPrice],
  );
  const hasReductionDiscount = discountedTotalPrice < totalPrice;
  const reviewCount = comments.length;
  const ratingValue = 4.7;
  const savings = product?.ancien_price && unitPrice ? Math.max(product.ancien_price - unitPrice, 0) : 0;

  const addToCartServer = async () => {
    if (!product) return;
    const id_user = resolveClientUserId(user?.id);
    if (!id_user) return;

    const caracteristique: Record<string, string> = {};
    Object.entries(selectedVariants).forEach(([key, value]) => {
      if (value?.value) caracteristique[key] = value.value;
    });

    const variantAdjustment = Object.values(selectedVariants).reduce(
      (sum, variant) => sum + (variant.priceAdjustment || 0),
      0,
    );
    const colorAdjustment = selectedColor?.priceAdjustment || 0;
    const priceAdjustment = variantAdjustment + colorAdjustment;
    const basePrice = product.price || 0;
    const unitPriceValue = basePrice + priceAdjustment;

    const cartItem = {
      id_user,
      id_product: product._id,
      quantite: quantity,
      caracteristique,
      caracteristique_couleur: {
        type: selectedColor?.type || "",
        img: selectedColor?.img?.secure_url || "",
      },
      priceData: {
        basePrice,
        priceAdjustment,
        unitPrice: unitPriceValue,
        totalPrice: unitPriceValue * quantity,
      },
    };

    try {
      const res = await fetch("/api/client/addProduct_in_cart_client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cartItem),
      });
      if (!res.ok) throw new Error("add_cart");
      await refreshCartCount();
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'ajouter au panier");
    }
  };

  const handleAddToCart = () => {
    if (!product) {
      toast.error("Produit indisponible");
      return false;
    }
    if (missingVariants.length > 0) {
      toast.error(`Veuillez sélectionner: ${missingVariants.join(", ")}`);
      return false;
    }

    addToCart({
      productId: product._id,
      quantity,
      selectedSize: variantSummary,
      selectedColor: selectedColor?.type,
      price: unitPrice,
    });

    void addToCartServer();

    toast.success("Produit ajouté au panier", {
      description: product.title?.fr || "Produit",
    });

    return true;
  };

  const handleVariantSelect = (variantType: string, value: VariantValue) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [variantType]: {
        value: value.value || "",
        priceAdjustment: value.priceAdjustment,
      },
    }));
  };

  const handleBuyNow = () => {
    const added = handleAddToCart();
    if (added) {
      router.push("/checkout");
    }
  };

  const handleImageZoom = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const shareText = `Découvrez ${product?.title?.fr || "ce produit"} chez Ateliers Henna & Traditions`;

  const handleShare = (platform: string) => {
    if (!shareUrl) return;
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
      copy: shareUrl,
    };

    if (platform === "copy") {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Lien copié !");
    } else {
      window.open(urls[platform], "_blank", "width=600,height=400");
    }
    setShowShareMenu(false);
  };

  const handleSubmitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!product) {
      toast.error("Produit indisponible");
      return;
    }
    if (!commentName.trim() || !commentEmail.trim() || !commentText.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsSubmittingComment(true);
    try {
      const createRes = await fetch("/api/client/add_commante", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: commentName.trim(),
          email: commentEmail.trim(),
          avis: commentText.trim(),
        }),
      });

      if (!createRes.ok) throw new Error("create");
      const created = await createRes.json();

      const linkRes = await fetch("/api/client/add_commante_in_product", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: product._id,
          id_comment: created._id,
        }),
      });

      if (!linkRes.ok) throw new Error("link");

      setComments((prev) => [{ ...created }, ...prev]);
      setCommentName("");
      setCommentEmail("");
      setCommentText("");
      toast.success("Merci pour votre avis !");
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'envoyer votre avis");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const rawImages = (product?.array_ProductImg || []).map((img) => img.secure_url).filter(Boolean);
  const galleryImages = rawImages.length > 0 ? rawImages : [FALLBACK_IMAGE];
  const hasMultipleImages = galleryImages.length > 1;

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  if (isLoadingProduct) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-28 pb-20 text-center text-muted-foreground">Chargement...</div>
        <Footer />
      </div>
    );
  }

  if (!product || loadError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-32 pb-20 text-center">
          <h1 className="font-display text-3xl text-foreground mb-4">Produit non trouvé</h1>
          <p className="text-sm text-muted-foreground mb-6">{loadError || "Veuillez réessayer plus tard."}</p>
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline">
            <Home className="w-4 h-4" />
            Retour à l’accueil
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/10">
      <Header />

      <div className="h-[100px] sm:h-[120px]" />

      <div className={`bg-card/80 backdrop-blur-md border-b border-border transition-all duration-700 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto scrollbar-hide">
            <Link href="/" className="hover:text-primary transition-colors flex-shrink-0">
              <Home className="w-4 h-4" />
            </Link>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            {category && (
              <>
                <Link href={`/category/${category.name_search}`} className="hover:text-primary transition-colors flex-shrink-0">
                  {category.name}
                </Link>
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              </>
            )}
            <span className="text-foreground font-medium truncate">{product.title?.fr || "Produit"}</span>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16">
          <div
            ref={galleryRef}
            className={`space-y-4 lg:sticky lg:top-6 lg:h-fit transition-all duration-700 delay-100 ${
              isLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div
              className="relative aspect-square rounded-3xl overflow-hidden bg-card shadow-luxury border border-border/60 cursor-zoom-in group"
              onMouseMove={handleImageZoom}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onClick={() => setShowFullscreen(true)}
            >
              <img
                src={galleryImages[selectedImage]}
                alt={product.title?.fr || "Produit"}
                className={`w-full h-full object-cover transition-transform duration-500 ${
                  isZoomed ? "scale-[2]" : "scale-100"
                }`}
                style={isZoomed ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` } : undefined}
              />

              <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-elevated">
                <ZoomIn className="w-5 h-5 text-foreground" />
              </div>

              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-destructive text-destructive-foreground text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                  -{discount}%
                </div>
              )}

              {hasMultipleImages && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-card/90 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-card shadow-elevated"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-card/90 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-card shadow-elevated"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {hasMultipleImages && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-foreground/90 text-background rounded-full px-3 py-1 text-xs font-semibold">
                  {selectedImage + 1} / {galleryImages.length}
                </div>
              )}
            </div>

            {hasMultipleImages && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 snap-start ${
                      selectedImage === idx
                        ? "border-primary ring-2 ring-primary/30 shadow-gold"
                        : "border-border/60 opacity-70 hover:opacity-100 hover:border-primary/50"
                    }`}
                  >
                    <img src={img} alt={`Vue ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            className={`space-y-6 transition-all duration-700 delay-200 ${
              isLoaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div>
              {category && (
                <Link
                  href={`/category/${category.name_search}`}
                  className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-primary"
                >
                  {category.name}
                </Link>
              )}

              <div className="flex items-start justify-between gap-4">
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground leading-tight tracking-tight">
                  {product.title?.fr || "Produit"}
                </h1>

                <div className="hidden lg:flex items-center gap-2">
                  <button
                    onClick={() => toggleFavorite(product._id)}
                    className={`p-3 rounded-full border transition-all hover:scale-110 ${
                      isFavorite(product._id)
                        ? "bg-destructive border-destructive text-white"
                        : "border-border text-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite(product._id) ? "fill-current" : ""}`} />
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="p-3 rounded-full border border-border text-foreground hover:border-primary hover:text-primary transition-all hover:scale-110"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>

                    {showShareMenu && (
                      <div className="absolute right-0 top-full mt-2 bg-background border border-border rounded-xl shadow-elevated p-2 z-10 animate-scale-in min-w-[160px]">
                        <button
                          onClick={() => handleShare("facebook")}
                          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg hover:bg-muted transition-colors"
                        >
                          <Facebook className="w-4 h-4 text-[#1877F2]" />
                          <span className="text-sm">Facebook</span>
                        </button>
                        <button
                          onClick={() => handleShare("twitter")}
                          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg hover:bg-muted transition-colors"
                        >
                          <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                          <span className="text-sm">Twitter</span>
                        </button>
                        <button
                          onClick={() => handleShare("whatsapp")}
                          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg hover:bg-muted transition-colors"
                        >
                          <MessageCircle className="w-4 h-4 text-[#25D366]" />
                          <span className="text-sm">WhatsApp</span>
                        </button>
                        <button
                          onClick={() => handleShare("copy")}
                          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg hover:bg-muted transition-colors"
                        >
                          <LinkIcon className="w-4 h-4" />
                          <span className="text-sm">Copier le lien</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(ratingValue) ? "text-primary fill-primary" : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">{ratingValue} • {reviewCount} avis</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-primary">Vendu {product.purchaseCount || 0} fois</span>
              </div>

              <div className="flex items-baseline gap-3 mt-4 flex-wrap">
                <span className="font-display text-3xl sm:text-4xl font-bold text-primary">
                  {unitPrice.toLocaleString()} DZD
                </span>
                
                {discount > 0 && savings > 0 && (
                  <span className="text-sm font-semibold text-destructive bg-destructive/10 px-2 py-1 rounded">
                    Économisez {savings.toLocaleString()} DZD
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">En stock - Disponible</span>
                <span className="text-xs text-muted-foreground">• Livraison en 24-48h</span>
              </div>

              {product?.reduction && product.reduction.length > 0 && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
                  <div className="flex items-start gap-3">
                    <Tag className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                        Offres spéciales
                      </h4>
                      {product.reduction
                        .filter((r) => r.quantite && r.reduction)
                        .sort((a, b) => (a.quantite || 0) - (b.quantite || 0))
                        .map((r, i) => (
                          <p key={i} className="text-sm text-amber-700 dark:text-amber-400">
                            Achetez {r.quantite} unités et économisez {r.reduction?.toLocaleString()} DZD
                          </p>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6 divide-y divide-border">
              {(product.variant_color || []).length > 0 && (
                <div className="pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-foreground">Modèle</h3>
                    {selectedColor && (
                      <span className="text-sm text-primary font-medium">{selectedColor.type}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {(product.variant_color || []).map((color, index) => {
                      const isSelected = selectedColor?._id === color._id;
                      const isDisabled = color.isActive === false;
                      const colorAdjustment = typeof color.priceAdjustment === "number" ? color.priceAdjustment : null;
                      return (
                        <button
                          key={color._id || color.type || index}
                          onClick={() => !isDisabled && setSelectedColor(color)}
                          disabled={isDisabled}
                          className={`group relative rounded-xl overflow-hidden transition-all duration-300 ${
                            isSelected
                              ? "ring-2 ring-primary shadow-gold"
                              : isDisabled
                                ? "ring-1 ring-border opacity-40 cursor-not-allowed"
                                : "ring-1 ring-border hover:ring-primary/50 hover:shadow-soft"
                          }`}
                        >
                          <div className="aspect-square relative overflow-hidden bg-muted">
                            {color.img?.secure_url ? (
                              <img
                                src={color.img.secure_url}
                                alt={color.type}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-foreground">
                                {color.type}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors" />

                            {isSelected && (
                              <span className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 to-transparent p-2">
                            <p className="text-background text-[10px] font-medium truncate text-center">
                              {color.type}
                            </p>
                            {colorAdjustment !== null && colorAdjustment !== 0 && (
                              <p className="text-background/80 text-[10px] text-center">
                                {colorAdjustment > 0 ? "+" : ""} {colorAdjustment} DZD
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {(product.variant || []).length > 0 && (
                <div className="pt-6 space-y-5">
                  {(product.variant || []).map((variant, variantIndex) => {
                    const variantKey = variant.type?.fr || "Option";
                    const selected = selectedVariants[variantKey];
                    const variantDisabled = variant.isActive === false;
                    return (
                      <div key={variant._id || variantKey || variantIndex}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className={`text-base font-semibold ${variantDisabled ? 'text-muted-foreground/50' : 'text-foreground'}`}>
                            {variant.type?.fr || "Option"}
                            {variantDisabled && <span className="ml-2 text-xs font-normal text-muted-foreground/40">(indisponible)</span>}
                          </h3>
                          {selected && (
                            <span className="text-sm text-primary font-medium">{selected.value}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(variant.array_value || []).map((value, idx) => {
                            const isSelected = selected?.value === value.value;
                            const isDisabled = variantDisabled || value.isActive === false;
                            const priceAdjustment = value.priceAdjustment || 0;
                            return (
                              <button
                                key={`${variantKey}-${value.value || idx}`}
                                onClick={() => !isDisabled && handleVariantSelect(variantKey, value)}
                                disabled={isDisabled}
                                className={`relative px-4 py-2.5 rounded-xl border-2 font-medium text-sm transition-all duration-200 ${
                                  isSelected
                                    ? "bg-primary border-primary text-primary-foreground shadow-gold"
                                    : isDisabled
                                      ? "border-border/40 text-muted-foreground/40 opacity-40 cursor-not-allowed line-through"
                                      : "border-border text-foreground hover:border-primary/50 hover:bg-accent"
                                }`}
                              >
                                <span>{value.value}</span>
                                {priceAdjustment !== 0 && (
                                  <span className="ml-2 text-xs opacity-75">
                                    {priceAdjustment > 0 ? "+" : ""}
                                    {priceAdjustment.toFixed(2)} TND
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            <div className="space-y-3 bg-card/60 rounded-2xl border border-border/60 p-4">
              <span className="font-medium text-foreground">Quantité</span>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-14 h-12 flex items-center justify-center font-semibold text-foreground bg-muted/30">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-muted-foreground">
                  Total:{" "}
                  {hasReductionDiscount ? (
                    <>
                      <span className="line-through text-muted-foreground/60">{totalPrice.toLocaleString()} DZD</span>{" "}
                      <span className="font-semibold text-primary">{discountedTotalPrice.toLocaleString()} DZD</span>
                    </>
                  ) : (
                    <span className="font-semibold text-foreground">{totalPrice.toLocaleString()} DZD</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="gold"
                size="lg"
                // className="flex-1 w-full h-14 text-base gap-2 group"
                className="w-full h-14 text-base flex shadow-gold"

                onClick={handleAddToCart}
                disabled={missingVariants.length > 0}
              >
                <ShoppingCart className="w-5 h-5 transition-transform group-hover:scale-110" />
                Ajouter au panier
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full h-14 text-base border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={handleBuyNow}
                disabled={missingVariants.length > 0}
              >
                Acheter maintenant
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="flex lg:hidden items-center justify-center gap-4 py-4 border-t border-border">
              <button
                onClick={() => toggleFavorite(product._id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                  isFavorite(product._id)
                    ? "bg-destructive border-destructive text-white"
                    : "border-border text-foreground hover:border-primary"
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite(product._id) ? "fill-current" : ""}`} />
                <span className="text-sm">Favoris</span>
              </button>

              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-foreground hover:border-primary transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm">Partager</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 py-6 border-t border-border">
              <div className="flex flex-col items-center text-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-accent/60 border border-border/50 flex items-center justify-center group-hover:bg-accent transition-colors">
                  <Truck className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Livraison rapide</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-accent/60 border border-border/50 flex items-center justify-center group-hover:bg-accent transition-colors">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Paiement sécurisé</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-accent/60 border border-border/50 flex items-center justify-center group-hover:bg-accent transition-colors">
                  <RotateCcw className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Retour 14 jours</span>
              </div>
            </div>

            <Accordion type="single" collapsible defaultValue="description" className="border-t border-border">
              <AccordionItem value="description" className="border-b border-border">
                <AccordionTrigger className="text-base font-medium py-4 hover:text-primary transition-colors">
                  Description
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  <p className="mb-4">
                    {product.description?.fr
                      ? product.description.fr
                      : `Découvrez notre ${product?.title?.fr || "produit"}, une pièce d'exception alliant élégance et qualité supérieure.`}
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Qualité premium garantie
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Finitions soignées
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Finition atelier Ateliers Henna & Traditions
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="composition" className="border-b border-border">
                <AccordionTrigger className="text-base font-medium py-4 hover:text-primary transition-colors">
                  Composition & Finitions
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <span>Matériaux: sélectionnés selon le modèle et l’usage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <span>Détails: rubans, ornements, bougies ou textile selon variante</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <span>Finition: soignée en atelier</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <span>Préparation: contrôle visuel avant remise ou expédition</span>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

    
            </Accordion>
          </div>
        </div>

        <div className="mt-12 sm:mt-16">
          <div className="rounded-3xl border border-border/60 bg-background/70 p-6 sm:p-8 shadow-luxury">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">Avis clients</h2>
                <p className="text-sm text-muted-foreground">Partagez votre expérience sur ce produit.</p>
              </div>
              <span className="text-sm text-muted-foreground">{reviewCount} avis</span>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.4fr,1fr]">
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Soyez le premier à laisser un avis.</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment._id} className="rounded-2xl border border-border/60 bg-background/80 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{comment.name || "Client"}</p>
                          <p className="text-xs text-muted-foreground">
                            {comment.createdAt
                              ? new Date(comment.createdAt).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-primary fill-primary" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">{comment.avis}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSubmitComment} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Nom</label>
                  <input
                    type="text"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <input
                    type="email"
                    value={commentEmail}
                    onChange={(e) => setCommentEmail(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="vous@email.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Votre avis</label>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Partagez votre expérience..."
                  />
                </div>
                <Button type="submit" size="lg" variant="gold" className="w-full" disabled={isSubmittingComment}>
                  {isSubmittingComment ? "Envoi en cours..." : "Envoyer mon avis"}
                </Button>
              </form>
            </div>
          </div>
        </div>

        <div className={`mt-16 sm:mt-20 transition-all duration-700 delay-500 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <RelatedProducts currentProductId={product._id} category={product.categorie || ""} />
        </div>
      </main>

      <Dialog open={showSizeGuide} onOpenChange={setShowSizeGuide}>
        <DialogContent className="max-w-lg">
          <DialogTitle className="font-display text-2xl">Guide des tailles</DialogTitle>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">Toutes les mesures sont en centimètres (cm)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="py-3 px-4 text-left font-medium">Taille</th>
                    <th className="py-3 px-4 text-center font-medium">Poitrine</th>
                    <th className="py-3 px-4 text-center font-medium">Taille</th>
                    <th className="py-3 px-4 text-center font-medium">Hanches</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeGuide.map((row, idx) => (
                    <tr key={row.size} className={`border-b border-border ${idx % 2 === 0 ? "" : "bg-muted/30"}`}>
                      <td className="py-3 px-4 font-medium">{row.size}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{row.chest}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{row.waist}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{row.hips}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              💡 Pour une mesure précise, utilisez un mètre ruban souple et mesurez directement sur votre corps.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-none w-screen h-screen p-0 border-0 bg-transparent">
          <DialogTitle className="sr-only">{product.title?.fr || "Produit"}</DialogTitle>
          <div className="relative w-full h-full bg-foreground/95 backdrop-blur-sm">
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-5 right-5 z-20 p-3 rounded-full bg-background/20 text-background hover:bg-background/30 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-6 h-6" />
            </button>

            {hasMultipleImages && (
              <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 rounded-full bg-background/20 px-4 py-2 text-xs font-semibold text-background">
                {selectedImage + 1} / {galleryImages.length}
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={galleryImages[selectedImage]}
                alt={product.title?.fr || "Produit"}
                className="w-full h-full object-contain"
              />
            </div>

            {hasMultipleImages && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-5 top-1/2 -translate-y-1/2 z-20 p-4 bg-background/20 text-background rounded-full hover:bg-background/30 transition-colors"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-5 top-1/2 -translate-y-1/2 z-20 p-4 bg-background/20 text-background rounded-full hover:bg-background/30 transition-colors"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              </>
            )}

            {hasMultipleImages && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 rounded-full bg-background/20 px-4 py-2">
                {galleryImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`h-2 w-2 rounded-full transition-all ${
                      selectedImage === idx ? "w-6 bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
