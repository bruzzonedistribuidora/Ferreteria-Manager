import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plug, Wifi, CreditCard, Truck, MessageSquare, FileText, Database, Cloud, Settings, ExternalLink } from "lucide-react";

type Integration = {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  status: "connected" | "available" | "coming_soon";
  configurable?: boolean;
};

const integrations: Integration[] = [
  {
    id: "mercadopago",
    name: "MercadoPago",
    description: "Recibe pagos con tarjeta, QR y más.",
    icon: CreditCard,
    category: "Pagos",
    status: "available",
    configurable: true
  },
  {
    id: "afip_facturacion",
    name: "AFIP / ARCA",
    description: "Facturación electrónica oficial.",
    icon: FileText,
    category: "Fiscal",
    status: "available",
    configurable: true
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Envía comprobantes y notificaciones.",
    icon: MessageSquare,
    category: "Comunicación",
    status: "available",
    configurable: true
  },
  {
    id: "correo_argentino",
    name: "Correo Argentino",
    description: "Calcula envíos y genera etiquetas.",
    icon: Truck,
    category: "Envíos",
    status: "coming_soon"
  },
  {
    id: "andreani",
    name: "Andreani",
    description: "Integración con Andreani para envíos.",
    icon: Truck,
    category: "Envíos",
    status: "coming_soon"
  },
  {
    id: "google_drive",
    name: "Google Drive",
    description: "Respaldo automático de datos.",
    icon: Cloud,
    category: "Backup",
    status: "available"
  },
  {
    id: "excel_export",
    name: "Exportación Excel",
    description: "Exporta informes en formato Excel.",
    icon: Database,
    category: "Datos",
    status: "connected"
  },
  {
    id: "tiendanube",
    name: "Tiendanube",
    description: "Sincroniza productos y pedidos.",
    icon: Cloud,
    category: "E-Commerce",
    status: "coming_soon"
  }
];

export default function Integrations() {
  const categories = [...new Set(integrations.map(i => i.category))];

  const StatusBadge = ({ status }: { status: Integration["status"] }) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-700">Conectado</Badge>;
      case "available":
        return <Badge variant="outline">Disponible</Badge>;
      case "coming_soon":
        return <Badge variant="secondary">Próximamente</Badge>;
    }
  };

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Integraciones</h1>
          <p className="text-slate-500 dark:text-slate-400">Conecta FerreCloud con otros servicios y plataformas.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Conectadas</CardTitle>
              <Wifi className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {integrations.filter(i => i.status === "connected").length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Disponibles</CardTitle>
              <Plug className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {integrations.filter(i => i.status === "available").length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximamente</CardTitle>
              <Cloud className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {integrations.filter(i => i.status === "coming_soon").length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Categorías</CardTitle>
              <Settings className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {categories.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {categories.map(category => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {integrations.filter(i => i.category === category).map(integration => (
                  <Card 
                    key={integration.id} 
                    className={`${integration.status === "connected" ? "border-green-200 bg-green-50/50 dark:bg-green-950/30" : ""}`}
                    data-testid={`card-integration-${integration.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            integration.status === "connected" 
                              ? "bg-green-100 dark:bg-green-900" 
                              : "bg-slate-100 dark:bg-slate-800"
                          }`}>
                            <integration.icon className={`h-5 w-5 ${
                              integration.status === "connected" 
                                ? "text-green-600" 
                                : "text-slate-600"
                            }`} />
                          </div>
                          <div>
                            <CardTitle className="text-base">{integration.name}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {integration.description}
                            </CardDescription>
                          </div>
                        </div>
                        <StatusBadge status={integration.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        {integration.status === "connected" && (
                          <div className="flex items-center gap-2">
                            <Switch checked={true} />
                            <Label className="text-sm">Activa</Label>
                          </div>
                        )}
                        {integration.status === "available" && (
                          <Button size="sm" variant="outline" data-testid={`button-connect-${integration.id}`}>
                            <Plug className="h-4 w-4 mr-1" />
                            Conectar
                          </Button>
                        )}
                        {integration.status === "coming_soon" && (
                          <span className="text-xs text-muted-foreground">
                            Disponible próximamente
                          </span>
                        )}
                        {integration.configurable && integration.status !== "coming_soon" && (
                          <Button size="sm" variant="ghost" data-testid={`button-settings-${integration.id}`}>
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
