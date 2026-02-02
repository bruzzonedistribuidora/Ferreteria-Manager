import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { DollarSign, ShoppingBag, AlertTriangle, Package, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <Layout>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-8 h-96 w-full rounded-xl" />
      </Layout>
    );
  }

  const chartData = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 2000 },
    { name: 'Thu', sales: 2780 },
    { name: 'Fri', sales: 1890 },
    { name: 'Sat', sales: 2390 },
    { name: 'Sun', sales: 3490 },
  ];

  return (
    <Layout>
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Overview of your store's performance today.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Revenue"
            value={`$${stats?.revenueToday ? Number(stats.revenueToday).toLocaleString() : '0.00'}`}
            description="Revenue generated today"
            icon={DollarSign}
            variant="default"
            trend="up"
            trendValue="12%"
          />
          <StatsCard
            title="Sales Today"
            value={stats?.totalSalesToday || 0}
            description="Total transactions"
            icon={ShoppingBag}
            variant="orange"
          />
          <StatsCard
            title="Total Products"
            value={stats?.totalProducts || 0}
            description="Active inventory items"
            icon={Package}
            variant="blue"
          />
          <StatsCard
            title="Low Stock"
            value={stats?.lowStockCount || 0}
            description="Items needing restock"
            icon={AlertTriangle}
            variant="default"
            className={stats?.lowStockCount > 0 ? "border-red-200 bg-red-50" : ""}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-7">
          <Card className="col-span-4 shadow-md border-border/50">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ff6b35" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                    <XAxis dataKey="name" className="text-xs text-slate-500" tickLine={false} axisLine={false} />
                    <YAxis className="text-xs text-slate-500" tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#ff6b35' }}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#ff6b35" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3 shadow-md border-border/50">
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stats?.recentSales && stats.recentSales.length > 0 ? (
                  stats.recentSales.map((sale: any) => (
                    <div key={sale.id} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center space-x-4">
                        <div className="bg-orange-100 p-2 rounded-full">
                          <ShoppingBag className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {sale.client?.name || "Walk-in Client"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(sale.createdAt), "HH:mm")} • {sale.paymentMethod}
                          </p>
                        </div>
                      </div>
                      <div className="font-medium text-sm">
                        +${Number(sale.totalAmount).toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No sales recorded today yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
