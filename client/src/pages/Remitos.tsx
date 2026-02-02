import { Layout } from "@/components/Layout";
import { useState, useMemo } from "react";
import { 
  FileText, 
  Plus, 
  Users, 
  ClipboardCheck, 
  Search, 
  ShoppingCart, 
  Trash2, 
  Minus, 
  Check, 
  Loader2,
  Package,
  Calendar,
  Eye,
  FileCheck,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/use-products";
import { useClients } from "@/hooks/use-clients";
import { 
  useDeliveryNotes, 
  useCreateDeliveryNote, 
  usePendingNotesByClient,
  usePreInvoices,
  useCreatePreInvoice,
  useUpdatePreInvoiceStatus 
} from "@/hooks/use-delivery-notes";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DeliveryNoteWithDetails, PreInvoiceWithDetails, ClientWithPendingNotes } from "@shared/schema";

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
};

export default function Remitos() {
  const [activeTab, setActiveTab] = useState("nuevo");
  
  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">Remitos</h1>
            <p className="text-gray-500">Gestión de remitos y pre-facturas</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid gap-1">
            <TabsTrigger value="nuevo" className="flex items-center gap-2" data-testid="tab-nuevo">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Remito</span>
              <span className="sm:hidden">Nuevo</span>
            </TabsTrigger>
            <TabsTrigger value="lista" className="flex items-center gap-2" data-testid="tab-lista">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Lista de Remitos</span>
              <span className="sm:hidden">Lista</span>
            </TabsTrigger>
            <TabsTrigger value="agrupar" className="flex items-center gap-2" data-testid="tab-agrupar">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Agrupar por Cliente</span>
              <span className="sm:hidden">Agrupar</span>
            </TabsTrigger>
            <TabsTrigger value="prefacturas" className="flex items-center gap-2" data-testid="tab-prefacturas">
              <ClipboardCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Pre-Facturas</span>
              <span className="sm:hidden">Pre-Fact.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nuevo" className="mt-6">
            <NuevoRemitoTab />
          </TabsContent>

          <TabsContent value="lista" className="mt-6">
            <ListaRemitosTab />
          </TabsContent>

          <TabsContent value="agrupar" className="mt-6">
            <AgruparPorClienteTab />
          </TabsContent>

          <TabsContent value="prefacturas" className="mt-6">
            <PreFacturasTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function NuevoRemitoTab() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [notes, setNotes] = useState("");

  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: clients } = useClients();
  const { mutate: createDeliveryNote, isPending: isProcessing } = useCreateDeliveryNote();

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                            p.sku.toLowerCase().includes(search.toLowerCase());
      return matchesSearch && p.isActive;
    });
  }, [products, search]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { 
        productId: product.id, 
        name: product.name, 
        price: Number(product.price), 
        quantity: 1,
        maxStock: product.stockQuantity
      }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCreateRemito = () => {
    if (!selectedClientId) {
      toast({
        title: "Cliente Requerido",
        description: "Debe seleccionar un cliente para el remito.",
        variant: "destructive",
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Carrito Vacío",
        description: "Agregue productos al remito.",
        variant: "destructive",
      });
      return;
    }

    createDeliveryNote({
      clientId: parseInt(selectedClientId),
      notes: notes || undefined,
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price
      }))
    }, {
      onSuccess: () => {
        toast({
          title: "Remito Creado",
          description: "El remito se ha generado correctamente.",
        });
        setCart([]);
        setNotes("");
        setSelectedClientId("");
      },
      onError: () => {
        toast({
          title: "Error",
          description: "No se pudo crear el remito.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              <CardTitle className="text-lg">Productos</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-products"
              />
            </div>

            <ScrollArea className="h-[400px]">
              {loadingProducts ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredProducts.map(product => (
                    <Card 
                      key={product.id} 
                      className="cursor-pointer hover-elevate transition-all"
                      onClick={() => addToCart(product)}
                      data-testid={`card-product-${product.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.sku}</p>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            ${Number(product.price).toLocaleString()}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              <CardTitle className="text-lg">Nuevo Remito</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Cliente *</label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger data-testid="select-client">
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map(client => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Notas (opcional)</label>
              <Textarea
                placeholder="Observaciones..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none"
                rows={2}
                data-testid="input-notes"
              />
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Productos ({cart.length})</p>
              <ScrollArea className="h-[200px]">
                {cart.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Agregue productos al remito
                  </p>
                ) : (
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.productId} className="flex items-center justify-between bg-white rounded-lg p-2 border">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">${item.price.toLocaleString()} c/u</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.productId, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.productId, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-red-500"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="text-xl font-bold text-orange-600">
                  ${cartTotal.toLocaleString()}
                </span>
              </div>
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={handleCreateRemito}
                disabled={isProcessing || cart.length === 0 || !selectedClientId}
                data-testid="button-create-remito"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Generar Remito
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ListaRemitosTab() {
  const { data: deliveryNotes, isLoading } = useDeliveryNotes();
  const [viewNote, setViewNote] = useState<DeliveryNoteWithDetails | null>(null);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>;
      case 'invoiced':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Facturado</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Anulado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            Todos los Remitos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!deliveryNotes || deliveryNotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay remitos registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deliveryNotes.map(note => (
                <Card key={note.id} className="hover-elevate" data-testid={`card-remito-${note.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-semibold text-orange-600">{note.noteNumber}</p>
                          <p className="text-sm text-gray-600">{note.client?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {note.createdAt && format(new Date(note.createdAt), "dd/MM/yyyy", { locale: es })}
                          </p>
                          <p className="font-medium">
                            ${note.items.reduce((sum, item) => sum + Number(item.subtotal), 0).toLocaleString()}
                          </p>
                        </div>
                        {getStatusBadge(note.status)}
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => setViewNote(note)}
                          data-testid={`button-view-remito-${note.id}`}
                        >
                          <Eye className="w-4 h-4" />
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

      <Dialog open={!!viewNote} onOpenChange={() => setViewNote(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Remito {viewNote?.noteNumber}
            </DialogTitle>
          </DialogHeader>
          {viewNote && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Cliente</p>
                  <p className="font-medium">{viewNote.client?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Fecha</p>
                  <p className="font-medium">
                    {viewNote.createdAt && format(new Date(viewNote.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
              
              {viewNote.notes && (
                <div>
                  <p className="text-gray-500 text-sm">Notas</p>
                  <p className="text-sm">{viewNote.notes}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="font-medium mb-2">Productos</p>
                <div className="space-y-2">
                  {viewNote.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.product?.name}</span>
                      <span className="font-medium">${Number(item.subtotal).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="text-xl font-bold text-orange-600">
                  ${viewNote.items.reduce((sum, item) => sum + Number(item.subtotal), 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AgruparPorClienteTab() {
  const { data: clientsWithPending, isLoading } = usePendingNotesByClient();
  const { mutate: createPreInvoice, isPending } = useCreatePreInvoice();
  const [selectedNotes, setSelectedNotes] = useState<Record<number, number[]>>({});
  const [expandedClient, setExpandedClient] = useState<number | null>(null);

  const toggleNoteSelection = (clientId: number, noteId: number) => {
    setSelectedNotes(prev => {
      const clientNotes = prev[clientId] || [];
      if (clientNotes.includes(noteId)) {
        return { ...prev, [clientId]: clientNotes.filter(id => id !== noteId) };
      }
      return { ...prev, [clientId]: [...clientNotes, noteId] };
    });
  };

  const selectAllForClient = (client: ClientWithPendingNotes) => {
    const allIds = client.pendingDeliveryNotes.map(n => n.id);
    setSelectedNotes(prev => ({ ...prev, [client.id]: allIds }));
  };

  const handleGeneratePreInvoice = (clientId: number) => {
    const noteIds = selectedNotes[clientId] || [];
    if (noteIds.length === 0) {
      toast({
        title: "Seleccione Remitos",
        description: "Debe seleccionar al menos un remito para generar la pre-factura.",
        variant: "destructive",
      });
      return;
    }

    createPreInvoice({
      clientId,
      deliveryNoteIds: noteIds
    }, {
      onSuccess: () => {
        toast({
          title: "Pre-Factura Generada",
          description: "La pre-factura se ha creado y está pendiente de revisión.",
        });
        setSelectedNotes(prev => ({ ...prev, [clientId]: [] }));
      },
      onError: () => {
        toast({
          title: "Error",
          description: "No se pudo generar la pre-factura.",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Agrupación de Remitos</p>
              <p className="text-sm text-blue-700">
                Seleccione los remitos pendientes de cada cliente para generar una pre-factura que será revisada por administración.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!clientsWithPending || clientsWithPending.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay remitos pendientes para agrupar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {clientsWithPending.map(client => {
            const clientSelectedNotes = selectedNotes[client.id] || [];
            const selectedTotal = client.pendingDeliveryNotes
              .filter(n => clientSelectedNotes.includes(n.id))
              .reduce((sum, n) => sum + n.items.reduce((s, i) => s + Number(i.subtotal), 0), 0);

            return (
              <Card key={client.id} data-testid={`card-client-group-${client.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{client.name}</CardTitle>
                        <p className="text-sm text-gray-500">
                          {client.pendingDeliveryNotes.length} remitos pendientes - 
                          Total: ${client.totalPendingAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => selectAllForClient(client)}
                      >
                        Seleccionar Todos
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
                      >
                        {expandedClient === client.id ? 'Ocultar' : 'Ver Detalle'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {expandedClient === client.id && (
                    <div className="space-y-2 border-t pt-4">
                      {client.pendingDeliveryNotes.map(note => (
                        <div 
                          key={note.id} 
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            clientSelectedNotes.includes(note.id) 
                              ? 'bg-orange-50 border-orange-200' 
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={clientSelectedNotes.includes(note.id)}
                              onCheckedChange={() => toggleNoteSelection(client.id, note.id)}
                              data-testid={`checkbox-note-${note.id}`}
                            />
                            <div>
                              <p className="font-medium">{note.noteNumber}</p>
                              <p className="text-sm text-gray-500">
                                {note.createdAt && format(new Date(note.createdAt), "dd/MM/yyyy", { locale: es })} - 
                                {note.items.length} productos
                              </p>
                            </div>
                          </div>
                          <span className="font-medium">
                            ${note.items.reduce((sum, item) => sum + Number(item.subtotal), 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {clientSelectedNotes.length > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <p className="text-sm text-gray-500">Seleccionados: {clientSelectedNotes.length} remitos</p>
                        <p className="font-semibold text-lg text-orange-600">
                          Total: ${selectedTotal.toLocaleString()}
                        </p>
                      </div>
                      <Button
                        className="bg-orange-500 hover:bg-orange-600"
                        onClick={() => handleGeneratePreInvoice(client.id)}
                        disabled={isPending}
                        data-testid={`button-generate-preinvoice-${client.id}`}
                      >
                        {isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <FileCheck className="w-4 h-4 mr-2" />
                        )}
                        Generar Pre-Factura
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PreFacturasTab() {
  const { data: preInvoices, isLoading } = usePreInvoices();
  const { mutate: updateStatus, isPending } = useUpdatePreInvoiceStatus();
  const [viewPreInvoice, setViewPreInvoice] = useState<PreInvoiceWithDetails | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending_review':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente Revisión</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprobada</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rechazada</Badge>;
      case 'invoiced':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Facturada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleApprove = (id: number) => {
    updateStatus({ id, status: 'approved', adminNotes }, {
      onSuccess: () => {
        toast({ title: "Pre-Factura Aprobada" });
        setViewPreInvoice(null);
        setAdminNotes("");
      }
    });
  };

  const handleReject = (id: number) => {
    if (!adminNotes) {
      toast({
        title: "Notas Requeridas",
        description: "Ingrese el motivo del rechazo.",
        variant: "destructive",
      });
      return;
    }
    updateStatus({ id, status: 'rejected', adminNotes }, {
      onSuccess: () => {
        toast({ title: "Pre-Factura Rechazada" });
        setViewPreInvoice(null);
        setAdminNotes("");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-orange-500" />
            Pre-Facturas para Revisión
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!preInvoices || preInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay pre-facturas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {preInvoices.map(pi => (
                <Card key={pi.id} className="hover-elevate" data-testid={`card-preinvoice-${pi.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-semibold text-orange-600">{pi.preInvoiceNumber}</p>
                        <p className="text-sm text-gray-600">{pi.client?.name}</p>
                        <p className="text-xs text-gray-400">
                          {pi.deliveryNotes.length} remitos agrupados
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {pi.createdAt && format(new Date(pi.createdAt), "dd/MM/yyyy", { locale: es })}
                          </p>
                          <p className="font-semibold text-lg">
                            ${Number(pi.totalAmount).toLocaleString()}
                          </p>
                        </div>
                        {getStatusBadge(pi.status)}
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => setViewPreInvoice(pi)}
                          data-testid={`button-view-preinvoice-${pi.id}`}
                        >
                          <Eye className="w-4 h-4" />
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

      <Dialog open={!!viewPreInvoice} onOpenChange={() => { setViewPreInvoice(null); setAdminNotes(""); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-orange-500" />
              Pre-Factura {viewPreInvoice?.preInvoiceNumber}
            </DialogTitle>
          </DialogHeader>
          {viewPreInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Cliente</p>
                  <p className="font-medium">{viewPreInvoice.client?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Estado</p>
                  {getStatusBadge(viewPreInvoice.status)}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="font-medium mb-3">Remitos Incluidos</p>
                <div className="space-y-3">
                  {viewPreInvoice.deliveryNotes.map(note => (
                    <Card key={note.id} className="bg-gray-50">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-orange-600">{note.noteNumber}</span>
                          <span className="text-sm text-gray-500">
                            {note.createdAt && format(new Date(note.createdAt), "dd/MM/yyyy", { locale: es })}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          {note.items.map(item => (
                            <div key={item.id} className="flex justify-between">
                              <span>{item.quantity}x {item.product?.name}</span>
                              <span>${Number(item.subtotal).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end mt-2 pt-2 border-t font-medium">
                          Subtotal: ${note.items.reduce((sum, i) => sum + Number(i.subtotal), 0).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 flex justify-between items-center">
                <span className="font-semibold text-lg">Total Pre-Factura:</span>
                <span className="text-2xl font-bold text-orange-600">
                  ${Number(viewPreInvoice.totalAmount).toLocaleString()}
                </span>
              </div>

              {viewPreInvoice.status === 'pending_review' && (
                <div className="border-t pt-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Notas de Administración</label>
                    <Textarea
                      placeholder="Agregar observaciones o correcciones..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      data-testid="input-admin-notes"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleReject(viewPreInvoice.id)}
                      disabled={isPending}
                      data-testid="button-reject"
                    >
                      Rechazar
                    </Button>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(viewPreInvoice.id)}
                      disabled={isPending}
                      data-testid="button-approve"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                      Aprobar
                    </Button>
                  </div>
                </div>
              )}

              {viewPreInvoice.adminNotes && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Notas de Administración:</p>
                  <p className="text-sm">{viewPreInvoice.adminNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
