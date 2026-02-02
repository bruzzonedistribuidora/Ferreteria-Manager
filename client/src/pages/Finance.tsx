import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw, DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, Building2, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import type { Sale, CashRegister, Client, Supplier } from "@shared/schema";

type SaleWithDetails = Sale & { client: any; items: any[] };
type ClientWithBalance = Client & { currentBalance: number };
type SupplierWithBalance = Supplier & { currentBalance: number };

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#eab308', '#8b5cf6'];

export default function Finance() {
  const { data: sales = [], isLoading: loadingSales } = useQuery<SaleWithDetails[]>({
    queryKey: ["/api/sales"],
  });

  const { data: cashRegisters = [], isLoading: loadingCash } = useQuery<CashRegister[]>({
    queryKey: ["/api/cash-registers"],
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery<ClientWithBalance[]>({
    queryKey: ["/api/clients-with-balance"],
  });

  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery<SupplierWithBalance[]>({
    queryKey: ["/api/suppliers-with-balance"],
  });

  // Calculate today's data
  const today = new Date();
  const todaySales = sales.filter(s => {
    if (!s.createdAt) return false;
    const saleDate = new Date(s.createdAt);
    return saleDate >= startOfDay(today) && saleDate <= endOfDay(today);
  });
  
  const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);

  // Last 7 days chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const daySales = sales.filter(s => {
      if (!s.createdAt) return false;
      const saleDate = new Date(s.createdAt);
      return saleDate >= startOfDay(date) && saleDate <= endOfDay(date);
    });
    return {
      day: format(date, 'EEE', { locale: es }),
      ventas: daySales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0),
      cantidad: daySales.length
    };
  });

  // Cash register balance
  const totalCashBalance = cashRegisters.reduce((sum, cr) => sum + Number(cr.currentBalance || 0), 0);

  // Client debt
  const totalClientDebt = clients
    .filter(c => c.currentBalance > 0)
    .reduce((sum, c) => sum + c.currentBalance, 0);

  // Supplier debt
  const totalSupplierDebt = suppliers
    .filter(s => s.currentBalance > 0)
    .reduce((sum, s) => sum + s.currentBalance, 0);

  // Payment method distribution (this month)
  const thisMonth = sales.filter(s => {
    if (!s.createdAt) return false;
    const saleDate = new Date(s.createdAt);
    return saleDate.getMonth() === today.getMonth() && saleDate.getFullYear() === today.getFullYear();
  });

  const paymentDistribution = thisMonth.reduce((acc, sale) => {
    const method = sale.paymentMethod || 'other';
    const labels: Record<string, string> = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia',
      check: 'Cheque',
      credit_account: 'Cta. Cte.',
      mixed: 'Mixto'
    };
    const label = labels[method] || 'Otro';
    acc[label] = (acc[label] || 0) + Number(sale.totalAmount || 0);
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(paymentDistribution).map(([name, value]) => ({ name, value }));

  const isLoading = loadingSales || loadingCash || loadingClients || loadingSuppliers;

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Finanzas</h1>
          <p className="text-slate-500 dark:text-slate-400">Resumen financiero del negocio.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-5">
              <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Ventas Hoy</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300" data-testid="today-revenue">
                    ${todayRevenue.toFixed(2)}
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {todaySales.length} ventas
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Efectivo en Caja</CardTitle>
                  <Wallet className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300" data-testid="cash-balance">
                    ${totalCashBalance.toFixed(2)}
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {cashRegisters.filter(cr => cr.isActive).length} cajas activas
                  </p>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Por Cobrar</CardTitle>
                  <Users className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 flex items-center">
                    ${totalClientDebt.toFixed(2)}
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    deuda de clientes
                  </p>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Por Pagar</CardTitle>
                  <Building2 className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300 flex items-center">
                    ${totalSupplierDebt.toFixed(2)}
                    <ArrowDownRight className="h-4 w-4 ml-1" />
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    a proveedores
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saldo Neto</CardTitle>
                  <DollarSign className="h-4 w-4 text-slate-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${totalClientDebt - totalSupplierDebt >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${(totalClientDebt - totalSupplierDebt).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    a cobrar - a pagar
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Ventas Últimos 7 Días</CardTitle>
                  <CardDescription>Evolución diaria de ventas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={last7Days}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="day" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ventas']}
                          labelClassName="font-medium"
                        />
                        <Bar dataKey="ventas" fill="#f97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribución por Forma de Pago</CardTitle>
                  <CardDescription>Este mes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {pieData.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Sin datos para este mes
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
