import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, Printer, Shield, Save, FileText, 
  Eye, EyeOff, CheckCircle, AlertCircle
} from "lucide-react";
import type { CompanySettings, PrintSettings } from "@shared/schema";

const taxConditions = [
  "Responsable Inscripto",
  "Monotributista",
  "Exento",
  "Consumidor Final",
  "Responsable No Inscripto"
];

const paperSizes = [
  { value: "A4", label: "A4 (210 x 297 mm)" },
  { value: "A5", label: "A5 (148 x 210 mm)" },
  { value: "A6", label: "A6 (105 x 148 mm)" },
  { value: "Ticket80", label: "Ticket 80mm" },
  { value: "Ticket58", label: "Ticket 58mm" },
];

const provinces = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba", 
  "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja",
  "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan",
  "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", 
  "Tierra del Fuego", "Tucumán"
];

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("company");
  const [selectedPrintType, setSelectedPrintType] = useState<string | null>(null);

  const [companyForm, setCompanyForm] = useState<Partial<CompanySettings>>({
    companyName: "",
    fantasyName: "",
    cuit: "",
    taxCondition: "",
    grossIncome: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    phone: "",
    email: "",
    website: "",
    arcaPointOfSale: undefined,
    arcaEnvironment: "testing",
  });

  const [printForm, setPrintForm] = useState<Partial<PrintSettings>>({});

  const { data: companySettings } = useQuery<CompanySettings>({
    queryKey: ["/api/settings/company"],
  });

  const { data: printSettings = [] } = useQuery<PrintSettings[]>({
    queryKey: ["/api/settings/print"],
  });

  useEffect(() => {
    if (companySettings) {
      setCompanyForm(companySettings);
    }
  }, [companySettings]);

  useEffect(() => {
    if (selectedPrintType) {
      const setting = printSettings.find(s => s.documentType === selectedPrintType);
      if (setting) {
        setPrintForm(setting);
      }
    }
  }, [selectedPrintType, printSettings]);

  const saveCompanyMutation = useMutation({
    mutationFn: (data: Partial<CompanySettings>) => 
      apiRequest("POST", "/api/settings/company", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/company"] });
      toast({ title: "Datos de empresa guardados" });
    },
    onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
  });

  const savePrintMutation = useMutation({
    mutationFn: (data: Partial<PrintSettings>) => 
      apiRequest("POST", "/api/settings/print", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/print"] });
      toast({ title: "Configuración de impresión guardada" });
    },
    onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
  });

  const handleSaveCompany = () => {
    if (!companyForm.companyName || !companyForm.cuit) {
      toast({ title: "Razón social y CUIT son requeridos", variant: "destructive" });
      return;
    }
    saveCompanyMutation.mutate(companyForm);
  };

  const handleSavePrint = () => {
    if (!printForm.documentType) return;
    savePrintMutation.mutate(printForm);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Configuración</h1>
        <p className="text-muted-foreground">Configura los datos de tu empresa y preferencias del sistema</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="company" className="flex items-center gap-2" data-testid="tab-company">
            <Building2 className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="arca" className="flex items-center gap-2" data-testid="tab-arca">
            <Shield className="h-4 w-4" />
            ARCA / AFIP
          </TabsTrigger>
          <TabsTrigger value="print" className="flex items-center gap-2" data-testid="tab-print">
            <Printer className="h-4 w-4" />
            Impresión
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Datos de la Empresa</CardTitle>
              <CardDescription>Información fiscal y de contacto de tu negocio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Razón Social *</Label>
                  <Input
                    value={companyForm.companyName || ""}
                    onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                    placeholder="Razón social según AFIP"
                    data-testid="input-company-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nombre de Fantasía</Label>
                  <Input
                    value={companyForm.fantasyName || ""}
                    onChange={(e) => setCompanyForm({ ...companyForm, fantasyName: e.target.value })}
                    placeholder="Nombre comercial"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>CUIT *</Label>
                  <Input
                    value={companyForm.cuit || ""}
                    onChange={(e) => setCompanyForm({ ...companyForm, cuit: e.target.value })}
                    placeholder="XX-XXXXXXXX-X"
                    data-testid="input-cuit"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Condición IVA</Label>
                  <Select
                    value={companyForm.taxCondition || ""}
                    onValueChange={(v) => setCompanyForm({ ...companyForm, taxCondition: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {taxConditions.map(tc => (
                        <SelectItem key={tc} value={tc}>{tc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ingresos Brutos</Label>
                  <Input
                    value={companyForm.grossIncome || ""}
                    onChange={(e) => setCompanyForm({ ...companyForm, grossIncome: e.target.value })}
                    placeholder="Número IIBB"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-4">Dirección</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Dirección</Label>
                    <Input
                      value={companyForm.address || ""}
                      onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                      placeholder="Calle y número"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ciudad</Label>
                    <Input
                      value={companyForm.city || ""}
                      onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Provincia</Label>
                    <Select
                      value={companyForm.province || ""}
                      onValueChange={(v) => setCompanyForm({ ...companyForm, province: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Código Postal</Label>
                    <Input
                      value={companyForm.postalCode || ""}
                      onChange={(e) => setCompanyForm({ ...companyForm, postalCode: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-4">Contacto</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      value={companyForm.phone || ""}
                      onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={companyForm.email || ""}
                      onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sitio Web</Label>
                    <Input
                      value={companyForm.website || ""}
                      onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                      placeholder="www.ejemplo.com"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={handleSaveCompany}
                  disabled={saveCompanyMutation.isPending}
                  data-testid="button-save-company"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveCompanyMutation.isPending ? "Guardando..." : "Guardar Datos"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arca" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configuración ARCA / AFIP
              </CardTitle>
              <CardDescription>
                Configura la conexión con ARCA (ex AFIP) para facturación electrónica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Requisitos para facturar</p>
                    <ul className="text-sm text-blue-800 mt-2 space-y-1">
                      <li>• Certificado digital (.pem) generado desde ARCA</li>
                      <li>• Clave privada (.key) asociada al certificado</li>
                      <li>• Punto de venta habilitado para factura electrónica</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Punto de Venta</Label>
                  <Input
                    type="number"
                    value={companyForm.arcaPointOfSale || ""}
                    onChange={(e) => setCompanyForm({ ...companyForm, arcaPointOfSale: parseInt(e.target.value) || undefined })}
                    placeholder="1"
                    data-testid="input-arca-pos"
                  />
                  <p className="text-xs text-muted-foreground">Número de punto de venta habilitado en ARCA</p>
                </div>
                <div className="space-y-2">
                  <Label>Entorno</Label>
                  <Select
                    value={companyForm.arcaEnvironment || "testing"}
                    onValueChange={(v) => setCompanyForm({ ...companyForm, arcaEnvironment: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="testing">
                        <span className="flex items-center gap-2">
                          <Badge variant="secondary">Testing</Badge>
                          Homologación
                        </span>
                      </SelectItem>
                      <SelectItem value="production">
                        <span className="flex items-center gap-2">
                          <Badge>Producción</Badge>
                          Facturación real
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Certificado (.pem)</Label>
                <Textarea
                  value={companyForm.arcaCertificate || ""}
                  onChange={(e) => setCompanyForm({ ...companyForm, arcaCertificate: e.target.value })}
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  className="font-mono text-xs"
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label>Clave Privada (.key)</Label>
                <Textarea
                  value={companyForm.arcaPrivateKey || ""}
                  onChange={(e) => setCompanyForm({ ...companyForm, arcaPrivateKey: e.target.value })}
                  placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                  className="font-mono text-xs"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  La clave privada se almacena de forma segura y nunca se muestra
                </p>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={handleSaveCompany}
                  disabled={saveCompanyMutation.isPending}
                  data-testid="button-save-arca"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Configuración ARCA
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="print" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Tipos de Comprobante</CardTitle>
                <CardDescription>Selecciona para configurar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {printSettings.map(ps => (
                  <Button
                    key={ps.documentType}
                    variant={selectedPrintType === ps.documentType ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedPrintType(ps.documentType)}
                    data-testid={`button-print-${ps.documentType}`}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {ps.documentName}
                    <Badge variant="secondary" className="ml-auto">
                      {ps.paperSize}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedPrintType 
                    ? `Configurar: ${printSettings.find(p => p.documentType === selectedPrintType)?.documentName}`
                    : "Selecciona un comprobante"
                  }
                </CardTitle>
                <CardDescription>
                  Personaliza el formato y elementos a mostrar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedPrintType ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Printer className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Selecciona un tipo de comprobante para configurar</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Tamaño de Papel</Label>
                        <Select
                          value={printForm.paperSize || "A4"}
                          onValueChange={(v) => setPrintForm({ ...printForm, paperSize: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {paperSizes.map(ps => (
                              <SelectItem key={ps.value} value={ps.value}>{ps.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Orientación</Label>
                        <Select
                          value={printForm.orientation || "portrait"}
                          onValueChange={(v) => setPrintForm({ ...printForm, orientation: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="portrait">Vertical (Portrait)</SelectItem>
                            <SelectItem value="landscape">Horizontal (Landscape)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Margen Superior (mm)</Label>
                        <Input
                          type="number"
                          value={printForm.marginTop ?? 10}
                          onChange={(e) => setPrintForm({ ...printForm, marginTop: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Margen Inferior (mm)</Label>
                        <Input
                          type="number"
                          value={printForm.marginBottom ?? 10}
                          onChange={(e) => setPrintForm({ ...printForm, marginBottom: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Margen Izquierdo (mm)</Label>
                        <Input
                          type="number"
                          value={printForm.marginLeft ?? 10}
                          onChange={(e) => setPrintForm({ ...printForm, marginLeft: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Margen Derecho (mm)</Label>
                        <Input
                          type="number"
                          value={printForm.marginRight ?? 10}
                          onChange={(e) => setPrintForm({ ...printForm, marginRight: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-4">Elementos a Mostrar</h3>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="flex items-center justify-between">
                          <Label>Logo de la empresa</Label>
                          <Switch
                            checked={printForm.showLogo ?? true}
                            onCheckedChange={(v) => setPrintForm({ ...printForm, showLogo: v })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Datos de la empresa</Label>
                          <Switch
                            checked={printForm.showCompanyData ?? true}
                            onCheckedChange={(v) => setPrintForm({ ...printForm, showCompanyData: v })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Datos del cliente</Label>
                          <Switch
                            checked={printForm.showClientData ?? true}
                            onCheckedChange={(v) => setPrintForm({ ...printForm, showClientData: v })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="font-medium text-primary">Mostrar Precios</Label>
                          <Switch
                            checked={printForm.showPrices ?? true}
                            onCheckedChange={(v) => setPrintForm({ ...printForm, showPrices: v })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Precio Unitario</Label>
                          <Switch
                            checked={printForm.showUnitPrice ?? true}
                            onCheckedChange={(v) => setPrintForm({ ...printForm, showUnitPrice: v })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Subtotal por línea</Label>
                          <Switch
                            checked={printForm.showSubtotal ?? true}
                            onCheckedChange={(v) => setPrintForm({ ...printForm, showSubtotal: v })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Descuentos</Label>
                          <Switch
                            checked={printForm.showDiscounts ?? true}
                            onCheckedChange={(v) => setPrintForm({ ...printForm, showDiscounts: v })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Impuestos (IVA)</Label>
                          <Switch
                            checked={printForm.showTaxes ?? true}
                            onCheckedChange={(v) => setPrintForm({ ...printForm, showTaxes: v })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Total</Label>
                          <Switch
                            checked={printForm.showTotal ?? true}
                            onCheckedChange={(v) => setPrintForm({ ...printForm, showTotal: v })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Forma de pago</Label>
                          <Switch
                            checked={printForm.showPaymentMethod ?? true}
                            onCheckedChange={(v) => setPrintForm({ ...printForm, showPaymentMethod: v })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Notas/Observaciones</Label>
                          <Switch
                            checked={printForm.showNotes ?? true}
                            onCheckedChange={(v) => setPrintForm({ ...printForm, showNotes: v })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Código de barras</Label>
                          <Switch
                            checked={printForm.showBarcode ?? false}
                            onCheckedChange={(v) => setPrintForm({ ...printForm, showBarcode: v })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Código QR</Label>
                          <Switch
                            checked={printForm.showQrCode ?? false}
                            onCheckedChange={(v) => setPrintForm({ ...printForm, showQrCode: v })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Espacio para firma</Label>
                          <Switch
                            checked={printForm.showSignature ?? false}
                            onCheckedChange={(v) => setPrintForm({ ...printForm, showSignature: v })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-4">Textos Personalizados</h3>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label>Texto de encabezado</Label>
                          <Input
                            value={printForm.headerText || ""}
                            onChange={(e) => setPrintForm({ ...printForm, headerText: e.target.value })}
                            placeholder="Texto opcional en el encabezado"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Texto de pie de página</Label>
                          <Textarea
                            value={printForm.footerText || ""}
                            onChange={(e) => setPrintForm({ ...printForm, footerText: e.target.value })}
                            placeholder="Texto opcional al pie del comprobante"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 border-t pt-4">
                      <div className="space-y-2">
                        <Label>Número de copias</Label>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          value={printForm.copies ?? 1}
                          onChange={(e) => setPrintForm({ ...printForm, copies: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <Button 
                        onClick={handleSavePrint}
                        disabled={savePrintMutation.isPending}
                        data-testid="button-save-print"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {savePrintMutation.isPending ? "Guardando..." : "Guardar Configuración"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
