import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Users, DollarSign, Plus, Edit, Trash2, Loader2, 
  Banknote, Calendar, FileText, Check, X, ArrowDownCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  documentId: string | null;
  phone: string | null;
  email: string | null;
  position: string | null;
  baseSalary: string;
  paymentFrequency: string | null;
  bankName: string | null;
  bankAccount: string | null;
  cbu: string | null;
  isActive: boolean;
  createdAt: string;
};

type PayrollPayment = {
  id: number;
  employeeId: number;
  paymentType: string;
  paymentDate: string;
  period: string | null;
  grossAmount: string;
  deductions: string;
  advances: string;
  netAmount: string;
  paymentMethod: string | null;
  status: string;
  notes: string | null;
  employee?: Employee;
};

type EmployeeAdvance = {
  id: number;
  employeeId: number;
  amount: string;
  requestDate: string;
  reason: string | null;
  status: string;
  paidAt: string | null;
  employee?: Employee;
};

const PAYMENT_TYPES = [
  { value: "salary", label: "Sueldo" },
  { value: "advance", label: "Adelanto" },
  { value: "bonus", label: "Bono/Premio" },
  { value: "vacation", label: "Vacaciones" },
  { value: "aguinaldo", label: "Aguinaldo" },
  { value: "liquidation", label: "Liquidación Final" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Efectivo" },
  { value: "transfer", label: "Transferencia" },
  { value: "check", label: "Cheque" },
];

export default function PayrollPayments() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pagos");
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const [employeeForm, setEmployeeForm] = useState({
    firstName: "", lastName: "", documentId: "", phone: "", email: "",
    position: "", baseSalary: "", paymentFrequency: "monthly",
    bankName: "", bankAccount: "", cbu: ""
  });

  const [paymentForm, setPaymentForm] = useState({
    employeeId: "", paymentType: "salary", period: "", grossAmount: "",
    deductions: "0", advances: "0", paymentMethod: "transfer", notes: ""
  });

  const [advanceForm, setAdvanceForm] = useState({
    employeeId: "", amount: "", reason: ""
  });

  const { data: employees = [], isLoading: loadingEmployees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery<PayrollPayment[]>({
    queryKey: ["/api/payroll-payments"],
  });

  const { data: advances = [], isLoading: loadingAdvances } = useQuery<EmployeeAdvance[]>({
    queryKey: ["/api/employee-advances"],
  });

  const createEmployeeMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/employees", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setShowEmployeeDialog(false);
      resetEmployeeForm();
      toast({ title: "Empleado creado exitosamente" });
    }
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/employees/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setShowEmployeeDialog(false);
      setEditingEmployee(null);
      resetEmployeeForm();
      toast({ title: "Empleado actualizado" });
    }
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Empleado eliminado" });
    }
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/payroll-payments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employee-advances"] });
      setShowPaymentDialog(false);
      resetPaymentForm();
      toast({ title: "Pago registrado exitosamente" });
    }
  });

  const markPaymentPaidMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PUT", `/api/payroll-payments/${id}/pay`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll-payments"] });
      toast({ title: "Pago marcado como pagado" });
    }
  });

  const createAdvanceMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/employee-advances", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-advances"] });
      setShowAdvanceDialog(false);
      resetAdvanceForm();
      toast({ title: "Adelanto registrado" });
    }
  });

  const approveAdvanceMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PUT", `/api/employee-advances/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-advances"] });
      toast({ title: "Adelanto aprobado" });
    }
  });

  const payAdvanceMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PUT", `/api/employee-advances/${id}/pay`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-advances"] });
      toast({ title: "Adelanto pagado" });
    }
  });

  const resetEmployeeForm = () => {
    setEmployeeForm({
      firstName: "", lastName: "", documentId: "", phone: "", email: "",
      position: "", baseSalary: "", paymentFrequency: "monthly",
      bankName: "", bankAccount: "", cbu: ""
    });
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      employeeId: "", paymentType: "salary", period: "", grossAmount: "",
      deductions: "0", advances: "0", paymentMethod: "transfer", notes: ""
    });
  };

  const resetAdvanceForm = () => {
    setAdvanceForm({ employeeId: "", amount: "", reason: "" });
  };

  const handleEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmployeeForm({
      firstName: emp.firstName,
      lastName: emp.lastName,
      documentId: emp.documentId || "",
      phone: emp.phone || "",
      email: emp.email || "",
      position: emp.position || "",
      baseSalary: emp.baseSalary,
      paymentFrequency: emp.paymentFrequency || "monthly",
      bankName: emp.bankName || "",
      bankAccount: emp.bankAccount || "",
      cbu: emp.cbu || ""
    });
    setShowEmployeeDialog(true);
  };

  const handleSaveEmployee = () => {
    const data = {
      ...employeeForm,
      baseSalary: parseFloat(employeeForm.baseSalary) || 0
    };
    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, data });
    } else {
      createEmployeeMutation.mutate(data);
    }
  };

  const handleSavePayment = () => {
    const gross = parseFloat(paymentForm.grossAmount) || 0;
    const deductions = parseFloat(paymentForm.deductions) || 0;
    const advancesDed = parseFloat(paymentForm.advances) || 0;
    const net = gross - deductions - advancesDed;

    createPaymentMutation.mutate({
      employeeId: parseInt(paymentForm.employeeId),
      paymentType: paymentForm.paymentType,
      period: paymentForm.period || null,
      grossAmount: gross,
      deductions,
      advances: advancesDed,
      netAmount: net,
      paymentMethod: paymentForm.paymentMethod,
      notes: paymentForm.notes || null
    });
  };

  const handleSaveAdvance = () => {
    createAdvanceMutation.mutate({
      employeeId: parseInt(advanceForm.employeeId),
      amount: parseFloat(advanceForm.amount),
      reason: advanceForm.reason || null
    });
  };

  const getPaymentTypeLabel = (type: string) => {
    return PAYMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline">Pendiente</Badge>;
      case "paid": return <Badge className="bg-green-100 text-green-800">Pagado</Badge>;
      case "approved": return <Badge className="bg-blue-100 text-blue-800">Aprobado</Badge>;
      case "rejected": return <Badge variant="destructive">Rechazado</Badge>;
      case "deducted": return <Badge variant="secondary">Descontado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const activeEmployees = employees.filter(e => e.isActive);
  const pendingAdvances = advances.filter(a => a.status === "pending" || a.status === "approved");
  const totalPendingAdvances = pendingAdvances.reduce((sum, a) => sum + Number(a.amount), 0);
  const thisMonthPayments = payments.filter(p => {
    const date = new Date(p.paymentDate);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const totalThisMonth = thisMonthPayments.reduce((sum, p) => sum + Number(p.netAmount), 0);

  if (loadingEmployees || loadingPayments || loadingAdvances) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pagos a Personal</h1>
            <p className="text-gray-500">Gestiona empleados, sueldos y adelantos</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Empleados Activos</p>
                  <p className="text-2xl font-bold">{activeEmployees.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pagado Este Mes</p>
                  <p className="text-2xl font-bold">${totalThisMonth.toLocaleString('es-AR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-orange-100">
                  <ArrowDownCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Adelantos Pendientes</p>
                  <p className="text-2xl font-bold">${totalPendingAdvances.toLocaleString('es-AR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-100">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pagos Este Mes</p>
                  <p className="text-2xl font-bold">{thisMonthPayments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pagos" data-testid="tab-pagos">
              <Banknote className="w-4 h-4 mr-2" />
              Pagos
            </TabsTrigger>
            <TabsTrigger value="adelantos" data-testid="tab-adelantos">
              <ArrowDownCircle className="w-4 h-4 mr-2" />
              Adelantos
            </TabsTrigger>
            <TabsTrigger value="empleados" data-testid="tab-empleados">
              <Users className="w-4 h-4 mr-2" />
              Empleados
            </TabsTrigger>
          </TabsList>

          {/* PAGOS TAB */}
          <TabsContent value="pagos" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="w-5 h-5" />
                  Historial de Pagos
                </CardTitle>
                <Button onClick={() => setShowPaymentDialog(true)} data-testid="button-new-payment">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Pago
                </Button>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Banknote className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay pagos registrados</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead className="text-right">Bruto</TableHead>
                        <TableHead className="text-right">Neto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => {
                        const emp = employees.find(e => e.id === payment.employeeId);
                        return (
                          <TableRow key={payment.id} data-testid={`payment-row-${payment.id}`}>
                            <TableCell>
                              {format(new Date(payment.paymentDate), 'dd/MM/yyyy', { locale: es })}
                            </TableCell>
                            <TableCell className="font-medium">
                              {emp ? `${emp.firstName} ${emp.lastName}` : '-'}
                            </TableCell>
                            <TableCell>{getPaymentTypeLabel(payment.paymentType)}</TableCell>
                            <TableCell>{payment.period || '-'}</TableCell>
                            <TableCell className="text-right">
                              ${Number(payment.grossAmount).toLocaleString('es-AR')}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${Number(payment.netAmount).toLocaleString('es-AR')}
                            </TableCell>
                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                            <TableCell>
                              {payment.status === "pending" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => markPaymentPaidMutation.mutate(payment.id)}
                                  data-testid={`button-pay-${payment.id}`}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Pagar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ADELANTOS TAB */}
          <TabsContent value="adelantos" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownCircle className="w-5 h-5" />
                  Adelantos de Sueldo
                </CardTitle>
                <Button onClick={() => setShowAdvanceDialog(true)} data-testid="button-new-advance">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Adelanto
                </Button>
              </CardHeader>
              <CardContent>
                {advances.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ArrowDownCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay adelantos registrados</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Empleado</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {advances.map((advance) => {
                        const emp = employees.find(e => e.id === advance.employeeId);
                        return (
                          <TableRow key={advance.id} data-testid={`advance-row-${advance.id}`}>
                            <TableCell>
                              {format(new Date(advance.requestDate), 'dd/MM/yyyy', { locale: es })}
                            </TableCell>
                            <TableCell className="font-medium">
                              {emp ? `${emp.firstName} ${emp.lastName}` : '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${Number(advance.amount).toLocaleString('es-AR')}
                            </TableCell>
                            <TableCell>{advance.reason || '-'}</TableCell>
                            <TableCell>{getStatusBadge(advance.status)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {advance.status === "pending" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => approveAdvanceMutation.mutate(advance.id)}
                                    data-testid={`button-approve-${advance.id}`}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                )}
                                {advance.status === "approved" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => payAdvanceMutation.mutate(advance.id)}
                                    data-testid={`button-pay-advance-${advance.id}`}
                                  >
                                    <DollarSign className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* EMPLEADOS TAB */}
          <TabsContent value="empleados" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Lista de Empleados
                </CardTitle>
                <Button 
                  onClick={() => {
                    setEditingEmployee(null);
                    resetEmployeeForm();
                    setShowEmployeeDialog(true);
                  }} 
                  data-testid="button-new-employee"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Empleado
                </Button>
              </CardHeader>
              <CardContent>
                {employees.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay empleados registrados</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>DNI</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead className="text-right">Sueldo Base</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((emp) => (
                        <TableRow key={emp.id} data-testid={`employee-row-${emp.id}`}>
                          <TableCell className="font-medium">
                            {emp.firstName} {emp.lastName}
                          </TableCell>
                          <TableCell>{emp.documentId || '-'}</TableCell>
                          <TableCell>{emp.position || '-'}</TableCell>
                          <TableCell className="text-right">
                            ${Number(emp.baseSalary).toLocaleString('es-AR')}
                          </TableCell>
                          <TableCell>
                            {emp.isActive ? (
                              <Badge className="bg-green-100 text-green-800">Activo</Badge>
                            ) : (
                              <Badge variant="secondary">Inactivo</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditEmployee(emp)}
                                data-testid={`button-edit-employee-${emp.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => deleteEmployeeMutation.mutate(emp.id)}
                                data-testid={`button-delete-employee-${emp.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Employee Dialog */}
        <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? "Editar Empleado" : "Nuevo Empleado"}</DialogTitle>
              <DialogDescription>
                {editingEmployee ? "Modifica los datos del empleado" : "Ingresa los datos del nuevo empleado"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={employeeForm.firstName}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, firstName: e.target.value })}
                  data-testid="input-employee-firstName"
                />
              </div>
              <div className="space-y-2">
                <Label>Apellido *</Label>
                <Input
                  value={employeeForm.lastName}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, lastName: e.target.value })}
                  data-testid="input-employee-lastName"
                />
              </div>
              <div className="space-y-2">
                <Label>DNI</Label>
                <Input
                  value={employeeForm.documentId}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, documentId: e.target.value })}
                  data-testid="input-employee-documentId"
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={employeeForm.phone}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                  data-testid="input-employee-phone"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                  data-testid="input-employee-email"
                />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input
                  value={employeeForm.position}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                  data-testid="input-employee-position"
                />
              </div>
              <div className="space-y-2">
                <Label>Sueldo Base</Label>
                <Input
                  type="number"
                  value={employeeForm.baseSalary}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, baseSalary: e.target.value })}
                  data-testid="input-employee-baseSalary"
                />
              </div>
              <div className="space-y-2">
                <Label>Frecuencia de Pago</Label>
                <Select
                  value={employeeForm.paymentFrequency}
                  onValueChange={(v) => setEmployeeForm({ ...employeeForm, paymentFrequency: v })}
                >
                  <SelectTrigger data-testid="select-employee-paymentFrequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="biweekly">Quincenal</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Banco</Label>
                <Input
                  value={employeeForm.bankName}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, bankName: e.target.value })}
                  data-testid="input-employee-bankName"
                />
              </div>
              <div className="space-y-2">
                <Label>Número de Cuenta</Label>
                <Input
                  value={employeeForm.bankAccount}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, bankAccount: e.target.value })}
                  data-testid="input-employee-bankAccount"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>CBU</Label>
                <Input
                  value={employeeForm.cbu}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, cbu: e.target.value })}
                  data-testid="input-employee-cbu"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEmployeeDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveEmployee}
                disabled={!employeeForm.firstName || !employeeForm.lastName || createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
                data-testid="button-save-employee"
              >
                {(createEmployeeMutation.isPending || updateEmployeeMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pago</DialogTitle>
              <DialogDescription>
                Registra un pago de sueldo o similar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Empleado *</Label>
                <Select
                  value={paymentForm.employeeId}
                  onValueChange={(v) => setPaymentForm({ ...paymentForm, employeeId: v })}
                >
                  <SelectTrigger data-testid="select-payment-employee">
                    <SelectValue placeholder="Seleccionar empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.firstName} {emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Pago</Label>
                  <Select
                    value={paymentForm.paymentType}
                    onValueChange={(v) => setPaymentForm({ ...paymentForm, paymentType: v })}
                  >
                    <SelectTrigger data-testid="select-payment-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Input
                    placeholder="2026-01"
                    value={paymentForm.period}
                    onChange={(e) => setPaymentForm({ ...paymentForm, period: e.target.value })}
                    data-testid="input-payment-period"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Monto Bruto *</Label>
                  <Input
                    type="number"
                    value={paymentForm.grossAmount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, grossAmount: e.target.value })}
                    data-testid="input-payment-grossAmount"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deducciones</Label>
                  <Input
                    type="number"
                    value={paymentForm.deductions}
                    onChange={(e) => setPaymentForm({ ...paymentForm, deductions: e.target.value })}
                    data-testid="input-payment-deductions"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Adelantos</Label>
                  <Input
                    type="number"
                    value={paymentForm.advances}
                    onChange={(e) => setPaymentForm({ ...paymentForm, advances: e.target.value })}
                    data-testid="input-payment-advances"
                  />
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Neto a Pagar</p>
                <p className="text-2xl font-bold text-green-600">
                  ${((parseFloat(paymentForm.grossAmount) || 0) - 
                     (parseFloat(paymentForm.deductions) || 0) - 
                     (parseFloat(paymentForm.advances) || 0)).toLocaleString('es-AR')}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Select
                  value={paymentForm.paymentMethod}
                  onValueChange={(v) => setPaymentForm({ ...paymentForm, paymentMethod: v })}
                >
                  <SelectTrigger data-testid="select-payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  data-testid="input-payment-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSavePayment}
                disabled={!paymentForm.employeeId || !paymentForm.grossAmount || createPaymentMutation.isPending}
                data-testid="button-save-payment"
              >
                {createPaymentMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Registrar Pago
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Advance Dialog */}
        <Dialog open={showAdvanceDialog} onOpenChange={setShowAdvanceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar Adelanto</DialogTitle>
              <DialogDescription>
                Registra una solicitud de adelanto de sueldo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Empleado *</Label>
                <Select
                  value={advanceForm.employeeId}
                  onValueChange={(v) => setAdvanceForm({ ...advanceForm, employeeId: v })}
                >
                  <SelectTrigger data-testid="select-advance-employee">
                    <SelectValue placeholder="Seleccionar empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.firstName} {emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monto *</Label>
                <Input
                  type="number"
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                  data-testid="input-advance-amount"
                />
              </div>
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Textarea
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  data-testid="input-advance-reason"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdvanceDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveAdvance}
                disabled={!advanceForm.employeeId || !advanceForm.amount || createAdvanceMutation.isPending}
                data-testid="button-save-advance"
              >
                {createAdvanceMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Registrar Adelanto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
