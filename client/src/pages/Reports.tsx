import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, FileText, Download, Calendar, DollarSign, TrendingUp, Package, Receipt } from "lucide-react";
import { useState } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import type { Sale, Product, Category } from "@shared/schema";

type SaleWithDetails = Sale & { client: any; items: any[] };
type ProductWithCategory = Product & { category: Category | null };

export default function Reports() {
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");

  const { data: sales = [], isLoading: loadingSales } = useQuery<SaleWithDetails[]>({
    queryKey: ["/api/sales"],
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const now = new Date();
    switch (period) {
      case "current_month":
        setDateFrom(format(startOfMonth(now), 'yyyy-MM-dd'));
        setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
      case "last_month":
        const lastMonth = subMonths(now, 1);
        setDateFrom(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
        setDateTo(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
        break;
      case "last_3_months":
        setDateFrom(format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'));
        setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
    }
  };

  // Filter sales by date range
  const filteredSales = sales.filter(sale => {
    if (!sale.createdAt) return false;
    const saleDate = new Date(sale.createdAt);
    return saleDate >= new Date(dateFrom) && saleDate <= new Date(dateTo + 'T23:59:59');
  });

  // Calculate summaries
  const totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
  const totalSales = filteredSales.length;
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
  
  // Group by payment method
  const byPaymentMethod = filteredSales.reduce((acc, sale) => {
    const method = sale.paymentMethod || 'other';
    if (!acc[method]) acc[method] = { count: 0, total: 0 };
    acc[method].count++;
    acc[method].total += Number(sale.totalAmount || 0);
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  // Group by document type
  const byDocumentType = filteredSales.reduce((acc, sale) => {
    const docType = sale.documentType || 'ingreso';
    if (!acc[docType]) acc[docType] = { count: 0, total: 0 };
    acc[docType].count++;
    acc[docType].total += Number(sale.totalAmount || 0);
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  // Top products
  const productSales = filteredSales.flatMap(s => s.items || []).reduce((acc, item) => {
    if (!item.productId) return acc;
    if (!acc[item.productId]) {
      acc[item.productId] = { name: item.product?.name || `Producto #${item.productId}`, quantity: 0, total: 0 };
    }
    acc[item.productId].quantity += item.quantity;
    acc[item.productId].total += Number(item.subtotal || 0);
    return acc;
  }, {} as Record<number, { name: string; quantity: number; total: number }>);

  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);

  const paymentLabels: Record<string, string> = {
    cash: "Efectivo",
    card: "Tarjeta",
    transfer: "Transferencia",
    check: "Cheque",
    credit_account: "Cuenta Corriente",
    mixed: "Mixto"
  };

  const docTypeLabels: Record<string, string> = {
    ingreso: "Ticket/Ingreso",
    factura_a: "Factura A",
    factura_b: "Factura B",
    factura_c: "Factura C",
    presupuesto: "Presupuesto"
  };

  const isLoading = loadingSales || loadingProducts;

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Informes e IVA</h1>
            <p className="text-slate-500 dark:text-slate-400">Reportes de ventas, productos e impuestos.</p>
          </div>
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Período de Análisis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="space-y-2">
                <Label>Período Rápido</Label>
                <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                  <SelectTrigger className="w-48" data-testid="select-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current_month">Mes Actual</SelectItem>
                    <SelectItem value="last_month">Mes Anterior</SelectItem>
                    <SelectItem value="last_3_months">Últimos 3 Meses</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Desde</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setSelectedPeriod("custom"); }}
                  data-testid="input-date-from"
                />
              </div>
              <div className="space-y-2">
                <Label>Hasta</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setSelectedPeriod("custom"); }}
                  data-testid="input-date-to"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facturación Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-revenue">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{totalSales} ventas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${avgTicket.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">por venta</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Efectivo</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(byPaymentMethod['cash']?.total || 0).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{byPaymentMethod['cash']?.count || 0} ventas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productos Vendidos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.values(productSales).reduce((sum, p) => sum + p.quantity, 0)}</div>
              <p className="text-xs text-muted-foreground">unidades</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Tabs defaultValue="payments">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="payments">Por Forma de Pago</TabsTrigger>
                  <TabsTrigger value="documents">Por Tipo Documento</TabsTrigger>
                  <TabsTrigger value="products">Productos Más Vendidos</TabsTrigger>
                </TabsList>

                <TabsContent value="payments" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Forma de Pago</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">% del Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(byPaymentMethod).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                            No hay datos para el período seleccionado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        Object.entries(byPaymentMethod)
                          .sort((a, b) => b[1].total - a[1].total)
                          .map(([method, data]) => (
                            <TableRow key={method}>
                              <TableCell className="font-medium">{paymentLabels[method] || method}</TableCell>
                              <TableCell className="text-center">{data.count}</TableCell>
                              <TableCell className="text-right font-bold">${data.total.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {((data.total / totalRevenue) * 100).toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="documents" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo de Documento</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">% del Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(byDocumentType).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                            No hay datos para el período seleccionado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        Object.entries(byDocumentType)
                          .sort((a, b) => b[1].total - a[1].total)
                          .map(([docType, data]) => (
                            <TableRow key={docType}>
                              <TableCell className="font-medium">{docTypeLabels[docType] || docType}</TableCell>
                              <TableCell className="text-center">{data.count}</TableCell>
                              <TableCell className="text-right font-bold">${data.total.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {((data.total / totalRevenue) * 100).toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="products" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">Total Vendido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                            No hay datos para el período seleccionado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        topProducts.map(([id, data], index) => (
                          <TableRow key={id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>{data.name}</TableCell>
                            <TableCell className="text-center">{data.quantity}</TableCell>
                            <TableCell className="text-right font-bold">${data.total.toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
