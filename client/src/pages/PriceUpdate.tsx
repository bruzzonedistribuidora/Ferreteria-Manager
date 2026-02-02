import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, FileSpreadsheet, Settings, Check, X, AlertTriangle, 
  TrendingUp, TrendingDown, Minus, ArrowRight, Plus, Pencil, Trash2,
  CheckCircle, XCircle, AlertCircle, RotateCcw
} from "lucide-react";
import * as XLSX from "xlsx";
import type { Supplier, SupplierImportTemplate } from "@shared/schema";

type Step = "select-supplier" | "configure-template" | "upload-file" | "preview" | "analysis" | "complete";

interface ColumnMapping {
  supplierCode: string;
  description: string;
  price: string;
  [key: string]: string;
}

interface AnalysisItem {
  supplierCode: string;
  description: string;
  sku: string | null;
  productName: string | null;
  oldPrice: number;
  newPrice: number;
  variation: number;
  status: "update" | "not_found" | "discontinued";
}

interface AnalysisResult {
  logId: number;
  summary: {
    total: number;
    updated: number;
    notFound: number;
    discontinued: number;
    avgVariation: number;
  };
  details: AnalysisItem[];
}

const excelColumns = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"];

export default function PriceUpdate() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("select-supplier");
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<SupplierImportTemplate | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SupplierImportTemplate | null>(null);

  const [templateForm, setTemplateForm] = useState({
    name: "",
    hasHeaderRow: true,
    startRow: 1,
    sheetName: "",
    columnMapping: {
      supplierCode: "A",
      description: "B",
      price: "C"
    } as ColumnMapping
  });

  const [fileData, setFileData] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: templates = [], refetch: refetchTemplates } = useQuery<SupplierImportTemplate[]>({
    queryKey: ["/api/supplier-import-templates", selectedSupplierId],
    enabled: !!selectedSupplierId,
  });

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  const createTemplateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/supplier-import-templates", data),
    onSuccess: () => {
      refetchTemplates();
      setTemplateDialogOpen(false);
      toast({ title: "Plantilla creada exitosamente" });
    },
    onError: () => toast({ title: "Error al crear plantilla", variant: "destructive" }),
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/supplier-import-templates/${id}`, data),
    onSuccess: () => {
      refetchTemplates();
      setTemplateDialogOpen(false);
      setEditingTemplate(null);
      toast({ title: "Plantilla actualizada" });
    },
    onError: () => toast({ title: "Error al actualizar plantilla", variant: "destructive" }),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/supplier-import-templates/${id}`),
    onSuccess: () => {
      refetchTemplates();
      setSelectedTemplate(null);
      toast({ title: "Plantilla eliminada" });
    },
    onError: () => toast({ title: "Error al eliminar plantilla", variant: "destructive" }),
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: any): Promise<AnalysisResult> => {
      const response = await apiRequest("POST", "/api/price-updates/analyze", data);
      return response.json();
    },
    onSuccess: (result: AnalysisResult) => {
      setAnalysisResult(result);
      setStep("analysis");
    },
    onError: () => toast({ title: "Error al analizar datos", variant: "destructive" }),
  });

  const applyMutation = useMutation({
    mutationFn: (logId: number) => apiRequest("POST", `/api/price-updates/${logId}/apply`),
    onSuccess: () => {
      setStep("complete");
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Precios actualizados exitosamente" });
    },
    onError: () => toast({ title: "Error al aplicar precios", variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: (logId: number) => apiRequest("POST", `/api/price-updates/${logId}/cancel`),
    onSuccess: () => {
      resetProcess();
      toast({ title: "Actualización cancelada" });
    },
  });

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = templateForm.sheetName || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        
        const startRow = templateForm.hasHeaderRow ? templateForm.startRow : templateForm.startRow - 1;
        const rows = jsonData.slice(startRow) as any[][];
        
        const mapping = selectedTemplate?.columnMapping as ColumnMapping || templateForm.columnMapping;
        const mappedData = rows
          .filter(row => row.some(cell => cell !== ""))
          .map(row => {
            const mapped: Record<string, any> = {};
            Object.entries(mapping).forEach(([field, col]) => {
              const colIndex = col.charCodeAt(0) - 65;
              mapped[field] = row[colIndex] ?? "";
            });
            return mapped;
          });

        setFileData(mappedData);
        setStep("preview");
      } catch (err) {
        toast({ title: "Error al leer el archivo", variant: "destructive" });
      }
    };

    reader.readAsBinaryString(file);
  }, [templateForm, selectedTemplate, toast]);

  const openTemplateDialog = (template?: SupplierImportTemplate) => {
    if (template) {
      setEditingTemplate(template);
      const mapping = template.columnMapping as ColumnMapping;
      setTemplateForm({
        name: template.name,
        hasHeaderRow: template.hasHeaderRow ?? true,
        startRow: template.startRow ?? 1,
        sheetName: template.sheetName || "",
        columnMapping: mapping
      });
    } else {
      setEditingTemplate(null);
      setTemplateForm({
        name: "",
        hasHeaderRow: true,
        startRow: 1,
        sheetName: "",
        columnMapping: { supplierCode: "A", description: "B", price: "C" }
      });
    }
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!selectedSupplierId || !templateForm.name) {
      toast({ title: "Complete los campos requeridos", variant: "destructive" });
      return;
    }

    const data = {
      supplierId: selectedSupplierId,
      name: templateForm.name,
      columnMapping: templateForm.columnMapping,
      hasHeaderRow: templateForm.hasHeaderRow,
      startRow: templateForm.startRow,
      sheetName: templateForm.sheetName || null
    };

    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const handleAnalyze = () => {
    if (!selectedSupplierId || !selectedTemplate) return;
    
    analyzeMutation.mutate({
      supplierId: selectedSupplierId,
      templateId: selectedTemplate.id,
      fileName,
      data: fileData
    });
  };

  const resetProcess = () => {
    setStep("select-supplier");
    setSelectedSupplierId(null);
    setSelectedTemplate(null);
    setFileData([]);
    setFileName("");
    setAnalysisResult(null);
  };

  const getVariationIcon = (variation: number) => {
    if (variation > 0) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (variation < 0) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "update":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Actualizar</Badge>;
      case "not_found":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">No encontrado</Badge>;
      case "discontinued":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Discontinuado</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Actualización de Precios</h1>
          <p className="text-muted-foreground">Actualiza los costos de productos desde listas de proveedores</p>
        </div>
        {step !== "select-supplier" && (
          <Button variant="outline" onClick={resetProcess} data-testid="button-reset">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reiniciar
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Badge variant={step === "select-supplier" ? "default" : "secondary"}>1. Proveedor</Badge>
        <ArrowRight className="h-4 w-4" />
        <Badge variant={step === "configure-template" ? "default" : "secondary"}>2. Plantilla</Badge>
        <ArrowRight className="h-4 w-4" />
        <Badge variant={step === "upload-file" ? "default" : "secondary"}>3. Archivo</Badge>
        <ArrowRight className="h-4 w-4" />
        <Badge variant={step === "preview" ? "default" : "secondary"}>4. Vista Previa</Badge>
        <ArrowRight className="h-4 w-4" />
        <Badge variant={step === "analysis" ? "default" : "secondary"}>5. Análisis</Badge>
        <ArrowRight className="h-4 w-4" />
        <Badge variant={step === "complete" ? "default" : "secondary"}>6. Completado</Badge>
      </div>

      {step === "select-supplier" && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 1: Seleccionar Proveedor</CardTitle>
            <CardDescription>Elige el proveedor cuya lista de precios vas a importar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {suppliers.map(supplier => (
                <Card 
                  key={supplier.id}
                  className={`cursor-pointer hover-elevate ${selectedSupplierId === supplier.id ? "border-primary border-2" : ""}`}
                  onClick={() => setSelectedSupplierId(supplier.id)}
                  data-testid={`card-supplier-${supplier.id}`}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-sm text-muted-foreground">{supplier.email || "Sin email"}</p>
                      </div>
                      {selectedSupplierId === supplier.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={() => setStep("configure-template")} 
                disabled={!selectedSupplierId}
                data-testid="button-next-step"
              >
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "configure-template" && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 2: Configurar Plantilla de Lectura</CardTitle>
            <CardDescription>
              Configura cómo leer el archivo Excel de {selectedSupplier?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Plantillas guardadas</h3>
              <Button onClick={() => openTemplateDialog()} data-testid="button-new-template">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Plantilla
              </Button>
            </div>

            {templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay plantillas configuradas para este proveedor</p>
                <p className="text-sm">Crea una nueva plantilla para comenzar</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {templates.map(template => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer hover-elevate ${selectedTemplate?.id === template.id ? "border-primary border-2" : ""}`}
                    onClick={() => setSelectedTemplate(template)}
                    data-testid={`card-template-${template.id}`}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Código: {(template.columnMapping as any)?.supplierCode || "?"}, 
                            Precio: {(template.columnMapping as any)?.price || "?"}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); openTemplateDialog(template); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="text-destructive"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if(confirm("¿Eliminar esta plantilla?")) deleteTemplateMutation.mutate(template.id); 
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("select-supplier")}>
                Anterior
              </Button>
              <Button 
                onClick={() => setStep("upload-file")} 
                disabled={!selectedTemplate}
                data-testid="button-next-step"
              >
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "upload-file" && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 3: Cargar Archivo Excel</CardTitle>
            <CardDescription>
              Sube la lista de precios de {selectedSupplier?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Arrastra un archivo o haz clic para seleccionar</p>
              <p className="text-sm text-muted-foreground mb-4">Formatos soportados: .xlsx, .xls, .csv</p>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="max-w-xs mx-auto"
                data-testid="input-file-upload"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Configuración de la plantilla:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Columna Código Proveedor: <strong>{(selectedTemplate?.columnMapping as any)?.supplierCode}</strong></li>
                <li>• Columna Descripción: <strong>{(selectedTemplate?.columnMapping as any)?.description}</strong></li>
                <li>• Columna Precio: <strong>{(selectedTemplate?.columnMapping as any)?.price}</strong></li>
                <li>• Tiene encabezado: <strong>{selectedTemplate?.hasHeaderRow ? "Sí" : "No"}</strong></li>
                <li>• Fila inicial: <strong>{selectedTemplate?.startRow}</strong></li>
              </ul>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("configure-template")}>
                Anterior
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 4: Vista Previa de Datos</CardTitle>
            <CardDescription>
              Verifica que las columnas se leyeron correctamente ({fileData.length} filas)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border rounded-lg overflow-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2 border-b">Código Proveedor</th>
                    <th className="text-left p-2 border-b">Descripción</th>
                    <th className="text-right p-2 border-b">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {fileData.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-mono">{row.supplierCode}</td>
                      <td className="p-2">{row.description}</td>
                      <td className="p-2 text-right font-mono">
                        ${parseFloat(row.price || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {fileData.length > 50 && (
              <p className="text-sm text-muted-foreground text-center">
                Mostrando 50 de {fileData.length} filas
              </p>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("upload-file")}>
                Anterior
              </Button>
              <Button onClick={handleAnalyze} disabled={analyzeMutation.isPending} data-testid="button-analyze">
                {analyzeMutation.isPending ? "Analizando..." : "Analizar Cambios"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "analysis" && analysisResult && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold">{analysisResult.summary.total}</p>
                <p className="text-sm text-muted-foreground">Total en archivo</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-blue-700">{analysisResult.summary.updated}</p>
                <p className="text-sm text-blue-600">A actualizar</p>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-yellow-700">{analysisResult.summary.notFound}</p>
                <p className="text-sm text-yellow-600">No encontrados</p>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-red-700">{analysisResult.summary.discontinued}</p>
                <p className="text-sm text-red-600">Discontinuados</p>
              </CardContent>
            </Card>
            <Card className={analysisResult.summary.avgVariation > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
              <CardContent className="pt-4 text-center">
                <p className={`text-3xl font-bold ${analysisResult.summary.avgVariation > 0 ? "text-red-700" : "text-green-700"}`}>
                  {analysisResult.summary.avgVariation > 0 ? "+" : ""}{analysisResult.summary.avgVariation.toFixed(1)}%
                </p>
                <p className={`text-sm ${analysisResult.summary.avgVariation > 0 ? "text-red-600" : "text-green-600"}`}>
                  Variación promedio
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Paso 5: Análisis de Actualización</CardTitle>
              <CardDescription>Revisa los cambios antes de aplicarlos</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">Todos ({analysisResult.details.length})</TabsTrigger>
                  <TabsTrigger value="update">
                    Actualizar ({analysisResult.details.filter(d => d.status === "update").length})
                  </TabsTrigger>
                  <TabsTrigger value="not_found">
                    No encontrados ({analysisResult.details.filter(d => d.status === "not_found").length})
                  </TabsTrigger>
                  <TabsTrigger value="discontinued">
                    Discontinuados ({analysisResult.details.filter(d => d.status === "discontinued").length})
                  </TabsTrigger>
                </TabsList>

                {["all", "update", "not_found", "discontinued"].map(tab => (
                  <TabsContent key={tab} value={tab} className="mt-4">
                    <div className="border rounded-lg overflow-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="text-left p-2 border-b">Estado</th>
                            <th className="text-left p-2 border-b">Código</th>
                            <th className="text-left p-2 border-b">SKU</th>
                            <th className="text-left p-2 border-b">Producto</th>
                            <th className="text-right p-2 border-b">Precio Anterior</th>
                            <th className="text-right p-2 border-b">Precio Nuevo</th>
                            <th className="text-right p-2 border-b">Variación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysisResult.details
                            .filter(d => tab === "all" || d.status === tab)
                            .map((item, i) => (
                            <tr key={i} className="border-b hover:bg-muted/50">
                              <td className="p-2">{getStatusBadge(item.status)}</td>
                              <td className="p-2 font-mono text-xs">{item.supplierCode}</td>
                              <td className="p-2 font-mono text-xs">{item.sku || "-"}</td>
                              <td className="p-2">{item.productName || item.description}</td>
                              <td className="p-2 text-right font-mono">
                                ${item.oldPrice.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-2 text-right font-mono font-medium">
                                ${item.newPrice.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-2 text-right">
                                <span className={`flex items-center justify-end gap-1 ${
                                  item.variation > 0 ? "text-red-600" : item.variation < 0 ? "text-green-600" : ""
                                }`}>
                                  {getVariationIcon(item.variation)}
                                  {item.variation > 0 ? "+" : ""}{item.variation.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              <div className="flex justify-between pt-6 border-t mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => cancelMutation.mutate(analysisResult.logId)}
                  disabled={cancelMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  onClick={() => applyMutation.mutate(analysisResult.logId)}
                  disabled={applyMutation.isPending || analysisResult.summary.updated === 0}
                  data-testid="button-apply-updates"
                >
                  {applyMutation.isPending ? "Aplicando..." : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Aplicar {analysisResult.summary.updated} Actualizaciones
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === "complete" && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Actualización Completada</h2>
            <p className="text-muted-foreground mb-6">
              Los precios de {analysisResult?.summary.updated} productos han sido actualizados exitosamente.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={resetProcess}>
                Nueva Actualización
              </Button>
              <Button onClick={() => window.location.href = "/products"}>
                Ver Productos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Editar Plantilla" : "Nueva Plantilla"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre de la plantilla *</Label>
              <Input
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="ej: Lista Oficial 2024"
                data-testid="input-template-name"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Col. Código</Label>
                <Select 
                  value={templateForm.columnMapping.supplierCode}
                  onValueChange={(v) => setTemplateForm({
                    ...templateForm,
                    columnMapping: { ...templateForm.columnMapping, supplierCode: v }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {excelColumns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Col. Descripción</Label>
                <Select 
                  value={templateForm.columnMapping.description}
                  onValueChange={(v) => setTemplateForm({
                    ...templateForm,
                    columnMapping: { ...templateForm.columnMapping, description: v }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {excelColumns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Col. Precio</Label>
                <Select 
                  value={templateForm.columnMapping.price}
                  onValueChange={(v) => setTemplateForm({
                    ...templateForm,
                    columnMapping: { ...templateForm.columnMapping, price: v }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {excelColumns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={templateForm.hasHeaderRow}
                  onCheckedChange={(v) => setTemplateForm({ ...templateForm, hasHeaderRow: v })}
                />
                <Label>Tiene fila de encabezado</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fila inicial</Label>
                <Input
                  type="number"
                  min={1}
                  value={templateForm.startRow}
                  onChange={(e) => setTemplateForm({ ...templateForm, startRow: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre de hoja</Label>
                <Input
                  value={templateForm.sheetName}
                  onChange={(e) => setTemplateForm({ ...templateForm, sheetName: e.target.value })}
                  placeholder="(primera hoja)"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveTemplate}
              disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
              data-testid="button-save-template"
            >
              {editingTemplate ? "Guardar Cambios" : "Crear Plantilla"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
