import { Layout } from "@/components/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, DollarSign, Users, CheckCircle, Clock, AlertTriangle, RefreshCw, CreditCard } from "lucide-react";
import { useState } from "react";
import { format, addMonths, isPast, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Client } from "@shared/schema";

type Installment = {
  id: number;
  clientId: number;
  clientName: string;
  description: string;
  totalAmount: number;
  installmentCount: number;
  installmentAmount: number;
  paidInstallments: number;
  nextDueDate: Date;
  status: 'active' | 'completed' | 'overdue';
  createdAt: Date;
};

export default function InternalInstallments() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [installmentCount, setInstallmentCount] = useState("3");

  const { data: clients = [], isLoading: loadingClients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: installments = [], isLoading: loadingInstallments } = useQuery<Installment[]>({
    queryKey: ["/api/internal-installments"],
    // Mock data for now - would come from API
    queryFn: async () => {
      // Return empty array - would be replaced with actual API call
      return [];
    }
  });

  const createInstallment = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/internal-installments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/internal-installments"] });
      toast({ title: "Plan Creado", description: "El plan de cuotas se creó exitosamente." });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setSelectedClient("");
    setDescription("");
    setTotalAmount("");
    setInstallmentCount("3");
  };

  const calculateInstallment = () => {
    const total = parseFloat(totalAmount) || 0;
    const count = parseInt(installmentCount) || 1;
    return (total / count).toFixed(2);
  };

  const handleSubmit = () => {
    if (!selectedClient || !totalAmount || !installmentCount) return;
    createInstallment.mutate({
      clientId: parseInt(selectedClient),
      description,
      totalAmount: parseFloat(totalAmount),
      installmentCount: parseInt(installmentCount)
    });
  };

  const activeInstallments = installments.filter(i => i.status === 'active');
  const overdueInstallments = installments.filter(i => i.status === 'overdue');
  const completedInstallments = installments.filter(i => i.status === 'completed');

  const totalPending = installments
    .filter(i => i.status !== 'completed')
    .reduce((sum, i) => sum + (i.totalAmount - (i.paidInstallments * i.installmentAmount)), 0);

  const thisMonthDue = installments.filter(i => 
    i.status !== 'completed' && isSameMonth(new Date(i.nextDueDate), new Date())
  ).reduce((sum, i) => sum + i.installmentAmount, 0);

  const StatusBadge = ({ status }: { status: Installment["status"] }) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-700">Activo</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Completado</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Vencido</Badge>;
    }
  };

  const isLoading = loadingClients || loadingInstallments;

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Cuotas Internas</h1>
            <p className="text-slate-500 dark:text-slate-400">Gestiona planes de financiación propios para tus clientes.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-plan">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Plan de Cuotas</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger data-testid="select-client">
                      <SelectValue placeholder="Seleccionar cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.filter(c => c.isActive).map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Descripción / Concepto</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej: Compra de herramientas"
                    data-testid="input-description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monto Total</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      placeholder="$0.00"
                      data-testid="input-total"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cantidad de Cuotas</Label>
                    <Select value={installmentCount} onValueChange={setInstallmentCount}>
                      <SelectTrigger data-testid="select-installments">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 9, 12, 18, 24].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n} cuotas</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {totalAmount && (
                  <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Valor de cada cuota</p>
                          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            ${calculateInstallment()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Primera cuota</p>
                          <p className="font-medium">
                            {format(addMonths(new Date(), 1), "MMMM yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!selectedClient || !totalAmount || createInstallment.isPending}
                  data-testid="button-create"
                >
                  {createInstallment.isPending ? "Creando..." : "Crear Plan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Planes Activos</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300" data-testid="count-active">
                {activeInstallments.length}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">en curso</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Cuotas Vencidas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300" data-testid="count-overdue">
                {overdueInstallments.length}
              </div>
              <p className="text-xs text-red-600 dark:text-red-400">a regularizar</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">A Cobrar Este Mes</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300" data-testid="due-this-month">
                ${thisMonthDue.toFixed(2)}
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">cuotas del mes</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Total Pendiente</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300" data-testid="total-pending">
                ${totalPending.toFixed(2)}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">por cobrar</p>
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
              <Tabs defaultValue="active">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="active" data-testid="tab-active">
                    <Clock className="h-4 w-4 mr-2" />
                    Activos ({activeInstallments.length})
                  </TabsTrigger>
                  <TabsTrigger value="overdue" data-testid="tab-overdue">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Vencidos ({overdueInstallments.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed" data-testid="tab-completed">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Completados ({completedInstallments.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-4">
                  <InstallmentTable installments={activeInstallments} />
                </TabsContent>

                <TabsContent value="overdue" className="mt-4">
                  <InstallmentTable installments={overdueInstallments} />
                </TabsContent>

                <TabsContent value="completed" className="mt-4">
                  <InstallmentTable installments={completedInstallments} />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function InstallmentTable({ installments }: { installments: Installment[] }) {
  const StatusBadge = ({ status }: { status: Installment["status"] }) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-700">Activo</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Completado</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Vencido</Badge>;
    }
  };

  if (installments.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No hay planes de cuotas en esta categoría.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Concepto</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-center">Cuotas</TableHead>
          <TableHead className="text-right">Valor Cuota</TableHead>
          <TableHead className="text-center">Pagadas</TableHead>
          <TableHead>Próximo Vto.</TableHead>
          <TableHead className="text-center">Estado</TableHead>
          <TableHead className="text-center">Acción</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {installments.map(inst => (
          <TableRow key={inst.id} data-testid={`row-installment-${inst.id}`}>
            <TableCell className="font-medium">{inst.clientName}</TableCell>
            <TableCell className="text-muted-foreground">{inst.description}</TableCell>
            <TableCell className="text-right">${inst.totalAmount.toFixed(2)}</TableCell>
            <TableCell className="text-center">{inst.installmentCount}</TableCell>
            <TableCell className="text-right">${inst.installmentAmount.toFixed(2)}</TableCell>
            <TableCell className="text-center">
              <span className="font-medium">{inst.paidInstallments}</span>
              <span className="text-muted-foreground">/{inst.installmentCount}</span>
            </TableCell>
            <TableCell>
              {format(new Date(inst.nextDueDate), "dd/MM/yyyy", { locale: es })}
            </TableCell>
            <TableCell className="text-center">
              <StatusBadge status={inst.status} />
            </TableCell>
            <TableCell className="text-center">
              {inst.status !== 'completed' && (
                <Button size="sm" variant="outline">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Cobrar
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
