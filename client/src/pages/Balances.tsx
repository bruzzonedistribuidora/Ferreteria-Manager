import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Users, Building2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import type { Client, Supplier, ClientAccountMovement, SupplierAccountMovement } from "@shared/schema";

type ClientWithBalance = Client & { currentBalance: number };
type SupplierWithBalance = Supplier & { currentBalance: number };

export default function Balances() {
  const { data: clients = [], isLoading: loadingClients } = useQuery<ClientWithBalance[]>({
    queryKey: ["/api/clients-with-balance"],
  });

  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery<SupplierWithBalance[]>({
    queryKey: ["/api/suppliers-with-balance"],
  });

  const clientsWithDebt = clients.filter(c => c.currentBalance > 0);
  const clientsWithCredit = clients.filter(c => c.currentBalance < 0);
  const totalClientDebt = clientsWithDebt.reduce((sum, c) => sum + c.currentBalance, 0);

  const suppliersWithDebt = suppliers.filter(s => s.currentBalance > 0);
  const totalSupplierDebt = suppliersWithDebt.reduce((sum, s) => sum + s.currentBalance, 0);

  const isLoading = loadingClients || loadingSuppliers;

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Saldos y Deudas</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestiona las cuentas corrientes de clientes y proveedores.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Clientes Nos Deben</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300" data-testid="total-client-debt">
                ${totalClientDebt.toFixed(2)}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">{clientsWithDebt.length} clientes</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Clientes a Favor</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                ${Math.abs(clientsWithCredit.reduce((sum, c) => sum + c.currentBalance, 0)).toFixed(2)}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">{clientsWithCredit.length} clientes</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Debemos a Proveedores</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300" data-testid="total-supplier-debt">
                ${totalSupplierDebt.toFixed(2)}
              </div>
              <p className="text-xs text-red-600 dark:text-red-400">{suppliersWithDebt.length} proveedores</p>
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
              <p className="text-xs text-muted-foreground">a cobrar - a pagar</p>
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
              <Tabs defaultValue="clients">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="clients" data-testid="tab-clients">
                    <Users className="h-4 w-4 mr-2" />
                    Clientes ({clients.filter(c => c.currentBalance !== 0).length})
                  </TabsTrigger>
                  <TabsTrigger value="suppliers" data-testid="tab-suppliers">
                    <Building2 className="h-4 w-4 mr-2" />
                    Proveedores ({suppliers.filter(s => s.currentBalance !== 0).length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="clients" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>CUIT/DNI</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Límite Crédito</TableHead>
                        <TableHead className="text-right">Saldo Actual</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.filter(c => c.currentBalance !== 0).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            No hay clientes con saldo pendiente.
                          </TableCell>
                        </TableRow>
                      ) : (
                        clients
                          .filter(c => c.currentBalance !== 0)
                          .sort((a, b) => b.currentBalance - a.currentBalance)
                          .map(client => (
                            <TableRow key={client.id} data-testid={`row-client-${client.id}`}>
                              <TableCell className="font-medium">{client.name}</TableCell>
                              <TableCell className="text-muted-foreground">{client.taxId || "-"}</TableCell>
                              <TableCell className="text-muted-foreground">{client.phone || "-"}</TableCell>
                              <TableCell className="text-muted-foreground">
                                ${Number(client.creditLimit || 0).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`font-bold ${client.currentBalance > 0 ? 'text-green-600' : 'text-blue-600'}`}>
                                  {client.currentBalance > 0 ? '' : '-'}${Math.abs(client.currentBalance).toFixed(2)}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={client.currentBalance > 0 ? "default" : "secondary"}>
                                  {client.currentBalance > 0 ? "Debe" : "A Favor"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="suppliers" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>CUIT</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Días Pago</TableHead>
                        <TableHead className="text-right">Saldo Actual</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliers.filter(s => s.currentBalance !== 0).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            No hay proveedores con saldo pendiente.
                          </TableCell>
                        </TableRow>
                      ) : (
                        suppliers
                          .filter(s => s.currentBalance !== 0)
                          .sort((a, b) => b.currentBalance - a.currentBalance)
                          .map(supplier => (
                            <TableRow key={supplier.id} data-testid={`row-supplier-${supplier.id}`}>
                              <TableCell className="font-medium">{supplier.name}</TableCell>
                              <TableCell className="text-muted-foreground">{supplier.taxId || "-"}</TableCell>
                              <TableCell className="text-muted-foreground">{supplier.phone || "-"}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {supplier.paymentTermDays || 30} días
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`font-bold ${supplier.currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  ${Math.abs(supplier.currentBalance).toFixed(2)}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={supplier.currentBalance > 0 ? "destructive" : "secondary"}>
                                  {supplier.currentBalance > 0 ? "Debemos" : "A Nuestro Favor"}
                                </Badge>
                              </TableCell>
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
