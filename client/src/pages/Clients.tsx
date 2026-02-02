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
  Plus, Search, Edit, Trash2, Users, Phone, Mail, MapPin, 
  CreditCard, UserCheck, DollarSign, MessageCircle, Building2
} from "lucide-react";
import type { Client, ClientWithDetails, ClientAuthorizedContact, ClientAccountMovement, ClientAccountSummary } from "@shared/schema";

const TAX_CONDITIONS: Record<string, string> = {
  consumidor_final: "Consumidor Final",
  responsable_inscripto: "Responsable Inscripto",
  monotributista: "Monotributista",
  exento: "Exento"
};

export default function Clients() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients", searchQuery],
    queryFn: () => fetch(`/api/clients${searchQuery ? `?search=${searchQuery}` : ""}`).then(r => r.json())
  });

  const { data: clientDetails } = useQuery<ClientWithDetails>({
    queryKey: ["/api/clients", selectedClient?.id, "details"],
    queryFn: () => fetch(`/api/clients/${selectedClient?.id}/details`).then(r => r.json()),
    enabled: !!selectedClient
  });

  const { data: accountSummary } = useQuery<ClientAccountSummary>({
    queryKey: ["/api/clients", selectedClient?.id, "account"],
    queryFn: () => fetch(`/api/clients/${selectedClient?.id}/account`).then(r => r.json()),
    enabled: !!selectedClient
  });

  const { data: contacts = [] } = useQuery<ClientAuthorizedContact[]>({
    queryKey: ["/api/clients", selectedClient?.id, "contacts"],
    queryFn: () => fetch(`/api/clients/${selectedClient?.id}/contacts`).then(r => r.json()),
    enabled: !!selectedClient
  });

  const createClientMutation = useMutation({
    mutationFn: (data: Partial<Client>) => apiRequest("POST", "/api/clients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Cliente creado", description: "El cliente se ha creado correctamente" });
    }
  });

  const updateClientMutation = useMutation({
    mutationFn: (data: { id: number; updates: Partial<Client> }) => 
      apiRequest("PUT", `/api/clients/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsEditDialogOpen(false);
      toast({ title: "Cliente actualizado", description: "Los datos del cliente se han actualizado" });
    }
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setSelectedClient(null);
      toast({ title: "Cliente eliminado", description: "El cliente ha sido desactivado" });
    }
  });

  const createContactMutation = useMutation({
    mutationFn: (data: Partial<ClientAuthorizedContact>) => 
      apiRequest("POST", `/api/clients/${selectedClient?.id}/contacts`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", selectedClient?.id, "contacts"] });
      setIsContactDialogOpen(false);
      toast({ title: "Contacto agregado", description: "El contacto autorizado se ha agregado" });
    }
  });

  const createMovementMutation = useMutation({
    mutationFn: (data: { type: string; amount: number; concept: string; notes?: string }) =>
      apiRequest("POST", `/api/clients/${selectedClient?.id}/movements`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", selectedClient?.id, "account"] });
      setIsMovementDialogOpen(false);
      toast({ title: "Movimiento registrado", description: "El movimiento se ha registrado en la cuenta corriente" });
    }
  });

  const handleCreateClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    createClientMutation.mutate({
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
      taxCondition: formData.get("taxCondition") as string || "consumidor_final",
      discountPercent: formData.get("discountPercent") as string || "0",
      creditLimit: formData.get("creditLimit") as string || "0",
      notes: formData.get("notes") as string || undefined
    });
  };

  const handleUpdateClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClient) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    updateClientMutation.mutate({
      id: selectedClient.id,
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
        taxCondition: formData.get("taxCondition") as string || "consumidor_final",
        discountPercent: formData.get("discountPercent") as string || "0",
        creditLimit: formData.get("creditLimit") as string || "0",
        notes: formData.get("notes") as string || undefined
      }
    });
  };

  const handleCreateContact = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    createContactMutation.mutate({
      name: formData.get("name") as string,
      dni: formData.get("dni") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      email: formData.get("email") as string || undefined,
      position: formData.get("position") as string || undefined,
      notes: formData.get("notes") as string || undefined
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
      notes: formData.get("notes") as string || undefined
    });
  };

  const activeClients = clients.filter(c => c.isActive !== false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Clientes</h1>
          <p className="text-muted-foreground">Gestión avanzada de clientes con cuenta corriente</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-client">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo Cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre / Fantasía *</Label>
                  <Input id="name" name="name" required data-testid="input-client-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Razón Social</Label>
                  <Input id="businessName" name="businessName" data-testid="input-client-business-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">CUIT / CUIL / DNI</Label>
                  <Input id="taxId" name="taxId" placeholder="30-12345678-9" data-testid="input-client-tax-id" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxCondition">Condición Fiscal</Label>
                  <Select name="taxCondition" defaultValue="consumidor_final">
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
                  <Input id="phone" name="phone" data-testid="input-client-phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input id="whatsapp" name="whatsapp" placeholder="+54 9 11..." data-testid="input-client-whatsapp" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" data-testid="input-client-email" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input id="address" name="address" data-testid="input-client-address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input id="city" name="city" data-testid="input-client-city" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Provincia</Label>
                  <Input id="province" name="province" data-testid="input-client-province" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Código Postal</Label>
                  <Input id="postalCode" name="postalCode" data-testid="input-client-postal-code" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountPercent">Descuento (%)</Label>
                  <Input id="discountPercent" name="discountPercent" type="number" defaultValue="0" step="0.01" data-testid="input-client-discount" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="creditLimit">Límite de Crédito</Label>
                  <Input id="creditLimit" name="creditLimit" type="number" defaultValue="0" step="0.01" data-testid="input-client-credit-limit" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea id="notes" name="notes" data-testid="input-client-notes" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createClientMutation.isPending} data-testid="button-save-client">
                  {createClientMutation.isPending ? "Guardando..." : "Guardar Cliente"}
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
                data-testid="input-search-clients"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando clientes...</div>
            ) : activeClients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay clientes registrados</div>
            ) : (
              activeClients.map(client => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`p-3 rounded-md cursor-pointer border transition-colors ${
                    selectedClient?.id === client.id 
                      ? "border-primary bg-accent" 
                      : "border-transparent hover-elevate"
                  }`}
                  data-testid={`card-client-${client.id}`}
                >
                  <div className="font-medium">{client.name}</div>
                  {client.businessName && (
                    <div className="text-sm text-muted-foreground">{client.businessName}</div>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {client.taxId && <span>{client.taxId}</span>}
                    {client.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {client.phone}
                      </span>
                    )}
                  </div>
                  {client.taxCondition && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {TAX_CONDITIONS[client.taxCondition] || client.taxCondition}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex-1">
          {selectedClient ? (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {selectedClient.name}
                  </CardTitle>
                  {selectedClient.businessName && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedClient.businessName}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" data-testid="button-edit-client">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Editar Cliente</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpdateClient} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Nombre / Fantasía *</Label>
                            <Input id="edit-name" name="name" defaultValue={selectedClient.name} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-businessName">Razón Social</Label>
                            <Input id="edit-businessName" name="businessName" defaultValue={selectedClient.businessName || ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-taxId">CUIT / CUIL / DNI</Label>
                            <Input id="edit-taxId" name="taxId" defaultValue={selectedClient.taxId || ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-taxCondition">Condición Fiscal</Label>
                            <Select name="taxCondition" defaultValue={selectedClient.taxCondition || "consumidor_final"}>
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
                            <Input id="edit-phone" name="phone" defaultValue={selectedClient.phone || ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-whatsapp">WhatsApp</Label>
                            <Input id="edit-whatsapp" name="whatsapp" defaultValue={selectedClient.whatsapp || ""} />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input id="edit-email" name="email" type="email" defaultValue={selectedClient.email || ""} />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label htmlFor="edit-address">Dirección</Label>
                            <Input id="edit-address" name="address" defaultValue={selectedClient.address || ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-city">Ciudad</Label>
                            <Input id="edit-city" name="city" defaultValue={selectedClient.city || ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-province">Provincia</Label>
                            <Input id="edit-province" name="province" defaultValue={selectedClient.province || ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-postalCode">Código Postal</Label>
                            <Input id="edit-postalCode" name="postalCode" defaultValue={selectedClient.postalCode || ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-discountPercent">Descuento (%)</Label>
                            <Input id="edit-discountPercent" name="discountPercent" type="number" defaultValue={selectedClient.discountPercent || "0"} step="0.01" />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label htmlFor="edit-creditLimit">Límite de Crédito</Label>
                            <Input id="edit-creditLimit" name="creditLimit" type="number" defaultValue={selectedClient.creditLimit || "0"} step="0.01" />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label htmlFor="edit-notes">Notas</Label>
                            <Textarea id="edit-notes" name="notes" defaultValue={selectedClient.notes || ""} />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={updateClientMutation.isPending}>
                            {updateClientMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => deleteClientMutation.mutate(selectedClient.id)}
                    data-testid="button-delete-client"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="info">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="info" data-testid="tab-info">Información</TabsTrigger>
                    <TabsTrigger value="contacts" data-testid="tab-contacts">Autorizados</TabsTrigger>
                    <TabsTrigger value="account" data-testid="tab-account">Cuenta Corriente</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Datos Fiscales</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span>{selectedClient.taxId || "Sin CUIT"}</span>
                            </div>
                            <Badge>{TAX_CONDITIONS[selectedClient.taxCondition || "consumidor_final"]}</Badge>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Contacto</h4>
                          <div className="space-y-2">
                            {selectedClient.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{selectedClient.phone}</span>
                              </div>
                            )}
                            {selectedClient.whatsapp && (
                              <div className="flex items-center gap-2">
                                <MessageCircle className="h-4 w-4 text-green-500" />
                                <span>{selectedClient.whatsapp}</span>
                              </div>
                            )}
                            {selectedClient.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{selectedClient.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Dirección</h4>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <div>{selectedClient.address || "Sin dirección"}</div>
                              <div className="text-sm text-muted-foreground">
                                {[selectedClient.city, selectedClient.province, selectedClient.postalCode]
                                  .filter(Boolean).join(", ")}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Condiciones Comerciales</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Descuento:</span>
                              <Badge variant="secondary">{selectedClient.discountPercent || 0}%</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Límite de crédito:</span>
                              <span className="font-medium">${Number(selectedClient.creditLimit || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {selectedClient.notes && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Notas</h4>
                        <p className="text-sm">{selectedClient.notes}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="contacts" className="mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Personas Autorizadas
                      </h4>
                      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" data-testid="button-add-contact">
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Agregar Persona Autorizada</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleCreateContact} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="contact-name">Nombre *</Label>
                              <Input id="contact-name" name="name" required data-testid="input-contact-name" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="contact-dni">DNI</Label>
                              <Input id="contact-dni" name="dni" data-testid="input-contact-dni" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="contact-phone">Teléfono</Label>
                              <Input id="contact-phone" name="phone" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="contact-email">Email</Label>
                              <Input id="contact-email" name="email" type="email" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="contact-position">Cargo</Label>
                              <Input id="contact-position" name="position" placeholder="Ej: Encargado, Dueño" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="contact-notes">Notas</Label>
                              <Textarea id="contact-notes" name="notes" />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setIsContactDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button type="submit" disabled={createContactMutation.isPending} data-testid="button-save-contact">
                                {createContactMutation.isPending ? "Guardando..." : "Guardar"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {contacts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay personas autorizadas registradas
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>DNI</TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead>Teléfono</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contacts.map(contact => (
                            <TableRow key={contact.id} data-testid={`row-contact-${contact.id}`}>
                              <TableCell className="font-medium">{contact.name}</TableCell>
                              <TableCell>{contact.dni || "-"}</TableCell>
                              <TableCell>{contact.position || "-"}</TableCell>
                              <TableCell>{contact.phone || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
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
                              <Select name="type" defaultValue="credit">
                                <SelectTrigger data-testid="select-movement-type">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="credit">Pago / Abono</SelectItem>
                                  <SelectItem value="debit">Cargo / Débito</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mov-amount">Monto</Label>
                              <Input id="mov-amount" name="amount" type="number" step="0.01" required data-testid="input-movement-amount" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mov-concept">Concepto</Label>
                              <Input id="mov-concept" name="concept" required placeholder="Ej: Pago en efectivo" data-testid="input-movement-concept" />
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
                            <div className="text-sm text-muted-foreground">Total Haber</div>
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
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-16">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Selecciona un cliente para ver sus detalles</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
