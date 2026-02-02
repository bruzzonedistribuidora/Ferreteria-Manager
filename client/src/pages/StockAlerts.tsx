import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, PackageX, TrendingDown, RefreshCw, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Product, Category } from "@shared/schema";

type ProductWithCategory = Product & { category: Category | null };

export default function StockAlerts() {
  const { data: products = [], isLoading, refetch } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const outOfStock = products.filter(p => p.stockQuantity <= 0 && p.isActive);
  const lowStock = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= (p.minStockLevel || 5) && p.isActive);
  const reorderPoint = products.filter(p => p.stockQuantity <= (p.reorderPoint || 10) && p.stockQuantity > (p.minStockLevel || 5) && p.isActive);

  const AlertBadge = ({ type }: { type: 'out' | 'low' | 'reorder' }) => {
    if (type === 'out') return <Badge variant="destructive" data-testid="badge-out-stock">Sin Stock</Badge>;
    if (type === 'low') return <Badge className="bg-orange-500 text-white" data-testid="badge-low-stock">Stock Bajo</Badge>;
    return <Badge variant="outline" className="border-yellow-500 text-yellow-700" data-testid="badge-reorder">Reponer</Badge>;
  };

  const ProductTable = ({ items, alertType }: { items: ProductWithCategory[], alertType: 'out' | 'low' | 'reorder' }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>Producto</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead className="text-center">Stock Actual</TableHead>
          <TableHead className="text-center">Stock Mínimo</TableHead>
          <TableHead className="text-center">Punto Pedido</TableHead>
          <TableHead className="text-center">Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
              No hay productos en esta categoría de alerta.
            </TableCell>
          </TableRow>
        ) : (
          items.map(product => (
            <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
              <TableCell className="font-mono text-sm">{product.sku}</TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.category?.name || "-"}</TableCell>
              <TableCell className="text-center">
                <span className={`font-bold ${product.stockQuantity <= 0 ? 'text-red-600' : product.stockQuantity <= (product.minStockLevel || 5) ? 'text-orange-600' : 'text-yellow-600'}`}>
                  {product.stockQuantity}
                </span>
              </TableCell>
              <TableCell className="text-center text-muted-foreground">{product.minStockLevel || 5}</TableCell>
              <TableCell className="text-center text-muted-foreground">{product.reorderPoint || 10}</TableCell>
              <TableCell className="text-center">
                <AlertBadge type={alertType} />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Faltantes y Alertas de Stock</h1>
            <p className="text-slate-500 dark:text-slate-400">Monitorea productos con stock bajo o agotados.</p>
          </div>
          <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Sin Stock</CardTitle>
              <PackageX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-700 dark:text-red-300" data-testid="count-out-stock">{outOfStock.length}</div>
              <p className="text-xs text-red-600 dark:text-red-400">productos agotados</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Stock Bajo</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700 dark:text-orange-300" data-testid="count-low-stock">{lowStock.length}</div>
              <p className="text-xs text-orange-600 dark:text-orange-400">bajo mínimo</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Para Reponer</CardTitle>
              <Package className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300" data-testid="count-reorder">{reorderPoint.length}</div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">en punto de pedido</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Productos con Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Tabs defaultValue="out" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="out" data-testid="tab-out-stock">
                    Sin Stock ({outOfStock.length})
                  </TabsTrigger>
                  <TabsTrigger value="low" data-testid="tab-low-stock">
                    Stock Bajo ({lowStock.length})
                  </TabsTrigger>
                  <TabsTrigger value="reorder" data-testid="tab-reorder">
                    Para Reponer ({reorderPoint.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="out" className="mt-4">
                  <ProductTable items={outOfStock} alertType="out" />
                </TabsContent>
                <TabsContent value="low" className="mt-4">
                  <ProductTable items={lowStock} alertType="low" />
                </TabsContent>
                <TabsContent value="reorder" className="mt-4">
                  <ProductTable items={reorderPoint} alertType="reorder" />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
