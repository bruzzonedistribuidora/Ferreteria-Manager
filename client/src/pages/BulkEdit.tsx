import { Layout } from "@/components/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RefreshCw, Edit3, Percent, DollarSign, Tag, Package, CheckSquare, Square, Filter } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category, Brand } from "@shared/schema";

type ProductWithCategory = Product & { category: Category | null };

export default function BulkEdit() {
  const { toast } = useToast();
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editType, setEditType] = useState<"price_percent" | "price_fixed" | "profit" | "status">("price_percent");
  const [editValue, setEditValue] = useState("");

  const { data: products = [], isLoading } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const bulkUpdate = useMutation({
    mutationFn: async (data: { productIds: number[]; editType: string; value: string }) => {
      const res = await apiRequest("POST", "/api/products/bulk-update", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Actualización Masiva", description: `${data.updated || selectedProducts.size} productos actualizados.` });
      setDialogOpen(false);
      setSelectedProducts(new Set());
      setEditValue("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.categoryId?.toString() === categoryFilter;
    const matchesBrand = brandFilter === "all" || p.brandId?.toString() === brandFilter;
    return matchesSearch && matchesCategory && matchesBrand && p.isActive;
  });

  const toggleProduct = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const toggleAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleApply = () => {
    if (selectedProducts.size === 0 || !editValue) return;
    bulkUpdate.mutate({
      productIds: Array.from(selectedProducts),
      editType,
      value: editValue
    });
  };

  const editTypeLabels: Record<string, string> = {
    price_percent: "Ajustar Precio %",
    price_fixed: "Establecer Precio",
    profit: "Cambiar % Ganancia",
    status: "Cambiar Estado"
  };

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Modificación Masiva</h1>
            <p className="text-slate-500 dark:text-slate-400">Edita múltiples productos a la vez.</p>
          </div>
          {selectedProducts.size > 0 && (
            <Button onClick={() => setDialogOpen(true)} data-testid="button-bulk-action">
              <Edit3 className="h-4 w-4 mr-2" />
              Editar {selectedProducts.size} productos
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <Input
                  placeholder="Nombre o SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Marca</Label>
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger data-testid="select-brand">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {brands.filter(b => b.isActive).map(brand => (
                      <SelectItem key={brand.id} value={brand.id.toString()}>{brand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={toggleAll} className="w-full" data-testid="button-select-all">
                  {selectedProducts.size === filteredProducts.length ? (
                    <>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Deseleccionar Todo
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Seleccionar Todo ({filteredProducts.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos ({filteredProducts.length})
            </CardTitle>
            <CardDescription>
              {selectedProducts.size} productos seleccionados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Costo</TableHead>
                      <TableHead className="text-center">% Gan.</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                          No hay productos que coincidan con los filtros.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map(product => (
                        <TableRow 
                          key={product.id} 
                          className={selectedProducts.has(product.id) ? "bg-orange-50 dark:bg-orange-950" : ""}
                          data-testid={`row-product-${product.id}`}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.has(product.id)}
                              onCheckedChange={() => toggleProduct(product.id)}
                              data-testid={`checkbox-product-${product.id}`}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="text-muted-foreground">{product.category?.name || "-"}</TableCell>
                          <TableCell className="text-right">${Number(product.costWithTax || product.costPrice || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-center">{product.profitPercent}%</TableCell>
                          <TableCell className="text-right font-bold">${Number(product.price).toFixed(2)}</TableCell>
                          <TableCell className="text-center">{product.stockQuantity}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edición Masiva - {selectedProducts.size} productos</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Edición</Label>
                <Select value={editType} onValueChange={(v: any) => setEditType(v)}>
                  <SelectTrigger data-testid="select-edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price_percent">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Ajustar Precio por Porcentaje
                      </div>
                    </SelectItem>
                    <SelectItem value="price_fixed">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Establecer Precio Fijo
                      </div>
                    </SelectItem>
                    <SelectItem value="profit">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Cambiar % de Ganancia
                      </div>
                    </SelectItem>
                    <SelectItem value="status">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Cambiar Estado (Activo/Inactivo)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {editType === "price_percent" && "Porcentaje de Ajuste (ej: 10 para +10%, -5 para -5%)"}
                  {editType === "price_fixed" && "Nuevo Precio ($)"}
                  {editType === "profit" && "Nuevo % de Ganancia"}
                  {editType === "status" && "Estado (1=Activo, 0=Inactivo)"}
                </Label>
                <Input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={editType === "status" ? "1 o 0" : "Valor"}
                  data-testid="input-value"
                />
                {editType === "price_percent" && (
                  <p className="text-xs text-muted-foreground">
                    Ej: 10 aumenta 10%, -5 reduce 5%
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleApply}
                disabled={!editValue || bulkUpdate.isPending}
                data-testid="button-apply"
              >
                {bulkUpdate.isPending ? "Aplicando..." : "Aplicar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
