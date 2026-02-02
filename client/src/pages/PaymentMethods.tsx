import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  CreditCard, Wallet, Building2, Plus, Pencil, Trash2, Settings, 
  Banknote, ArrowRightLeft, Receipt, Percent, Check, X, Loader2
} from "lucide-react";
import type { PaymentMethod, CardConfiguration, CardInstallmentPlan, BankAccount, CardWithPlans } from "@shared/schema";

export default function PaymentMethods() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("methods");
  const [isMethodDialogOpen, setIsMethodDialogOpen] = useState(false);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [editingCard, setEditingCard] = useState<CardWithPlans | null>(null);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [selectedCardForPlan, setSelectedCardForPlan] = useState<CardWithPlans | null>(null);

  const { data: paymentMethods = [], isLoading: loadingMethods } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

  const { data: cards = [], isLoading: loadingCards } = useQuery<CardWithPlans[]>({
    queryKey: ["/api/cards"],
  });

  const { data: bankAccounts = [], isLoading: loadingBanks } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const updateMethodMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<PaymentMethod>) => {
      return apiRequest("PUT", `/api/payment-methods/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({ title: "Método de pago actualizado" });
    },
  });

  const deleteMethodMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/payment-methods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({ title: "Método de pago desactivado" });
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<CardConfiguration>) => {
      return apiRequest("PUT", `/api/cards/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      toast({ title: "Tarjeta actualizada" });
    },
  });

  const createBankMutation = useMutation({
    mutationFn: async (data: Partial<BankAccount>) => {
      return apiRequest("POST", "/api/bank-accounts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      setIsBankDialogOpen(false);
      toast({ title: "Cuenta bancaria creada" });
    },
  });

  const updateBankMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<BankAccount>) => {
      return apiRequest("PUT", `/api/bank-accounts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      setIsBankDialogOpen(false);
      toast({ title: "Cuenta bancaria actualizada" });
    },
  });

  const deleteBankMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/bank-accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({ title: "Cuenta bancaria desactivada" });
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async ({ cardId, ...data }: { cardId: number; installments: number; surchargePercent: string; description?: string }) => {
      return apiRequest("POST", `/api/cards/${cardId}/installments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      setIsPlanDialogOpen(false);
      toast({ title: "Plan de cuotas creado" });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/installments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      toast({ title: "Plan de cuotas eliminado" });
    },
  });

  const getMethodIcon = (code: string) => {
    switch (code) {
      case "cash": return <Banknote className="h-5 w-5" />;
      case "card": return <CreditCard className="h-5 w-5" />;
      case "transfer": return <ArrowRightLeft className="h-5 w-5" />;
      case "check": case "echeq": return <Receipt className="h-5 w-5" />;
      case "credit_account": return <Wallet className="h-5 w-5" />;
      default: return <Settings className="h-5 w-5" />;
    }
  };

  const renderPaymentMethodsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Configura los métodos de pago disponibles en tu negocio</p>
      </div>

      {loadingMethods ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paymentMethods.map((method) => (
            <Card key={method.id} className={!method.isActive ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${method.isActive ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-400"}`}>
                      {getMethodIcon(method.code)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{method.name}</CardTitle>
                      <p className="text-sm text-slate-500">{method.code}</p>
                    </div>
                  </div>
                  <Switch
                    checked={method.isActive ?? true}
                    onCheckedChange={(checked) => 
                      updateMethodMutation.mutate({ id: method.id, isActive: checked })
                    }
                    data-testid={`toggle-method-${method.code}`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mt-2">
                  {method.requiresReference && (
                    <Badge variant="outline">Requiere referencia</Badge>
                  )}
                  {method.allowsInstallments && (
                    <Badge variant="outline">Permite cuotas</Badge>
                  )}
                  {Number(method.defaultSurchargePercent) > 0 && (
                    <Badge variant="secondary">+{method.defaultSurchargePercent}%</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderCardsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Configura las tarjetas aceptadas y sus planes de cuotas</p>
        <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCard(null)} data-testid="button-add-card">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarjeta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCard ? "Editar Tarjeta" : "Nueva Tarjeta"}</DialogTitle>
            </DialogHeader>
            <CardForm 
              card={editingCard} 
              onSave={async (data) => {
                if (editingCard) {
                  await updateCardMutation.mutateAsync({ id: editingCard.id, ...data });
                } else {
                  await apiRequest("POST", "/api/cards", data);
                  queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
                }
                setIsCardDialogOpen(false);
                toast({ title: editingCard ? "Tarjeta actualizada" : "Tarjeta creada" });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loadingCards ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map((card) => (
            <Card key={card.id} className={!card.isActive ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${card.isActive ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{card.displayName}</CardTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{card.cardBrand.toUpperCase()}</Badge>
                        <Badge variant={card.cardType === "credit" ? "default" : "secondary"}>
                          {card.cardType === "credit" ? "Crédito" : "Débito"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setEditingCard(card);
                        setIsCardDialogOpen(true);
                      }}
                      data-testid={`button-edit-card-${card.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={card.isActive ?? true}
                      onCheckedChange={(checked) => 
                        updateCardMutation.mutate({ id: card.id, isActive: checked })
                      }
                      data-testid={`toggle-card-${card.id}`}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {card.cardType === "credit" && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-700">Planes de Cuotas</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedCardForPlan(card);
                          setIsPlanDialogOpen(true);
                        }}
                        data-testid={`button-add-plan-${card.id}`}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Agregar Plan
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {card.installmentPlans?.map((plan) => (
                        <div 
                          key={plan.id} 
                          className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full text-sm"
                        >
                          <span className="font-medium">{plan.installments} cuota{plan.installments > 1 ? "s" : ""}</span>
                          {Number(plan.surchargePercent) > 0 && (
                            <span className="text-orange-600">+{plan.surchargePercent}%</span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 ml-1"
                            onClick={() => deletePlanMutation.mutate(plan.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {(!card.installmentPlans || card.installmentPlans.length === 0) && (
                        <p className="text-sm text-slate-400">Sin planes configurados</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Plan de Cuotas - {selectedCardForPlan?.displayName}</DialogTitle>
          </DialogHeader>
          <InstallmentPlanForm 
            cardId={selectedCardForPlan?.id ?? 0}
            onSave={async (data) => {
              await createPlanMutation.mutateAsync(data);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderBankAccountsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Administra las cuentas bancarias para recibir transferencias</p>
        <Dialog open={isBankDialogOpen} onOpenChange={setIsBankDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingBank(null)} data-testid="button-add-bank">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cuenta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingBank ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}</DialogTitle>
            </DialogHeader>
            <BankAccountForm 
              account={editingBank}
              onSave={async (data) => {
                if (editingBank) {
                  await updateBankMutation.mutateAsync({ id: editingBank.id, ...data });
                } else {
                  await createBankMutation.mutateAsync(data);
                }
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loadingBanks ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      ) : bankAccounts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500 text-center mb-4">
              No hay cuentas bancarias configuradas.<br />
              Agrega una cuenta para recibir transferencias.
            </p>
            <Button onClick={() => setIsBankDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Cuenta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bankAccounts.map((account) => (
            <Card key={account.id} className={!account.isActive ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${account.isActive ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {account.bankName}
                        {account.isDefault && (
                          <Badge className="bg-green-600">Principal</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-slate-500">
                        {account.accountType === "checking" ? "Cuenta Corriente" : "Caja de Ahorro"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setEditingBank(account);
                        setIsBankDialogOpen(true);
                      }}
                      data-testid={`button-edit-bank-${account.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteBankMutation.mutate(account.id)}
                      data-testid={`button-delete-bank-${account.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Titular:</span>
                    <span className="font-medium">{account.holderName}</span>
                  </div>
                  {account.holderCuit && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">CUIT:</span>
                      <span className="font-mono">{account.holderCuit}</span>
                    </div>
                  )}
                  {account.cbu && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">CBU:</span>
                      <span className="font-mono text-xs">{account.cbu}</span>
                    </div>
                  )}
                  {account.alias && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Alias:</span>
                      <span className="font-medium">{account.alias}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Formas de Pago</h1>
          <p className="text-slate-500 mt-1">Configura los métodos de pago, tarjetas y cuentas bancarias</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="methods" data-testid="tab-methods">
              <Wallet className="h-4 w-4 mr-2" />
              Métodos
            </TabsTrigger>
            <TabsTrigger value="cards" data-testid="tab-cards">
              <CreditCard className="h-4 w-4 mr-2" />
              Tarjetas
            </TabsTrigger>
            <TabsTrigger value="banks" data-testid="tab-banks">
              <Building2 className="h-4 w-4 mr-2" />
              Bancos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="methods" className="mt-6">
            {renderPaymentMethodsTab()}
          </TabsContent>

          <TabsContent value="cards" className="mt-6">
            {renderCardsTab()}
          </TabsContent>

          <TabsContent value="banks" className="mt-6">
            {renderBankAccountsTab()}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function CardForm({ card, onSave }: { card: CardWithPlans | null; onSave: (data: any) => Promise<void> }) {
  const [formData, setFormData] = useState({
    cardBrand: card?.cardBrand || "",
    cardType: card?.cardType || "credit",
    displayName: card?.displayName || "",
    maxInstallments: card?.maxInstallments || 1,
    defaultSurchargePercent: card?.defaultSurchargePercent || "0",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cardBrand">Marca</Label>
          <Input
            id="cardBrand"
            value={formData.cardBrand}
            onChange={(e) => setFormData({ ...formData, cardBrand: e.target.value })}
            placeholder="visa, mastercard..."
            required
            data-testid="input-card-brand"
          />
        </div>
        <div>
          <Label htmlFor="cardType">Tipo</Label>
          <Select value={formData.cardType} onValueChange={(v) => setFormData({ ...formData, cardType: v })}>
            <SelectTrigger data-testid="select-card-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="credit">Crédito</SelectItem>
              <SelectItem value="debit">Débito</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="displayName">Nombre a Mostrar</Label>
        <Input
          id="displayName"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          placeholder="Visa Crédito"
          required
          data-testid="input-card-display-name"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="maxInstallments">Máx. Cuotas</Label>
          <Input
            id="maxInstallments"
            type="number"
            min="1"
            max="48"
            value={formData.maxInstallments}
            onChange={(e) => setFormData({ ...formData, maxInstallments: Number(e.target.value) })}
            data-testid="input-max-installments"
          />
        </div>
        <div>
          <Label htmlFor="defaultSurcharge">Recargo Default (%)</Label>
          <Input
            id="defaultSurcharge"
            type="number"
            min="0"
            step="0.5"
            value={formData.defaultSurchargePercent}
            onChange={(e) => setFormData({ ...formData, defaultSurchargePercent: e.target.value })}
            data-testid="input-default-surcharge"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={saving} data-testid="button-save-card">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {card ? "Guardar Cambios" : "Crear Tarjeta"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function InstallmentPlanForm({ cardId, onSave }: { cardId: number; onSave: (data: any) => Promise<void> }) {
  const [formData, setFormData] = useState({
    installments: 3,
    surchargePercent: "0",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ cardId, ...formData });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="installments">Cantidad de Cuotas</Label>
          <Input
            id="installments"
            type="number"
            min="1"
            max="48"
            value={formData.installments}
            onChange={(e) => setFormData({ ...formData, installments: Number(e.target.value) })}
            required
            data-testid="input-installments"
          />
        </div>
        <div>
          <Label htmlFor="surcharge">Recargo (%)</Label>
          <Input
            id="surcharge"
            type="number"
            min="0"
            step="0.5"
            value={formData.surchargePercent}
            onChange={(e) => setFormData({ ...formData, surchargePercent: e.target.value })}
            required
            data-testid="input-surcharge"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="3 cuotas sin interés"
          data-testid="input-plan-description"
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={saving} data-testid="button-save-plan">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Agregar Plan
        </Button>
      </DialogFooter>
    </form>
  );
}

function BankAccountForm({ account, onSave }: { account: BankAccount | null; onSave: (data: any) => Promise<void> }) {
  const [formData, setFormData] = useState({
    bankName: account?.bankName || "",
    accountType: account?.accountType || "checking",
    accountNumber: account?.accountNumber || "",
    cbu: account?.cbu || "",
    alias: account?.alias || "",
    holderName: account?.holderName || "",
    holderCuit: account?.holderCuit || "",
    isDefault: account?.isDefault || false,
    notes: account?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bankName">Banco</Label>
          <Input
            id="bankName"
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            placeholder="Banco Nación"
            required
            data-testid="input-bank-name"
          />
        </div>
        <div>
          <Label htmlFor="accountType">Tipo de Cuenta</Label>
          <Select value={formData.accountType} onValueChange={(v) => setFormData({ ...formData, accountType: v })}>
            <SelectTrigger data-testid="select-account-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checking">Cuenta Corriente</SelectItem>
              <SelectItem value="savings">Caja de Ahorro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="holderName">Titular</Label>
        <Input
          id="holderName"
          value={formData.holderName}
          onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
          placeholder="Nombre del titular"
          required
          data-testid="input-holder-name"
        />
      </div>
      <div>
        <Label htmlFor="holderCuit">CUIT del Titular</Label>
        <Input
          id="holderCuit"
          value={formData.holderCuit}
          onChange={(e) => setFormData({ ...formData, holderCuit: e.target.value })}
          placeholder="20-12345678-9"
          data-testid="input-holder-cuit"
        />
      </div>
      <div>
        <Label htmlFor="cbu">CBU</Label>
        <Input
          id="cbu"
          value={formData.cbu}
          onChange={(e) => setFormData({ ...formData, cbu: e.target.value })}
          placeholder="0110012345678901234567"
          data-testid="input-cbu"
        />
      </div>
      <div>
        <Label htmlFor="alias">Alias</Label>
        <Input
          id="alias"
          value={formData.alias}
          onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
          placeholder="MI.ALIAS.BANCO"
          data-testid="input-alias"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="isDefault"
          checked={formData.isDefault}
          onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
          data-testid="toggle-default-account"
        />
        <Label htmlFor="isDefault">Cuenta Principal</Label>
      </div>
      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Notas adicionales..."
          data-testid="input-bank-notes"
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={saving} data-testid="button-save-bank">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {account ? "Guardar Cambios" : "Crear Cuenta"}
        </Button>
      </DialogFooter>
    </form>
  );
}
