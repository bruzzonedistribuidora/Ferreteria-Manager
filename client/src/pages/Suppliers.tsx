import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Search, Edit, Trash2, Truck, Phone, Mail, MapPin, 
  CreditCard, DollarSign, Building2, Calendar, Percent, Landmark
} from "lucide-react";
import type { Supplier, SupplierWithDetails, SupplierAccountMovement, SupplierAccountSummary, SupplierProductDiscount } from "@shared/schema";

const TAX_CONDITIONS: Record<string, string> = {
  consumidor_final: "Consumidor Final",
  responsable_inscripto: "Responsable Inscripto",
  monotributista: "Monotributista",
  exento: "Exento"
};

export default function Suppliers() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers", searchQuery],
    queryFn: () => fetch(`/api/suppliers${searchQuery ? `?search=${searchQuery}` : ""}`).then(r => r.json())
  });

  const { data: supplierDetails } = useQuery<SupplierWithDetails>({
    queryKey: ["/api/suppliers", selectedSupplier?.id, "details"],
    queryFn: () => fetch(`/api/suppliers/${selectedSupplier?.id}/details`).then(r => r.json()),
    enabled: !!selectedSupplier
  });

  const { data: accountSummary } = useQuery<SupplierAccountSummary>({
    queryKey: ["/api/suppliers", selectedSupplier?.id, "account"],
    queryFn: () => fetch(`/api/suppliers/${selectedSupplier?.id}/account`).then(r => r.json()),
    enabled: !!selectedSupplier
  });

  const { data: discounts = [] } = useQuery<SupplierProductDiscount[]>({
    queryKey: ["/api/suppliers", selectedSupplier?.id, "discounts"],
    queryFn: () => fetch(`/api/suppliers/${selectedSupplier?.id}/discounts`).then(r => r.json()),
    enabled: !!selectedSupplier
  });

  const createSupplierMutation = useMutation({
    mutationFn: (data: Partial<Supplier>) => apiRequest("POST", "/api/suppliers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Proveedor creado", description: "El proveedor se ha creado correctamente" });
    }
  });

  const updateSupplierMutation = useMutation({
    mutationFn: (data: { id: number; updates: Partial<Supplier> }) => 
      apiRequest("PUT", `/api/suppliers/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsEditDialogOpen(false);
      toast({ title: "Proveedor actualizado", description: "Los datos del proveedor se han actualizado" });
    }
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setSelectedSupplier(null);
      toast({ title: "Proveedor eliminado", description: "El proveedor ha sido desactivado" });
    }
  });

  const createMovementMutation = useMutation({
    mutationFn: (data: { type: string; amount: number; concept: string; documentNumber?: string; dueDate?: string; notes?: string }) =>
      apiRequest("POST", `/api/suppliers/${selectedSupplier?.id}/movements`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", selectedSupplier?.id, "account"] });
      setIsMovementDialogOpen(false);
      toast({ title: "Movimiento registrado", description: "El movimiento se ha registrado en la cuenta corriente" });
    }
  });

  const handleCreateSupplier = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    createSupplierMutation.mutate({
      name: formData.get("name") as string,
      businessName: formData.get("businessName") as string || undefined,
      email: formData.get("email") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      whatsapp: formData.get("whatsapp") as string || undefined,
      address: formData.get("address") as string || undefined,
      city: formData.get("city") as string || undefined,
      province: formData.get("province") as string || undefined,
      postalCode: formData.get("postalCode") as string || undefined,
      taxId: formData.get("taxId") as string || undefined,
      taxCondition: formData.get("taxCondition") as string || "responsable_inscripto",
      defaultDiscountPercent: formData.get("defaultDiscountPercent") as string || "0",
      paymentTermDays: Number(formData.get("paymentTermDays")) || 30,
      bankName: formData.get("bankName") as string || undefined,
      bankAccountNumber: formData.get("bankAccountNumber") as string || undefined,
      bankCbu: formData.get("bankCbu") as string || undefined,
      bankAlias: formData.get("bankAlias") as string || undefined,
      contactName: formData.get("contactName") as string || undefined,
      contactPhone: formData.get("contactPhone") as string || undefined,
      contactEmail: formData.get("contactEmail") as string || undefined,
      notes: formData.get("notes") as string || undefined
    });
  };

  const handleUpdateSupplier = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    updateSupplierMutation.mutate({
      id: selectedSupplier.id,
      updates: {
        name: formData.get("name") as string,
        businessName: formData.get("businessName") as string || undefined,
        email: formData.get("email") as string || undefined,
        phone: formData.get("phone") as string || undefined,
        whatsapp: formData.get("whatsapp") as string || undefined,
        address: formData.get("address") as string || undefined,
        city: formData.get("city") as string || undefined,
        province: formData.get("province") as string || undefined,
        postalCode: formData.get("postalCode") as string || undefined,
        taxId: formData.get("taxId") as string || undefined,
        taxCondition: formData.get("taxCondition") as string || "responsable_inscripto",
        defaultDiscountPercent: formData.get("defaultDiscountPercent") as string || "0",
        paymentTermDays: Number(formData.get("paymentTermDays")) || 30,
        bankName: formData.get("bankName") as string || undefined,
        bankAccountNumber: formData.get("bankAccountNumber") as string || undefined,
        bankCbu: formData.get("bankCbu") as string || undefined,
        bankAlias: formData.get("bankAlias") as string || undefined,
        contactName: formData.get("contactName") as string || undefined,
        contactPhone: formData.get("contactPhone") as string || undefined,
        contactEmail: formData.get("contactEmail") as string || undefined,
        notes: formData.get("notes") as string || undefined
      }
    });
  };

  const handleCreateMovement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    createMovementMutation.mutate({
      type: formData.get("type") as string,
      amount: Number(formData.get("amount")),
      concept: formData.get("concept") as string,
      documentNumber: formData.get("documentNumber") as string || undefined,
      dueDate: formData.get("dueDate") as string || undefined,
      notes: formData.get("notes") as string || undefined
    });
  };

  const activeSuppliers = suppliers.filter(s => s.isActive !== false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Proveedores</h1>
          <p className="text-muted-foreground">Gestión de proveedores con cuenta corriente y descuentos</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-supplier">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo Proveedor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre / Fantasía *</Label>
                  <Input id="name" name="name" required data-testid="input-supplier-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Razón Social</Label>
                  <Input id="businessName" name="businessName" data-testid="input-supplier-business-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">CUIT</Label>
                  <Input id="taxId" name="taxId" placeholder="30-12345678-9" data-testid="input-supplier-tax-id" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxCondition">Condición Fiscal</Label>
                  <Select name="taxCondition" defaultValue="responsable_inscripto">
                    <SelectTrigger data-testid="select-tax-condition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TAX_CONDITIONS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" name="phone" data-testid="input-supplier-phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input id="whatsapp" name="whatsapp" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" data-testid="input-supplier-email" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input id="address" name="address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input id="city" name="city" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Provincia</Label>
                  <Input id="province" name="province" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultDiscountPercent">Descuento por defecto (%)</Label>
                  <Input id="defaultDiscountPercent" name="defaultDiscountPercent" type="number" defaultValue="0" step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentTermDays">Plazo de pago (días)</Label>
                  <Input id="paymentTermDays" name="paymentTermDays" type="number" defaultValue="30" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="flex items-center gap-2"><Landmark className="h-4 w-4" /> Datos Bancarios</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Banco</Label>
                  <Input id="bankName" name="bankName" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber">Nro. Cuenta</Label>
                  <Input id="bankAccountNumber" name="bankAccountNumber" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankCbu">CBU</Label>
                  <Input id="bankCbu" name="bankCbu" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAlias">Alias</Label>
                  <Input id="bankAlias" name="bankAlias" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Contacto Principal</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName">Nombre</Label>
                  <Input id="contactName" name="contactName" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Teléfono</Label>
                  <Input id="contactPhone" name="contactPhone" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="contactEmail">Email Contacto</Label>
                  <Input id="contactEmail" name="contactEmail" type="email" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea id="notes" name="notes" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createSupplierMutation.isPending} data-testid="button-save-supplier">
                  {createSupplierMutation.isPending ? "Guardando..." : "Guardar Proveedor"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-6">
        <Card className="w-1/3">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, CUIT, teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-suppliers"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando proveedores...</div>
            ) : activeSuppliers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay proveedores registrados</div>
            ) : (
              activeSuppliers.map(supplier => (
                <div
                  key={supplier.id}
                  onClick={() => setSelectedSupplier(supplier)}
                  className={`p-3 rounded-md cursor-pointer border transition-colors ${
                    selectedSupplier?.id === supplier.id 
                      ? "border-primary bg-accent" 
                      : "border-transparent hover-elevate"
                  }`}
                  data-testid={`card-supplier-${supplier.id}`}
                >
                  <div className="font-medium flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    {supplier.name}
                  </div>
                  {supplier.businessName && (
                    <div className="text-sm text-muted-foreground">{supplier.businessName}</div>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {supplier.taxId && <span>{supplier.taxId}</span>}
                    {supplier.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {supplier.phone}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex-1">
          {selectedSupplier ? (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {selectedSupplier.name}
                  </CardTitle>
                  {selectedSupplier.businessName && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedSupplier.businessName}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" data-testid="button-edit-supplier">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Editar Proveedor</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpdateSupplier} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Nombre / Fantasía *</Label>
                            <Input id="edit-name" name="name" defaultValue={selectedSupplier.name} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-businessName">Razón Social</Label>
                            <Input id="edit-businessName" name="businessName" defaultValue={selectedSupplier.businessName || ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-taxId">CUIT</Label>
                            <Input id="edit-taxId" name="taxId" defaultValue={selectedSupplier.taxId || ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-taxCondition">Condición Fiscal</Label>
                            <Select name="taxCondition" defaultValue={selectedSupplier.taxCondition || "responsable_inscripto"}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(TAX_CONDITIONS).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-phone">Teléfono</Label>
                            <Input id="edit-phone" name="phone" defaultValue={selectedSupplier.phone || ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input id="edit-email" name="email" defaultValue={selectedSupplier.email || ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-defaultDiscountPercent">Descuento (%)</Label>
                            <Input id="edit-defaultDiscountPercent" name="defaultDiscountPercent" type="number" defaultValue={selectedSupplier.defaultDiscountPercent || "0"} step="0.01" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-paymentTermDays">Plazo pago (días)</Label>
                            <Input id="edit-paymentTermDays" name="paymentTermDays" type="number" defaultValue={selectedSupplier.paymentTermDays || 30} />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={updateSupplierMutation.isPending}>
                            {updateSupplierMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => deleteSupplierMutation.mutate(selectedSupplier.id)}
                    data-testid="button-delete-supplier"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="info">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="info" data-testid="tab-info">Información</TabsTrigger>
                    <TabsTrigger value="account" data-testid="tab-account">Cuenta Corriente</TabsTrigger>
                    <TabsTrigger value="discounts" data-testid="tab-discounts">Descuentos</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Datos Fiscales</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span>{selectedSupplier.taxId || "Sin CUIT"}</span>
                            </div>
                            <Badge>{TAX_CONDITIONS[selectedSupplier.taxCondition || "responsable_inscripto"]}</Badge>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Contacto</h4>
                          <div className="space-y-2">
                            {selectedSupplier.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{selectedSupplier.phone}</span>
                              </div>
                            )}
                            {selectedSupplier.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{selectedSupplier.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Condiciones Comerciales</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Percent className="h-4 w-4 text-muted-foreground" />
                              <span>Descuento: {selectedSupplier.defaultDiscountPercent || 0}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>Plazo pago: {selectedSupplier.paymentTermDays || 30} días</span>
                            </div>
                          </div>
                        </div>
                        {(selectedSupplier.bankName || selectedSupplier.bankCbu) && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Datos Bancarios</h4>
                            <div className="space-y-1 text-sm">
                              {selectedSupplier.bankName && <div>Banco: {selectedSupplier.bankName}</div>}
                              {selectedSupplier.bankCbu && <div>CBU: {selectedSupplier.bankCbu}</div>}
                              {selectedSupplier.bankAlias && <div>Alias: {selectedSupplier.bankAlias}</div>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="account" className="mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Cuenta Corriente
                        </h4>
                        {accountSummary && (
                          <div className={`text-xl font-bold ${accountSummary.currentBalance > 0 ? "text-red-500" : "text-green-500"}`}>
                            ${accountSummary.currentBalance.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" data-testid="button-add-movement">
                            <Plus className="h-4 w-4 mr-2" />
                            Nuevo Movimiento
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Registrar Movimiento</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleCreateMovement} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="mov-type">Tipo</Label>
                              <Select name="type" defaultValue="debit">
                                <SelectTrigger data-testid="select-movement-type">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="debit">Factura / Debe</SelectItem>
                                  <SelectItem value="credit">Pago / Haber</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mov-amount">Monto</Label>
                              <Input id="mov-amount" name="amount" type="number" step="0.01" required data-testid="input-movement-amount" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mov-concept">Concepto</Label>
                              <Input id="mov-concept" name="concept" required placeholder="Ej: Factura A-0001-00000123" data-testid="input-movement-concept" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mov-documentNumber">Nro. Documento</Label>
                              <Input id="mov-documentNumber" name="documentNumber" placeholder="Factura, recibo, etc." />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mov-dueDate">Fecha Vencimiento</Label>
                              <Input id="mov-dueDate" name="dueDate" type="date" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mov-notes">Notas</Label>
                              <Textarea id="mov-notes" name="notes" />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setIsMovementDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button type="submit" disabled={createMovementMutation.isPending} data-testid="button-save-movement">
                                {createMovementMutation.isPending ? "Registrando..." : "Registrar"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {accountSummary && (
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-sm text-muted-foreground">Total Debe</div>
                            <div className="text-xl font-bold text-red-500">${accountSummary.totalDebit.toLocaleString()}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-sm text-muted-foreground">Total Pagado</div>
                            <div className="text-xl font-bold text-green-500">${accountSummary.totalCredit.toLocaleString()}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-sm text-muted-foreground">Saldo</div>
                            <div className={`text-xl font-bold ${accountSummary.currentBalance > 0 ? "text-red-500" : "text-green-500"}`}>
                              ${accountSummary.currentBalance.toLocaleString()}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {accountSummary?.movements?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay movimientos registrados
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Concepto</TableHead>
                            <TableHead>Vencimiento</TableHead>
                            <TableHead>Debe</TableHead>
                            <TableHead>Haber</TableHead>
                            <TableHead>Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accountSummary?.movements?.map(mov => (
                            <TableRow key={mov.id} data-testid={`row-movement-${mov.id}`}>
                              <TableCell className="text-sm">
                                {new Date(mov.createdAt!).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {mov.concept}
                                {mov.documentNumber && (
                                  <span className="text-xs text-muted-foreground ml-2">({mov.documentNumber})</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {mov.dueDate ? new Date(mov.dueDate).toLocaleDateString() : '-'}
                              </TableCell>
                              <TableCell className="text-red-500">
                                {mov.type === 'debit' ? `$${Number(mov.amount).toLocaleString()}` : '-'}
                              </TableCell>
                              <TableCell className="text-green-500">
                                {mov.type === 'credit' ? `$${Number(mov.amount).toLocaleString()}` : '-'}
                              </TableCell>
                              <TableCell className={Number(mov.balance) > 0 ? "text-red-500" : "text-green-500"}>
                                ${Number(mov.balance).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>

                  <TabsContent value="discounts" className="mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Descuentos por Artículo
                      </h4>
                    </div>

                    {discounts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Descuento general: {selectedSupplier.defaultDiscountPercent || 0}%</p>
                        <p className="text-sm mt-2">No hay descuentos específicos por artículo configurados</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto/Categoría</TableHead>
                            <TableHead>Descuento</TableHead>
                            <TableHead>Cant. Mínima</TableHead>
                            <TableHead>Vigencia</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {discounts.map(discount => (
                            <TableRow key={discount.id} data-testid={`row-discount-${discount.id}`}>
                              <TableCell>
                                {discount.productId ? `Producto #${discount.productId}` : 
                                 discount.categoryId ? `Categoría #${discount.categoryId}` : 'Todos'}
                              </TableCell>
                              <TableCell className="font-medium text-green-600">
                                {discount.discountPercent}%
                              </TableCell>
                              <TableCell>{discount.minQuantity || 1}</TableCell>
                              <TableCell className="text-sm">
                                {discount.validFrom || discount.validTo 
                                  ? `${discount.validFrom ? new Date(discount.validFrom).toLocaleDateString() : ''} - ${discount.validTo ? new Date(discount.validTo).toLocaleDateString() : ''}`
                                  : 'Sin límite'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-16">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Selecciona un proveedor para ver sus detalles</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
