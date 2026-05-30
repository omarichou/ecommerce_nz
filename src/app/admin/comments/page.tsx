"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CommentProduct {
  _id: string;
  title?: { fr?: string; ar?: string };
  array_ProductImg?: { secure_url?: string }[];
  categorie?: string;
  price?: number;
}

interface CommentItem {
  _id: string;
  name?: string;
  email?: string;
  avis?: string;
  createdAt?: string;
  id_product?: CommentProduct | null;
}

interface CommentGroup {
  productId?: string;
  product?: CommentProduct | null;
  comments: CommentItem[];
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [groups, setGroups] = useState<CommentGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadComments = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/admin/get_comments?page=${page}&limit=${pageSize}&search=${encodeURIComponent(searchQuery)}`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error("load");
        const data = await response.json();
        if (!isMounted) return;
        setComments(data.comments || []);
        setGroups(data.groups || []);
        setTotal(data.pagination?.totalComments || 0);
      } catch (error) {
        console.error(error);
        toast.error("Erreur", { description: "Impossible de charger les commentaires" });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void loadComments();
    return () => {
      isMounted = false;
    };
  }, [page, pageSize, searchQuery]);

  const totalPages = useMemo(() => (pageSize > 0 ? Math.max(Math.ceil(total / pageSize), 1) : 1), [total, pageSize]);

  const handleDelete = async (commentId: string) => {
    if (!confirm("Supprimer ce commentaire ?")) return;
    try {
      const response = await fetch("/api/admin/delete_Commentaire", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: commentId }),
      });
      if (!response.ok) throw new Error("delete");
      setComments((prev) => prev.filter((item) => item._id !== commentId));
      setGroups((prev) =>
        prev
          .map((group) => ({ ...group, comments: group.comments.filter((item) => item._id !== commentId) }))
          .filter((group) => group.comments.length > 0),
      );
      setTotal((prev) => Math.max(prev - 1, 0));
      toast.success("Commentaire supprimé");
    } catch (error) {
      console.error(error);
      toast.error("Erreur", { description: "Suppression impossible" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Commentaires</h1>
            <p className="text-muted-foreground mt-1">{total} commentaire(s) au total</p>
          </div>
        </div>

        <Card className="border-border/50 bg-white dark:bg-slate-900">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou avis..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {groups.map((group) => {
            const product = group.product;
            const imageUrl = product?.array_ProductImg?.[0]?.secure_url;
            const productTitle = product?.title?.fr || product?.title?.ar || "Produit";
            return (
              <Card key={product?._id || group.productId || "deleted"} className="border-border/50 bg-white dark:bg-slate-900">
                <CardContent className="p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden">
                        {imageUrl ? (
                          <Image src={imageUrl} alt={productTitle} width={48} height={48} className="object-cover" />
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{productTitle}</p>
                        {product && (product.categorie || typeof product.price === "number") && (
                          <p className="text-xs text-muted-foreground">
                            {product.categorie ? product.categorie : ""}
                            {product.categorie && typeof product.price === "number" ? " • " : ""}
                            {typeof product.price === "number" ? `${product.price} DA` : ""}
                          </p>
                        )}
                        {!product && <Badge variant="secondary">Produit supprimé</Badge>}
                      </div>
                    </div>
                    <Badge variant="secondary">{group.comments.length} commentaire(s)</Badge>
                  </div>

                  <div className="divide-y divide-border">
                    {group.comments.map((comment) => (
                      <div key={comment._id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{comment.name || "-"}</p>
                            <p className="text-xs text-muted-foreground">{comment.email || "-"}</p>
                            <Badge variant="outline" className="text-xs">
                              {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString("fr-FR") : "-"}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground">{comment.avis || "-"}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(comment._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {!isLoading && comments.length === 0 && (
            <Card className="border-border/50 bg-white dark:bg-slate-900">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">Aucun commentaire trouvé.</CardContent>
            </Card>
          )}

          {isLoading && (
            <Card className="border-border/50 bg-white dark:bg-slate-900">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">Chargement...</CardContent>
            </Card>
          )}
        </div>

        <div className="text-sm text-muted-foreground">Total: {total} commentaire(s)</div>
      </div>
    </AdminLayout>
  );
}
