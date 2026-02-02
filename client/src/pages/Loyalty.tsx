import { Layout } from "@/components/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Gift, Star, Settings, Users, TrendingUp } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { LoyaltyProgram, Client, ClientLoyaltyPoints } from "@shared/schema";

type ClientWithPoints = Client & { loyaltyPoints?: ClientLoyaltyPoints };

export default function Loyalty() {
  const { toast } = useToast();
  const [pointsPerCurrency, setPointsPerCurrency] = useState("1");
  const [currencyPerPoint, setCurrencyPerPoint] = useState("0.01");
  const [minPointsRedemption, setMinPointsRedemption] = useState("100");
  const [maxDiscountPercent, setMaxDiscountPercent] = useState("10");
  const [isActive, setIsActive] = useState(false);

  const { data: program, isLoading: loadingProgram } = useQuery<LoyaltyProgram>({
    queryKey: ["/api/loyalty-program"],
  });

  const { data: clientsWithPoints = [], isLoading: loadingClients } = useQuery<ClientWithPoints[]>({
    queryKey: ["/api/clients-with-points"],
  });

  const updateProgram = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/loyalty-program", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty-program"] });
      toast({ title: "Programa Actualizado", description: "La configuración se guardó correctamente." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const handleSaveSettings = () => {
    updateProgram.mutate({
      pointsPerCurrency: parseFloat(pointsPerCurrency),
      currencyPerPoint: parseFloat(currencyPerPoint),
      minPointsRedemption: parseInt(minPointsRedemption),
      maxDiscountPercent: parseFloat(maxDiscountPercent),
      isActive
    });
  };

  // Initialize form with program data
  useState(() => {
    if (program) {
      setPointsPerCurrency(program.pointsPerCurrency?.toString() || "1");
      setCurrencyPerPoint(program.currencyPerPoint?.toString() || "0.01");
      setMinPointsRedemption(program.minPointsRedemption?.toString() || "100");
      setMaxDiscountPercent(program.maxDiscountPercent?.toString() || "10");
      setIsActive(program.isActive || false);
    }
  });

  const totalActiveClients = clientsWithPoints.filter(c => (c.loyaltyPoints?.points || 0) > 0).length;
  const totalPoints = clientsWithPoints.reduce((sum, c) => sum + (c.loyaltyPoints?.points || 0), 0);

  const isLoading = loadingProgram || loadingClients;

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Programa de Fidelización</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestiona el programa de puntos para premiar a tus clientes.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Estado</CardTitle>
              <Gift className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {program?.isActive ? "Activo" : "Inactivo"}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400">Programa de puntos</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Clientes Activos</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300" data-testid="active-clients">
                {totalActiveClients}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">con puntos acumulados</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Puntos Totales</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300" data-testid="total-points">
                {totalPoints.toLocaleString()}
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">acumulados</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Valor en Puntos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                ${(totalPoints * parseFloat(currencyPerPoint || "0.01")).toFixed(2)}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">valor potencial</p>
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
              <Tabs defaultValue="settings">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="settings" data-testid="tab-settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Configuración
                  </TabsTrigger>
                  <TabsTrigger value="clients" data-testid="tab-clients">
                    <Users className="h-4 w-4 mr-2" />
                    Clientes ({clientsWithPoints.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="mt-4">
                  <div className="max-w-xl space-y-6">
                    <div className="flex items-center justify-between py-4 border-b">
                      <div>
                        <Label className="text-base">Activar Programa</Label>
                        <p className="text-sm text-muted-foreground">
                          Habilita la acumulación y canje de puntos.
                        </p>
                      </div>
                      <Switch 
                        checked={isActive} 
                        onCheckedChange={setIsActive}
                        data-testid="switch-active"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Puntos por Peso</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={pointsPerCurrency}
                          onChange={(e) => setPointsPerCurrency(e.target.value)}
                          data-testid="input-points-per-currency"
                        />
                        <p className="text-xs text-muted-foreground">
                          Puntos que gana el cliente por cada $1 gastado.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Valor por Punto ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={currencyPerPoint}
                          onChange={(e) => setCurrencyPerPoint(e.target.value)}
                          data-testid="input-currency-per-point"
                        />
                        <p className="text-xs text-muted-foreground">
                          Valor en pesos de cada punto al canjear.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Mínimo para Canje</Label>
                        <Input
                          type="number"
                          value={minPointsRedemption}
                          onChange={(e) => setMinPointsRedemption(e.target.value)}
                          data-testid="input-min-redemption"
                        />
                        <p className="text-xs text-muted-foreground">
                          Puntos mínimos necesarios para poder canjear.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Descuento Máximo (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={maxDiscountPercent}
                          onChange={(e) => setMaxDiscountPercent(e.target.value)}
                          data-testid="input-max-discount"
                        />
                        <p className="text-xs text-muted-foreground">
                          Máximo descuento aplicable con puntos en una compra.
                        </p>
                      </div>
                    </div>

                    <Button 
                      onClick={handleSaveSettings}
                      disabled={updateProgram.isPending}
                      className="w-full"
                      data-testid="button-save"
                    >
                      {updateProgram.isPending ? "Guardando..." : "Guardar Configuración"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="clients" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead className="text-center">Puntos Actuales</TableHead>
                        <TableHead className="text-center">Total Acumulado</TableHead>
                        <TableHead className="text-center">Total Canjeado</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientsWithPoints.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            No hay clientes en el programa de fidelización.
                          </TableCell>
                        </TableRow>
                      ) : (
                        clientsWithPoints
                          .sort((a, b) => (b.loyaltyPoints?.points || 0) - (a.loyaltyPoints?.points || 0))
                          .map(client => (
                            <TableRow key={client.id} data-testid={`row-client-${client.id}`}>
                              <TableCell className="font-medium">{client.name}</TableCell>
                              <TableCell className="text-muted-foreground">{client.phone || "-"}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="default" className="bg-yellow-500">
                                  <Star className="h-3 w-3 mr-1" />
                                  {client.loyaltyPoints?.points || 0}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-muted-foreground">
                                {client.loyaltyPoints?.totalEarned || 0}
                              </TableCell>
                              <TableCell className="text-center text-muted-foreground">
                                {client.loyaltyPoints?.totalRedeemed || 0}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={(client.loyaltyPoints?.points || 0) >= parseInt(minPointsRedemption) ? "default" : "secondary"}>
                                  {(client.loyaltyPoints?.points || 0) >= parseInt(minPointsRedemption) ? "Puede Canjear" : "Acumulando"}
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
