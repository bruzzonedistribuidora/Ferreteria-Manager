import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Brain, TrendingDown, Package, ShoppingCart, Sparkles, AlertTriangle, BarChart3 } from "lucide-react";
import type { Product, Category, Supplier } from "@shared/schema";

type ProductWithCategory = Product & { category: Category | null };

export default function PurchasesAI() {
  const { data: products = [], isLoading: loadingProducts, refetch } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // AI-like recommendations based on stock data
  const lowStockProducts = products.filter(p => 
    p.isActive && p.stockQuantity <= (p.reorderPoint || 10)
  ).sort((a, b) => a.stockQuantity - b.stockQuantity);

  const outOfStockProducts = products.filter(p => p.isActive && p.stockQuantity <= 0);

  // Recommended purchase quantities (basic algorithm)
  const recommendations = lowStockProducts.map(product => {
    const reorderPoint = product.reorderPoint || 10;
    const maxStock = product.maxStockLevel || reorderPoint * 3;
    const suggestedQuantity = Math.max(maxStock - product.stockQuantity, reorderPoint);
    const estimatedCost = suggestedQuantity * Number(product.costWithTax || product.costPrice || 0);
    
    return {
      product,
      suggestedQuantity,
      estimatedCost,
      priority: product.stockQuantity <= 0 ? 'urgent' : 
                product.stockQuantity <= (product.minStockLevel || 5) ? 'high' : 'medium'
    };
  });

  const totalEstimatedCost = recommendations.reduce((sum, r) => sum + r.estimatedCost, 0);
  const urgentCount = recommendations.filter(r => r.priority === 'urgent').length;
  const highCount = recommendations.filter(r => r.priority === 'high').length;

  const PriorityBadge = ({ priority }: { priority: string }) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgente</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 text-white">Alta</Badge>;
      default:
        return <Badge variant="outline">Media</Badge>;
    }
  };

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Compras & IA</h1>
            <p className="text-slate-500 dark:text-slate-400">Recomendaciones inteligentes de compra basadas en tu inventario.</p>
          </div>
          <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar Análisis
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Productos a Reponer</CardTitle>
              <Brain className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300" data-testid="count-to-reorder">
                {recommendations.length}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400">recomendaciones activas</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Urgentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300" data-testid="count-urgent">
                {urgentCount}
              </div>
              <p className="text-xs text-red-600 dark:text-red-400">sin stock</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Prioridad Alta</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300" data-testid="count-high">
                {highCount}
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400">bajo mínimo</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Inversión Estimada</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300" data-testid="estimated-cost">
                ${totalEstimatedCost.toFixed(0)}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">para reponer todo</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Recomendaciones de Compra
            </CardTitle>
            <CardDescription>
              Análisis inteligente basado en niveles de stock, puntos de reorden y tendencias de venta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-10">
                <Package className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-green-700">¡Tu inventario está bien abastecido!</p>
                <p className="text-muted-foreground">No hay productos que necesiten reposición en este momento.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-center">Stock Actual</TableHead>
                    <TableHead className="text-center">Punto Reorden</TableHead>
                    <TableHead className="text-center">Cantidad Sugerida</TableHead>
                    <TableHead className="text-right">Costo Est.</TableHead>
                    <TableHead className="text-center">Prioridad</TableHead>
                    <TableHead className="text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recommendations.map(rec => (
                    <TableRow key={rec.product.id} data-testid={`row-product-${rec.product.id}`}>
                      <TableCell className="font-mono text-sm">{rec.product.sku}</TableCell>
                      <TableCell className="font-medium">{rec.product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{rec.product.category?.name || "-"}</TableCell>
                      <TableCell className="text-center">
                        <span className={rec.product.stockQuantity <= 0 ? 'text-red-600 font-bold' : rec.product.stockQuantity <= (rec.product.minStockLevel || 5) ? 'text-orange-600 font-bold' : ''}>
                          {rec.product.stockQuantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {rec.product.reorderPoint || 10}
                      </TableCell>
                      <TableCell className="text-center font-bold text-blue-600">
                        {rec.suggestedQuantity}
                      </TableCell>
                      <TableCell className="text-right">
                        ${rec.estimatedCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <PriorityBadge priority={rec.priority} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button size="sm" variant="outline" data-testid={`button-add-${rec.product.id}`}>
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          A Pedido
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Proveedores Activos
            </CardTitle>
            <CardDescription>
              Proveedores disponibles para realizar pedidos de compra.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {suppliers.filter(s => s.isActive).slice(0, 6).map(supplier => (
                <Card key={supplier.id} className="bg-slate-50 dark:bg-slate-900">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-xs text-muted-foreground">{supplier.phone || supplier.email}</p>
                      </div>
                      <Badge variant="outline">
                        {supplier.paymentTermDays || 30}d
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
