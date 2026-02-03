import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Zap, User, Smartphone, Lock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Landing() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [clientId, setClientId] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", "/api/portal/login", { identifier: id });
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("portalToken", data.token);
      toast({ title: "Bienvenido", description: `Hola ${data.client.name}` });
      setLocation("/portal");
    },
    onError: () => {
      toast({ title: "Error", description: "No se encontró un cliente con ese DNI/CUIT", variant: "destructive" });
    }
  });

  const handleClientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientId.trim()) {
      loginMutation.mutate(clientId.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y Branding */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className="h-20 w-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/30 mx-auto">
              <ShoppingCart className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-slate-800 rounded-lg flex items-center justify-center border-2 border-slate-700">
              <Zap className="h-4 w-4 text-orange-500" />
            </div>
          </div>
          
          <h1 className="text-3xl font-black tracking-tight mb-2">
            <span className="text-white">FERRE</span>
            <span className="text-orange-500">CLOUD</span>
          </h1>
          <p className="text-slate-400 text-sm tracking-widest uppercase">
            Sistema de Gestión para Ferreterías
          </p>
        </div>

        {/* Card de Login */}
        <Card className="bg-white/95 backdrop-blur border-0 shadow-2xl">
          <CardContent className="p-6">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100">
                <TabsTrigger 
                  value="personal" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2"
                  data-testid="tab-personal"
                >
                  <User className="h-4 w-4" />
                  <span className="font-semibold">PERSONAL</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="clientes"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2"
                  data-testid="tab-clientes"
                >
                  <Smartphone className="h-4 w-4" />
                  <span className="font-semibold">PORTAL CLIENTES</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab Personal - Empleados */}
              <TabsContent value="personal" className="space-y-6">
                <div className="text-center space-y-2 py-4">
                  <p className="text-slate-600 text-sm">
                    Acceso exclusivo para empleados y administradores
                  </p>
                </div>

                <Button 
                  className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg shadow-lg shadow-orange-500/25"
                  onClick={() => window.location.href = '/api/login'}
                  data-testid="button-login-personal"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  ENTRAR AL ERP
                </Button>

                <p className="text-center text-xs text-slate-400 pt-2">
                  Iniciar sesión con tu cuenta autorizada
                </p>
              </TabsContent>

              {/* Tab Clientes */}
              <TabsContent value="clientes" className="space-y-6">
                <form onSubmit={handleClientLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId" className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                      DNI / CUIT
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="clientId"
                        type="text"
                        placeholder="Ingresa tu DNI o CUIT"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="pl-10 h-12 bg-slate-50 border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                        data-testid="input-client-id"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg shadow-lg shadow-orange-500/25"
                    disabled={loginMutation.isPending || !clientId.trim()}
                    data-testid="button-login-cliente"
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    {loginMutation.isPending ? "INGRESANDO..." : "ACCEDER AL PORTAL"}
                  </Button>
                </form>

                <p className="text-center text-xs text-slate-400 pt-2">
                  Consulta tu cuenta corriente, puntos y ofertas
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-500 text-xs">
            © 2024 FerreCloud · Sistema de gestión en la nube
          </p>
        </div>
      </div>
    </div>
  );
}
