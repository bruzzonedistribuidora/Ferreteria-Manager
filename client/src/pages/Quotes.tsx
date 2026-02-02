import { Layout } from "@/components/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Search, Trash2, RefreshCw, Send, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import type { Client, Product, Category, Quote } from "@shared/schema";

type ProductWithCategory = Product & { category: Category | null };

type QuoteItem = {
  productId: number;
  productSku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
};

type QuoteWithClient = Quote & { client: Client | null };

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
  expired: "Vencida",
  converted: "Convertida a Venta"
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-orange-100 text-orange-700",
  converted: "bg-emerald-100 text-emerald-700"
};

export default function Quotes() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [notes, setNotes] = useState("");
  const [validDays, setValidDays] = useState("15");

  const { data: quotes = [], isLoading } = useQuery<QuoteWithClient[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: products = [] } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const createQuote = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/quotes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({ title: "Cotización Creada", description: "La cotización se generó exitosamente." });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/quotes/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({ title: "Estado Actualizado" });
    }
  });

  const convertToSale = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/quotes/${id}/convert`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({ title: "Cotización Convertida", description: "Se creó una venta a partir de la cotización." });
    }
  });

  const resetForm = () => {
    setSelectedClient("");
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setItems([]);
    setNotes("");
    setValidDays("15");
    setSearchTerm("");
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId);
    if (clientId) {
      const client = clients.find(c => c.id.toString() === clientId);
      if (client) {
        setClientName(client.name);
        setClientEmail(client.email || "");
        setClientPhone(client.phone || "");
      }
    }
  };

  const addProduct = (product: ProductWithCategory) => {
    if (items.find(i => i.productId === product.id)) {
      setItems(items.map(i => 
        i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setItems([...items, {
        productId: product.id,
        productSku: product.sku,
        productName: product.name,
        quantity: 1,
        unitPrice: Number(product.price)
      }]);
    }
    setSearchTerm("");
  };

  const updateItemQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setItems(items.filter(i => i.productId !== productId));
    } else {
      setItems(items.map(i => i.productId === productId ? { ...i, quantity } : i));
    }
  };

  const removeItem = (productId: number) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleSubmit = () => {
    if (items.length === 0) return;
    createQuote.mutate({
      clientId: selectedClient ? parseInt(selectedClient) : null,
      clientName: clientName || null,
      clientEmail: clientEmail || null,
      clientPhone: clientPhone || null,
      notes,
      validUntil: addDays(new Date(), parseInt(validDays)).toISOString(),
      items: items.map(i => ({
        productId: i.productId,
        productSku: i.productSku,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice
      }))
    });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Cotizaciones</h1>
            <p className="text-slate-500 dark:text-slate-400">Genera presupuestos formales para tus clientes.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-quote">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Cotización
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nueva Cotización</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cliente Registrado</Label>
                    <Select value={selectedClient} onValueChange={handleClientChange}>
                      <SelectTrigger data-testid="select-client">
                        <SelectValue placeholder="Seleccionar cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin cliente registrado</SelectItem>
                        {clients.filter(c => c.isActive).map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Validez (días)</Label>
                    <Input 
                      type="number" 
                      min="1"
                      value={validDays} 
                      onChange={(e) => setValidDays(e.target.value)}
                      data-testid="input-valid-days"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input 
                      value={clientName} 
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Nombre del cliente"
                      data-testid="input-client-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      type="email"
                      value={clientEmail} 
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="email@ejemplo.com"
                      data-testid="input-client-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input 
                      value={clientPhone} 
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Teléfono"
                      data-testid="input-client-phone"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Agregar Productos</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre o SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-product"
                    />
                  </div>
                  {searchTerm && (
                    <div className="max-h-40 overflow-y-auto border rounded-md">
                      {filteredProducts.slice(0, 10).map(product => (
                        <div
                          key={product.id}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center"
                          onClick={() => addProduct(product)}
                        >
                          <div>
                            <span className="font-medium">{product.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">({product.sku})</span>
                          </div>
                          <span className="text-sm">${Number(product.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {items.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead className="w-24">Cantidad</TableHead>
                        <TableHead className="text-right">Precio Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map(item => (
                        <TableRow key={item.productId}>
                          <TableCell className="font-mono text-sm">{item.productSku}</TableCell>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 0)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">${(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" onClick={() => removeItem(item.productId)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                <div className="flex justify-end">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">${total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas adicionales, condiciones, etc..."
                    data-testid="input-notes"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={items.length === 0 || createQuote.isPending}
                  data-testid="button-create-quote"
                >
                  {createQuote.isPending ? "Creando..." : "Crear Cotización"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Cotizaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Cotización</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Válida Hasta</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        No hay cotizaciones registradas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    quotes.map(quote => (
                      <TableRow key={quote.id} data-testid={`row-quote-${quote.id}`}>
                        <TableCell className="font-mono font-medium">{quote.quoteNumber}</TableCell>
                        <TableCell>{quote.client?.name || quote.clientName || "-"}</TableCell>
                        <TableCell>
                          {quote.createdAt ? format(new Date(quote.createdAt), "dd/MM/yyyy", { locale: es }) : "-"}
                        </TableCell>
                        <TableCell>
                          {quote.validUntil ? format(new Date(quote.validUntil), "dd/MM/yyyy", { locale: es }) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-bold">${Number(quote.totalAmount).toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={STATUS_COLORS[quote.status || "draft"]}>
                            {STATUS_LABELS[quote.status || "draft"]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {quote.status === "draft" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateStatus.mutate({ id: quote.id, status: "sent" })}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Enviar
                              </Button>
                            )}
                            {(quote.status === "sent" || quote.status === "accepted") && quote.status !== "converted" && (
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => convertToSale.mutate(quote.id)}
                                disabled={convertToSale.isPending}
                              >
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                A Venta
                              </Button>
                            )}
                            {quote.status === "sent" && (
                              <>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  onClick={() => updateStatus.mutate({ id: quote.id, status: "accepted" })}
                                  className="text-green-600"
                                >
                                  <ShoppingCart className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  onClick={() => updateStatus.mutate({ id: quote.id, status: "rejected" })}
                                  className="text-red-600"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
