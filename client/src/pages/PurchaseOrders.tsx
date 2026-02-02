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
import { Plus, Package, Truck, Search, Trash2, RefreshCw, FileText, Check, X } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Supplier, Product, Category, PurchaseOrder } from "@shared/schema";

type ProductWithCategory = Product & { category: Category | null };

type OrderItem = {
  productId: number;
  productSku: string;
  productName: string;
  quantity: number;
  unitCost: number;
};

type PurchaseOrderWithSupplier = PurchaseOrder & { supplier: Supplier };

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviado",
  confirmed: "Confirmado",
  partial: "Recepción Parcial",
  received: "Recibido",
  cancelled: "Cancelado"
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  received: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700"
};

export default function PurchaseOrders() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [notes, setNotes] = useState("");
  const [expectedDate, setExpectedDate] = useState("");

  const { data: orders = [], isLoading } = useQuery<PurchaseOrderWithSupplier[]>({
    queryKey: ["/api/purchase-orders"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: products = [] } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const createOrder = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/purchase-orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({ title: "Pedido Creado", description: "El pedido de compra se generó exitosamente." });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/purchase-orders/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({ title: "Estado Actualizado" });
    }
  });

  const resetForm = () => {
    setSelectedSupplier("");
    setItems([]);
    setNotes("");
    setExpectedDate("");
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
        unitCost: Number(product.costWithTax) || Number(product.costPrice) || 0
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

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  const handleSubmit = () => {
    if (!selectedSupplier || items.length === 0) return;
    createOrder.mutate({
      supplierId: parseInt(selectedSupplier),
      notes,
      expectedDeliveryDate: expectedDate || null,
      items: items.map(i => ({
        productId: i.productId,
        productSku: i.productSku,
        productName: i.productName,
        quantity: i.quantity,
        unitCost: i.unitCost
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Pedidos de Compra</h1>
            <p className="text-slate-500 dark:text-slate-400">Gestiona los pedidos a proveedores.</p>
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
                <DialogTitle>Nuevo Pedido de Compra</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Proveedor</Label>
                    <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                      <SelectTrigger data-testid="select-supplier">
                        <SelectValue placeholder="Seleccionar proveedor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.filter(s => s.isActive).map(s => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
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
                          <span className="text-sm">${Number(product.costWithTax || product.costPrice || 0).toFixed(2)}</span>
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
                        <TableHead className="text-right">Costo Unit.</TableHead>
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
                          <TableCell className="text-right">${item.unitCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">${(item.quantity * item.unitCost).toFixed(2)}</TableCell>
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
                    <p className="text-sm text-muted-foreground">Total del Pedido</p>
                    <p className="text-2xl font-bold">${total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas adicionales para el pedido..."
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
                  disabled={!selectedSupplier || items.length === 0 || createOrder.isPending}
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
              <Truck className="h-5 w-5" />
              Pedidos de Compra
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
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Entrega Esperada</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        No hay pedidos de compra registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map(order => (
                      <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                        <TableCell className="font-mono font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.supplier?.name || "-"}</TableCell>
                        <TableCell>
                          {order.createdAt ? format(new Date(order.createdAt), "dd/MM/yyyy", { locale: es }) : "-"}
                        </TableCell>
                        <TableCell>
                          {order.expectedDeliveryDate ? format(new Date(order.expectedDeliveryDate), "dd/MM/yyyy", { locale: es }) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-bold">${Number(order.totalAmount).toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={STATUS_COLORS[order.status || "draft"]}>
                            {STATUS_LABELS[order.status || "draft"]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {order.status === "draft" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateStatus.mutate({ id: order.id, status: "sent" })}
                                data-testid={`button-send-${order.id}`}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Enviar
                              </Button>
                            )}
                            {order.status === "sent" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateStatus.mutate({ id: order.id, status: "confirmed" })}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Confirmar
                              </Button>
                            )}
                            {(order.status === "confirmed" || order.status === "partial") && (
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => updateStatus.mutate({ id: order.id, status: "received" })}
                              >
                                <Package className="h-4 w-4 mr-1" />
                                Recibido
                              </Button>
                            )}
                            {order.status === "draft" && (
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={() => updateStatus.mutate({ id: order.id, status: "cancelled" })}
                              >
                                <X className="h-4 w-4 text-red-500" />
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
