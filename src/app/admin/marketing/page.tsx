"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminData, type PromoCode } from "@/contexts/AdminDataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Copy, Download, Mail, Megaphone, MoreVertical, Pencil, Percent, Plus, Power, Tag, Trash2, Truck, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function AdminMarketingPage() {
  const {
    promoCodes,
    subscribers,
    addPromoCode,
    updatePromoCode,
    deletePromoCode,
    removeSubscriber,
    exportSubscribers,
    refreshPromoCodes,
    refreshSubscribers,
  } = useAdminData();

  const [isLoading, setIsLoading] = useState(false);

  const [isPromoDialogOpen, setIsPromoDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignMessage, setCampaignMessage] = useState("");
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);

  const [promoForm, setPromoForm] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed" | "free_shipping",
    value: "",
    minOrderAmount: "",
    maxUses: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    applicableCategories: [] as string[],
    active: true,
  });

  const activePromos = promoCodes.filter((p) => p.active).length;
  const totalUsage = promoCodes.reduce((sum, p) => sum + p.usedCount, 0);
  const activeSubscribers = subscribers.filter((s) => s.active).length;

  useEffect(() => {
    let isMounted = true;
    const loadMarketing = async () => {
      setIsLoading(true);
      await Promise.all([refreshPromoCodes(), refreshSubscribers()]);
      if (isMounted) setIsLoading(false);
    };
    void loadMarketing();
    return () => {
      isMounted = false;
    };
  }, [refreshPromoCodes, refreshSubscribers]);

  const openPromoDialog = (promo?: PromoCode) => {
    if (promo) {
      setEditingPromo(promo);
      setPromoForm({
        code: promo.code,
        type: promo.type,
        value: promo.value.toString(),
        minOrderAmount: promo.minOrderAmount.toString(),
        maxUses: promo.maxUses.toString(),
        startDate: promo.startDate.split("T")[0],
        endDate: promo.endDate.split("T")[0],
        applicableCategories: promo.applicableCategories,
        active: promo.active,
      });
    } else {
      setEditingPromo(null);
      setPromoForm({
        code: "",
        type: "percentage",
        value: "",
        minOrderAmount: "",
        maxUses: "",
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
        applicableCategories: [],
        active: true,
      });
    }
    setIsPromoDialogOpen(true);
  };

  const handleSavePromo = () => {
    const data = {
      code: promoForm.code.toUpperCase(),
      type: promoForm.type,
      value: parseFloat(promoForm.value) || 0,
      minOrderAmount: parseFloat(promoForm.minOrderAmount) || 0,
      maxUses: parseInt(promoForm.maxUses, 10) || 100,
      applicableCategories: promoForm.applicableCategories,
      applicableProducts: [],
      startDate: new Date(promoForm.startDate).toISOString(),
      endDate: new Date(promoForm.endDate).toISOString(),
      active: promoForm.active,
    };

    if (editingPromo) {
      updatePromoCode(editingPromo.id, data);
      toast.success("Code promo modifié");
    } else {
      addPromoCode(data);
      toast.success("Code promo créé");
    }
    setIsPromoDialogOpen(false);
  };

  const handleDeletePromo = (id: string) => {
    if (confirm("Supprimer ce code promo ?")) {
      deletePromoCode(id);
      toast.error("Code promo supprimé");
    }
  };

  const togglePromoStatus = (id: string, active: boolean) => {
    updatePromoCode(id, { active });
    toast.success(active ? "Code activé" : "Code désactivé");
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copié");
  };

  const handleExportSubscribers = () => {
    const csv = exportSubscribers();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `newsletter_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Export réussi", { description: `${activeSubscribers} abonnés exportés` });
  };

  const handleSendCampaign = async () => {
    if (!campaignSubject.trim() || !campaignMessage.trim()) {
      toast.error("Sujet et message requis");
      return;
    }

    try {
      setIsSendingCampaign(true);
      const response = await fetch("/api/admin/send_campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: campaignSubject, message: campaignMessage }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Erreur envoi campagne");
      }
      toast.success("Campagne envoyée", { description: `${data.sent} envoyés • ${data.failed} échecs` });
      setCampaignSubject("");
      setCampaignMessage("");
    } catch (error) {
      console.error(error);
      toast.error("Erreur", { description: "Impossible d'envoyer la campagne" });
    } finally {
      setIsSendingCampaign(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "percentage":
        return <Percent className="w-4 h-4" />;
      case "fixed":
        return <Tag className="w-4 h-4" />;
      case "free_shipping":
        return <Truck className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Marketing</h1>
            <p className="text-muted-foreground mt-1">Codes promo et newsletter</p>
          </div>
        </div>
        {isLoading && <p className="text-sm text-muted-foreground">Chargement des données marketing...</p>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Codes actifs</p>
                  <p className="text-2xl font-bold">{activePromos}</p>
                </div>
                <Tag className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total utilisations</p>
                  <p className="text-2xl font-bold">{totalUsage}</p>
                </div>
                <Megaphone className="w-8 h-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Abonnés newsletter</p>
                  <p className="text-2xl font-bold">{activeSubscribers}</p>
                </div>
                <Mail className="w-8 h-8 text-emerald-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total abonnés</p>
                  <p className="text-2xl font-bold">{subscribers.length}</p>
                </div>
                <Users className="w-8 h-8 text-violet-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="promos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="promos">Codes promo</TabsTrigger>
            <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
            <TabsTrigger value="campagnes">Campagnes</TabsTrigger>
          </TabsList>

          <TabsContent value="promos" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => openPromoDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Créer un code
              </Button>
            </div>

            <div className="grid gap-4">
              {promoCodes.map((promo) => {
                const isExpired = new Date(promo.endDate) < new Date();
                const isExhausted = promo.usedCount >= promo.maxUses;

                return (
                  <Card key={promo.id} className={`bg-white dark:bg-slate-900 ${!promo.active || isExpired ? "opacity-60" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              promo.type === "percentage"
                                ? "bg-primary/10 text-primary"
                                : promo.type === "fixed"
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-emerald-100 text-emerald-600"
                            }`}
                          >
                            {getTypeIcon(promo.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-mono font-bold text-lg">{promo.code}</p>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyCode(promo.code)}>
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>
                                {promo.type === "percentage" && `${promo.value}% de réduction`}
                                {promo.type === "fixed" && `${promo.value} DA de réduction`}
                                {promo.type === "free_shipping" && "Livraison gratuite"}
                              </span>
                              {promo.minOrderAmount > 0 && <span>• Min. {promo.minOrderAmount.toLocaleString()} DA</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-lg font-bold">
                              {promo.usedCount}/{promo.maxUses}
                            </p>
                            <p className="text-xs text-muted-foreground">Utilisations</p>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(promo.startDate), "dd MMM", { locale: fr })} -
                              {format(new Date(promo.endDate), "dd MMM yyyy", { locale: fr })}
                            </div>
                            <div className="flex gap-1">
                              {isExpired && <Badge variant="secondary">Expiré</Badge>}
                              {isExhausted && <Badge variant="secondary">Épuisé</Badge>}
                              {!isExpired && !isExhausted && promo.active && (
                                <Badge className="bg-emerald-100 text-emerald-700">Actif</Badge>
                              )}
                              {!promo.active && <Badge variant="outline">Désactivé</Badge>}
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900">
                              <DropdownMenuItem onClick={() => openPromoDialog(promo)}>
                                <Pencil className="w-4 h-4 mr-2" /> Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => togglePromoStatus(promo.id, !promo.active)}>
                                <Power className="w-4 h-4 mr-2" /> {promo.active ? "Désactiver" : "Activer"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeletePromo(promo.id)} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {promoCodes.length === 0 && (
                <Card className="bg-white dark:bg-slate-900">
                  <CardContent className="py-12 text-center">
                    <Tag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Aucun code promo</p>
                    <Button onClick={() => openPromoDialog()} className="mt-4">
                      Créer votre premier code
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="newsletter" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleExportSubscribers} className="gap-2">
                <Download className="w-4 h-4" />
                Exporter les emails
              </Button>
            </div>

            <Card className="bg-white dark:bg-slate-900 overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Email</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Prénom</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">Inscrit le</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Statut</th>
                        <th className="w-20 py-3 px-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((sub) => (
                        <tr key={sub.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span>{sub.email}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">{sub.firstName || "-"}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground hidden lg:table-cell">
                            {format(new Date(sub.subscribedAt), "dd/MM/yyyy", { locale: fr })}
                          </td>
                          <td className="py-3 px-4">
                            {sub.active ? (
                              <Badge className="bg-emerald-100 text-emerald-700">Actif</Badge>
                            ) : (
                              <Badge variant="secondary">Désabonné</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                              onClick={() => removeSubscriber(sub.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {subscribers.length === 0 && (
                  <div className="py-12 text-center">
                    <Mail className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Aucun abonné</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campagnes" className="space-y-4">
            <Card className="bg-white dark:bg-slate-900">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h4 className="text-lg font-semibold">Envoyer une campagne</h4>
                  <p className="text-sm text-muted-foreground">Email envoyé à tous les abonnés vérifiés et actifs.</p>
                </div>
                <div className="space-y-2">
                  <Label>Sujet</Label>
                  <Input
                    value={campaignSubject}
                    onChange={(e) => setCampaignSubject(e.target.value)}
                    placeholder="Ex: Nouvelle collection disponible"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <textarea
                    value={campaignMessage}
                    onChange={(e) => setCampaignMessage(e.target.value)}
                    className="min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Écrivez votre message..."
                  />
                </div>
                <Button onClick={handleSendCampaign} disabled={isSendingCampaign} className="gap-2">
                  <Mail className="w-4 h-4" />
                  {isSendingCampaign ? "Envoi..." : "Envoyer la campagne"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isPromoDialogOpen} onOpenChange={setIsPromoDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPromo ? "Modifier le code promo" : "Créer un code promo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input
                value={promoForm.code}
                onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                placeholder="Ex: PROMO20"
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de réduction</Label>
                <Select value={promoForm.type} onValueChange={(v) => setPromoForm({ ...promoForm, type: v as PromoCode["type"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                    <SelectItem value="fixed">Montant fixe (DA)</SelectItem>
                    <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valeur {promoForm.type === "percentage" ? "(%)" : promoForm.type === "fixed" ? "(DA)" : ""}</Label>
                <Input
                  type="number"
                  value={promoForm.value}
                  onChange={(e) => setPromoForm({ ...promoForm, value: e.target.value })}
                  disabled={promoForm.type === "free_shipping"}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Montant minimum (DA)</Label>
                <Input
                  type="number"
                  value={promoForm.minOrderAmount}
                  onChange={(e) => setPromoForm({ ...promoForm, minOrderAmount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Limite d&apos;utilisations</Label>
                <Input
                  type="number"
                  value={promoForm.maxUses}
                  onChange={(e) => setPromoForm({ ...promoForm, maxUses: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input type="date" value={promoForm.startDate} onChange={(e) => setPromoForm({ ...promoForm, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Input type="date" value={promoForm.endDate} onChange={(e) => setPromoForm({ ...promoForm, endDate: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Code actif</Label>
              <Switch checked={promoForm.active} onCheckedChange={(c) => setPromoForm({ ...promoForm, active: c })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromoDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSavePromo} disabled={!promoForm.code}>
              {editingPromo ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
