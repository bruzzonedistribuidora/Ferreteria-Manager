import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  DollarSign, Plus, ArrowUpCircle, ArrowDownCircle, Lock, Unlock, 
  FileText, AlertTriangle, Clock, Calendar, Building, CreditCard,
  Banknote, Wallet, Eye, History, Settings
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { CashRegister, CashRegisterSession, CashMovement, Check, BankAccount } from "@shared/schema";

type CheckWithAlert = Check & {
  daysUntilDue: number;
  isOverdue: boolean;
  alertLevel: 'normal' | 'warning' | 'urgent' | 'overdue';
};

export default function CashRegisters() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("cajas");
  const [selectedRegisterId, setSelectedRegisterId] = useState<number | null>(null);
  const [isOpenSessionDialogOpen, setIsOpenSessionDialogOpen] = useState(false);
  const [isCloseSessionDialogOpen, setIsCloseSessionDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [isNewRegisterDialogOpen, setIsNewRegisterDialogOpen] = useState(false);
  const [isNewCheckDialogOpen, setIsNewCheckDialogOpen] = useState(false);
  const [isCheckActionDialogOpen, setIsCheckActionDialogOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<CheckWithAlert | null>(null);
  const [checkAction, setCheckAction] = useState<'deposit' | 'endorse' | 'reject' | null>(null);

  const [openingBalance, setOpeningBalance] = useState("");
  const [closingBalance, setClosingBalance] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [movementType, setMovementType] = useState("income");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementDescription, setMovementDescription] = useState("");
  const [movementReference, setMovementReference] = useState("");
  const [newRegisterName, setNewRegisterName] = useState("");
  const [newRegisterDescription, setNewRegisterDescription] = useState("");

  const [newCheck, setNewCheck] = useState({
    checkType: "physical",
    checkNumber: "",
    bankName: "",
    bankBranch: "",
    amount: "",
    issueDate: "",
    dueDate: "",
    issuerName: "",
    issuerCuit: "",
    payeeName: "",
    notes: "",
  });

  const [actionInput, setActionInput] = useState("");

  const { data: registers = [], isLoading: loadingRegisters } = useQuery<CashRegister[]>({
    queryKey: ['/api/cash-registers'],
  });

  const { data: currentSession } = useQuery<CashRegisterSession | null>({
    queryKey: ['/api/cash-registers', selectedRegisterId, 'current-session'],
    queryFn: async () => {
      const res = await fetch(`/api/cash-registers/${selectedRegisterId}/current-session`);
      if (!res.ok) throw new Error('Failed to fetch current session');
      return res.json();
    },
    enabled: !!selectedRegisterId,
  });

  const { data: sessionDetails } = useQuery({
    queryKey: ['/api/cash-sessions', currentSession?.id],
    queryFn: async () => {
      const res = await fetch(`/api/cash-sessions/${currentSession?.id}`);
      if (!res.ok) throw new Error('Failed to fetch session details');
      return res.json();
    },
    enabled: !!currentSession?.id,
  });

  const { data: checksWithAlerts = [] } = useQuery<CheckWithAlert[]>({
    queryKey: ['/api/checks/alerts'],
  });

  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({
    queryKey: ['/api/bank-accounts'],
  });

  const openSessionMutation = useMutation({
    mutationFn: async (data: { cashRegisterId: number; openingBalance: string }) => {
      return apiRequest('POST', '/api/cash-sessions/open', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cash-sessions'] });
      setIsOpenSessionDialogOpen(false);
      setOpeningBalance("");
      toast({ title: "Caja abierta", description: "La sesión de caja fue iniciada" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const closeSessionMutation = useMutation({
    mutationFn: async (data: { sessionId: number; closingBalance: string; notes?: string }) => {
      return apiRequest('POST', `/api/cash-sessions/${data.sessionId}/close`, { 
        closingBalance: data.closingBalance, 
        notes: data.notes 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cash-sessions'] });
      setIsCloseSessionDialogOpen(false);
      setClosingBalance("");
      setCloseNotes("");
      toast({ title: "Caja cerrada", description: "La sesión de caja fue cerrada exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const createMovementMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/cash-movements', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cash-sessions'] });
      setIsMovementDialogOpen(false);
      setMovementAmount("");
      setMovementDescription("");
      setMovementReference("");
      toast({ title: "Movimiento registrado", description: "El movimiento fue registrado correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const createRegisterMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return apiRequest('POST', '/api/cash-registers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cash-registers'] });
      setIsNewRegisterDialogOpen(false);
      setNewRegisterName("");
      setNewRegisterDescription("");
      toast({ title: "Caja creada", description: "La nueva caja fue creada correctamente" });
    },
  });

  const createCheckMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/checks', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/checks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/checks/alerts'] });
      setIsNewCheckDialogOpen(false);
      setNewCheck({
        checkType: "physical",
        checkNumber: "",
        bankName: "",
        bankBranch: "",
        amount: "",
        issueDate: "",
        dueDate: "",
        issuerName: "",
        issuerCuit: "",
        payeeName: "",
        notes: "",
      });
      toast({ title: "Cheque registrado", description: "El cheque fue registrado en la cartera" });
    },
  });

  const depositCheckMutation = useMutation({
    mutationFn: async (data: { id: number; depositAccountId: number }) => {
      return apiRequest('POST', `/api/checks/${data.id}/deposit`, { depositAccountId: data.depositAccountId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/checks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/checks/alerts'] });
      setIsCheckActionDialogOpen(false);
      setSelectedCheck(null);
      setActionInput("");
      toast({ title: "Cheque depositado", description: "El cheque fue marcado como depositado" });
    },
  });

  const endorseCheckMutation = useMutation({
    mutationFn: async (data: { id: number; endorsedTo: string }) => {
      return apiRequest('POST', `/api/checks/${data.id}/endorse`, { endorsedTo: data.endorsedTo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/checks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/checks/alerts'] });
      setIsCheckActionDialogOpen(false);
      setSelectedCheck(null);
      setActionInput("");
      toast({ title: "Cheque endosado", description: "El cheque fue marcado como endosado" });
    },
  });

  const rejectCheckMutation = useMutation({
    mutationFn: async (data: { id: number; reason: string }) => {
      return apiRequest('POST', `/api/checks/${data.id}/reject`, { reason: data.reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/checks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/checks/alerts'] });
      setIsCheckActionDialogOpen(false);
      setSelectedCheck(null);
      setActionInput("");
      toast({ title: "Cheque rechazado", description: "El cheque fue marcado como rechazado" });
    },
  });

  const handleOpenSession = () => {
    if (!selectedRegisterId || !openingBalance) return;
    openSessionMutation.mutate({ cashRegisterId: selectedRegisterId, openingBalance });
  };

  const handleCloseSession = () => {
    if (!currentSession || !closingBalance) return;
    closeSessionMutation.mutate({ sessionId: currentSession.id, closingBalance, notes: closeNotes || undefined });
  };

  const handleCreateMovement = () => {
    if (!currentSession || !movementAmount) return;
    createMovementMutation.mutate({
      sessionId: currentSession.id,
      cashRegisterId: currentSession.cashRegisterId,
      type: movementType,
      amount: movementAmount,
      description: movementDescription || undefined,
      reference: movementReference || undefined,
    });
  };

  const handleCheckAction = () => {
    if (!selectedCheck) return;
    if (checkAction === 'deposit' && actionInput) {
      depositCheckMutation.mutate({ id: selectedCheck.id, depositAccountId: Number(actionInput) });
    } else if (checkAction === 'endorse' && actionInput) {
      endorseCheckMutation.mutate({ id: selectedCheck.id, endorsedTo: actionInput });
    } else if (checkAction === 'reject' && actionInput) {
      rejectCheckMutation.mutate({ id: selectedCheck.id, reason: actionInput });
    }
  };

  const getAlertBadge = (check: CheckWithAlert) => {
    switch (check.alertLevel) {
      case 'overdue':
        return <Badge variant="destructive" data-testid={`badge-alert-${check.id}`}>Vencido</Badge>;
      case 'urgent':
        return <Badge className="bg-orange-500" data-testid={`badge-alert-${check.id}`}>Vence pronto</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500 text-black" data-testid={`badge-alert-${check.id}`}>Próximo</Badge>;
      default:
        return <Badge variant="secondary" data-testid={`badge-alert-${check.id}`}>Normal</Badge>;
    }
  };

  const selectedRegister = registers.find(r => r.id === selectedRegisterId);

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Gestión de Cajas</h1>
            <p className="text-slate-600">Administre las cajas, movimientos y cartera de cheques</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cajas" data-testid="tab-cajas">
              <Wallet className="h-4 w-4 mr-2" />
              Cajas
            </TabsTrigger>
            <TabsTrigger value="movimientos" data-testid="tab-movimientos">
              <History className="h-4 w-4 mr-2" />
              Movimientos
            </TabsTrigger>
            <TabsTrigger value="cheques" data-testid="tab-cheques">
              <FileText className="h-4 w-4 mr-2" />
              Cartera de Cheques
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cajas" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Cajas Registradoras</h2>
              <Dialog open={isNewRegisterDialogOpen} onOpenChange={setIsNewRegisterDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-new-register">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Caja
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva Caja Registradora</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Nombre</Label>
                      <Input
                        id="register-name"
                        value={newRegisterName}
                        onChange={(e) => setNewRegisterName(e.target.value)}
                        placeholder="Ej: Caja 2"
                        data-testid="input-register-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-desc">Descripción</Label>
                      <Textarea
                        id="register-desc"
                        value={newRegisterDescription}
                        onChange={(e) => setNewRegisterDescription(e.target.value)}
                        placeholder="Descripción opcional"
                        data-testid="input-register-description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={() => createRegisterMutation.mutate({ name: newRegisterName, description: newRegisterDescription })}
                      disabled={!newRegisterName || createRegisterMutation.isPending}
                      data-testid="button-save-register"
                    >
                      Crear Caja
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {registers.map((register) => (
                <Card 
                  key={register.id} 
                  className={`cursor-pointer transition-all ${selectedRegisterId === register.id ? 'ring-2 ring-orange-500' : ''}`}
                  onClick={() => setSelectedRegisterId(register.id)}
                  data-testid={`card-register-${register.id}`}
                >
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-lg">{register.name}</CardTitle>
                    <Badge variant={register.isActive ? "default" : "secondary"} data-testid={`badge-status-${register.id}`}>
                      {register.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Saldo actual:</span>
                        <span className="font-semibold text-lg" data-testid={`text-balance-${register.id}`}>
                          ${parseFloat(register.currentBalance || "0").toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {register.description && (
                        <p className="text-sm text-slate-500">{register.description}</p>
                      )}
                      {register.lastClosedAt && (
                        <p className="text-xs text-slate-400">
                          Último cierre: {format(new Date(register.lastClosedAt), "dd/MM/yyyy HH:mm", { locale: es })}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedRegister && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    {selectedRegister.name}
                  </CardTitle>
                  <CardDescription>
                    {currentSession ? "Sesión activa" : "Sin sesión activa"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!currentSession ? (
                    <Dialog open={isOpenSessionDialogOpen} onOpenChange={setIsOpenSessionDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" data-testid="button-open-session">
                          <Unlock className="h-4 w-4 mr-2" />
                          Abrir Caja
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Abrir Caja</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="opening-balance">Saldo Inicial</Label>
                            <Input
                              id="opening-balance"
                              type="number"
                              step="0.01"
                              value={openingBalance}
                              onChange={(e) => setOpeningBalance(e.target.value)}
                              placeholder="0.00"
                              data-testid="input-opening-balance"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={handleOpenSession}
                            disabled={!openingBalance || openSessionMutation.isPending}
                            data-testid="button-confirm-open"
                          >
                            Abrir Caja
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-green-50 rounded-lg">
                          <ArrowUpCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                          <p className="text-sm text-slate-600">Saldo Inicial</p>
                          <p className="font-semibold" data-testid="text-session-opening">
                            ${parseFloat(currentSession.openingBalance).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                          <p className="text-sm text-slate-600">Apertura</p>
                          <p className="font-semibold" data-testid="text-session-time">
                            {currentSession.openedAt && format(new Date(currentSession.openedAt), "HH:mm", { locale: es })}
                          </p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <DollarSign className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                          <p className="text-sm text-slate-600">Saldo Actual</p>
                          <p className="font-semibold" data-testid="text-session-current">
                            ${parseFloat(selectedRegister.currentBalance || "0").toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1" data-testid="button-new-movement">
                              <Plus className="h-4 w-4 mr-2" />
                              Registrar Movimiento
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Nuevo Movimiento</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Tipo de Movimiento</Label>
                                <Select value={movementType} onValueChange={setMovementType}>
                                  <SelectTrigger data-testid="select-movement-type">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="income">Ingreso</SelectItem>
                                    <SelectItem value="expense">Egreso</SelectItem>
                                    <SelectItem value="transfer_in">Transferencia Entrada</SelectItem>
                                    <SelectItem value="transfer_out">Transferencia Salida</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="movement-amount">Monto</Label>
                                <Input
                                  id="movement-amount"
                                  type="number"
                                  step="0.01"
                                  value={movementAmount}
                                  onChange={(e) => setMovementAmount(e.target.value)}
                                  placeholder="0.00"
                                  data-testid="input-movement-amount"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="movement-description">Descripción</Label>
                                <Input
                                  id="movement-description"
                                  value={movementDescription}
                                  onChange={(e) => setMovementDescription(e.target.value)}
                                  placeholder="Descripción del movimiento"
                                  data-testid="input-movement-description"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="movement-reference">Referencia</Label>
                                <Input
                                  id="movement-reference"
                                  value={movementReference}
                                  onChange={(e) => setMovementReference(e.target.value)}
                                  placeholder="Nro. de comprobante"
                                  data-testid="input-movement-reference"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                onClick={handleCreateMovement}
                                disabled={!movementAmount || createMovementMutation.isPending}
                                data-testid="button-save-movement"
                              >
                                Registrar
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={isCloseSessionDialogOpen} onOpenChange={setIsCloseSessionDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="destructive" className="flex-1" data-testid="button-close-session">
                              <Lock className="h-4 w-4 mr-2" />
                              Cerrar Caja
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Cerrar Caja</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="p-4 bg-slate-100 rounded-lg">
                                <p className="text-sm text-slate-600">Saldo esperado del sistema:</p>
                                <p className="font-semibold text-xl">
                                  ${parseFloat(selectedRegister.currentBalance || "0").toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="closing-balance">Saldo Contado (Arqueo)</Label>
                                <Input
                                  id="closing-balance"
                                  type="number"
                                  step="0.01"
                                  value={closingBalance}
                                  onChange={(e) => setClosingBalance(e.target.value)}
                                  placeholder="0.00"
                                  data-testid="input-closing-balance"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="close-notes">Notas</Label>
                                <Textarea
                                  id="close-notes"
                                  value={closeNotes}
                                  onChange={(e) => setCloseNotes(e.target.value)}
                                  placeholder="Observaciones del cierre"
                                  data-testid="input-close-notes"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                variant="destructive"
                                onClick={handleCloseSession}
                                disabled={!closingBalance || closeSessionMutation.isPending}
                                data-testid="button-confirm-close"
                              >
                                Confirmar Cierre
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="movimientos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Movimientos</CardTitle>
                <CardDescription>
                  {selectedRegister ? `Movimientos de ${selectedRegister.name}` : "Seleccione una caja para ver sus movimientos"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedRegister ? (
                  <p className="text-center text-slate-500 py-8">Seleccione una caja en la pestaña "Cajas"</p>
                ) : !currentSession ? (
                  <p className="text-center text-slate-500 py-8">No hay sesión activa para esta caja</p>
                ) : (
                  <div className="space-y-3">
                    {(sessionDetails as any)?.movements?.length === 0 ? (
                      <p className="text-center text-slate-500 py-8">No hay movimientos en esta sesión</p>
                    ) : (
                      (sessionDetails as any)?.movements?.map((mov: CashMovement) => (
                        <div 
                          key={mov.id} 
                          className="flex items-center justify-between p-4 border rounded-lg"
                          data-testid={`movement-${mov.id}`}
                        >
                          <div className="flex items-center gap-3">
                            {mov.type === 'income' || mov.type === 'sale' || mov.type === 'transfer_in' ? (
                              <ArrowUpCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <ArrowDownCircle className="h-5 w-5 text-red-600" />
                            )}
                            <div>
                              <p className="font-medium">{mov.description || mov.type}</p>
                              <p className="text-xs text-slate-500">
                                {mov.createdAt && format(new Date(mov.createdAt), "dd/MM HH:mm", { locale: es })}
                                {mov.reference && ` - Ref: ${mov.reference}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              mov.type === 'income' || mov.type === 'sale' || mov.type === 'transfer_in' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {mov.type === 'income' || mov.type === 'sale' || mov.type === 'transfer_in' ? '+' : '-'}
                              ${parseFloat(mov.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </p>
                            {mov.runningBalance && (
                              <p className="text-xs text-slate-500">
                                Saldo: ${parseFloat(mov.runningBalance).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cheques" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Cartera de Cheques</h2>
              <Dialog open={isNewCheckDialogOpen} onOpenChange={setIsNewCheckDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-new-check">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Cheque
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Registrar Cheque</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select 
                        value={newCheck.checkType} 
                        onValueChange={(v) => setNewCheck(p => ({ ...p, checkType: v }))}
                      >
                        <SelectTrigger data-testid="select-check-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="physical">Cheque Físico</SelectItem>
                          <SelectItem value="echeq">E-Cheq</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="check-number">Número de Cheque</Label>
                      <Input
                        id="check-number"
                        value={newCheck.checkNumber}
                        onChange={(e) => setNewCheck(p => ({ ...p, checkNumber: e.target.value }))}
                        data-testid="input-check-number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="check-bank">Banco</Label>
                      <Input
                        id="check-bank"
                        value={newCheck.bankName}
                        onChange={(e) => setNewCheck(p => ({ ...p, bankName: e.target.value }))}
                        data-testid="input-check-bank"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="check-amount">Monto</Label>
                      <Input
                        id="check-amount"
                        type="number"
                        step="0.01"
                        value={newCheck.amount}
                        onChange={(e) => setNewCheck(p => ({ ...p, amount: e.target.value }))}
                        data-testid="input-check-amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="check-issue-date">Fecha Emisión</Label>
                      <Input
                        id="check-issue-date"
                        type="date"
                        value={newCheck.issueDate}
                        onChange={(e) => setNewCheck(p => ({ ...p, issueDate: e.target.value }))}
                        data-testid="input-check-issue-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="check-due-date">Fecha Vencimiento</Label>
                      <Input
                        id="check-due-date"
                        type="date"
                        value={newCheck.dueDate}
                        onChange={(e) => setNewCheck(p => ({ ...p, dueDate: e.target.value }))}
                        data-testid="input-check-due-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="check-issuer">Librador</Label>
                      <Input
                        id="check-issuer"
                        value={newCheck.issuerName}
                        onChange={(e) => setNewCheck(p => ({ ...p, issuerName: e.target.value }))}
                        data-testid="input-check-issuer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="check-issuer-cuit">CUIT Librador</Label>
                      <Input
                        id="check-issuer-cuit"
                        value={newCheck.issuerCuit}
                        onChange={(e) => setNewCheck(p => ({ ...p, issuerCuit: e.target.value }))}
                        data-testid="input-check-issuer-cuit"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="check-notes">Notas</Label>
                      <Textarea
                        id="check-notes"
                        value={newCheck.notes}
                        onChange={(e) => setNewCheck(p => ({ ...p, notes: e.target.value }))}
                        data-testid="input-check-notes"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={() => createCheckMutation.mutate(newCheck)}
                      disabled={!newCheck.checkNumber || !newCheck.bankName || !newCheck.amount || !newCheck.issueDate || !newCheck.dueDate || !newCheck.issuerName || createCheckMutation.isPending}
                      data-testid="button-save-check"
                    >
                      Registrar Cheque
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {checksWithAlerts.filter(c => c.alertLevel !== 'normal').length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-orange-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Alertas de Vencimiento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {checksWithAlerts
                      .filter(c => c.alertLevel !== 'normal')
                      .map(check => (
                        <div 
                          key={check.id} 
                          className="flex items-center justify-between p-3 bg-white rounded-lg"
                          data-testid={`alert-check-${check.id}`}
                        >
                          <div className="flex items-center gap-3">
                            {getAlertBadge(check)}
                            <div>
                              <p className="font-medium">Cheque #{check.checkNumber}</p>
                              <p className="text-sm text-slate-600">{check.issuerName} - {check.bankName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              ${parseFloat(check.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-slate-500">
                              Vence: {format(new Date(check.dueDate), "dd/MM/yyyy", { locale: es })}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Cheques Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {checksWithAlerts.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No hay cheques pendientes</p>
                  ) : (
                    checksWithAlerts.map(check => (
                      <div 
                        key={check.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50"
                        data-testid={`check-${check.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            {check.checkType === 'echeq' ? (
                              <CreditCard className="h-5 w-5 text-slate-600" />
                            ) : (
                              <FileText className="h-5 w-5 text-slate-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">#{check.checkNumber}</p>
                              <Badge variant="outline">{check.checkType === 'echeq' ? 'E-Cheq' : 'Físico'}</Badge>
                              {getAlertBadge(check)}
                            </div>
                            <p className="text-sm text-slate-600">{check.issuerName}</p>
                            <p className="text-xs text-slate-500">
                              {check.bankName} - Vence: {format(new Date(check.dueDate), "dd/MM/yyyy", { locale: es })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold text-lg">
                              ${parseFloat(check.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-slate-500">
                              {check.daysUntilDue > 0 
                                ? `${check.daysUntilDue} días para vencer` 
                                : check.daysUntilDue === 0 
                                  ? 'Vence hoy' 
                                  : `${Math.abs(check.daysUntilDue)} días vencido`}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedCheck(check);
                                setCheckAction('deposit');
                                setIsCheckActionDialogOpen(true);
                              }}
                              data-testid={`button-deposit-${check.id}`}
                            >
                              <Building className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedCheck(check);
                                setCheckAction('endorse');
                                setIsCheckActionDialogOpen(true);
                              }}
                              data-testid={`button-endorse-${check.id}`}
                            >
                              <Banknote className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedCheck(check);
                                setCheckAction('reject');
                                setIsCheckActionDialogOpen(true);
                              }}
                              data-testid={`button-reject-${check.id}`}
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Dialog open={isCheckActionDialogOpen} onOpenChange={setIsCheckActionDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {checkAction === 'deposit' && 'Depositar Cheque'}
                    {checkAction === 'endorse' && 'Endosar Cheque'}
                    {checkAction === 'reject' && 'Rechazar Cheque'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {selectedCheck && (
                    <div className="p-4 bg-slate-100 rounded-lg">
                      <p className="font-medium">Cheque #{selectedCheck.checkNumber}</p>
                      <p className="text-sm text-slate-600">{selectedCheck.issuerName} - {selectedCheck.bankName}</p>
                      <p className="font-semibold mt-2">
                        ${parseFloat(selectedCheck.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                  
                  {checkAction === 'deposit' && (
                    <div className="space-y-2">
                      <Label>Cuenta de Depósito</Label>
                      <Select value={actionInput} onValueChange={setActionInput}>
                        <SelectTrigger data-testid="select-deposit-account">
                          <SelectValue placeholder="Seleccione cuenta" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts.map(acc => (
                            <SelectItem key={acc.id} value={String(acc.id)}>
                              {acc.bankName} - {acc.alias || acc.accountNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {checkAction === 'endorse' && (
                    <div className="space-y-2">
                      <Label htmlFor="endorse-to">Endosar a</Label>
                      <Input
                        id="endorse-to"
                        value={actionInput}
                        onChange={(e) => setActionInput(e.target.value)}
                        placeholder="Nombre del beneficiario"
                        data-testid="input-endorse-to"
                      />
                    </div>
                  )}
                  
                  {checkAction === 'reject' && (
                    <div className="space-y-2">
                      <Label htmlFor="reject-reason">Motivo del Rechazo</Label>
                      <Textarea
                        id="reject-reason"
                        value={actionInput}
                        onChange={(e) => setActionInput(e.target.value)}
                        placeholder="Ingrese el motivo del rechazo"
                        data-testid="input-reject-reason"
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsCheckActionDialogOpen(false);
                      setActionInput("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCheckAction}
                    disabled={!actionInput}
                    variant={checkAction === 'reject' ? 'destructive' : 'default'}
                    data-testid="button-confirm-action"
                  >
                    Confirmar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}