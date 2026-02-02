import { Layout } from "@/components/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Minus, Package, RefreshCw, History, Search } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Product, Category, StockMovement } from "@shared/schema";

type ProductWithCategory = Product & { category: Category | null };

type StockMovementWithProduct = StockMovement & { product: Product | null };

export default function StockAdjustment() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductWithCategory | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract" | "set">("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: products = [], isLoading: loadingProducts } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const { data: movements = [], isLoading: loadingMovements } = useQuery<StockMovementWithProduct[]>({
    queryKey: ["/api/stock-movements"],
  });

  const adjustStock = useMutation({
    mutationFn: async (data: { productId: number; adjustmentType: string; quantity: number; notes: string }) => {
      const res = await apiRequest("POST", "/api/stock-adjustments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      toast({ title: "Ajuste Realizado", description: "El stock ha sido actualizado correctamente." });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setSelectedProduct(null);
    setAdjustmentType("add");
    setQuantity("");
    setReason("");
  };

  const handleSubmit = () => {
    if (!selectedProduct || !quantity) return;
    adjustStock.mutate({
      productId: selectedProduct.id,
      adjustmentType,
      quantity: parseInt(quantity),
      notes: reason
    });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recentMovements = movements
    .filter(m => m.movementType === 'adjustment' || m.movementType === 'manual_adjustment')
    .slice(0, 20);

  const movementTypeLabels: Record<string, string> = {
    sale: "Venta",
    purchase: "Compra",
    adjustment: "Ajuste",
    manual_adjustment: "Ajuste Manual",
    return: "Devolución",
    transfer: "Transferencia"
  };

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Ajuste de Stock</h1>
            <p className="text-slate-500 dark:text-slate-400">Realiza ajustes manuales al inventario.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-adjustment">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Ajuste
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Ajuste de Inventario</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Buscar Producto</Label>
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
                          onClick={() => {
                            setSelectedProduct(product);
                            setSearchTerm("");
                          }}
                          data-testid={`option-product-${product.id}`}
                        >
                          <div>
                            <span className="font-medium">{product.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">({product.sku})</span>
                          </div>
                          <span className="text-sm">Stock: {product.stockQuantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedProduct && (
                  <Card className="bg-slate-50 dark:bg-slate-900">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{selectedProduct.name}</p>
                          <p className="text-sm text-muted-foreground">SKU: {selectedProduct.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Stock Actual</p>
                          <p className="text-2xl font-bold" data-testid="text-current-stock">{selectedProduct.stockQuantity}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Ajuste</Label>
                    <Select value={adjustmentType} onValueChange={(v: "add" | "subtract" | "set") => setAdjustmentType(v)}>
                      <SelectTrigger data-testid="select-adjustment-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4 text-green-600" />
                            Sumar Stock
                          </div>
                        </SelectItem>
                        <SelectItem value="subtract">
                          <div className="flex items-center gap-2">
                            <Minus className="h-4 w-4 text-red-600" />
                            Restar Stock
                          </div>
                        </SelectItem>
                        <SelectItem value="set">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-600" />
                            Establecer Cantidad
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="0"
                      data-testid="input-quantity"
                    />
                  </div>
                </div>

                {selectedProduct && quantity && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md text-center">
                    <p className="text-sm text-muted-foreground">Nuevo Stock:</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300" data-testid="text-new-stock">
                      {adjustmentType === "set" 
                        ? parseInt(quantity) 
                        : adjustmentType === "add" 
                          ? selectedProduct.stockQuantity + parseInt(quantity || "0")
                          : selectedProduct.stockQuantity - parseInt(quantity || "0")}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Motivo del Ajuste</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe el motivo del ajuste (inventario físico, pérdida, etc.)"
                    data-testid="input-reason"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!selectedProduct || !quantity || adjustStock.isPending}
                  data-testid="button-confirm-adjustment"
                >
                  {adjustStock.isPending ? "Procesando..." : "Confirmar Ajuste"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de Ajustes
            </CardTitle>
            <CardDescription>Últimos ajustes manuales realizados al inventario.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMovements ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-center">Stock Anterior</TableHead>
                    <TableHead className="text-center">Stock Nuevo</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        No hay ajustes registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentMovements.map(movement => (
                      <TableRow key={movement.id} data-testid={`row-movement-${movement.id}`}>
                        <TableCell className="text-sm">
                          {movement.createdAt ? format(new Date(movement.createdAt), "dd/MM/yyyy HH:mm", { locale: es }) : "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {movement.product?.name || `Producto #${movement.productId}`}
                        </TableCell>
                        <TableCell>
                          {movementTypeLabels[movement.movementType] || movement.movementType}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={movement.quantity > 0 ? "text-green-600" : "text-red-600"}>
                            {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">{movement.previousStock}</TableCell>
                        <TableCell className="text-center font-medium">{movement.newStock}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {movement.notes || "-"}
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
