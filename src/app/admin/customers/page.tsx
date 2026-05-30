"use client";

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminData, type Customer } from "@/contexts/AdminDataContext";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Eye,
  Heart,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminCustomersPage() {
  const { customers, orders, addCustomer, deleteCustomer, refreshOrders } = useAdminData();

  useEffect(() => {
    void refreshOrders({ page: 1, limit: 200 });
  }, [refreshOrders]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    wilaya: "",
    postalCode: "",
    notes: "",
  });

  const filteredCustomers = customers.filter((c) => {
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    );
  });

  const exportCSV = () => {
    const headers = ["Nom", "Prénom", "Email", "Téléphone", "Commandes", "Total dépensé", "Inscrit le"];
    const rows = customers.map((c) => [
      c.lastName,
      c.firstName,
      c.email,
      c.phone,
      c.totalOrders.toString(),
      `${c.totalSpent} DA`,
      new Date(c.createdAt).toLocaleDateString("fr-FR"),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clients_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success("Export réussi", { description: `${customers.length} clients exportés` });
  };

  const handleAddCustomer = () => {
    addCustomer({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      addresses: formData.street
        ? [
            {
              id: `ADDR-${Date.now()}`,
              type: "shipping",
              isDefault: true,
              street: formData.street,
              city: formData.city,
              wilaya: formData.wilaya,
              postalCode: formData.postalCode,
              country: "Algérie",
            },
          ]
        : [],
      totalOrders: 0,
      totalSpent: 0,
      wishlist: [],
      notes: formData.notes,
      tags: [],
    });

    setIsAddDialogOpen(false);
    setFormData({ firstName: "", lastName: "", email: "", phone: "", street: "", city: "", wilaya: "", postalCode: "", notes: "" });
    toast.success("Client ajouté");
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer ce client ?")) {
      deleteCustomer(id);
      toast.error("Client supprimé");
    }
  };

  const openDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailOpen(true);
  };

  const customerOrders = selectedCustomer ? orders.filter((o) => o.customerEmail === selectedCustomer.email) : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Clients</h1>
            <p className="text-muted-foreground mt-1">{customers.length} clients enregistrés</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Ajouter
            </Button>
          </div>
        </div>

        <Card className="border-border/50 bg-white dark:bg-slate-900">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email, téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-white dark:bg-slate-900 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Client</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">Téléphone</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Commandes</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Total dépensé</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden xl:table-cell">Inscrit le</th>
                    <th className="w-20 py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-medium text-primary">
                              {customer.firstName[0]}
                              {customer.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {customer.firstName} {customer.lastName}
                            </p>
                            {customer.tags.includes("VIP") && <Badge variant="secondary" className="text-xs">VIP</Badge>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">{customer.email}</td>
                      <td className="py-3 px-4 text-sm hidden lg:table-cell">{customer.phone}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline">{customer.totalOrders}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">{customer.totalSpent.toLocaleString()} DA</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground hidden xl:table-cell">
                        {new Date(customer.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900">
                            <DropdownMenuItem onClick={() => openDetail(customer)}>
                              <Eye className="w-4 h-4 mr-2" /> Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(customer.id)} className="text-red-600">
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
            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Aucun client trouvé</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom *</Label>
                <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <Separator />
            <p className="text-sm font-medium">Adresse (optionnel)</p>
            <div className="space-y-2">
              <Input placeholder="Rue" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Ville" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
              <Input placeholder="Wilaya" value={formData.wilaya} onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notes internes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddCustomer} disabled={!formData.firstName || !formData.lastName || !formData.email}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-bold text-primary text-lg">
                  {selectedCustomer?.firstName[0]}
                  {selectedCustomer?.lastName[0]}
                </span>
              </div>
              <div>
                <p>
                  {selectedCustomer?.firstName} {selectedCustomer?.lastName}
                </p>
                {selectedCustomer?.tags.includes("VIP") && <Badge variant="secondary">VIP</Badge>}
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedCustomer.phone || "Non renseigné"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <ShoppingBag className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{selectedCustomer.totalOrders}</p>
                      <p className="text-xs text-muted-foreground">Commandes</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{selectedCustomer.totalSpent.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">DA dépensés</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
                      <p className="text-2xl font-bold">{selectedCustomer.wishlist.length}</p>
                      <p className="text-xs text-muted-foreground">Favoris</p>
                    </CardContent>
                  </Card>
                </div>

                {selectedCustomer.addresses.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Adresses
                    </h4>
                    {selectedCustomer.addresses.map((addr) => (
                      <div key={addr.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                        <p>{addr.street}</p>
                        <p>
                          {addr.city}, {addr.wilaya} {addr.postalCode}
                        </p>
                        <p>{addr.country}</p>
                        {addr.isDefault && (
                          <Badge variant="outline" className="mt-1">
                            Par défaut
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" /> Historique des commandes
                  </h4>
                  {customerOrders.length > 0 ? (
                    <div className="space-y-2">
                      {customerOrders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-mono text-sm">{order.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{order.total.toLocaleString()} DA</p>
                            <Badge variant="outline" className="text-xs">
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground text-sm">Aucune commande</div>
                  )}
                </div>

                {selectedCustomer.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notes internes</h4>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">{selectedCustomer.notes}</div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
