import { Layout } from "@/components/Layout";
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Upload, 
  FileSpreadsheet, 
  Check, 
  AlertTriangle, 
  ArrowRight, 
  Download,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import * as XLSX from "xlsx";

interface ExcelRow {
  [key: string]: any;
}

interface ColumnMapping {
  excelColumn: string;
  dbField: string;
}

const DB_FIELDS = [
  { value: "skip", label: "-- Omitir --" },
  { value: "sku", label: "Código / SKU *", required: true },
  { value: "name", label: "Nombre / Descripción *", required: true },
  { value: "barcode", label: "Código de Barras" },
  { value: "additionalCode1", label: "Código Adicional 1" },
  { value: "additionalCode2", label: "Código Adicional 2" },
  { value: "description", label: "Descripción Larga" },
  { value: "brandName", label: "Marca (nombre)" },
  { value: "supplierName", label: "Proveedor (nombre)" },
  { value: "categoryName", label: "Categoría / Rubro" },
  { value: "stockUnit", label: "Unidad Stock" },
  { value: "saleUnit", label: "Unidad Venta" },
  { value: "listCostNoTax", label: "Costo Lista (s/IVA)" },
  { value: "bulkQuantity", label: "Cantidad por Bulto" },
  { value: "costNoTax", label: "Costo (s/IVA)" },
  { value: "costWithTax", label: "Costo (c/IVA)" },
  { value: "profitPercent", label: "% Ganancia" },
  { value: "priceNoTax", label: "Precio (s/IVA)" },
  { value: "priceWithTax", label: "Precio (c/IVA)" },
  { value: "price", label: "Precio Final" },
  { value: "stockQuantity", label: "Stock Actual" },
  { value: "minStockLevel", label: "Stock Mínimo" },
  { value: "reorderPoint", label: "Punto de Pedido" },
  { value: "supplierDiscount1", label: "Descuento 1 (%)" },
  { value: "supplierDiscount2", label: "Descuento 2 (%)" },
  { value: "supplierDiscount3", label: "Descuento 3 (%)" },
  { value: "supplierDiscount4", label: "Descuento 4 (%)" },
  { value: "locationName", label: "Ubicación" },
];

export default function ImportData() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{success: number, errors: number, errorDetails: string[]}>({ success: 0, errors: 0, errorDetails: [] });

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(uploadedFile.type) && !uploadedFile.name.endsWith('.xlsx') && !uploadedFile.name.endsWith('.xls') && !uploadedFile.name.endsWith('.csv')) {
      toast({ title: "Formato no válido", description: "Por favor sube un archivo Excel (.xlsx, .xls) o CSV", variant: "destructive" });
      return;
    }

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { defval: "" });
        
        if (jsonData.length === 0) {
          toast({ title: "Archivo vacío", description: "El archivo no contiene datos", variant: "destructive" });
          return;
        }

        const headers = Object.keys(jsonData[0]);
        setExcelHeaders(headers);
        setExcelData(jsonData);
        
        const autoMappings: ColumnMapping[] = headers.map(header => {
          const lowerHeader = header.toLowerCase().trim();
          let dbField = "skip";
          
          if (lowerHeader.includes("codigo") || lowerHeader.includes("código") || lowerHeader.includes("sku") || lowerHeader === "cod") {
            dbField = "sku";
          } else if (lowerHeader.includes("descripcion") || lowerHeader.includes("descripción") || lowerHeader.includes("nombre") || lowerHeader.includes("articulo") || lowerHeader.includes("artículo")) {
            dbField = "name";
          } else if (lowerHeader.includes("barra") || lowerHeader.includes("ean") || lowerHeader.includes("upc")) {
            dbField = "barcode";
          } else if (lowerHeader.includes("marca") || lowerHeader.includes("brand")) {
            dbField = "brandName";
          } else if (lowerHeader.includes("proveedor") || lowerHeader.includes("supplier")) {
            dbField = "supplierName";
          } else if (lowerHeader.includes("rubro") || lowerHeader.includes("categoria") || lowerHeader.includes("categoría")) {
            dbField = "categoryName";
          } else if (lowerHeader.includes("stock") && !lowerHeader.includes("min")) {
            dbField = "stockQuantity";
          } else if (lowerHeader.includes("precio") && lowerHeader.includes("iva")) {
            dbField = "priceWithTax";
          } else if (lowerHeader.includes("precio") || lowerHeader.includes("price") || lowerHeader.includes("pvp")) {
            dbField = "price";
          } else if (lowerHeader.includes("costo") && lowerHeader.includes("iva")) {
            dbField = "costWithTax";
          } else if (lowerHeader.includes("costo") || lowerHeader.includes("cost")) {
            dbField = "costNoTax";
          } else if (lowerHeader.includes("ganancia") || lowerHeader.includes("margen") || lowerHeader.includes("markup")) {
            dbField = "profitPercent";
          } else if (lowerHeader.includes("unidad") || lowerHeader.includes("unit")) {
            dbField = "stockUnit";
          } else if (lowerHeader.includes("ubicacion") || lowerHeader.includes("ubicación") || lowerHeader.includes("location")) {
            dbField = "locationName";
          } else if (lowerHeader.includes("minimo") || lowerHeader.includes("mínimo")) {
            dbField = "minStockLevel";
          }
          
          return { excelColumn: header, dbField };
        });
        
        setColumnMappings(autoMappings);
        setStep(2);
        toast({ title: "Archivo cargado", description: `Se encontraron ${jsonData.length} filas de datos` });
      } catch (error) {
        toast({ title: "Error al leer archivo", description: "No se pudo procesar el archivo Excel", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  }, []);

  const updateMapping = (excelColumn: string, dbField: string) => {
    setColumnMappings(prev => 
      prev.map(m => m.excelColumn === excelColumn ? { ...m, dbField } : m)
    );
  };

  const validateMappings = () => {
    const mappedFields = columnMappings.filter(m => m.dbField !== "skip").map(m => m.dbField);
    const hasSku = mappedFields.includes("sku");
    const hasName = mappedFields.includes("name");
    
    if (!hasSku) {
      toast({ title: "Falta campo requerido", description: "Debes mapear la columna de Código/SKU", variant: "destructive" });
      return false;
    }
    if (!hasName) {
      toast({ title: "Falta campo requerido", description: "Debes mapear la columna de Nombre/Descripción", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleStartImport = async () => {
    if (!validateMappings()) return;

    setStep(3);
    setIsProcessing(true);
    setImportProgress(0);
    setImportResults({ success: 0, errors: 0, errorDetails: [] });

    const mappingObj: Record<string, string> = {};
    columnMappings.forEach(m => {
      if (m.dbField !== "skip") {
        mappingObj[m.excelColumn] = m.dbField;
      }
    });

    const productsToImport = excelData.map(row => {
      const product: Record<string, any> = {};
      Object.entries(mappingObj).forEach(([excelCol, dbField]) => {
        let value = row[excelCol];
        
        if (['stockQuantity', 'minStockLevel', 'reorderPoint', 'maxStockLevel', 'bulkQuantity'].includes(dbField)) {
          value = parseInt(value) || 0;
        }
        if (['listCostNoTax', 'costNoTax', 'costWithTax', 'priceNoTax', 'priceWithTax', 'price', 'profitPercent', 'supplierDiscount1', 'supplierDiscount2', 'supplierDiscount3', 'supplierDiscount4'].includes(dbField)) {
          const cleanValue = String(value).replace(/[^\d.,\-]/g, '').replace(',', '.');
          value = cleanValue || "0";
        }
        
        product[dbField] = value;
      });
      return product;
    });

    let successCount = 0;
    let errorCount = 0;
    const errorDetails: string[] = [];

    for (let i = 0; i < productsToImport.length; i++) {
      const product = productsToImport[i];
      try {
        await apiRequest("POST", "/api/products/import", product);
        successCount++;
      } catch (error: any) {
        errorCount++;
        errorDetails.push(`Fila ${i + 2}: ${product.sku || 'Sin SKU'} - ${error.message || 'Error desconocido'}`);
      }
      setImportProgress(Math.round(((i + 1) / productsToImport.length) * 100));
      setImportResults({ success: successCount, errors: errorCount, errorDetails });
    }

    setIsProcessing(false);
    queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    
    if (successCount > 0) {
      toast({ 
        title: "Importación completada", 
        description: `${successCount} productos importados correctamente${errorCount > 0 ? `, ${errorCount} errores` : ''}` 
      });
    }
  };

  const resetImport = () => {
    setStep(1);
    setFile(null);
    setExcelData([]);
    setExcelHeaders([]);
    setColumnMappings([]);
    setImportProgress(0);
    setImportResults({ success: 0, errors: 0, errorDetails: [] });
  };

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Importar Datos</h1>
          <p className="text-slate-500">Carga productos masivamente desde archivos Excel o CSV.</p>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-orange-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-orange-600 text-white' : 'bg-slate-200'}`}>1</div>
            <span className="font-medium">Cargar Archivo</span>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-orange-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-orange-600 text-white' : 'bg-slate-200'}`}>2</div>
            <span className="font-medium">Mapear Columnas</span>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-orange-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-orange-600 text-white' : 'bg-slate-200'}`}>3</div>
            <span className="font-medium">Importar</span>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Paso 1: Cargar Archivo
              </CardTitle>
              <CardDescription>
                Selecciona un archivo Excel (.xlsx, .xls) o CSV con los datos de productos a importar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-10 text-center hover:border-orange-400 transition-colors">
                <FileSpreadsheet className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-lg font-medium text-slate-700">
                    Arrastra tu archivo aquí o{" "}
                    <span className="text-orange-600 hover:underline">haz clic para seleccionar</span>
                  </span>
                  <Input 
                    id="file-upload" 
                    type="file" 
                    className="hidden" 
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    data-testid="input-file-upload"
                  />
                </Label>
                <p className="text-sm text-slate-500 mt-2">Formatos aceptados: Excel (.xlsx, .xls) o CSV</p>
              </div>

              <Alert className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Consejos para la importación</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                    <li>La primera fila debe contener los encabezados de columna</li>
                    <li>Los campos obligatorios son: Código/SKU y Nombre</li>
                    <li>Los precios pueden usar punto o coma como separador decimal</li>
                    <li>Las marcas y categorías se crearán automáticamente si no existen</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Paso 2: Mapear Columnas
              </CardTitle>
              <CardDescription>
                Archivo: <strong>{file?.name}</strong> - {excelData.length} filas encontradas. 
                Asocia cada columna del Excel con el campo correspondiente en el sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 font-medium text-sm text-slate-600 pb-2 border-b">
                  <div>Columna del Excel</div>
                  <div>Campo en FerreCloud</div>
                </div>
                
                {columnMappings.map((mapping) => (
                  <div key={mapping.excelColumn} className="grid grid-cols-2 gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">{mapping.excelColumn}</Badge>
                      <span className="text-xs text-slate-500 truncate max-w-[150px]">
                        Ej: {String(excelData[0]?.[mapping.excelColumn] || '').substring(0, 30)}
                      </span>
                    </div>
                    <Select 
                      value={mapping.dbField} 
                      onValueChange={(value) => updateMapping(mapping.excelColumn, value)}
                    >
                      <SelectTrigger data-testid={`select-mapping-${mapping.excelColumn}`}>
                        <SelectValue placeholder="Seleccionar campo" />
                      </SelectTrigger>
                      <SelectContent>
                        {DB_FIELDS.map(field => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium mb-2">Vista previa de datos (primeras 5 filas)</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {excelHeaders.slice(0, 6).map(h => (
                          <TableHead key={h} className="text-xs">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {excelData.slice(0, 5).map((row, i) => (
                        <TableRow key={i}>
                          {excelHeaders.slice(0, 6).map(h => (
                            <TableCell key={h} className="text-xs truncate max-w-[150px]">
                              {String(row[h] || '')}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={resetImport}>
                  Cancelar
                </Button>
                <Button onClick={handleStartImport} className="bg-green-600 hover:bg-green-700" data-testid="button-start-import">
                  <Check className="mr-2 h-4 w-4" />
                  Iniciar Importación ({excelData.length} productos)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                Paso 3: Importando Datos
              </CardTitle>
              <CardDescription>
                {isProcessing ? "Procesando productos..." : "Importación completada"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progreso</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="h-3" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="text-2xl font-bold text-green-700">{importResults.success}</p>
                          <p className="text-sm text-green-600">Productos importados</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <XCircle className="h-8 w-8 text-red-600" />
                        <div>
                          <p className="text-2xl font-bold text-red-700">{importResults.errors}</p>
                          <p className="text-sm text-red-600">Errores</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {importResults.errorDetails.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-[200px] overflow-y-auto">
                    <h4 className="font-medium text-red-700 mb-2">Detalles de errores:</h4>
                    <ul className="text-sm text-red-600 space-y-1">
                      {importResults.errorDetails.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {!isProcessing && (
                  <div className="flex justify-center gap-4 pt-4">
                    <Button variant="outline" onClick={resetImport}>
                      Nueva Importación
                    </Button>
                    <Button onClick={() => window.location.href = '/products'} className="bg-orange-600 hover:bg-orange-700">
                      Ver Productos
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
