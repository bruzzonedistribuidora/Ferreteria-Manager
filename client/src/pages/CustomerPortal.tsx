import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  LogIn, User, Wallet, Star, Gift, CreditCard, 
  ArrowUpRight, ArrowDownLeft, Phone, Mail, MessageCircle,
  LogOut, Receipt, Clock, CheckCircle2, XCircle, Send
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type ClientData = {
  client: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    taxId: string | null;
    clientType: string | null;
  };
  balance: number;
  movements: Array<{
    id: number;
    type: string;
    description: string;
    amount: string;
    balance: string;
    createdAt: string;
  }>;
  points: number;
  pointsTransactions: Array<{
    id: number;
    type: string;
    points: number;
    description: string | null;
    createdAt: string;
  }>;
  program: {
    name: string;
    pointsPerCurrency: number;
    currencyPerPoint: number;
    minRedeemPoints: number;
  } | null;
};

type Offer = {
  id: number;
  title: string;
  description: string | null;
  discountType: string;
  discountValue: string;
  validFrom: string | null;
  validTo: string | null;
  imageUrl: string | null;
};

export default function CustomerPortal() {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(localStorage.getItem("portalToken"));
  const [identifier, setIdentifier] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("transferencia");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", "/api/portal/login", { identifier: id });
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("portalToken", data.token);
      setToken(data.token);
      toast({ title: "Bienvenido", description: `Hola ${data.client.name}` });
    },
    onError: () => {
      toast({ title: "Error", description: "No se encontró un cliente con ese DNI/CUIT", variant: "destructive" });
    }
  });

  const { data: clientData, isLoading: loadingClient } = useQuery<ClientData>({
    queryKey: ["/api/portal/client", token],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch(`/api/portal/client/${token}`);
      if (!res.ok) throw new Error("Session expired");
      return res.json();
    },
    retry: false
  });

  const { data: offers = [] } = useQuery<Offer[]>({
    queryKey: ["/api/portal/offers"],
    enabled: !!token
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/portal/payment-request", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Solicitud enviada", description: "Recibirás confirmación pronto" });
      setPaymentAmount("");
      setReferenceNumber("");
      setPaymentNotes("");
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo enviar la solicitud", variant: "destructive" });
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("portalToken");
    setToken(null);
  };

  useEffect(() => {
    if (token && !loadingClient && !clientData) {
      handleLogout();
    }
  }, [token, loadingClient, clientData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier.trim()) {
      loginMutation.mutate(identifier.trim());
    }
  };

  const handlePaymentRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || !clientData) return;
    
    paymentMutation.mutate({
      clientId: clientData.client.id,
      amount: paymentAmount,
      paymentMethod,
      referenceNumber: referenceNumber || null,
      notes: paymentNotes || null
    });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">Portal de Clientes</CardTitle>
            <CardDescription>
              Accedé a tu cuenta, consultá tu saldo y puntos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">DNI o CUIT</Label>
                <Input
                  id="identifier"
                  data-testid="input-identifier"
                  placeholder="Ingresá tu DNI o CUIT"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="text-lg"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {loginMutation.isPending ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando tu información...</p>
        </div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  const isCurrentAccount = clientData.client.clientType === "cuenta_corriente";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="bg-white dark:bg-slate-800 border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium">{clientData.client.name}</p>
              <p className="text-xs text-muted-foreground">{clientData.client.taxId}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {isCurrentAccount && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Saldo de Cuenta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${clientData.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(clientData.balance).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {clientData.balance >= 0 ? "A favor" : "Debes"}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Star className="w-4 h-4" />
                Mis Puntos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {clientData.points.toLocaleString("es-AR")}
              </div>
              {clientData.program && (
                <p className="text-sm text-muted-foreground mt-1">
                  Equivalen a ${(clientData.points * clientData.program.currencyPerPoint).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="movements" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            {isCurrentAccount && <TabsTrigger value="movements" data-testid="tab-movements">Movimientos</TabsTrigger>}
            <TabsTrigger value="points" data-testid="tab-points">Puntos</TabsTrigger>
            <TabsTrigger value="offers" data-testid="tab-offers">Ofertas</TabsTrigger>
            {isCurrentAccount && <TabsTrigger value="payment" data-testid="tab-payment">Pagar</TabsTrigger>}
          </TabsList>

          {isCurrentAccount && (
            <TabsContent value="movements">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Movimientos de Cuenta</CardTitle>
                  <CardDescription>Tus últimos movimientos</CardDescription>
                </CardHeader>
                <CardContent>
                  {clientData.movements.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No hay movimientos registrados
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {clientData.movements.map((mov) => (
                        <div key={mov.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {mov.type === "cargo" ? (
                              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                                <ArrowUpRight className="w-4 h-4 text-red-600" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                <ArrowDownLeft className="w-4 h-4 text-green-600" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">{mov.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(mov.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${mov.type === "cargo" ? "text-red-600" : "text-green-600"}`}>
                              {mov.type === "cargo" ? "-" : "+"}${parseFloat(mov.amount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Saldo: ${parseFloat(mov.balance).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="points">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historial de Puntos</CardTitle>
                <CardDescription>
                  {clientData.program ? (
                    <>Acumulás {clientData.program.pointsPerCurrency} puntos por cada $1.000</>
                  ) : (
                    "Tu historial de puntos"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientData.pointsTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aún no tenés puntos acumulados
                  </p>
                ) : (
                  <div className="space-y-3">
                    {clientData.pointsTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {tx.type === "earn" ? (
                            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                              <Star className="w-4 h-4 text-orange-600" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                              <Gift className="w-4 h-4 text-purple-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{tx.description || (tx.type === "earn" ? "Puntos acumulados" : "Canje de puntos")}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                            </p>
                          </div>
                        </div>
                        <Badge variant={tx.type === "earn" ? "default" : "secondary"}>
                          {tx.type === "earn" ? "+" : "-"}{tx.points} pts
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offers">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ofertas y Promociones</CardTitle>
                <CardDescription>Beneficios exclusivos para vos</CardDescription>
              </CardHeader>
              <CardContent>
                {offers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay ofertas disponibles en este momento
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {offers.map((offer) => (
                      <div key={offer.id} className="border rounded-lg overflow-hidden">
                        {offer.imageUrl && (
                          <img src={offer.imageUrl} alt={offer.title} className="w-full h-32 object-cover" />
                        )}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{offer.title}</h3>
                            <Badge variant="secondary">
                              {offer.discountType === "percentage" 
                                ? `${offer.discountValue}% OFF` 
                                : `$${offer.discountValue}`}
                            </Badge>
                          </div>
                          {offer.description && (
                            <p className="text-sm text-muted-foreground">{offer.description}</p>
                          )}
                          {offer.validTo && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Válido hasta {format(new Date(offer.validTo), "dd/MM/yyyy", { locale: es })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isCurrentAccount && (
            <TabsContent value="payment">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Avisar Pago</CardTitle>
                  <CardDescription>
                    Informanos tu pago para acreditarlo rápidamente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePaymentRequest} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentAmount">Monto pagado</Label>
                      <Input
                        id="paymentAmount"
                        data-testid="input-payment-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Método de pago</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "transferencia", label: "Transferencia" },
                          { value: "deposito", label: "Depósito" },
                          { value: "efectivo", label: "Efectivo" },
                          { value: "cheque", label: "Cheque" }
                        ].map((method) => (
                          <Button
                            key={method.value}
                            type="button"
                            variant={paymentMethod === method.value ? "default" : "outline"}
                            className="w-full"
                            onClick={() => setPaymentMethod(method.value)}
                            data-testid={`button-method-${method.value}`}
                          >
                            {method.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="referenceNumber">Número de referencia (opcional)</Label>
                      <Input
                        id="referenceNumber"
                        data-testid="input-reference"
                        placeholder="Ej: número de transferencia"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentNotes">Notas (opcional)</Label>
                      <Input
                        id="paymentNotes"
                        data-testid="input-notes"
                        placeholder="Información adicional"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={paymentMutation.isPending || !paymentAmount}
                      data-testid="button-submit-payment"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {paymentMutation.isPending ? "Enviando..." : "Enviar Aviso de Pago"}
                    </Button>
                  </form>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <h4 className="font-medium">Datos para transferencia</h4>
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                      <p><strong>Banco:</strong> Banco Galicia</p>
                      <p><strong>CBU:</strong> 0000000000000000000000</p>
                      <p><strong>Alias:</strong> FERRECLOUD.PAGOS</p>
                      <p><strong>Titular:</strong> Ferretería S.R.L.</p>
                      <p><strong>CUIT:</strong> 30-00000000-0</p>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <h4 className="font-medium">Contactanos</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href="tel:+5411000000" data-testid="link-phone">
                          <Phone className="w-4 h-4 mr-2" />
                          Llamar
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://wa.me/5491100000000" target="_blank" data-testid="link-whatsapp">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          WhatsApp
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href="mailto:cobranzas@ferrecloud.com" data-testid="link-email">
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
