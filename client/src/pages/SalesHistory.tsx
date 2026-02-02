import { Layout } from "@/components/Layout";
import { useSales } from "@/hooks/use-sales";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Receipt, Calendar, CreditCard } from "lucide-react";

export default function SalesHistory() {
  const { data: sales, isLoading } = useSales();

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sales History</h1>
          <p className="text-slate-500">View and manage past transactions.</p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Loading history...</TableCell>
                  </TableRow>
                ) : sales?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No sales recorded yet.</TableCell>
                  </TableRow>
                ) : (
                  sales?.map((sale: any) => (
                    <TableRow key={sale.id} className="hover:bg-slate-50">
                      <TableCell className="font-mono font-medium text-slate-700">
                        {sale.receiptNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(sale.createdAt), "MMM d, yyyy HH:mm")}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {sale.client?.name || "Walk-in Client"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 capitalize">
                          <CreditCard className="h-3 w-3 text-slate-400" />
                          {sale.paymentMethod}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="bg-slate-100 text-slate-600 py-1 px-3 rounded-full text-xs font-medium">
                          {sale.items.length}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900">
                        ${Number(sale.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          {sale.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
