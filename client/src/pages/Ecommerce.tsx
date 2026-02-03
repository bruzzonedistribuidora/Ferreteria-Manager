import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, Package, Settings, Save, Eye, Check, X, Truck, 
  CreditCard, DollarSign, Bell, Store, Search, Globe, RefreshCw
} from "lucide-react";
import type { Product, EcommerceSettings, EcommerceOrder } from "@shared/schema";

const orderStatuses: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-800" },
  processing: { label: "Preparando", color: "bg-purple-100 text-purple-800" },
  shipped: { label: "Enviado", color: "bg-indigo-100 text-indigo-800" },
  delivered: { label: "Entregado", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

const paymentStatuses: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "Pagado", color: "bg-green-100 text-green-800" },
  failed: { label: "Fallido", color: "bg-red-100 text-red-800" },
  refunded: { label: "Reembolsado", color: "bg-gray-100 text-gray-800" },
};

export default function Ecommerce() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("catalog");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<EcommerceOrder | null>(null);

  const [settingsForm, setSettingsForm] = useState<Partial<EcommerceSettings>>({
    storeName: "",
    storeDescription: "",
    currency: "ARS",
    shippingEnabled: true,
    localPickupEnabled: true,
    paymentOnDeliveryEnabled: true,
    bankTransferEnabled: true,
    isActive: false,
  });

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: ecommerceProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/ecommerce/products"],
  });

  const { data: orders = [] } = useQuery<EcommerceOrder[]>({
    queryKey: ["/api/ecommerce/orders"],
  });

  const { data: settings } = useQuery<EcommerceSettings>({
    queryKey: ["/api/ecommerce/settings"],
  });

  useEffect(() => {
    if (settings) {
      setSettingsForm(settings);
    }
  }, [settings]);

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Product> }) =>
      apiRequest("PATCH", `/api/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/products"] });
      toast({ title: "Producto actualizado" });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (data: Partial<EcommerceSettings>) =>
      apiRequest("POST", "/api/ecommerce/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/settings"] });
      toast({ title: "Configuración guardada" });
    },
    onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EcommerceOrder> }) =>
      apiRequest("PATCH", `/api/ecommerce/orders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/orders"] });
      toast({ title: "Pedido actualizado" });
      setSelectedOrder(null);
    },
  });


  const filteredProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const publishedCount = allProducts.filter(p => p.publishOnline).length;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">E-Commerce</h1>
          <p className="text-muted-foreground">Gestiona tu tienda online y pedidos</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={settings?.isActive ? "default" : "secondary"} className="text-sm px-3 py-1">
            <Globe className="h-4 w-4 mr-1" />
            {settings?.isActive ? "Tienda Activa" : "Tienda Inactiva"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Productos Online</p>
                <p className="text-2xl font-bold">{publishedCount}</p>
              </div>
              <Package className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pedidos Pendientes</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.orderStatus === "pending").length}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pedidos Hoy</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => {
                    const today = new Date().toDateString();
                    return new Date(o.createdAt!).toDateString() === today;
                  }).length}
                </p>
              </div>
              <Store className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventas Online</p>
                <p className="text-2xl font-bold">
                  ${orders
                    .filter(o => o.paymentStatus === "paid")
                    .reduce((sum, o) => sum + Number(o.total || 0), 0)
                    .toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="catalog" className="flex items-center gap-2" data-testid="tab-catalog">
            <Package className="h-4 w-4" />
            Catálogo
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2" data-testid="tab-orders">
            <ShoppingCart className="h-4 w-4" />
            Pedidos
            {orders.filter(o => o.orderStatus === "pending").length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {orders.filter(o => o.orderStatus === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2" data-testid="tab-settings">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Catálogo de Productos</CardTitle>
                  <CardDescription>Selecciona los productos que se mostrarán en tu tienda online</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-products"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Online</TableHead>
                    <TableHead className="w-[60px]">Dest.</TableHead>
                    <TableHead className="w-[60px]">Oferta</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Precio Oferta</TableHead>
                    <TableHead>Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.slice(0, 50).map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Switch
                          checked={product.publishOnline || false}
                          onCheckedChange={() => updateProductMutation.mutate({
                            id: product.id,
                            data: { publishOnline: !product.publishOnline }
                          })}
                          data-testid={`switch-publish-${product.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={product.isFeatured || false}
                          onCheckedChange={() => updateProductMutation.mutate({
                            id: product.id,
                            data: { isFeatured: !product.isFeatured }
                          })}
                          data-testid={`switch-featured-${product.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={product.isOnSale || false}
                          onCheckedChange={() => updateProductMutation.mutate({
                            id: product.id,
                            data: { isOnSale: !product.isOnSale }
                          })}
                          data-testid={`switch-sale-${product.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                          </div>
                          {product.isFeatured && <Badge data-testid={`badge-featured-${product.id}`}>Destacado</Badge>}
                          {product.isOnSale && <Badge variant="destructive" data-testid={`badge-sale-${product.id}`}>Oferta</Badge>}
                          {product.isNewArrival && <Badge variant="secondary" data-testid={`badge-new-${product.id}`}>Nuevo</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>${Number(product.priceWithTax || product.price).toLocaleString()}</TableCell>
                      <TableCell>
                        {product.isOnSale ? (
                          <Input
                            type="number"
                            className="w-24"
                            value={product.salePrice || ""}
                            placeholder="Precio"
                            data-testid={`input-sale-price-${product.id}`}
                            onBlur={(e) => updateProductMutation.mutate({
                              id: product.id,
                              data: { salePrice: e.target.value }
                            })}
                          />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={Number(product.stockQuantity) > 0 ? "default" : "secondary"}>
                          {product.stockQuantity || 0}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredProducts.length > 50 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Mostrando 50 de {filteredProducts.length} productos
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Online</CardTitle>
              <CardDescription>Gestiona los pedidos recibidos desde tu tienda</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay pedidos todavía</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Pago</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono">{order.orderNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customerName}</p>
                            <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          ${Number(order.total).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={orderStatuses[order.orderStatus || "pending"]?.color}>
                            {orderStatuses[order.orderStatus || "pending"]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={paymentStatuses[order.paymentStatus || "pending"]?.color}>
                            {paymentStatuses[order.paymentStatus || "pending"]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(order.createdAt!).toLocaleDateString("es-AR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setSelectedOrder(order)}
                              data-testid={`button-view-order-${order.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {order.orderStatus === "pending" && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-green-600"
                                  onClick={() => updateOrderMutation.mutate({
                                    id: order.id,
                                    data: { orderStatus: "confirmed" }
                                  })}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-red-600"
                                  onClick={() => updateOrderMutation.mutate({
                                    id: order.id,
                                    data: { orderStatus: "cancelled" }
                                  })}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
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

        <TabsContent value="settings" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Tienda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Activar Tienda Online</Label>
                    <p className="text-sm text-muted-foreground">
                      Tu tienda será visible públicamente
                    </p>
                  </div>
                  <Switch
                    checked={settingsForm.isActive || false}
                    onCheckedChange={(v) => setSettingsForm({ ...settingsForm, isActive: v })}
                    data-testid="switch-store-active"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nombre de la Tienda</Label>
                  <Input
                    value={settingsForm.storeName || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                    placeholder="Mi Ferretería Online"
                    data-testid="input-store-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={settingsForm.storeDescription || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeDescription: e.target.value })}
                    placeholder="Descripción de tu tienda..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Select
                    value={settingsForm.currency || "ARS"}
                    onValueChange={(v) => setSettingsForm({ ...settingsForm, currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">Pesos Argentinos (ARS)</SelectItem>
                      <SelectItem value="USD">Dólares (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Envíos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Habilitar Envíos</Label>
                  <Switch
                    checked={settingsForm.shippingEnabled || false}
                    onCheckedChange={(v) => setSettingsForm({ ...settingsForm, shippingEnabled: v })}
                  />
                </div>

                {settingsForm.shippingEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Costo de Envío Fijo</Label>
                      <Input
                        type="number"
                        value={settingsForm.flatShippingRate || ""}
                        onChange={(e) => setSettingsForm({ ...settingsForm, flatShippingRate: e.target.value })}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Envío Gratis desde ($)</Label>
                      <Input
                        type="number"
                        value={settingsForm.freeShippingMinAmount || ""}
                        onChange={(e) => setSettingsForm({ ...settingsForm, freeShippingMinAmount: e.target.value })}
                        placeholder="Sin mínimo"
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between">
                  <Label>Retiro en Local</Label>
                  <Switch
                    checked={settingsForm.localPickupEnabled || false}
                    onCheckedChange={(v) => setSettingsForm({ ...settingsForm, localPickupEnabled: v })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Métodos de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Pago Contra Entrega</Label>
                    <p className="text-sm text-muted-foreground">Efectivo al recibir</p>
                  </div>
                  <Switch
                    checked={settingsForm.paymentOnDeliveryEnabled || false}
                    onCheckedChange={(v) => setSettingsForm({ ...settingsForm, paymentOnDeliveryEnabled: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Transferencia Bancaria</Label>
                    <p className="text-sm text-muted-foreground">CBU / Alias</p>
                  </div>
                  <Switch
                    checked={settingsForm.bankTransferEnabled || false}
                    onCheckedChange={(v) => setSettingsForm({ ...settingsForm, bankTransferEnabled: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Stripe</Label>
                    <p className="text-sm text-muted-foreground">Tarjetas internacionales</p>
                  </div>
                  <Switch
                    checked={settingsForm.stripeEnabled || false}
                    onCheckedChange={(v) => setSettingsForm({ ...settingsForm, stripeEnabled: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>MercadoPago</Label>
                    <p className="text-sm text-muted-foreground">Próximamente</p>
                  </div>
                  <Switch
                    checked={settingsForm.mercadoPagoEnabled || false}
                    onCheckedChange={(v) => setSettingsForm({ ...settingsForm, mercadoPagoEnabled: v })}
                    disabled
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Notificar nuevos pedidos</Label>
                  <Switch
                    checked={settingsForm.notifyNewOrders || false}
                    onCheckedChange={(v) => setSettingsForm({ ...settingsForm, notifyNewOrders: v })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email de notificación</Label>
                  <Input
                    type="email"
                    value={settingsForm.notificationEmail || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, notificationEmail: e.target.value })}
                    placeholder="ventas@miferreteria.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>WhatsApp de notificación</Label>
                  <Input
                    value={settingsForm.notificationWhatsapp || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, notificationWhatsapp: e.target.value })}
                    placeholder="+54 11 1234-5678"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => saveSettingsMutation.mutate(settingsForm)}
              disabled={saveSettingsMutation.isPending}
              data-testid="button-save-ecommerce-settings"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveSettingsMutation.isPending ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pedido {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Detalles del pedido
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Cliente</h4>
                  <p>{selectedOrder.customerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customerEmail}</p>
                  {selectedOrder.customerPhone && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.customerPhone}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Envío</h4>
                  {selectedOrder.shippingAddress ? (
                    <>
                      <p>{selectedOrder.shippingAddress}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.shippingCity}, {selectedOrder.shippingProvince}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Retiro en local</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span>Subtotal:</span>
                  <span>${Number(selectedOrder.subtotal).toLocaleString()}</span>
                </div>
                {Number(selectedOrder.shippingCost) > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Envío:</span>
                    <span>${Number(selectedOrder.shippingCost).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-bold text-lg mt-2">
                  <span>Total:</span>
                  <span>${Number(selectedOrder.total).toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label>Estado del Pedido</Label>
                <Select
                  value={selectedOrder.orderStatus || "pending"}
                  onValueChange={(v) => updateOrderMutation.mutate({
                    id: selectedOrder.id,
                    data: { orderStatus: v }
                  })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(orderStatuses).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOrder.customerNotes && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Notas del cliente</h4>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customerNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
}
