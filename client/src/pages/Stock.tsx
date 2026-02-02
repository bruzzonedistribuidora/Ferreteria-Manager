import { Layout } from "@/components/Layout";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Warehouse, 
  MapPin, 
  ArrowUpDown, 
  AlertTriangle,
  Plus,
  Loader2,
  Package,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  Search,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { StockLocation, StockMovementWithDetails, StockAlert, Product } from "@shared/schema";

export default function Stock() {
  const [activeTab, setActiveTab] = useState("alerts");
  
  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">Control de Stock</h1>
            <p className="text-gray-500">Gestión de inventario, ubicaciones y alertas</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid gap-1">
            <TabsTrigger value="alerts" className="flex items-center gap-2" data-testid="tab-alerts">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Alertas</span>
            </TabsTrigger>
            <TabsTrigger value="movements" className="flex items-center gap-2" data-testid="tab-movements">
              <ArrowUpDown className="w-4 h-4" />
              <span className="hidden sm:inline">Movimientos</span>
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center gap-2" data-testid="tab-locations">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Ubicaciones</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="mt-6">
            <AlertsTab />
          </TabsContent>

          <TabsContent value="movements" className="mt-6">
            <MovementsTab />
          </TabsContent>

          <TabsContent value="locations" className="mt-6">
            <LocationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function AlertsTab() {
  const { data: alerts = [], isLoading } = useQuery<StockAlert[]>({
    queryKey: ['/api/stock/alerts'],
  });

  const outOfStock = alerts.filter(a => a.alertType === 'out_of_stock');
  const lowStock = alerts.filter(a => a.alertType === 'low_stock');
  const overStock = alerts.filter(a => a.alertType === 'over_stock');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium">Sin Stock</p>
                <p className="text-2xl font-bold text-red-700">{outOfStock.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-yellow-600 font-medium">Stock Bajo</p>
                <p className="text-2xl font-bold text-yellow-700">{lowStock.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Sobrestock</p>
                <p className="text-2xl font-bold text-blue-700">{overStock.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay alertas de stock activas</p>
            <p className="text-sm">Todos los productos tienen niveles de stock adecuados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {outOfStock.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  Productos Sin Stock ({outOfStock.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {outOfStock.map(alert => (
                    <div key={alert.product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg" data-testid={`alert-out-${alert.product.id}`}>
                      <div>
                        <p className="font-medium text-red-700">{alert.product.name}</p>
                        <p className="text-sm text-red-500">SKU: {alert.product.sku}</p>
                      </div>
                      <Badge className="bg-red-100 text-red-700">0 unidades</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {lowStock.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <TrendingDown className="w-5 h-5" />
                  Productos con Stock Bajo ({lowStock.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowStock.map(alert => (
                    <div key={alert.product.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg" data-testid={`alert-low-${alert.product.id}`}>
                      <div>
                        <p className="font-medium text-yellow-700">{alert.product.name}</p>
                        <p className="text-sm text-yellow-500">SKU: {alert.product.sku} | Mínimo: {alert.minLevel}</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-700">{alert.currentStock} unidades</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {overStock.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <TrendingUp className="w-5 h-5" />
                  Productos con Sobrestock ({overStock.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overStock.map(alert => (
                    <div key={alert.product.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg" data-testid={`alert-over-${alert.product.id}`}>
                      <div>
                        <p className="font-medium text-blue-700">{alert.product.name}</p>
                        <p className="text-sm text-blue-500">SKU: {alert.product.sku} | Máximo: {alert.maxLevel}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700">{alert.currentStock} unidades</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function MovementsTab() {
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [adjustmentQty, setAdjustmentQty] = useState("");
  const [adjustmentNotes, setAdjustmentNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: movements = [], isLoading } = useQuery<StockMovementWithDetails[]>({
    queryKey: ['/api/stock-movements'],
  });

  const { data: products = [] } = useQuery<(Product & { category: any })[]>({
    queryKey: ['/api/products'],
  });

  const adjustMutation = useMutation({
    mutationFn: async (data: { productId: number; quantity: number; type: 'add' | 'subtract'; notes?: string }) => {
      return apiRequest('POST', '/api/stock/adjust', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stock/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsAdjustDialogOpen(false);
      setSelectedProductId(null);
      setAdjustmentQty("");
      setAdjustmentNotes("");
      toast({ title: "Stock ajustado", description: "El movimiento fue registrado correctamente" });
    },
  });

  const getMovementIcon = (type: string) => {
    if (type.includes('add') || type === 'entry' || type === 'purchase') {
      return <ArrowUp className="w-4 h-4 text-green-500" />;
    }
    return <ArrowDown className="w-4 h-4 text-red-500" />;
  };

  const getMovementLabel = (type: string) => {
    const labels: Record<string, string> = {
      entry: 'Entrada',
      exit: 'Salida',
      adjustment_add: 'Ajuste (+)',
      adjustment_subtract: 'Ajuste (-)',
      purchase: 'Compra',
      sale: 'Venta',
      transfer: 'Transferencia',
    };
    return labels[type] || type;
  };

  const handleAdjust = () => {
    if (!selectedProductId || !adjustmentQty) return;
    adjustMutation.mutate({
      productId: selectedProductId,
      quantity: parseInt(adjustmentQty),
      type: adjustmentType,
      notes: adjustmentNotes || undefined,
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-product"
            />
          </div>
          <Button onClick={() => setIsAdjustDialogOpen(true)} data-testid="button-adjust-stock">
            <Plus className="w-4 h-4 mr-2" />
            Ajustar Stock
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-orange-500" />
              Historial de Movimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {movements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ArrowUpDown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay movimientos de stock registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {movements.slice(0, 50).map(movement => (
                  <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`movement-${movement.id}`}>
                    <div className="flex items-center gap-3">
                      {getMovementIcon(movement.movementType)}
                      <div>
                        <p className="font-medium">{movement.product?.name}</p>
                        <p className="text-sm text-gray-500">
                          {getMovementLabel(movement.movementType)} - {movement.createdAt && format(new Date(movement.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={movement.movementType.includes('add') || movement.movementType === 'entry' || movement.movementType === 'purchase' ? 'default' : 'secondary'}>
                        {movement.movementType.includes('add') || movement.movementType === 'entry' || movement.movementType === 'purchase' ? '+' : '-'}{movement.quantity}
                      </Badge>
                      <p className="text-sm text-gray-500 mt-1">
                        Stock: {movement.previousStock} → {movement.newStock}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Producto</label>
              <Select value={selectedProductId?.toString() || ""} onValueChange={(v) => setSelectedProductId(Number(v))}>
                <SelectTrigger data-testid="select-product">
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.filter(p => p.isActive).map(product => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} (Stock: {product.stockQuantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Tipo de Ajuste</label>
              <Select value={adjustmentType} onValueChange={(v) => setAdjustmentType(v as 'add' | 'subtract')}>
                <SelectTrigger data-testid="select-adjust-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Agregar (+)</SelectItem>
                  <SelectItem value="subtract">Quitar (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Cantidad</label>
              <Input
                type="number"
                min="1"
                value={adjustmentQty}
                onChange={(e) => setAdjustmentQty(e.target.value)}
                placeholder="Ej: 10"
                data-testid="input-quantity"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Textarea
                value={adjustmentNotes}
                onChange={(e) => setAdjustmentNotes(e.target.value)}
                placeholder="Motivo del ajuste..."
                data-testid="input-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAdjust} 
              disabled={!selectedProductId || !adjustmentQty || adjustMutation.isPending}
              data-testid="button-confirm-adjust"
            >
              {adjustMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function LocationsTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StockLocation | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    zone: "",
    aisle: "",
    shelf: "",
    bin: "",
  });

  const { data: locations = [], isLoading } = useQuery<StockLocation[]>({
    queryKey: ['/api/stock-locations'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('POST', '/api/stock-locations', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stock-locations'] });
      resetForm();
      toast({ title: "Ubicación creada", description: "La ubicación fue creada correctamente" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      return apiRequest('PATCH', `/api/stock-locations/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stock-locations'] });
      resetForm();
      toast({ title: "Ubicación actualizada", description: "La ubicación fue actualizada correctamente" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/stock-locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stock-locations'] });
      toast({ title: "Ubicación eliminada", description: "La ubicación fue eliminada correctamente" });
    },
  });

  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingLocation(null);
    setFormData({ code: "", name: "", description: "", zone: "", aisle: "", shelf: "", bin: "" });
  };

  const handleEdit = (location: StockLocation) => {
    setEditingLocation(location);
    setFormData({
      code: location.code,
      name: location.name,
      description: location.description || "",
      zone: location.zone || "",
      aisle: location.aisle || "",
      shelf: location.shelf || "",
      bin: location.bin || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingLocation) {
      updateMutation.mutate({ id: editingLocation.id, data: formData });
    } else {
      createMutation.mutate(formData);
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
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-new-location">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Ubicación
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              Ubicaciones del Depósito
            </CardTitle>
          </CardHeader>
          <CardContent>
            {locations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay ubicaciones configuradas</p>
                <p className="text-sm">Cree ubicaciones para organizar su depósito</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locations.map(location => (
                  <Card key={location.id} className="hover-elevate" data-testid={`card-location-${location.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className="mb-2">{location.code}</Badge>
                          <p className="font-medium">{location.name}</p>
                          {location.description && (
                            <p className="text-sm text-gray-500 mt-1">{location.description}</p>
                          )}
                          <div className="mt-2 text-xs text-gray-400 space-y-1">
                            {location.zone && <p>Zona: {location.zone}</p>}
                            {location.aisle && <p>Pasillo: {location.aisle}</p>}
                            {location.shelf && <p>Estante: {location.shelf}</p>}
                            {location.bin && <p>Contenedor: {location.bin}</p>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(location)} data-testid={`button-edit-location-${location.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => deleteMutation.mutate(location.id)}
                            data-testid={`button-delete-location-${location.id}`}
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
      </div>

      <Dialog open={isDialogOpen} onOpenChange={resetForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Editar Ubicación' : 'Nueva Ubicación'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Código *</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ej: A-01-01"
                  data-testid="input-code"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Estante Principal"
                  data-testid="input-name"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional"
                data-testid="input-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Zona</label>
                <Input
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  placeholder="Ej: A"
                  data-testid="input-zone"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Pasillo</label>
                <Input
                  value={formData.aisle}
                  onChange={(e) => setFormData({ ...formData, aisle: e.target.value })}
                  placeholder="Ej: 01"
                  data-testid="input-aisle"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Estante</label>
                <Input
                  value={formData.shelf}
                  onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                  placeholder="Ej: 01"
                  data-testid="input-shelf"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Contenedor</label>
                <Input
                  value={formData.bin}
                  onChange={(e) => setFormData({ ...formData, bin: e.target.value })}
                  placeholder="Ej: A"
                  data-testid="input-bin"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.code || !formData.name || createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-location"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingLocation ? 'Guardar Cambios' : 'Crear Ubicación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
