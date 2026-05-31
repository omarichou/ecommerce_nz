"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Star, ShoppingBag, Eye, Sparkles, Check, X } from "lucide-react";
import { Product } from "@/data/products";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { resolveClientUserId } from "@/lib/clientUserId";

interface ProductCardModernProps {
  product: Product;
  index?: number;
  variant?: "default" | "compact";
}

type VariantValue = { value?: string; priceAdjustment?: number; isActive?: boolean };
type Variant = { _id?: string; isActive?: boolean; type?: { fr?: string; ar?: string }; array_value?: VariantValue[] };
type VariantColor = { _id?: string; isActive?: boolean; type?: string; img?: { secure_url?: string }; priceAdjustment?: number };
type ProductApi = {
  _id: string;
  title?: { fr?: string; ar?: string };
  price?: number;
  ancien_price?: number;
  disponible?: string;
  array_ProductImg?: { secure_url?: string }[];
  variant?: Variant[];
  variant_color?: VariantColor[];
};

const ProductCardModern = ({ product, index = 0 }: ProductCardModernProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCart, refreshCartCount } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickProduct, setQuickProduct] = useState<ProductApi | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, { value: string; priceAdjustment?: number }>>({});
  const [selectedColor, setSelectedColor] = useState<VariantColor | null>(null);
  const [quantity, setQuantity] = useState(1);
  const cardRef = useRef<HTMLDivElement>(null);

  const discount =
    product.ancien_price > 0
      ? Math.round(((product.ancien_price - product.price) / product.ancien_price) * 100)
      : 0;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [index]);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setQuickOpen(true);
    setQuickLoading(true);
    try {
      const response = await fetch(`/api/client/get_one_product?id=${product.id}`, { cache: "no-store" });
      if (!response.ok) throw new Error("load");
      const data: ProductApi = await response.json();
      setQuickProduct(data);
      setSelectedVariants({});
      setSelectedColor(data.variant_color?.find((c) => c.isActive !== false) || data.variant_color?.[0] || null);
      setQuantity(1);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les variantes");
      setQuickOpen(false);
    } finally {
      setQuickLoading(false);
    }
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

  const missingVariants = (quickProduct?.variant || []).reduce<string[]>((acc, variant) => {
    const key = variant.type?.fr || "Option";
    if (!selectedVariants[key]) acc.push(key);
    return acc;
  }, []) ?? [];

  if (quickProduct?.variant_color?.length && !selectedColor) {
    missingVariants.push("Couleur");
  }

  const unitPrice = (() => {
    const basePrice = quickProduct?.price || product.price || 0;
    const variantAdjustment = Object.values(selectedVariants).reduce(
      (sum, variant) => sum + (variant.priceAdjustment || 0),
      0,
    );
    const colorAdjustment = selectedColor?.priceAdjustment || 0;
    return basePrice + variantAdjustment + colorAdjustment;
  })();

  const isUnavailable = quickProduct?.disponible !== "disponible";

  const handleConfirmQuickAdd = async () => {
    if (!quickProduct) return;
    if (isUnavailable) {
      toast.error("Ce produit n'est pas disponible actuellement");
      return;
    }
    if (missingVariants.length > 0) {
      toast.error(`Veuillez sélectionner: ${missingVariants.join(", ")}`);
      return;
    }

    const id_user = resolveClientUserId(user?.id);
    if (id_user) {
      const cartItem = {
        id_user,
        id_product: quickProduct._id,
        quantite: quantity,
        caracteristique: Object.entries(selectedVariants).reduce<Record<string, string>>((acc, [key, val]) => {
          acc[key] = val.value;
          return acc;
        }, {}),
        caracteristique_couleur: {
          type: selectedColor?.type || "",
          img: selectedColor?.img?.secure_url || "",
        },
        priceData: {
          basePrice: quickProduct.price || 0,
          priceAdjustment: unitPrice - (quickProduct.price || 0),
          unitPrice,
          totalPrice: unitPrice * quantity,
        },
      };

      try {
        const res = await fetch("/api/client/addProduct_in_cart_client", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cartItem),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          toast.error(body?.error || "Impossible d'ajouter au panier");
          return;
        }
        await refreshCartCount();
      } catch (error) {
        console.error(error);
        toast.error("Impossible d'ajouter au panier");
        return;
      }
    }

    addToCart({
      productId: quickProduct._id,
      quantity,
      selectedSize: Object.entries(selectedVariants)
        .map(([key, val]) => `${key}: ${val.value}`)
        .join(" • "),
      selectedColor: selectedColor?.type,
      price: unitPrice,
    });

    toast.success("Ajouté au panier !", {
      description: quickProduct.title?.fr || product.title.fr,
      icon: <ShoppingBag className="w-4 h-4" />,
    });

    setQuickOpen(false);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);

    if (!isFavorite(product.id)) {
      toast.success("Ajouté aux favoris", {
        description: product.title.fr,
        icon: <Heart className="w-4 h-4 fill-current" />,
      });
    }
  };

  return (
    <div
      ref={cardRef}
      className={cn("group relative transition-all duration-200", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative bg-card rounded-xl sm:rounded-3xl overflow-hidden border border-border/50 shadow-luxury hover:shadow-elevated transition-all duration-500 hover:-translate-y-1">
        <Link href={`/product/${product.id}`} className="block">
          <div className="relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-muted">
            {!imageLoaded && <div className="absolute inset-0 animate-shimmer" />}

            <Image
              src={product.images[0]}
              alt={product.title.fr}
              fill
              onLoad={() => setImageLoaded(true)}
              className={cn(
                "object-cover transition-all duration-700",
                imageLoaded ? "opacity-100" : "opacity-0",
                isHovered && product.images[1] ? "scale-110 opacity-0" : "scale-100",
              )}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />

            {product.images[1] && (
              <Image
                src={product.images[1]}
                alt={product.title.fr}
                fill
                className={cn(
                  "object-cover transition-all duration-700",
                  isHovered ? "opacity-100 scale-100" : "opacity-0 scale-110",
                )}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            )}

            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent transition-opacity duration-300",
                isHovered ? "opacity-100" : "opacity-0 sm:opacity-0",
              )}
            />

            <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 flex items-start justify-between">
              {product.disponible && product.disponible !== "disponible" ? (
                <div className="bg-muted-foreground/80 text-muted text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-lg">
                  Indisponible
                </div>
              ) : discount > 0 ? (
                <div className="flex items-center gap-1 bg-destructive text-destructive-foreground text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-lg">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  -{discount}%
                </div>
              ) : (
                <div />
              )}

              <button
                onClick={handleFavorite}
                className={cn(
                  "p-1.5 sm:p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-lg",
                  isFavorite(product.id)
                    ? "bg-destructive text-white scale-110"
                    : "bg-background/80 text-foreground hover:bg-background hover:scale-110 active:scale-95",
                )}
              >
                <Heart className={cn("w-3.5 h-3.5 sm:w-5 sm:h-5", isFavorite(product.id) && "fill-current")} />
              </button>
            </div>

            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 p-2 sm:p-4 flex gap-2 transition-all duration-300",
                "opacity-100 translate-y-0 sm:opacity-0 sm:translate-y-4",
                "sm:group-hover:opacity-100 sm:group-hover:translate-y-0",
              )}
            >
              <button
                type="button"
                onClick={() => router.push(`/product/${product.id}`)}
                aria-label={`Voir ${product.title.fr}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-3 bg-background/95 backdrop-blur-md text-foreground rounded-lg sm:rounded-xl font-medium text-[11px] sm:text-sm hover:bg-primary hover:text-primary-foreground transition-all shadow-lg"
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Voir</span>
              </button>

              <button
                onClick={handleQuickAdd}
                aria-label={`Ajouter ${product.title.fr} au panier`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-3 bg-primary text-primary-foreground rounded-lg sm:rounded-xl font-medium text-[11px] sm:text-sm hover:bg-primary/90 transition-all shadow-lg active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Ajouter</span>
              </button>
            </div>
          </div>
        </Link>

        <div className="p-2.5 sm:p-4">
          <Link href={`/product/${product.id}`}>
            <h3 className="font-display text-[13px] sm:text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors min-h-[2rem] sm:min-h-[2.5rem]">
              {product.title.fr}
            </h3>
          </Link>

          <div className="flex items-center gap-1.5 mt-1.5 sm:mt-2">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-2.5 h-2.5 sm:w-3.5 sm:h-3.5",
                    i < Math.floor(product.rating) ? "text-primary fill-primary" : "text-muted-foreground/30",
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">({product.rating})</span>
          </div>

          <div className="flex items-baseline gap-2 mt-2 sm:mt-3">
            <span className="font-display text-sm sm:text-lg font-bold text-foreground">
              {product.price.toLocaleString()}
              <span className="text-[10px] sm:text-sm font-body font-medium text-muted-foreground ml-1">DZD</span>
            </span>
            {product.ancien_price > 0 && (
              <span className="text-[10px] sm:text-sm text-muted-foreground line-through">
                {product.ancien_price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle className="font-display text-xl">Ajouter au panier</DialogTitle>
          {quickLoading ? (
            <div className="py-6 text-sm text-muted-foreground">Chargement...</div>
          ) : quickProduct ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="relative w-16 h-16 rounded-lg bg-muted overflow-hidden">
                  <Image
                    src={quickProduct.array_ProductImg?.[0]?.secure_url || product.images[0]}
                    alt={quickProduct.title?.fr || product.title.fr}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div>
                  <p className="font-medium text-foreground">{quickProduct.title?.fr || product.title.fr}</p>
                  <p className="text-sm text-muted-foreground">{unitPrice.toLocaleString()} DZD</p>
                  {isUnavailable && (
                    <span className="inline-block mt-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                      Produit indisponible
                    </span>
                  )}
                </div>
              </div>

              {(quickProduct.variant_color || []).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Couleur</p>
                  <div className="flex flex-wrap gap-2">
                    {(quickProduct.variant_color || []).map((color, idx) => {
                          const isSelected = selectedColor?._id === color._id;
                          const isDisabled = color.isActive === false;
                          return (
                            <button
                              key={color._id || color.type || idx}
                              onClick={() => !isDisabled && setSelectedColor(color)}
                              disabled={isDisabled}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all",
                                isSelected
                                  ? "border-primary bg-primary/10 text-primary"
                                  : isDisabled
                                    ? "border-border/40 text-muted-foreground/40 opacity-40 cursor-not-allowed line-through"
                                    : "border-border text-muted-foreground hover:border-primary/50",
                              )}
                            >
                              {color.type}
                              {isSelected && <Check className="w-3 h-3" />}
                            </button>
                          );
                    })}
                  </div>
                </div>
              )}

              {(quickProduct.variant || []).map((variant, variantIndex) => {
                const variantKey = variant.type?.fr || "Option";
                const selected = selectedVariants[variantKey];
                return (
                  <div key={variant._id || variantKey || variantIndex} className="space-y-2">
                    <p className="text-sm font-medium text-foreground">{variant.type?.fr || "Option"}</p>
                    <div className="flex flex-wrap gap-2">
                      {(variant.array_value || []).map((value, idx) => {
                        const isSelected = selected?.value === value.value;
                        const isDisabled = value.isActive === false;
                        return (
                          <button
                            key={`${variantKey}-${value.value || idx}`}
                            onClick={() => !isDisabled && handleVariantSelect(variantKey, value)}
                            disabled={isDisabled}
                            className={cn(
                              "px-3 py-2 rounded-lg border text-xs transition-all",
                              isSelected
                                ? "border-primary bg-primary/10 text-primary"
                                : isDisabled
                                  ? "border-border/40 text-muted-foreground/40 opacity-40 cursor-not-allowed line-through"
                                  : "border-border text-muted-foreground hover:border-primary/50",
                            )}
                          >
                            {value.value}
                            {isSelected && <Check className="w-3 h-3 ml-1 inline" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleConfirmQuickAdd}
                  disabled={isUnavailable}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                    isUnavailable
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {isUnavailable ? "Indisponible" : "Ajouter"}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-sm text-muted-foreground">Impossible de charger ce produit.</div>
          )}
          <button
            onClick={() => setQuickOpen(false)}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductCardModern;
