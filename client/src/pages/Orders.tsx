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
import { Plus, ClipboardList, Search, Trash2, RefreshCw, CheckCircle, Package, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Client, Product, Category, CustomerOrder } from "@shared/schema";

type ProductWithCategory = Product & { category: Category | null };

type OrderItem = {
  productId: number;
  productSku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
};

type CustomerOrderWithClient = CustomerOrder & { client: Client | null };

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  processing: "En Proceso",
  ready: "Listo para Entregar",
  delivered: "Entregado",
  cancelled: "Cancelado"
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  ready: "bg-green-100 text-green-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700"
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  partial: "Parcial",
  paid: "Pagado"
};

export default function Orders() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [notes, setNotes] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  const { data: orders = [], isLoading } = useQuery<CustomerOrderWithClient[]>({
    queryKey: ["/api/customer-orders"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: products = [] } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const createOrder = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/customer-orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-orders"] });
      toast({ title: "Pedido Creado", description: "El pedido se registró exitosamente." });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/customer-orders/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-orders"] });
      toast({ title: "Estado Actualizado" });
    }
  });

  const convertToSale = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/customer-orders/${id}/convert`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({ title: "Pedido Facturado", description: "Se creó una venta a partir del pedido." });
    }
  });

  const resetForm = () => {
    setSelectedClient("");
    setItems([]);
    setNotes("");
    setExpectedDate("");
    setDepositAmount("");
    setSearchTerm("");
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
    if (!selectedClient || items.length === 0) return;
    createOrder.mutate({
      clientId: parseInt(selectedClient),
      notes,
      expectedDate: expectedDate || null,
      depositAmount: depositAmount ? parseFloat(depositAmount) : 0,
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

  const getNextStatus = (current: string) => {
    const flow: Record<string, string> = {
      pending: "confirmed",
      confirmed: "processing",
      processing: "ready",
      ready: "delivered"
    };
    return flow[current];
  };

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Pedidos de Clientes</h1>
            <p className="text-slate-500 dark:text-slate-400">Gestiona los pedidos y encargos de clientes.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-order">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo Pedido de Cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger data-testid="select-client">
                        <SelectValue placeholder="Seleccionar cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.filter(c => c.isActive).map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Esperada de Entrega</Label>
                    <Input 
                      type="date" 
                      value={expectedDate} 
                      onChange={(e) => setExpectedDate(e.target.value)}
                      data-testid="input-expected-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Seña / Anticipo</Label>
                    <Input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={depositAmount} 
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="$0.00"
                      data-testid="input-deposit"
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

                <div className="flex justify-between items-end">
                  {depositAmount && parseFloat(depositAmount) > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Seña: ${parseFloat(depositAmount).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Saldo: ${(total - parseFloat(depositAmount)).toFixed(2)}</p>
                    </div>
                  )}
                  <div className="text-right ml-auto">
                    <p className="text-sm text-muted-foreground">Total del Pedido</p>
                    <p className="text-2xl font-bold">${total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas adicionales, especificaciones, etc..."
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
                  disabled={!selectedClient || items.length === 0 || createOrder.isPending}
                  data-testid="button-create-order"
                >
                  {createOrder.isPending ? "Creando..." : "Crear Pedido"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Pedidos
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
                    <TableHead>N° Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Entrega</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Pago</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        No hay pedidos registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map(order => (
                      <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                        <TableCell className="font-mono font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.client?.name || "-"}</TableCell>
                        <TableCell>
                          {order.createdAt ? format(new Date(order.createdAt), "dd/MM/yyyy", { locale: es }) : "-"}
                        </TableCell>
                        <TableCell>
                          {order.expectedDate ? format(new Date(order.expectedDate), "dd/MM/yyyy", { locale: es }) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-bold">${Number(order.totalAmount).toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={STATUS_COLORS[order.status || "pending"]}>
                            {STATUS_LABELS[order.status || "pending"]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {PAYMENT_STATUS_LABELS[order.paymentStatus || "pending"]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {getNextStatus(order.status || "pending") && order.status !== "delivered" && order.status !== "cancelled" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateStatus.mutate({ id: order.id, status: getNextStatus(order.status || "pending") })}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {STATUS_LABELS[getNextStatus(order.status || "pending")]}
                              </Button>
                            )}
                            {order.status === "delivered" && !order.convertedToSaleId && (
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => convertToSale.mutate(order.id)}
                                disabled={convertToSale.isPending}
                              >
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                Facturar
                              </Button>
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
