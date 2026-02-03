import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Ticket, Gift, CreditCard, Edit2, Trash2, 
  Check, X, Clock, Eye, DollarSign, Percent, Calendar
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type LoyaltyCoupon = {
  id: number;
  code: string;
  discountType: string;
  discountValue: string;
  minPurchase: string | null;
  maxDiscount: string | null;
  usageLimit: number | null;
  perClientLimit: number | null;
  usageCount: number | null;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
  createdAt: string;
};

type LoyaltyOffer = {
  id: number;
  title: string;
  description: string | null;
  discountType: string;
  discountValue: string;
  imageUrl: string | null;
  validFrom: string | null;
  validTo: string | null;
  showInPortal: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
};

type PaymentRequest = {
  id: number;
  clientId: number;
  amount: string;
  paymentMethod: string;
  referenceNumber: string | null;
  proofImageUrl: string | null;
  notes: string | null;
  status: string;
  processedBy: string | null;
  processedAt: string | null;
  createdAt: string;
  client: {
    id: number;
    name: string;
    taxId: string | null;
    phone: string | null;
  };
};

export default function LoyaltyAdmin() {
  const { toast } = useToast();
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<LoyaltyCoupon | null>(null);
  const [editingOffer, setEditingOffer] = useState<LoyaltyOffer | null>(null);

  const [couponForm, setCouponForm] = useState({
    code: "",
    name: "",
    discountType: "percentage",
    discountValue: "",
    minPurchase: "",
    maxDiscount: "",
    usageLimit: "",
    perClientLimit: "",
    validFrom: "",
    validTo: "",
    isActive: true
  });

  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    imageUrl: "",
    validFrom: "",
    validTo: "",
    showInPortal: true,
    displayOrder: 0,
    isActive: true
  });

  const { data: coupons = [], isLoading: loadingCoupons } = useQuery<LoyaltyCoupon[]>({
    queryKey: ["/api/loyalty-coupons"]
  });

  const { data: offers = [], isLoading: loadingOffers } = useQuery<LoyaltyOffer[]>({
    queryKey: ["/api/loyalty-offers"]
  });

  const { data: paymentRequests = [], isLoading: loadingRequests } = useQuery<PaymentRequest[]>({
    queryKey: ["/api/payment-requests"]
  });

  const couponMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingCoupon) {
        const res = await apiRequest("PUT", `/api/loyalty-coupons/${editingCoupon.id}`, data);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/loyalty-coupons", data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty-coupons"] });
      setCouponDialogOpen(false);
      resetCouponForm();
      toast({ title: editingCoupon ? "Cupón actualizado" : "Cupón creado" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo guardar el cupón", variant: "destructive" });
    }
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/loyalty-coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty-coupons"] });
      toast({ title: "Cupón eliminado" });
    }
  });

  const offerMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingOffer) {
        const res = await apiRequest("PUT", `/api/loyalty-offers/${editingOffer.id}`, data);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/loyalty-offers", data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty-offers"] });
      setOfferDialogOpen(false);
      resetOfferForm();
      toast({ title: editingOffer ? "Oferta actualizada" : "Oferta creada" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo guardar la oferta", variant: "destructive" });
    }
  });

  const deleteOfferMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/loyalty-offers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty-offers"] });
      toast({ title: "Oferta eliminada" });
    }
  });

  const processPaymentMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const res = await apiRequest("PUT", `/api/payment-requests/${id}/process`, { status, notes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-requests"] });
      toast({ title: "Solicitud procesada" });
    }
  });

  const resetCouponForm = () => {
    setCouponForm({
      code: "",
      name: "",
      discountType: "percentage",
      discountValue: "",
      minPurchase: "",
      maxDiscount: "",
      usageLimit: "",
      perClientLimit: "",
      validFrom: "",
      validTo: "",
      isActive: true
    });
    setEditingCoupon(null);
  };

  const resetOfferForm = () => {
    setOfferForm({
      title: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      imageUrl: "",
      validFrom: "",
      validTo: "",
      showInPortal: true,
      displayOrder: 0,
      isActive: true
    });
    setEditingOffer(null);
  };

  const openEditCoupon = (coupon: LoyaltyCoupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      name: coupon.name || "",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchase: coupon.minPurchase || "",
      maxDiscount: coupon.maxDiscount || "",
      usageLimit: coupon.usageLimit?.toString() || "",
      perClientLimit: coupon.perClientLimit?.toString() || "",
      validFrom: coupon.validFrom ? coupon.validFrom.split("T")[0] : "",
      validTo: coupon.validTo ? coupon.validTo.split("T")[0] : "",
      isActive: coupon.isActive
    });
    setCouponDialogOpen(true);
  };

  const openEditOffer = (offer: LoyaltyOffer) => {
    setEditingOffer(offer);
    setOfferForm({
      title: offer.title,
      description: offer.description || "",
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      imageUrl: offer.imageUrl || "",
      validFrom: offer.validFrom ? offer.validFrom.split("T")[0] : "",
      validTo: offer.validTo ? offer.validTo.split("T")[0] : "",
      showInPortal: offer.showInPortal,
      displayOrder: offer.displayOrder,
      isActive: offer.isActive
    });
    setOfferDialogOpen(true);
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    couponMutation.mutate({
      code: couponForm.code.toUpperCase(),
      name: couponForm.name || couponForm.code.toUpperCase(),
      discountType: couponForm.discountType,
      discountValue: couponForm.discountValue,
      minPurchaseAmount: couponForm.minPurchase || null,
      maxDiscountAmount: couponForm.maxDiscount || null,
      usageLimit: couponForm.usageLimit ? parseInt(couponForm.usageLimit) : null,
      perClientLimit: couponForm.perClientLimit ? parseInt(couponForm.perClientLimit) : null,
      validFrom: couponForm.validFrom || null,
      validTo: couponForm.validTo || null,
      isActive: couponForm.isActive
    });
  };

  const handleSaveOffer = (e: React.FormEvent) => {
    e.preventDefault();
    offerMutation.mutate({
      title: offerForm.title,
      description: offerForm.description || null,
      discountType: offerForm.discountType,
      discountValue: offerForm.discountValue,
      imageUrl: offerForm.imageUrl || null,
      validFrom: offerForm.validFrom || null,
      validTo: offerForm.validTo || null,
      showInPortal: offerForm.showInPortal,
      displayOrder: offerForm.displayOrder,
      isActive: offerForm.isActive
    });
  };

  const pendingRequests = paymentRequests.filter(r => r.status === "pending");

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Administración de Fidelización</h1>
            <p className="text-muted-foreground">Gestionar cupones, ofertas y solicitudes de pago</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                Cupones Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {coupons.filter(c => c.isActive).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Ofertas Activas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {offers.filter(o => o.isActive).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Pagos Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {pendingRequests.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="coupons" className="space-y-4">
          <TabsList>
            <TabsTrigger value="coupons" data-testid="tab-coupons">
              <Ticket className="w-4 h-4 mr-2" />
              Cupones
            </TabsTrigger>
            <TabsTrigger value="offers" data-testid="tab-offers">
              <Gift className="w-4 h-4 mr-2" />
              Ofertas
            </TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">
              <CreditCard className="w-4 h-4 mr-2" />
              Solicitudes de Pago
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coupons">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Cupones de Descuento</CardTitle>
                  <CardDescription>Crear y gestionar cupones promocionales</CardDescription>
                </div>
                <Dialog open={couponDialogOpen} onOpenChange={(open) => {
                  setCouponDialogOpen(open);
                  if (!open) resetCouponForm();
                }}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-new-coupon">
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Cupón
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingCoupon ? "Editar Cupón" : "Nuevo Cupón"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveCoupon} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Código</Label>
                          <Input
                            data-testid="input-coupon-code"
                            value={couponForm.code}
                            onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                            placeholder="VERANO2024"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Nombre</Label>
                          <Input
                            data-testid="input-coupon-name"
                            value={couponForm.name}
                            onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })}
                            placeholder="Descuento de verano"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo de descuento</Label>
                          <Select
                            value={couponForm.discountType}
                            onValueChange={(v) => setCouponForm({ ...couponForm, discountType: v })}
                          >
                            <SelectTrigger data-testid="select-discount-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Porcentaje</SelectItem>
                              <SelectItem value="fixed">Monto fijo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Valor</Label>
                          <Input
                            data-testid="input-discount-value"
                            type="number"
                            step="0.01"
                            value={couponForm.discountValue}
                            onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                            placeholder={couponForm.discountType === "percentage" ? "10" : "1000"}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Compra mínima</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={couponForm.minPurchase}
                            onChange={(e) => setCouponForm({ ...couponForm, minPurchase: e.target.value })}
                            placeholder="Opcional"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Descuento máximo</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={couponForm.maxDiscount}
                            onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value })}
                            placeholder="Opcional"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Usos totales</Label>
                          <Input
                            type="number"
                            value={couponForm.usageLimit}
                            onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
                            placeholder="Ilimitado"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Usos por cliente</Label>
                          <Input
                            type="number"
                            value={couponForm.perClientLimit}
                            onChange={(e) => setCouponForm({ ...couponForm, perClientLimit: e.target.value })}
                            placeholder="Ilimitado"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Válido desde</Label>
                          <Input
                            type="date"
                            value={couponForm.validFrom}
                            onChange={(e) => setCouponForm({ ...couponForm, validFrom: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Válido hasta</Label>
                          <Input
                            type="date"
                            value={couponForm.validTo}
                            onChange={(e) => setCouponForm({ ...couponForm, validTo: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={couponForm.isActive}
                          onCheckedChange={(v) => setCouponForm({ ...couponForm, isActive: v })}
                        />
                        <Label>Activo</Label>
                      </div>

                      <DialogFooter>
                        <Button type="submit" disabled={couponMutation.isPending} data-testid="button-save-coupon">
                          {couponMutation.isPending ? "Guardando..." : "Guardar"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingCoupons ? (
                  <p className="text-center py-8 text-muted-foreground">Cargando...</p>
                ) : coupons.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No hay cupones creados</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descuento</TableHead>
                        <TableHead>Usos</TableHead>
                        <TableHead>Vigencia</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coupons.map((coupon) => (
                        <TableRow key={coupon.id}>
                          <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                          <TableCell>
                            {coupon.discountType === "percentage" ? (
                              <span className="flex items-center gap-1">
                                <Percent className="w-3 h-3" />
                                {coupon.discountValue}%
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                ${parseFloat(coupon.discountValue).toLocaleString("es-AR")}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {coupon.usageCount || 0}
                            {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                          </TableCell>
                          <TableCell>
                            {coupon.validFrom || coupon.validTo ? (
                              <span className="text-sm">
                                {coupon.validFrom && format(new Date(coupon.validFrom), "dd/MM")}
                                {" - "}
                                {coupon.validTo && format(new Date(coupon.validTo), "dd/MM")}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Sin límite</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={coupon.isActive ? "default" : "secondary"}>
                              {coupon.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditCoupon(coupon)}
                                data-testid={`button-edit-coupon-${coupon.id}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteCouponMutation.mutate(coupon.id)}
                                data-testid={`button-delete-coupon-${coupon.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offers">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Ofertas y Promociones</CardTitle>
                  <CardDescription>Ofertas visibles en el portal de clientes</CardDescription>
                </div>
                <Dialog open={offerDialogOpen} onOpenChange={(open) => {
                  setOfferDialogOpen(open);
                  if (!open) resetOfferForm();
                }}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-new-offer">
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Oferta
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingOffer ? "Editar Oferta" : "Nueva Oferta"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveOffer} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                          data-testid="input-offer-title"
                          value={offerForm.title}
                          onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                          placeholder="Descuento de verano"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Textarea
                          value={offerForm.description}
                          onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                          placeholder="Descripción de la oferta"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo de descuento</Label>
                          <Select
                            value={offerForm.discountType}
                            onValueChange={(v) => setOfferForm({ ...offerForm, discountType: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Porcentaje</SelectItem>
                              <SelectItem value="fixed">Monto fijo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Valor</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={offerForm.discountValue}
                            onChange={(e) => setOfferForm({ ...offerForm, discountValue: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>URL de imagen (opcional)</Label>
                        <Input
                          value={offerForm.imageUrl}
                          onChange={(e) => setOfferForm({ ...offerForm, imageUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Válido desde</Label>
                          <Input
                            type="date"
                            value={offerForm.validFrom}
                            onChange={(e) => setOfferForm({ ...offerForm, validFrom: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Válido hasta</Label>
                          <Input
                            type="date"
                            value={offerForm.validTo}
                            onChange={(e) => setOfferForm({ ...offerForm, validTo: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Orden de visualización</Label>
                        <Input
                          type="number"
                          value={offerForm.displayOrder}
                          onChange={(e) => setOfferForm({ ...offerForm, displayOrder: parseInt(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={offerForm.showInPortal}
                            onCheckedChange={(v) => setOfferForm({ ...offerForm, showInPortal: v })}
                          />
                          <Label>Mostrar en portal</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={offerForm.isActive}
                            onCheckedChange={(v) => setOfferForm({ ...offerForm, isActive: v })}
                          />
                          <Label>Activo</Label>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button type="submit" disabled={offerMutation.isPending} data-testid="button-save-offer">
                          {offerMutation.isPending ? "Guardando..." : "Guardar"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingOffers ? (
                  <p className="text-center py-8 text-muted-foreground">Cargando...</p>
                ) : offers.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No hay ofertas creadas</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {offers.map((offer) => (
                      <Card key={offer.id} className="overflow-hidden">
                        {offer.imageUrl && (
                          <img src={offer.imageUrl} alt={offer.title} className="w-full h-32 object-cover" />
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">{offer.title}</h3>
                              <Badge variant="secondary">
                                {offer.discountType === "percentage" 
                                  ? `${offer.discountValue}% OFF` 
                                  : `$${parseFloat(offer.discountValue).toLocaleString("es-AR")}`}
                              </Badge>
                            </div>
                            <Badge variant={offer.isActive ? "default" : "outline"}>
                              {offer.isActive ? "Activa" : "Inactiva"}
                            </Badge>
                          </div>
                          {offer.description && (
                            <p className="text-sm text-muted-foreground mb-2">{offer.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              {offer.showInPortal ? (
                                <>
                                  <Eye className="w-3 h-3" />
                                  En portal
                                </>
                              ) : (
                                <>
                                  <X className="w-3 h-3" />
                                  Oculta
                                </>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditOffer(offer)}
                                data-testid={`button-edit-offer-${offer.id}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteOfferMutation.mutate(offer.id)}
                                data-testid={`button-delete-offer-${offer.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes de Pago</CardTitle>
                <CardDescription>Revisar y procesar avisos de pago de clientes</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRequests ? (
                  <p className="text-center py-8 text-muted-foreground">Cargando...</p>
                ) : paymentRequests.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No hay solicitudes de pago</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentRequests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell>
                            {format(new Date(req.createdAt), "dd/MM/yy HH:mm", { locale: es })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{req.client.name}</p>
                              <p className="text-xs text-muted-foreground">{req.client.taxId}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            ${parseFloat(req.amount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="capitalize">{req.paymentMethod}</TableCell>
                          <TableCell>{req.referenceNumber || "-"}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                req.status === "approved" ? "default" :
                                req.status === "rejected" ? "destructive" : "secondary"
                              }
                            >
                              {req.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                              {req.status === "approved" && <Check className="w-3 h-3 mr-1" />}
                              {req.status === "rejected" && <X className="w-3 h-3 mr-1" />}
                              {req.status === "pending" ? "Pendiente" : 
                               req.status === "approved" ? "Aprobado" : "Rechazado"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {req.status === "pending" && (
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => processPaymentMutation.mutate({ id: req.id, status: "approved" })}
                                  data-testid={`button-approve-${req.id}`}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => processPaymentMutation.mutate({ id: req.id, status: "rejected" })}
                                  data-testid={`button-reject-${req.id}`}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
