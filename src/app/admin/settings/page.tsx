"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminData } from "@/contexts/AdminDataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Globe, Mail, MapPin, Phone, Plus, Receipt, Save, Store, Truck, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const { settings, updateSettings } = useAdminData();

  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [isMinPriceLoading, setIsMinPriceLoading] = useState(false);

  const handleSave = () => {
    updateSettings(localSettings);
    setHasChanges(false);
    toast.success("Paramètres enregistrés");
  };

  const updateLocal = (updates: Partial<typeof settings>) => {
    setLocalSettings((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const addShippingZone = () => {
    updateLocal({
      shippingZones: [...localSettings.shippingZones, { name: "Nouvelle zone", regions: [], cost: 0, deliveryDays: "3-5 jours" }],
    });
  };

  const removeShippingZone = (index: number) => {
    updateLocal({
      shippingZones: localSettings.shippingZones.filter((_, i) => i !== index),
    });
  };

  const updateShippingZone = (index: number, updates: Partial<(typeof settings)["shippingZones"][0]>) => {
    const zones = [...localSettings.shippingZones];
    zones[index] = { ...zones[index], ...updates };
    updateLocal({ shippingZones: zones });
  };

  const togglePaymentMethod = (id: string) => {
    const methods = localSettings.paymentMethods.map((method) =>
      method.id === id ? { ...method, enabled: !method.enabled } : method,
    );
    updateLocal({ paymentMethods: methods });
  };

  const addTaxRate = () => {
    updateLocal({
      taxRates: [...localSettings.taxRates, { name: "Nouveau taux", rate: 19, categories: [] }],
    });
  };

  const removeTaxRate = (index: number) => {
    updateLocal({
      taxRates: localSettings.taxRates.filter((_, i) => i !== index),
    });
  };

  const updateTaxRate = (index: number, updates: Partial<(typeof settings)["taxRates"][0]>) => {
    const rates = [...localSettings.taxRates];
    rates[index] = { ...rates[index], ...updates };
    updateLocal({ taxRates: rates });
  };

  const fetchMinPrice = async () => {
    try {
      setIsMinPriceLoading(true);
      const res = await fetch("/api/admin/get_min_price", { cache: "no-store" });
      if (!res.ok) throw new Error("fetch");
      const data = await res.json();
      setMinPrice(data?.price_min ?? "");
    } catch (error) {
      toast.error("Impossible de charger le prix minimum");
    } finally {
      setIsMinPriceLoading(false);
    }
  };

  const updateMinPrice = async () => {
    try {
      setIsMinPriceLoading(true);
      const res = await fetch("/api/admin/update_min_price", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price_minimum: Number(minPrice) || 0 }),
      });
      if (!res.ok) throw new Error("update");
      toast.success("Prix minimum mis à jour");
    } catch (error) {
      toast.error("Impossible de mettre à jour le prix minimum");
    } finally {
      setIsMinPriceLoading(false);
    }
  };

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    void fetchMinPrice();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Paramètres</h1>
            <p className="text-muted-foreground mt-1">Configuration de la boutique</p>
          </div>
          {hasChanges && (
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Enregistrer les modifications
            </Button>
          )}
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          {/* <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="gap-2">
              <Store className="w-4 h-4" /> Général
            </TabsTrigger>
            <TabsTrigger value="shipping" className="gap-2">
              <Truck className="w-4 h-4" /> Livraison
            </TabsTrigger>
            <TabsTrigger value="payment" className="gap-2">
              <CreditCard className="w-4 h-4" /> Paiement
            </TabsTrigger>
            <TabsTrigger value="taxes" className="gap-2">
              <Receipt className="w-4 h-4" /> Taxes
            </TabsTrigger>
          </TabsList> */}

          <TabsContent value="general" className="space-y-6">
            {/* <Card className="bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" /> Informations de la boutique
                </CardTitle>
                <CardDescription>Informations générales affichées sur votre site</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom de la boutique</Label>
                    <Input value={localSettings.storeName} onChange={(e) => updateLocal({ storeName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Devise</Label>
                    <Select value={localSettings.currency} onValueChange={(v) => updateLocal({ currency: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DZD">Dinar algérien (DZD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        <SelectItem value="USD">Dollar américain (USD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email
                    </Label>
                    <Input type="email" value={localSettings.email} onChange={(e) => updateLocal({ email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Téléphone
                    </Label>
                    <Input value={localSettings.phone} onChange={(e) => updateLocal({ phone: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Adresse
                  </Label>
                  <Input value={localSettings.address} onChange={(e) => updateLocal({ address: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Fuseau horaire
                  </Label>
                  <Select value={localSettings.timezone} onValueChange={(v) => updateLocal({ timezone: v })}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Algiers">Africa/Algiers (GMT+1)</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris (GMT+1/+2)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card> */}

            <Card className="bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle>Prix minimum</CardTitle>
                <CardDescription>Montant minimum pour valider une commande</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-48"
                />
                <Button onClick={updateMinPrice} disabled={isMinPriceLoading}>
                  {isMinPriceLoading ? "Mise à jour..." : "Mettre à jour"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping" className="space-y-6">
            <Card className="bg-white dark:bg-slate-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-5 h-5" /> Zones de livraison
                    </CardTitle>
                    <CardDescription>Configurez les tarifs par zone géographique</CardDescription>
                  </div>
                  <Button onClick={addShippingZone} size="sm" className="gap-1">
                    <Plus className="w-4 h-4" /> Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {localSettings.shippingZones.map((zone, index) => (
                  <Card key={`${zone.name}-${index}`} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs">Nom de la zone</Label>
                            <Input value={zone.name} onChange={(e) => updateShippingZone(index, { name: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Régions (séparées par virgules)</Label>
                            <Input
                              value={zone.regions.join(", ")}
                              onChange={(e) =>
                                updateShippingZone(index, { regions: e.target.value.split(",").map((s) => s.trim()) })
                              }
                              placeholder="Alger, Blida, Tipaza"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Frais (DA)</Label>
                            <Input
                              type="number"
                              value={zone.cost}
                              onChange={(e) => updateShippingZone(index, { cost: parseInt(e.target.value, 10) || 0 })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Délai</Label>
                            <Input
                              value={zone.deliveryDays}
                              onChange={(e) => updateShippingZone(index, { deliveryDays: e.target.value })}
                              placeholder="2-3 jours"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 mt-5"
                          onClick={() => removeShippingZone(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {zone.freeAbove && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Livraison gratuite au-dessus de {zone.freeAbove.toLocaleString()} DA
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {localSettings.shippingZones.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">Aucune zone de livraison configurée</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <Card className="bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" /> Méthodes de paiement
                </CardTitle>
                <CardDescription>Activez les méthodes de paiement acceptées</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {localSettings.paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{method.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {method.id === "cod" && "Le client paie à la réception"}
                          {method.id === "cib" && "Paiement par carte bancaire"}
                        </p>
                      </div>
                    </div>
                    <Switch checked={method.enabled} onCheckedChange={() => togglePaymentMethod(method.id)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="taxes" className="space-y-6">
            <Card className="bg-white dark:bg-slate-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-5 h-5" /> Taux de TVA
                    </CardTitle>
                    <CardDescription>Configurez les taux de taxe par catégorie</CardDescription>
                  </div>
                  <Button onClick={addTaxRate} size="sm" className="gap-1">
                    <Plus className="w-4 h-4" /> Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {localSettings.taxRates.map((tax, index) => (
                  <Card key={`${tax.name}-${index}`} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 grid grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs">Nom</Label>
                            <Input value={tax.name} onChange={(e) => updateTaxRate(index, { name: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Taux (%)</Label>
                            <Input
                              type="number"
                              value={tax.rate}
                              onChange={(e) => updateTaxRate(index, { rate: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Catégories (optionnel)</Label>
                            <Input
                              value={tax.categories.join(", ")}
                              onChange={(e) =>
                                updateTaxRate(index, {
                                  categories: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                                })
                              }
                              placeholder="Toutes les catégories"
                            />
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => removeTaxRate(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {localSettings.taxRates.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">Aucun taux de TVA configuré</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
