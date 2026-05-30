"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Image from "next/image";
import { useAdminData, type AdminProduct } from "@/contexts/AdminDataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { MoreVertical, Package, Pencil, Plus, Search, Star, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminProductsPage() {
  const { products, categories, refreshProducts } = useAdminData();

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isPreviewZoomed, setIsPreviewZoomed] = useState(false);

  const [formData, setFormData] = useState({
    titleFr: "",
    titleAr: "",
    descriptionShort: "",
    descriptionLong: "",
    descriptionAr: "",
    price: "",
    ancienPrice: "",
    costPrice: "",
    category: "",
    availability: "disponible",
    rating: "4.5",
    sku: "",
    brand: "Ateliers Henna",
    featured: false,
    isNew: false,
    isPopular: false,
  });

  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<{ secure_url: string; public_id_url?: string }[]>([]);
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string | null>(null);

  const [reductions, setReductions] = useState<{ reduction: number; quantite: number }[]>([]);
  const [currentReduction, setCurrentReduction] = useState("");
  const [currentQuantite, setCurrentQuantite] = useState("");

  type VariantValue = { value: string; priceAdjustment?: number; isActive?: boolean };
  type Variant = { _id?: string; isActive?: boolean; type: { fr: string; ar: string }; array_value: VariantValue[] };
  type Color = { _id?: string; isActive?: boolean; img: { secure_url: string; public_id_url: string }; type: string; priceAdjustment: number };

  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantTypeFr, setVariantTypeFr] = useState("");
  const [variantTypeAr, setVariantTypeAr] = useState("");
  const [variantValues, setVariantValues] = useState<VariantValue[]>([]);
  const [variantValueInput, setVariantValueInput] = useState("");
  const [variantPriceInput, setVariantPriceInput] = useState("0");
  const [variantDrafts, setVariantDrafts] = useState<Record<string, { value: string; price: string }>>({});
  const [existingValueDrafts, setExistingValueDrafts] = useState<Record<string, { value: string; priceAdjustment: number; isActive: boolean }>>({});

  const [colors, setColors] = useState<Color[]>([]);
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);
  const [deletedColorIds, setDeletedColorIds] = useState<string[]>([]);
  const [colorFile, setColorFile] = useState<File | null>(null);
  const [colorName, setColorName] = useState("");
  const [colorPriceAdjustment, setColorPriceAdjustment] = useState("0");
  const [colorPriceDrafts, setColorPriceDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsListLoading(true);
      const meta = await refreshProducts({ page, limit: pageSize, q: searchQuery });
      if (isMounted && meta) {
        setTotal(meta.total);
      }
      if (isMounted) setIsListLoading(false);
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [page, pageSize, searchQuery, refreshProducts]);

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  const openImagePreview = (url?: string) => {
    if (!url) return;
    setPreviewImageUrl(url);
    setIsImagePreviewOpen(true);
    setIsPreviewZoomed(false);
  };

  const resetDialogState = () => {
    setEditingProduct(null);
    setFormData({
      titleFr: "",
      titleAr: "",
      descriptionShort: "",
      descriptionLong: "",
      descriptionAr: "",
      price: "",
      ancienPrice: "",
      costPrice: "",
      category: "",
      availability: "disponible",
      rating: "4.5",
      sku: "",
      brand: "Ateliers Henna",
      featured: false,
      isNew: false,
    isPopular: false,
  });
    setFiles([]);
    setFilePreviews([]);
    setExistingImages([]);
    setPrimaryImageUrl(null);
    setReductions([]);
    setCurrentReduction("");
    setCurrentQuantite("");
    setVariants([]);
    setVariantTypeFr("");
    setVariantTypeAr("");
    setVariantValues([]);
    setVariantValueInput("");
    setVariantPriceInput("0");
    setVariantDrafts({});
    setExistingValueDrafts({});
    setColors([]);
    setDeletedVariantIds([]);
    setDeletedColorIds([]);
    setColorFile(null);
    setColorName("");
    setColorPriceAdjustment("0");
    setColorPriceDrafts({});
  };

  const openAddDialog = () => {
    resetDialogState();
    setIsDialogOpen(true);
  };

  const openEditDialog = async (product: AdminProduct) => {
    resetDialogState();
    setEditingProduct(product);
    setIsDialogOpen(true);
    setIsLoadingDetails(true);
    try {
      const response = await fetch(`/api/admin/get_one_product?id=${product.id}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Chargement du produit impossible");
      }
      const data = await response.json();
      setFormData({
        titleFr: data.title?.fr || product.title.fr,
        titleAr: data.title?.ar || product.title.ar,
        descriptionShort: data.description?.fr || "",
        descriptionLong: data.description?.fr || "",
        descriptionAr: data.description?.ar || "",
        price: String(data.price ?? product.price),
        ancienPrice: String(data.ancien_price ?? product.ancien_price),
        costPrice: product.costPrice.toString(),
        category: data.categorie || product.category,
        
        availability: data.disponible || "disponible",
        rating: product.rating.toString(),
        sku: data.sku || product.sku,
        brand: product.brand,
        featured: data.featured === true,
        isNew: data.isNew === true,
        isPopular: data.isPopular === true,
      });
      const productImages = data.array_ProductImg || [];
      setExistingImages(productImages);
      setPrimaryImageUrl(productImages[0]?.secure_url || null);
      setReductions(data.reduction || []);
      setVariants(data.variant || []);
      setExistingValueDrafts({});
      setColors(data.variant_color || []);
    } catch (error) {
      console.error(error);
      toast.error("Erreur", { description: "Impossible de charger les détails du produit" });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;
    const maxSize = 5 * 1024 * 1024;
    const validFiles = selectedFiles.filter((file) => {
      if (file.size > maxSize) {
        toast.error(`Le fichier ${file.name} est trop volumineux (max 5MB).`);
        return false;
      }
      return true;
    });
    const previews = validFiles.map((file) => URL.createObjectURL(file));
    setFilePreviews((prev) => [...prev, ...previews]);
    setFiles((prev) => [...prev, ...validFiles]);
    if (!primaryImageUrl && existingImages.length === 0 && previews.length > 0) {
      setPrimaryImageUrl(previews[0]);
    }
  };

  const removeNewImage = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (index: number) => {
    const image = existingImages[index];
    if (!image?.public_id_url) {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    try {
      await fetch("/api/admin/delete_image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id: image.public_id_url }),
      });
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error(error);
      toast.error("Impossible de supprimer l'image");
    }
  };

  const addVariantValue = () => {
    if (!variantValueInput.trim()) return;
    const valueNormalized = variantValueInput.trim().toLowerCase();
    if (variantValues.some((v) => v.value.toLowerCase() === valueNormalized)) {
      toast.error("Cette valeur existe déjà");
      return;
    }
    setVariantValues((prev) => [
      ...prev,
      { value: variantValueInput.trim(), priceAdjustment: Number(variantPriceInput) || 0, isActive: true },
    ]);
    setVariantValueInput("");
    setVariantPriceInput("0");
  };

  const removeVariantValue = (index: number) => {
    setVariantValues((prev) => prev.filter((_, i) => i !== index));
  };

  const addVariant = () => {
    if (!variantTypeFr.trim() || variantValues.length === 0) return;
    const typeNormalized = variantTypeFr.trim().toLowerCase();
    if (variants.some((v) => (v.type?.fr || "").toLowerCase() === typeNormalized)) {
      toast.error("Ce type de variante existe déjà");
      return;
    }
    setVariants((prev) => [
      ...prev,
      { isActive: true, type: { fr: variantTypeFr.trim(), ar: variantTypeAr.trim() || variantTypeFr.trim() }, array_value: variantValues },
    ]);
    setVariantTypeFr("");
    setVariantTypeAr("");
    setVariantValues([]);
  };

  const removeVariant = (index: number) => {
    const variant = variants[index];
    if (variant?._id) {
      setDeletedVariantIds((prev) => [...prev, variant._id as string]);
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariantDraft = (variantId: string, field: "value" | "price", value: string) => {
    setVariantDrafts((prev) => ({
      ...prev,
      [variantId]: {
        value: field === "value" ? value : prev[variantId]?.value || "",
        price: field === "price" ? value : prev[variantId]?.price || "0",
      },
    }));
  };

  const addValueToExistingVariant = async (variantId: string) => {
    const draft = variantDrafts[variantId];
    if (!draft?.value?.trim()) return;
    const target = variants.find((v) => v._id === variantId);
    if (!target) return;

    const valueNormalized = draft.value.trim().toLowerCase();
    if (target.array_value.some((v) => v.value.toLowerCase() === valueNormalized)) {
      toast.error("Cette valeur existe déjà");
      return;
    }

    const updatedArray = [
      ...target.array_value,
      { value: draft.value.trim(), priceAdjustment: Number(draft.price) || 0 },
    ];

    try {
      const response = await fetch("/api/admin/update_Caracteristique", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: variantId, type: target.type, array_value: updatedArray }),
      });
      if (!response.ok) throw new Error("update variant");
      setVariants((prev) =>
        prev.map((item) => (item._id === variantId ? { ...item, array_value: updatedArray } : item)),
      );
      setVariantDrafts((prev) => ({ ...prev, [variantId]: { value: "", price: "0" } }));
      toast.success("Valeur ajoutée");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'ajout de la valeur");
    }
  };

  const removeValueFromExistingVariant = async (variantId: string, valueToDelete: string) => {
    const target = variants.find((v) => v._id === variantId);
    if (!target) return;
    const updatedArray = target.array_value.filter((val) => val.value !== valueToDelete);

    try {
      if (updatedArray.length === 0) {
        await fetch("/api/admin/delete_Caracteristique", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: variantId }),
        });
        setVariants((prev) => prev.filter((item) => item._id !== variantId));
        toast.success("Variant supprimé");
        return;
      }

      const response = await fetch("/api/admin/update_Caracteristique", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: variantId, type: target.type, array_value: updatedArray }),
      });
      if (!response.ok) throw new Error("update variant");

      setVariants((prev) =>
        prev.map((item) => (item._id === variantId ? { ...item, array_value: updatedArray } : item)),
      );
      toast.success("Valeur supprimée");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const toggleExistingVariantActive = async (variantId: string) => {
    const target = variants.find((v) => v._id === variantId);
    if (!target) return;
    const newActive = !(target.isActive ?? true);
    try {
      const response = await fetch("/api/admin/update_Caracteristique", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: variantId, isActive: newActive }),
      });
      if (!response.ok) throw new Error("toggle variant");
      setVariants((prev) =>
        prev.map((item) => (item._id === variantId ? { ...item, isActive: newActive } : item)),
      );
      toast.success(newActive ? "Variant activé" : "Variant désactivé");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du changement de statut");
    }
  };

  const toggleExistingVariantValueActive = async (variantId: string, valueIndex: number) => {
    const target = variants.find((v) => v._id === variantId);
    if (!target) return;
    const updatedValues = target.array_value.map((val, idx) =>
      idx === valueIndex ? { ...val, isActive: !(val.isActive ?? true) } : val,
    );
    try {
      const response = await fetch("/api/admin/update_Caracteristique", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: variantId, array_value: updatedValues }),
      });
      if (!response.ok) throw new Error("toggle value");
      setVariants((prev) =>
        prev.map((item) => (item._id === variantId ? { ...item, array_value: updatedValues } : item)),
      );
      toast.success("Valeur mise à jour");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const editExistingVariantValue = (variantId: string, valueIndex: number, field: "priceAdjustment" | "isActive", val: number | boolean) => {
    const target = variants.find((v) => v._id === variantId);
    if (!target || !target.array_value[valueIndex]) return;
    const value = target.array_value[valueIndex];
    const updated = {
      value: value.value,
      priceAdjustment: field === "priceAdjustment" ? (val as number) : (value.priceAdjustment ?? 0),
      isActive: field === "isActive" ? (val as boolean) : (value.isActive ?? true),
    };
    setExistingValueDrafts((prev) => ({
      ...prev,
      [`${variantId}-${valueIndex}`]: updated,
    }));
  };

  const saveExistingVariantValues = async (variantId: string) => {
    const target = variants.find((v) => v._id === variantId);
    if (!target) return;
    const updatedValues = target.array_value.map((val, idx) => {
      const draft = existingValueDrafts[`${variantId}-${idx}`];
      return draft
        ? { ...val, priceAdjustment: draft.priceAdjustment, isActive: draft.isActive }
        : val;
    });
    try {
      const response = await fetch("/api/admin/update_Caracteristique", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: variantId, array_value: updatedValues }),
      });
      if (!response.ok) throw new Error("save values");
      setVariants((prev) =>
        prev.map((item) => (item._id === variantId ? { ...item, array_value: updatedValues } : item)),
      );
      setExistingValueDrafts((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (key.startsWith(`${variantId}-`)) delete next[key];
        });
        return next;
      });
      toast.success("Valeurs enregistrées");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const deleteSpecificValueFromExistingVariant = async (variantId: string, valueIndex: number) => {
    const target = variants.find((v) => v._id === variantId);
    if (!target) return;
    const valueToDelete = target.array_value[valueIndex]?.value;
    if (!valueToDelete) return;
    await removeValueFromExistingVariant(variantId, valueToDelete);
  };

  const toggleExistingColorActive = async (colorId: string) => {
    const target = colors.find((c) => c._id === colorId);
    if (!target) return;
    const newActive = !(target.isActive ?? true);
    try {
      const response = await fetch("/api/admin/update_Caracteristique_color", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: colorId, isActive: newActive }),
      });
      if (!response.ok) throw new Error("toggle color");
      setColors((prev) =>
        prev.map((item) => (item._id === colorId ? { ...item, isActive: newActive } : item)),
      );
      toast.success(newActive ? "Couleur activée" : "Couleur désactivée");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du changement de statut");
    }
  };

  const toggleNewVariantActive = (index: number) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, isActive: !(v.isActive ?? true) } : v)));
  };

  const toggleNewVariantValueActive = (variantIndex: number, valueIndex: number) => {
    setVariants((prev) =>
      prev.map((v, vi) =>
        vi === variantIndex
          ? {
              ...v,
              array_value: v.array_value.map((val, valIdx) =>
                valIdx === valueIndex ? { ...val, isActive: !(val.isActive ?? true) } : val,
              ),
            }
          : v,
      ),
    );
  };

  const toggleNewColorActive = (index: number) => {
    setColors((prev) => prev.map((c, i) => (i === index ? { ...c, isActive: !(c.isActive ?? true) } : c)));
  };

  const toggleNewValueActive = (index: number) => {
    setVariantValues((prev) =>
      prev.map((v, i) => (i === index ? { ...v, isActive: !(v.isActive ?? true) } : v)),
    );
  };

  const addColor = async () => {
    if (!colorFile || !colorName.trim()) {
      toast.error("Veuillez ajouter une image et un nom de couleur");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", colorFile);
      const response = await fetch("/api/admin/stor_image_to_claud_and_get_url", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      const img = {
        secure_url: String(data.img_url.secure_url),
        public_id_url: String(data.img_url.public_id),
      };
      setColors((prev) => [
        ...prev,
        { isActive: true, img, type: colorName.trim(), priceAdjustment: Number(colorPriceAdjustment) || 0 },
      ]);
      setColorFile(null);
      setColorName("");
      setColorPriceAdjustment("0");
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'ajouter la couleur");
    }
  };

  const removeColor = (index: number) => {
    const color = colors[index];
    if (color?._id) {
      setDeletedColorIds((prev) => [...prev, color._id as string]);
    }
    setColors((prev) => prev.filter((_, i) => i !== index));
  };

  const updateExistingColorPrice = async (colorId: string, price: string) => {
    const color = colors.find((item) => item._id === colorId);
    if (!color) return;
    try {
      const response = await fetch("/api/admin/update_Caracteristique_color", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: colorId, priceAdjustment: Number(price) || 0 }),
      });
      if (!response.ok) throw new Error("update color");
      setColors((prev) =>
        prev.map((item) => (item._id === colorId ? { ...item, priceAdjustment: Number(price) || 0 } : item)),
      );
      toast.success("Prix ajusté");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour du prix");
    }
  };

  const addReduction = () => {
    if (!currentReduction || !currentQuantite) return;
    setReductions((prev) => [
      ...prev,
      { reduction: Number(currentReduction), quantite: Number(currentQuantite) },
    ]);
    setCurrentReduction("");
    setCurrentQuantite("");
  };

  const uploadImages = async () => {
    const uploaded = await Promise.all(
      files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/admin/stor_image_to_claud_and_get_url", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error("upload failed");
        const data = await response.json();
        return {
          secure_url: String(data.img_url.secure_url),
          public_id_url: String(data.img_url.public_id),
        };
      }),
    );
    return uploaded;
  };

  const setAsPrimary = (url: string) => {
    setPrimaryImageUrl(url);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        ...deletedVariantIds.map((id) =>
          fetch("/api/admin/delete_Caracteristique", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ _id: id }),
          }),
        ),
        ...deletedColorIds.map((id) =>
          fetch("/api/admin/delete_Caracteristique_couleur", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ _id: id }),
          }),
        ),
      ]);

      const uploadedImages = files.length ? await uploadImages() : [];
      let allImages = editingProduct ? [...existingImages, ...uploadedImages] : uploadedImages;
      if (primaryImageUrl) {
        const primaryIdx = allImages.findIndex((img) => img.secure_url === primaryImageUrl);
        if (primaryIdx > 0) {
          const [primary] = allImages.splice(primaryIdx, 1);
          allImages.unshift(primary);
        }
      }

      const createdVariants = await Promise.all(
        variants.map(async (variant) => {
          if (variant._id) return variant;
          const response = await fetch("/api/admin/add_Caracteristique", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(variant),
          });
          if (!response.ok) throw new Error("variant");
          return response.json();
        }),
      );

      const createdColors = await Promise.all(
        colors.map(async (color) => {
          if (color._id) return color;
          const response = await fetch("/api/admin/add_Caracteristique_color", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(color),
          });
          if (!response.ok) throw new Error("color");
          return response.json();
        }),
      );

      if (editingProduct) {
        const response = await fetch("/api/admin/update_Product", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            _id: editingProduct.id,
            categorie: formData.category,
            title: { fr: formData.titleFr, ar: formData.titleAr },
            price: parseFloat(formData.price) || 0,
            ancien_price: parseFloat(formData.ancienPrice) || 0,
            disponible: formData.availability || "disponible",
            description: { fr: formData.descriptionLong || formData.descriptionShort, ar: formData.descriptionAr || "" },
            variant: createdVariants.map((item: { _id: string }) => item._id),
            variant_color: createdColors.map((item: { _id: string }) => item._id),
            reduction: reductions,
            array_ProductImg: allImages,
            isNew: formData.isNew,
            isPopular: formData.isPopular,
            featured: formData.featured,
            sku: formData.sku || undefined,
          }),
        });

        if (!response.ok) throw new Error("update");
        toast.success("Produit modifié", { description: "Le produit a été mis à jour" });
      } else {
        const response = await fetch("/api/admin/addProduct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reductions,
            Categorie: formData.category,
            title: formData.titleFr,
            title_en_arabe: formData.titleAr,
            Price: parseFloat(formData.price) || 0,
            Ancien_price: parseFloat(formData.ancienPrice) || 0,
            description: formData.descriptionLong || formData.descriptionShort,
            description_en_arabe: formData.descriptionAr || "",
            disponible: formData.availability || "disponible",
            array_machinImg: allImages.map((img) => ({ img_url: { secure_url: img.secure_url, public_id: img.public_id_url } })),
            array_variant: createdVariants,
            variant_color: createdColors,
            isNew: formData.isNew,
            isPopular: formData.isPopular,
            featured: formData.featured,
            sku: formData.sku || undefined,
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err?.error || "add");
        }
        toast.success("Produit ajouté", { description: "Le nouveau produit a été créé" });
      }

      await refreshProducts();
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Erreur", { description: "Impossible d'enregistrer le produit" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    try {
      const response = await fetch(`/api/admin/get_one_product?id=${id}`, { cache: "no-store" });
      if (!response.ok) throw new Error("load");
      const product = await response.json();

      const deleteVariants = (product.variant || []).map((item: { _id: string }) =>
        fetch("/api/admin/delete_Caracteristique", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: item._id }),
        }),
      );

      const deleteColors = (product.variant_color || []).map((item: { _id: string; img: { public_id_url: string } }) =>
        fetch("/api/admin/delete_Caracteristique_couleur", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: item._id, img: item.img }),
        }),
      );

      const deleteComments = (product.comments || []).map((item: { _id: string }) =>
        fetch("/api/admin/delete_Commentaire", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: item._id }),
        }),
      );

      await Promise.all([...deleteVariants, ...deleteColors, ...deleteComments]);

      await fetch("/api/admin/delete_Product", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: id, array_ProductImg: product.array_ProductImg || [] }),
      });

      await refreshProducts();
      toast.error("Produit supprimé");
    } catch (error) {
      console.error(error);
      toast.error("Erreur", { description: "Suppression impossible" });
    }
  };

  const existingVariants = variants.filter((variant) => variant._id);
  const newVariants = variants.filter((variant) => !variant._id);
  const existingColors = colors.filter((color) => color._id);
  const newColors = colors.filter((color) => !color._id);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Produits</h1>
            <p className="text-muted-foreground mt-1">{total} produits au total</p>
          </div>
          <Button onClick={openAddDialog} className="gap-2">
            <Plus className="w-4 h-4" />
            Ajouter un produit
          </Button>
        </div>

        <Card className="border-border/50 bg-white dark:bg-slate-900">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, catégorie..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-white dark:bg-slate-900 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="w-28 py-3 px-4"></th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Produit</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">SKU</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">Catégorie</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Prix</th>
                    <th className="w-20 py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {isListLoading
                    ? Array.from({ length: 6 }).map((_, index) => (
                        <tr key={`skeleton-${index}`} className="border-b border-border/50">
                          <td className="py-3 px-4">
                            <div className="h-10 w-10 rounded bg-muted animate-pulse" />
                          </td>
                          <td className="py-3 px-4">
                            <div className="h-4 w-40 rounded bg-muted animate-pulse mb-2" />
                            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell">
                            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                          </td>
                          <td className="py-3 px-4">
                            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                          </td>
                          <td className="py-3 px-4"></td>
                        </tr>
                      ))
                    : products.map((product) => (
                        <tr key={product.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="py-2 px-4 w-28">
                            <button type="button" onClick={() => openImagePreview(product.images[0])} className="block">
                              <Image
                                src={product.images[0]}
                                alt=""
                                width={96}
                                height={96}
                                className="w-24 h-24 min-w-24 rounded-xl object-cover"
                                unoptimized
                              />
                            </button>
                          </td>
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-medium text-sm">{product.title.fr}</p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  {product.rating}
                                  {product.featured && (
                                    <Badge variant="outline" className="ml-1 h-4 text-[10px]">
                                      Vedette
                                    </Badge>
                                  )}
                                  {product.isNew && (
                                    <Badge variant="secondary" className="ml-1 h-4 text-[10px]">
                                      Nouveau
                                    </Badge>
                                  )}
                                  {product.isPopular && (
                                    <Badge variant="secondary" className="ml-1 h-4 text-[10px]">
                                      Populaire
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-4 text-sm font-mono text-muted-foreground hidden md:table-cell">{product.sku}</td>
                          <td className="py-2 px-4 text-sm hidden lg:table-cell">{product.category}</td>
                          <td className="py-2 px-4">
                            <div>
                              <span className="font-semibold text-sm">{product.price.toLocaleString()} DA</span>
                              {product.ancien_price > 0 && (
                                <span className="text-xs text-muted-foreground line-through ml-1">
                                  {product.ancien_price.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(product)}>
                                  <Pencil className="w-4 h-4 mr-2" /> Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(product.id)} className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
            {!isListLoading && products.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Aucun produit trouvé</p>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 text-sm">
              <span className="text-muted-foreground">
                {total > 0 ? `Page ${page} sur ${totalPages}` : ""}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => (p <= 1 ? totalPages : p - 1))}
                  disabled={totalPages <= 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => (p >= totalPages ? 1 : p + 1))}
                  disabled={totalPages <= 1}
                >
                  Suivant
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Modifier le produit" : "Ajouter un produit"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {isLoadingDetails ? (
              <div className="space-y-4 animate-pulse">
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-10 rounded-md bg-muted" />
                  <div className="h-10 rounded-md bg-muted" />
                </div>
                <div className="h-10 rounded-md bg-muted" />
                <div className="h-24 rounded-md bg-muted" />
                <div className="h-24 rounded-md bg-muted" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-10 rounded-md bg-muted" />
                  <div className="h-10 rounded-md bg-muted" />
                  <div className="h-10 rounded-md bg-muted" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-10 rounded-md bg-muted" />
                  <div className="h-10 rounded-md bg-muted" />
                </div>
                <div className="h-10 rounded-md bg-muted" />
              </div>
            ) : (
              <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom (Français) *</Label>
                <Input value={formData.titleFr} onChange={(e) => setFormData({ ...formData, titleFr: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Nom (Arabe)</Label>
                <Input value={formData.titleAr} onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })} dir="rtl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description courte</Label>
              <Input value={formData.descriptionShort} onChange={(e) => setFormData({ ...formData, descriptionShort: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description longue</Label>
              <Textarea
                value={formData.descriptionLong}
                onChange={(e) => setFormData({ ...formData, descriptionLong: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Arabe)</Label>
              <Textarea
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                rows={3}
                dir="rtl"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Prix (DA) *</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Ancien prix</Label>
                <Input type="number" value={formData.ancienPrice} onChange={(e) => setFormData({ ...formData, ancienPrice: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Coût</Label>
                <Input type="number" value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })} />
              </div>
            </div>
              <div className="space-y-2">
                <Label>Catégorie *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.name_search} value={cat.name_search}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              </>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Disponibilité</Label>
                <Select value={formData.availability} onValueChange={(v) => setFormData({ ...formData, availability: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="indisponible">Indisponible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={formData.featured} onCheckedChange={(c) => setFormData({ ...formData, featured: c === true })} />
              <Label>Produit vedette</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={formData.isNew} onCheckedChange={(c) => setFormData({ ...formData, isNew: c === true })} />
              <Label>Nouveauté</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={formData.isPopular} onCheckedChange={(c) => setFormData({ ...formData, isPopular: c === true })} />
              <Label>Populaire</Label>
            </div>

            <div className="space-y-2">
              <Label>Images produit *</Label>
              <div className="flex flex-col gap-3">
                <label className="inline-flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm cursor-pointer">
                  <Upload className="w-4 h-4" /> Ajouter des images
                  <input type="file" multiple className="hidden" onChange={handleFileChange} />
                </label>
                {(existingImages.length > 0 || filePreviews.length > 0) && (
                  <div className="flex flex-wrap gap-3">
                    {existingImages.map((img, index) => {
                      const isPrimary = primaryImageUrl === img.secure_url;
                      return (
                      <div key={`${img.public_id_url || img.secure_url}-${index}`} className="relative group">
                        <button type="button" onClick={() => openImagePreview(img.secure_url)} className="block">
                          <Image
                            src={img.secure_url}
                            alt=""
                            width={96}
                            height={96}
                            className={`h-24 w-24 rounded-lg object-cover ${isPrimary ? 'ring-2 ring-primary' : ''}`}
                            unoptimized
                          />
                        </button>
                        {isPrimary && (
                          <span className="absolute top-0 left-0 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-br-lg rounded-tl-lg font-semibold">
                            Principale
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute -right-2 -top-2 rounded-full bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => setAsPrimary(img.secure_url)}
                            className="absolute bottom-0 left-0 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded-tr rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Définir principale
                          </button>
                        )}
                      </div>
                    );})}
                    {filePreviews.map((preview, index) => {
                      const isPrimary = primaryImageUrl === preview;
                      return (
                      <div key={`${preview}-${index}`} className="relative group">
                        <button type="button" onClick={() => openImagePreview(preview)} className="block">
                          <Image
                            src={preview}
                            alt=""
                            width={96}
                            height={96}
                            className={`h-24 w-24 rounded-lg object-cover ${isPrimary ? 'ring-2 ring-primary' : ''}`}
                            unoptimized
                          />
                        </button>
                        {isPrimary && (
                          <span className="absolute top-0 left-0 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-br-lg rounded-tl-lg font-semibold">
                            Principale
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute -right-2 -top-2 rounded-full bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => setAsPrimary(preview)}
                            className="absolute bottom-0 left-0 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded-tr rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Définir principale
                          </button>
                        )}
                      </div>
                    );})}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <Label>Réductions</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Réduction (DA)"
                  value={currentReduction}
                  onChange={(e) => setCurrentReduction(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Quantité"
                  value={currentQuantite}
                  onChange={(e) => setCurrentQuantite(e.target.value)}
                />
              </div>
              <Button type="button" variant="outline" onClick={addReduction}>
                Ajouter une réduction
              </Button>
              {reductions.length > 0 && (
                <div className="space-y-2">
                  {reductions.map((item, index) => (
                    <div key={`${item.reduction}-${index}`} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                      <span>
                        {item.reduction} DA • Qté {item.quantite}
                      </span>
                      <button
                        type="button"
                        onClick={() => setReductions((prev) => prev.filter((_, i) => i !== index))}
                        className="text-red-500"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 border-t border-border pt-4">
              <Label>Variantes existantes</Label>
              {existingVariants.length === 0 && <p className="text-sm text-muted-foreground">Aucune variante enregistrée</p>}
              {existingVariants.map((variant) => {
                const hasValueDrafts = Object.keys(existingValueDrafts).some((k) =>
                  k.startsWith(`${variant._id}-`),
                );
                return (
                <div key={variant._id} className="rounded border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{variant.type.fr}</span>
                      <Checkbox
                        checked={variant.isActive ?? true}
                        onCheckedChange={() => toggleExistingVariantActive(variant._id as string)}
                      />
                      <Label className="text-xs text-muted-foreground">Actif</Label>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(variants.indexOf(variant))}>
                      Supprimer le variant
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {variant.array_value.map((value, valIdx) => {
                      const draftKey = `${variant._id}-${valIdx}`;
                      const draft = existingValueDrafts[draftKey];
                      const displayPrice = draft?.priceAdjustment ?? value.priceAdjustment ?? 0;
                      const displayActive = draft?.isActive ?? value.isActive ?? true;
                      return (
                      <div key={`${value.value}-${valIdx}`} className="flex items-center gap-2 rounded border px-3 py-1.5 text-sm">
                        <span className="min-w-[80px] font-medium">{value.value}</span>
                        <Input
                          type="number"
                          className="w-24 h-8 text-xs"
                          value={displayPrice}
                          onChange={(e) =>
                            editExistingVariantValue(variant._id as string, valIdx, "priceAdjustment", Number(e.target.value) || 0)
                          }
                        />
                        <span className="text-xs text-muted-foreground">DA</span>
                        <div className="flex items-center gap-1">
                          <Checkbox
                            checked={displayActive}
                            onCheckedChange={() => {
                              if (draft) {
                                editExistingVariantValue(variant._id as string, valIdx, "isActive", !draft.isActive);
                              } else {
                                editExistingVariantValue(variant._id as string, valIdx, "isActive", !(value.isActive ?? true));
                              }
                            }}
                          />
                          <Label className="text-xs">Actif</Label>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteSpecificValueFromExistingVariant(variant._id as string, valIdx)}
                          className="text-red-500 ml-auto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );})}
                  </div>
                  {hasValueDrafts && (
                    <Button type="button" size="sm" onClick={() => saveExistingVariantValues(variant._id as string)}>
                      Enregistrer les modifications
                    </Button>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Nouvelle valeur"
                      value={variantDrafts[variant._id as string]?.value || ""}
                      onChange={(e) => updateVariantDraft(variant._id as string, "value", e.target.value)}
                    />
                    <Input
                      placeholder="Ajustement"
                      type="number"
                      value={variantDrafts[variant._id as string]?.price || "0"}
                      onChange={(e) => updateVariantDraft(variant._id as string, "price", e.target.value)}
                    />
                    <Button type="button" variant="outline" onClick={() => addValueToExistingVariant(variant._id as string)}>
                      Ajouter
                    </Button>
                  </div>
                </div>
              );})}
            </div>

            <div className="space-y-4 border-t border-border pt-4">
              <Label>Ajouter une variante</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Type (FR)" value={variantTypeFr} onChange={(e) => setVariantTypeFr(e.target.value)} />
                <Input placeholder="Type (AR)" value={variantTypeAr} onChange={(e) => setVariantTypeAr(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input placeholder="Valeur" value={variantValueInput} onChange={(e) => setVariantValueInput(e.target.value)} />
                <Input
                  placeholder="Ajustement"
                  type="number"
                  value={variantPriceInput}
                  onChange={(e) => setVariantPriceInput(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={addVariantValue}>
                  Ajouter valeur
                </Button>
              </div>
              {variantValues.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {variantValues.map((value, index) => (
                    <div key={`${value.value}-${index}`} className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                      <span>
                        {value.value} (+{value.priceAdjustment || 0} DA)
                      </span>
                      <Checkbox
                        checked={value.isActive ?? true}
                        onCheckedChange={() => toggleNewValueActive(index)}
                      />
                      <button type="button" onClick={() => removeVariantValue(index)} className="text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Button type="button" onClick={addVariant}>
                Ajouter le variant
              </Button>
              {newVariants.length > 0 && (
                <div className="space-y-2">
                  {newVariants.map((variant, index) => (
                    <div key={`${variant.type.fr}-${index}`} className="rounded border p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{variant.type.fr}</span>
                          <Checkbox
                            checked={variant.isActive ?? true}
                            onCheckedChange={() => toggleNewVariantActive(index)}
                          />
                          <Label className="text-xs text-muted-foreground">Actif</Label>
                        </div>
                        <button type="button" onClick={() => removeVariant(variants.indexOf(variant))} className="text-red-500 text-sm">
                          Supprimer
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {variant.array_value.map((val, valIdx) => (
                          <div key={`${val.value}-${valIdx}`} className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                            <span>{val.value} (+{val.priceAdjustment || 0} DA)</span>
                            <Checkbox
                              checked={val.isActive ?? true}
                              onCheckedChange={() => toggleNewVariantValueActive(index, valIdx)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 border-t border-border pt-4">
              <Label>Couleurs existantes</Label>
              {existingColors.length === 0 && <p className="text-sm text-muted-foreground">Aucune couleur enregistrée</p>}
              {existingColors.map((color) => (
                <div key={color._id} className="flex items-center gap-4 rounded border p-3">
                  <Image
                    src={color.img.secure_url}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded object-cover"
                    unoptimized
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <p className="text-sm font-medium">{color.type}</p>
                    <Checkbox
                      checked={color.isActive ?? true}
                      onCheckedChange={() => toggleExistingColorActive(color._id as string)}
                    />
                    <Label className="text-xs text-muted-foreground">Actif</Label>
                  </div>
                  <Input
                    type="number"
                    className="w-28"
                    value={colorPriceDrafts[color._id as string] ?? String(color.priceAdjustment ?? 0)}
                    onChange={(e) => setColorPriceDrafts((prev) => ({ ...prev, [color._id as string]: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateExistingColorPrice(color._id as string, colorPriceDrafts[color._id as string] ?? String(color.priceAdjustment ?? 0))}
                  >
                    Mettre à jour
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => removeColor(colors.indexOf(color))}>
                    Supprimer
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-4 border-t border-border pt-4">
              <Label>Ajouter une couleur</Label>
              <div className="grid grid-cols-3 gap-3">
                <Input type="file" onChange={(e) => setColorFile(e.target.files?.[0] || null)} />
                <Input placeholder="Nom" value={colorName} onChange={(e) => setColorName(e.target.value)} />
                <Input
                  placeholder="Ajustement"
                  type="number"
                  value={colorPriceAdjustment}
                  onChange={(e) => setColorPriceAdjustment(e.target.value)}
                />
              </div>
              <Button type="button" variant="outline" onClick={addColor}>
                Ajouter la couleur
              </Button>
              {newColors.length > 0 && (
                <div className="space-y-2">
                  {newColors.map((color, index) => (
                    <div key={`${color.type}-${index}`} className="flex items-center justify-between rounded border p-3">
                      <div className="flex items-center gap-2">
                        <span>{color.type}</span>
                        <Checkbox
                          checked={color.isActive ?? true}
                          onCheckedChange={() => toggleNewColorActive(index)}
                        />
                        <Label className="text-xs text-muted-foreground">Actif</Label>
                      </div>
                      <button type="button" onClick={() => removeColor(colors.indexOf(color))} className="text-red-500">
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? "Enregistrement..." : editingProduct ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Aperçu de l'image</DialogTitle>
          {previewImageUrl && (
            <div className="relative aspect-square bg-muted cursor-zoom-in" onClick={() => setIsPreviewZoomed((v) => !v)}>
              <Image
                src={previewImageUrl}
                alt=""
                width={1200}
                height={1200}
                className={`w-full h-full object-cover transition-transform duration-300 ${
                  isPreviewZoomed ? "scale-150" : "scale-100"
                }`}
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
