"use client";

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminData } from "@/contexts/AdminDataContext";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Image as ImageIcon, Package, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Category } from "@/data/products";
import Image from "next/image";

export default function AdminCategoriesPage() {
  const { categories, products, addCategory, updateCategory, deleteCategory, refreshProducts } = useAdminData();

  useEffect(() => {
    void refreshProducts({ page: 1, limit: 200 });
  }, [refreshProducts]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", nameAr: "", imgUrl: "" });

  const getProductCount = (categoryName: string) => {
    return products.filter((p) => p.category === categoryName).length;
  };

  const openAddDialog = () => {
    setEditingCategory(null);
    setFormData({ name: "", nameAr: "", imgUrl: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, nameAr: category.name_ar, imgUrl: category.img_url });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Erreur", { description: "Le nom de la catégorie est requis" });
      return;
    }

    const categoryData = {
      name: formData.name,
      name_ar: formData.nameAr,
      img_url: formData.imgUrl || "/placeholder.svg",
    };

    if (editingCategory) {
      updateCategory(editingCategory.name_search, categoryData);
      toast.success("Catégorie modifiée", { description: "La catégorie a été mise à jour avec succès" });
    } else {
      addCategory(categoryData);
      toast.success("Catégorie ajoutée", { description: "La nouvelle catégorie a été créée avec succès" });
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (nameSearch: string, categoryName: string) => {
    const productCount = getProductCount(categoryName);
    if (productCount > 0) {
      toast.error("Suppression impossible", {
        description: `Cette catégorie contient ${productCount} produit(s). Déplacez-les d'abord.`,
      });
      return;
    }

    if (confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
      deleteCategory(nameSearch);
      toast.error("Catégorie supprimée", { description: "La catégorie a été supprimée avec succès" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Catégories</h1>
            <p className="text-muted-foreground mt-1">{categories.length} catégories</p>
          </div>
          <Button onClick={openAddDialog} className="gap-2">
            <Plus className="w-4 h-4" />
            Ajouter une catégorie
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const productCount = getProductCount(category.name);
            return (
              <Card
                key={category.name_search}
                className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden hover:shadow-lg transition-all duration-300 group"
              >
                <div className="aspect-video relative overflow-hidden bg-muted">
                  <Image
                    src={category.img_url}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-display text-xl font-bold text-white">{category.name}</h3>
                    <p className="text-white/80 text-sm" dir="rtl">
                      {category.name_ar}
                    </p>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="w-4 h-4" />
                      <span>{productCount} produit{productCount > 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEditDialog(category)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.name_search, category.name)}
                        className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <Tags className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Aucune catégorie trouvée</p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Modifier la catégorie" : "Ajouter une catégorie"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom (Français)</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nom de la catégorie" />
            </div>
            <div className="space-y-2">
              <Label>Nom (Arabe)</Label>
              <Input value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} placeholder="اسم الفئة" dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label>URL de l'image</Label>
              <div className="flex gap-2">
                <Input value={formData.imgUrl} onChange={(e) => setFormData({ ...formData, imgUrl: e.target.value })} placeholder="https://example.com/image.jpg" />
                <div className="w-12 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {formData.imgUrl ? <Image src={formData.imgUrl} alt="Preview" fill className="object-cover" sizes="48px" /> : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>{editingCategory ? "Enregistrer" : "Ajouter"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
