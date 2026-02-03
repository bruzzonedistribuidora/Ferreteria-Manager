import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Wallet,
  CreditCard,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend
} from "recharts";
import type { Sale } from "@shared/schema";

const COLORS = ['#f97316', '#0ea5e9', '#22c55e', '#a855f7', '#ef4444', '#eab308'];

export default function FinanceIntelligence() {
  const [activeTab, setActiveTab] = useState("equilibrio");

  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: expenses = [] } = useQuery<any[]>({
    queryKey: ["/api/cash-movements"],
  });

  // Calculate financial metrics
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Filter sales by period
  const salesToday = sales.filter(s => new Date(s.createdAt!) >= today);
  const salesWeek = sales.filter(s => new Date(s.createdAt!) >= startOfWeek);
  const salesMonth = sales.filter(s => new Date(s.createdAt!) >= startOfMonth);
  const salesYear = sales.filter(s => new Date(s.createdAt!) >= startOfYear);

  // Calculate totals
  const totalToday = salesToday.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
  const totalWeek = salesWeek.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
  const totalMonth = salesMonth.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
  const totalYear = salesYear.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);

  // Estimate costs (simplified: 60% of sales)
  const costRatio = 0.60;
  const grossMarginRatio = 1 - costRatio;

  // Fixed costs estimation (monthly)
  const fixedCostsMonthly = 500000; // Configurable
  const fixedCostsDaily = fixedCostsMonthly / 30;
  const fixedCostsWeekly = fixedCostsMonthly / 4;
  const fixedCostsYearly = fixedCostsMonthly * 12;

  // Break-even calculation
  const calculateBreakEven = (fixedCosts: number, marginRatio: number) => {
    if (marginRatio <= 0) return 0;
    return fixedCosts / marginRatio;
  };

  const breakEvenDaily = calculateBreakEven(fixedCostsDaily, grossMarginRatio);
  const breakEvenWeekly = calculateBreakEven(fixedCostsWeekly, grossMarginRatio);
  const breakEvenMonthly = calculateBreakEven(fixedCostsMonthly, grossMarginRatio);
  const breakEvenYearly = calculateBreakEven(fixedCostsYearly, grossMarginRatio);

  // Progress towards break-even
  const progressDaily = Math.min((totalToday / breakEvenDaily) * 100, 150);
  const progressWeekly = Math.min((totalWeek / breakEvenWeekly) * 100, 150);
  const progressMonthly = Math.min((totalMonth / breakEvenMonthly) * 100, 150);
  const progressYearly = Math.min((totalYear / breakEvenYearly) * 100, 150);

  // Profit calculations
  const profitDaily = totalToday * grossMarginRatio - fixedCostsDaily;
  const profitWeekly = totalWeek * grossMarginRatio - fixedCostsWeekly;
  const profitMonthly = totalMonth * grossMarginRatio - fixedCostsMonthly;
  const profitYearly = totalYear * grossMarginRatio - fixedCostsYearly;

  // Monthly trend data (last 12 months)
  const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const monthSales = sales.filter(s => {
      const saleDate = new Date(s.createdAt!);
      return saleDate.getMonth() === date.getMonth() && 
             saleDate.getFullYear() === date.getFullYear();
    });
    const revenue = monthSales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
    const costs = revenue * costRatio + fixedCostsMonthly;
    const profit = revenue - costs;
    
    return {
      month: date.toLocaleDateString('es-AR', { month: 'short' }),
      ingresos: revenue,
      costos: costs,
      utilidad: profit,
      equilibrio: breakEvenMonthly
    };
  });

  // Cash flow data
  const cashFlowData = [
    { name: 'Efectivo', value: totalMonth * 0.45, color: '#22c55e' },
    { name: 'Tarjetas', value: totalMonth * 0.35, color: '#0ea5e9' },
    { name: 'Transferencias', value: totalMonth * 0.15, color: '#a855f7' },
    { name: 'Cheques', value: totalMonth * 0.05, color: '#f97316' },
  ];

  // Expense breakdown
  const expenseBreakdown = [
    { name: 'Mercadería', value: totalMonth * costRatio, percentage: 60 },
    { name: 'Personal', value: fixedCostsMonthly * 0.4, percentage: 20 },
    { name: 'Alquiler', value: fixedCostsMonthly * 0.25, percentage: 12.5 },
    { name: 'Servicios', value: fixedCostsMonthly * 0.15, percentage: 7.5 },
    { name: 'Otros', value: fixedCostsMonthly * 0.2, percentage: 10 },
  ];

  // Profitability by category (simulated)
  const categoryProfitability = [
    { categoria: 'Herramientas', margen: 35, ventas: totalMonth * 0.25 },
    { categoria: 'Electricidad', margen: 42, ventas: totalMonth * 0.20 },
    { categoria: 'Plomería', margen: 38, ventas: totalMonth * 0.15 },
    { categoria: 'Construcción', margen: 28, ventas: totalMonth * 0.22 },
    { categoria: 'Pinturas', margen: 32, ventas: totalMonth * 0.18 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const BreakEvenCard = ({ 
    title, 
    icon: Icon, 
    breakEven, 
    current, 
    progress, 
    profit,
    period
  }: {
    title: string;
    icon: any;
    breakEven: number;
    current: number;
    progress: number;
    profit: number;
    period: string;
  }) => {
    const isAboveBreakEven = current >= breakEven;
    const remaining = breakEven - current;

    return (
      <Card className="hover-elevate">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {title}
            </CardTitle>
            <Badge variant={isAboveBreakEven ? "default" : "secondary"} className={isAboveBreakEven ? "bg-green-500" : ""}>
              {isAboveBreakEven ? "Superado" : "En curso"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Ventas {period}</span>
              <span className="font-semibold">{formatCurrency(current)}</span>
            </div>
            <Progress 
              value={Math.min(progress, 100)} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span className="text-orange-500 font-medium">PE: {formatCurrency(breakEven)}</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Punto Equilibrio</p>
              <p className="font-semibold text-orange-600">{formatCurrency(breakEven)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {isAboveBreakEven ? "Utilidad" : "Falta para PE"}
              </p>
              <p className={`font-semibold flex items-center gap-1 ${isAboveBreakEven ? "text-green-600" : "text-amber-600"}`}>
                {isAboveBreakEven ? (
                  <><ArrowUpRight className="h-3 w-3" />{formatCurrency(profit)}</>
                ) : (
                  <><Target className="h-3 w-3" />{formatCurrency(remaining)}</>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2" data-testid="text-page-title">
              <Brain className="h-7 w-7 text-orange-500" />
              Centro de Inteligencia Financiera
            </h1>
            <p className="text-slate-500 mt-1">
              Contabilidad analítica, flujos de fondo y análisis de rentabilidad
            </p>
          </div>
          <Button variant="outline" size="sm" data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="equilibrio" data-testid="tab-equilibrio">
              <Target className="h-4 w-4 mr-2" />
              Punto de Equilibrio
            </TabsTrigger>
            <TabsTrigger value="flujos" data-testid="tab-flujos">
              <Activity className="h-4 w-4 mr-2" />
              Flujos de Fondo
            </TabsTrigger>
            <TabsTrigger value="rentabilidad" data-testid="tab-rentabilidad">
              <TrendingUp className="h-4 w-4 mr-2" />
              Rentabilidad
            </TabsTrigger>
            <TabsTrigger value="analitica" data-testid="tab-analitica">
              <PieChart className="h-4 w-4 mr-2" />
              Contabilidad Analítica
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equilibrio" className="space-y-6 mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <BreakEvenCard
                title="Diario"
                icon={Clock}
                breakEven={breakEvenDaily}
                current={totalToday}
                progress={progressDaily}
                profit={profitDaily}
                period="hoy"
              />
              <BreakEvenCard
                title="Semanal"
                icon={Calendar}
                breakEven={breakEvenWeekly}
                current={totalWeek}
                progress={progressWeekly}
                profit={profitWeekly}
                period="esta semana"
              />
              <BreakEvenCard
                title="Mensual"
                icon={BarChart3}
                breakEven={breakEvenMonthly}
                current={totalMonth}
                progress={progressMonthly}
                profit={profitMonthly}
                period="este mes"
              />
              <BreakEvenCard
                title="Anual"
                icon={TrendingUp}
                breakEven={breakEvenYearly}
                current={totalYear}
                progress={progressYearly}
                profit={profitYearly}
                period="este año"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                  Evolución vs Punto de Equilibrio (12 meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis 
                        tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ color: '#1e293b' }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="ingresos" 
                        name="Ingresos"
                        stroke="#22c55e" 
                        fill="#22c55e" 
                        fillOpacity={0.3}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="costos" 
                        name="Costos"
                        stroke="#ef4444" 
                        fill="#ef4444" 
                        fillOpacity={0.2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="equilibrio" 
                        name="Punto Equilibrio"
                        stroke="#f97316" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Margen Bruto Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{(grossMarginRatio * 100).toFixed(0)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Contribución marginal sobre ventas
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Costos Fijos Mensuales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-700">{formatCurrency(fixedCostsMonthly)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Personal, alquiler, servicios
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Días para PE Mensual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {totalMonth > 0 ? Math.ceil(breakEvenMonthly / (totalMonth / now.getDate())) : "--"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Días estimados al ritmo actual
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="flujos" className="space-y-6 mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    Ingresos del Mes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">{formatCurrency(totalMonth)}</div>
                </CardContent>
              </Card>
              <Card className="bg-red-50 border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4" />
                    Egresos del Mes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-700">
                    {formatCurrency(totalMonth * costRatio + fixedCostsMonthly)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Flujo Neto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${profitMonthly >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    {formatCurrency(profitMonthly)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Cobranzas Pendientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-700">
                    {formatCurrency(totalMonth * 0.12)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-orange-500" />
                    Composición de Ingresos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={cashFlowData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {cashFlowData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-500" />
                    Flujo de Caja Proyectado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyTrend.slice(-6)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis 
                          tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="costos" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rentabilidad" className="space-y-6 mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">ROI Mensual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {totalMonth > 0 ? ((profitMonthly / (totalMonth * costRatio + fixedCostsMonthly)) * 100).toFixed(1) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Retorno sobre inversión</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Margen Neto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {totalMonth > 0 ? ((profitMonthly / totalMonth) * 100).toFixed(1) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Utilidad / Ventas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {formatCurrency(salesMonth.length > 0 ? totalMonth / salesMonth.length : 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Venta promedio por cliente</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ventas por Día</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {(salesMonth.length / (now.getDate() || 1)).toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Transacciones diarias promedio</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                  Rentabilidad por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryProfitability} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                      <YAxis dataKey="categoria" type="category" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: number, name: string) => 
                          name === 'margen' ? `${value}%` : formatCurrency(value)
                        }
                      />
                      <Legend />
                      <Bar dataKey="margen" name="Margen %" fill="#f97316" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Top Productos Rentables
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryProfitability.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <span className="font-medium">{item.categoria}</span>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {item.margen}% margen
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Productos Bajo Margen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryProfitability
                      .sort((a, b) => a.margen - b.margen)
                      .slice(0, 5)
                      .map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm">
                              {index + 1}
                            </div>
                            <span className="font-medium">{item.categoria}</span>
                          </div>
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                            {item.margen}% margen
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analitica" className="space-y-6 mt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-orange-500" />
                    Distribución de Costos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={expenseBreakdown}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, percentage }) => `${name} (${percentage}%)`}
                        >
                          {expenseBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Indicadores Clave</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Rotación Stock</span>
                    </div>
                    <span className="font-semibold">4.2x</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Días de Cobro</span>
                    </div>
                    <span className="font-semibold">18 días</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Días de Pago</span>
                    </div>
                    <span className="font-semibold">32 días</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Capital de Trabajo</span>
                    </div>
                    <span className="font-semibold text-green-600">+14 días</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-500" />
                  Evolución de Utilidad Mensual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis 
                        tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="utilidad" 
                        name="Utilidad Neta"
                        stroke="#22c55e" 
                        strokeWidth={3}
                        dot={{ fill: '#22c55e', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Estado de Resultados Simplificado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">Ventas Netas</span>
                      <span className="font-bold text-green-600">{formatCurrency(totalMonth)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b text-sm">
                      <span className="text-muted-foreground pl-4">(-) Costo de Mercadería</span>
                      <span className="text-red-600">{formatCurrency(totalMonth * costRatio)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">Utilidad Bruta</span>
                      <span className="font-bold">{formatCurrency(totalMonth * grossMarginRatio)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b text-sm">
                      <span className="text-muted-foreground pl-4">(-) Gastos Operativos</span>
                      <span className="text-red-600">{formatCurrency(fixedCostsMonthly)}</span>
                    </div>
                    <div className="flex justify-between py-2 bg-slate-50 rounded px-2">
                      <span className="font-bold">Utilidad Neta</span>
                      <span className={`font-bold ${profitMonthly >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(profitMonthly)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Análisis de Costos Fijos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {expenseBreakdown.slice(1).map((expense, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{expense.name}</span>
                          <span className="font-medium">{formatCurrency(expense.value)}</span>
                        </div>
                        <Progress value={expense.percentage * 2} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
