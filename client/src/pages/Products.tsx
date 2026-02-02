import { Layout } from "@/components/Layout";
import { useProducts, useCreateProduct, useDeleteProduct, useCategories } from "@/hooks/use-products";
import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Filter, Package, DollarSign, Warehouse, Layers, Globe, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, type Brand, type Supplier, type Warehouse as WarehouseType } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Products() {
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = useProducts({ search });
  const { data: categories } = useCategories();
  const { mutate: deleteProduct } = useDeleteProduct();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      deleteProduct(id, {
        onSuccess: () => toast({ title: "Producto eliminado" }),
        onError: () => toast({ title: "Error al eliminar", variant: "destructive" }),
      });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventario</h1>
            <p className="text-slate-500">Administra tus productos, stock y precios.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/20" data-testid="button-add-product">
                <Plus className="mr-2 h-4 w-4" /> Agregar Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo Producto</DialogTitle>
                <DialogDescription>Complete los datos del producto en las diferentes secciones.</DialogDescription>
              </DialogHeader>
              <ProductForm 
                categories={categories || []} 
                onSuccess={() => setIsCreateOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar productos..." 
              className="pl-10 border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-products"
            />
          </div>
          <Button variant="outline" className="border-slate-200 text-slate-600">
            <Filter className="mr-2 h-4 w-4" /> Filtros
          </Button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[100px]">Código</TableHead>
                <TableHead>Nombre del Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Cargando inventario...
                  </TableCell>
                </TableRow>
              ) : products?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No se encontraron productos. Agrega uno para comenzar.
                  </TableCell>
                </TableRow>
              ) : (
                products?.map((product) => (
                  <TableRow key={product.id} className="hover:bg-slate-50/50" data-testid={`row-product-${product.id}`}>
                    <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                    <TableCell className="font-medium text-slate-900">{product.name}</TableCell>
                    <TableCell>
                      {categories?.find(c => c.id === product.categoryId)?.name || "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${Number(product.price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="secondary"
                        className={
                          product.stockQuantity <= (product.minStockLevel || 5)
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }
                      >
                        {product.stockQuantity} unidades
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${product.isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-orange-600" data-testid={`button-actions-${product.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 cursor-pointer focus:text-red-600"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}

function ProductForm({ categories, onSuccess }: { categories: any[], onSuccess: () => void }) {
  const { mutate, isPending } = useCreateProduct();
  const { data: locations = [] } = useQuery<any[]>({ queryKey: ['/api/stock-locations'] });
  const { data: brands = [] } = useQuery<Brand[]>({ queryKey: ['/api/brands'] });
  const { data: suppliers = [] } = useQuery<Supplier[]>({ queryKey: ['/api/suppliers'] });
  const { data: warehouses = [] } = useQuery<WarehouseType[]>({ queryKey: ['/api/warehouses'] });
  
  const [activeTab, setActiveTab] = useState("general");
  
  const form = useForm<z.infer<typeof insertProductSchema>>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      sku: "",
      additionalCode1: "",
      additionalCode2: "",
      additionalCode3: "",
      additionalCode4: "",
      stockUnit: "unidad",
      saleUnit: "unidad",
      purchaseCurrency: "ARS",
      saleCurrency: "ARS",
      listCostNoTax: "0",
      bulkQuantity: 1,
      unitCost: "0",
      costNoTax: "0",
      costWithTax: "0",
      costUsd: "0",
      supplierDiscount1: "0",
      supplierDiscount2: "0",
      supplierDiscount3: "0",
      supplierDiscount4: "0",
      applySupplierDiscounts: false,
      profitPercent: "60",
      priceNoTax: "0",
      priceWithTax: "0",
      priceUsd: "0",
      taxPercent: "21",
      price: "0",
      stockQuantity: 0,
      minStockLevel: 5,
      reorderPoint: 10,
      maxStockLevel: 100,
      allowFractional: false,
      publishOnline: false,
      isActive: true,
    },
  });

  const listCostNoTax = parseFloat(form.watch("listCostNoTax") || "0");
  const bulkQuantity = form.watch("bulkQuantity") || 1;
  const profitPercent = parseFloat(form.watch("profitPercent") || "0");
  const taxPercent = parseFloat(form.watch("taxPercent") || "21");
  const supplierDiscount1 = parseFloat(form.watch("supplierDiscount1") || "0");
  const supplierDiscount2 = parseFloat(form.watch("supplierDiscount2") || "0");
  const supplierDiscount3 = parseFloat(form.watch("supplierDiscount3") || "0");
  const supplierDiscount4 = parseFloat(form.watch("supplierDiscount4") || "0");
  const applySupplierDiscounts = form.watch("applySupplierDiscounts");

  useEffect(() => {
    let unitCost = listCostNoTax / bulkQuantity;
    
    if (applySupplierDiscounts) {
      const discounts = [supplierDiscount1, supplierDiscount2, supplierDiscount3, supplierDiscount4];
      discounts.forEach(d => {
        if (d > 0) unitCost = unitCost * (1 - d / 100);
      });
    }
    
    const costNoTax = unitCost;
    const costWithTax = costNoTax * (1 + taxPercent / 100);
    const priceNoTax = costNoTax * (1 + profitPercent / 100);
    const priceWithTax = priceNoTax * (1 + taxPercent / 100);
    
    form.setValue("unitCost", unitCost.toFixed(2));
    form.setValue("costNoTax", costNoTax.toFixed(2));
    form.setValue("costWithTax", costWithTax.toFixed(2));
    form.setValue("priceNoTax", priceNoTax.toFixed(2));
    form.setValue("priceWithTax", priceWithTax.toFixed(2));
    form.setValue("price", priceWithTax.toFixed(2));
  }, [listCostNoTax, bulkQuantity, profitPercent, taxPercent, supplierDiscount1, supplierDiscount2, supplierDiscount3, supplierDiscount4, applySupplierDiscounts, form]);

  const onSubmit = (data: z.infer<typeof insertProductSchema>) => {
    mutate(data, {
      onSuccess: () => {
        toast({ title: "Producto creado exitosamente" });
        onSuccess();
      },
      onError: (err) => {
        toast({ title: "Error al crear producto", description: err.message, variant: "destructive" });
      }
    });
  };

  const unitOptions = [
    { value: "unidad", label: "Unidad" },
    { value: "metro", label: "Metro" },
    { value: "kilogramo", label: "Kilogramo" },
    { value: "litro", label: "Litro" },
    { value: "caja", label: "Caja" },
    { value: "pack", label: "Pack" },
    { value: "rollo", label: "Rollo" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="general" className="flex items-center gap-1" data-testid="tab-general">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="costs" className="flex items-center gap-1" data-testid="tab-costs">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Costos</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-1" data-testid="tab-inventory">
              <Warehouse className="h-4 w-4" />
              <span className="hidden sm:inline">Inventario</span>
            </TabsTrigger>
            <TabsTrigger value="fractional" className="flex items-center gap-1" data-testid="tab-fractional">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Fraccionado</span>
            </TabsTrigger>
            <TabsTrigger value="ecommerce" className="flex items-center gap-1" data-testid="tab-ecommerce">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">E-Commerce</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-orange-600 flex items-center gap-2">
                  <Package className="h-5 w-5" /> Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="col-span-2 sm:col-span-1">
                        <FormLabel>Nombre del Producto *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Martillo Stanley 20oz" {...field} data-testid="input-product-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU / Código Interno *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: MST-20Z" {...field} data-testid="input-sku" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <FormField
                    control={form.control}
                    name="additionalCode1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Código 1</FormLabel>
                        <FormControl>
                          <Input placeholder="Código 1" {...field} value={field.value ?? ""} className="text-sm" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="additionalCode2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Código 2</FormLabel>
                        <FormControl>
                          <Input placeholder="Código 2" {...field} value={field.value ?? ""} className="text-sm" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="additionalCode3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Código 3</FormLabel>
                        <FormControl>
                          <Input placeholder="Código 3" {...field} value={field.value ?? ""} className="text-sm" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="additionalCode4"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Código 4</FormLabel>
                        <FormControl>
                          <Input placeholder="Código 4" {...field} value={field.value ?? ""} className="text-sm" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Barras</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 7790001234567" {...field} value={field.value ?? ""} data-testid="input-barcode" />
                      </FormControl>
                      <FormDescription className="text-xs">Escanee o ingrese el código de barras EAN/UPC</FormDescription>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stockUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidad Primaria (Stock) *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? "unidad"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-stock-unit">
                              <SelectValue placeholder="Seleccionar unidad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {unitOptions.map((u) => (
                              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="saleUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidad de Venta *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? "unidad"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-sale-unit">
                              <SelectValue placeholder="Seleccionar unidad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {unitOptions.map((u) => (
                              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría / Rubro</FormLabel>
                        <Select 
                          onValueChange={(val) => field.onChange(val ? Number(val) : null)}
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Ej: Herramientas Manuales" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="brandId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <Select 
                          onValueChange={(val) => field.onChange(val ? Number(val) : null)}
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-brand">
                              <SelectValue placeholder="Ej: Stanley" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {brands.map((b) => (
                              <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proveedor Principal</FormLabel>
                        <Select 
                          onValueChange={(val) => field.onChange(val ? Number(val) : null)}
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-supplier">
                              <SelectValue placeholder="Ninguno" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers.map((s) => (
                              <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="supplierCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código Proveedor</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: ST201-M" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="purchaseCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moneda de Compra</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? "ARS"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ARS">ARS - Pesos Argentinos</SelectItem>
                            <SelectItem value="USD">USD - Dólares</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="saleCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moneda de Venta</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? "ARS"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ARS">ARS - Pesos Argentinos</SelectItem>
                            <SelectItem value="USD">USD - Dólares</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-600 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Estructura de Costos y Precios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="listCostNoTax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Costo de lista (s/IVA):</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value)} data-testid="input-list-cost" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-3 gap-4 items-end">
                    <FormField
                      control={form.control}
                      name="bulkQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Package className="h-4 w-4 text-blue-600" /> Cantidad por bulto:
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              {...field}
                              value={field.value ?? 1}
                              onChange={e => field.onChange(parseInt(e.target.value) || 1)} 
                              data-testid="input-bulk-quantity"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">unidades</FormDescription>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unitCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-green-600" /> Costo unitario:
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              {...field}
                              value={field.value ?? ""}
                              readOnly 
                              className="bg-green-100 font-bold text-green-800"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">= lista ÷ cantidad</FormDescription>
                        </FormItem>
                      )}
                    />
                    <div className="bg-yellow-100 p-3 rounded text-sm">
                      <p className="font-semibold">EJEMPLO:</p>
                      <p>Caja ${listCostNoTax.toFixed(2)}</p>
                      <p>÷ {bulkQuantity} unid.</p>
                      <p className="font-bold text-green-700">= ${(listCostNoTax / bulkQuantity).toFixed(2)}/u</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="costNoTax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costo (s/IVA):</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} readOnly className="bg-gray-50" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>USD</FormLabel>
                    <Input type="number" step="0.01" value="0.000" readOnly className="bg-gray-50" />
                  </FormItem>
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <Input type="number" step="0.01" value="0.000" readOnly className="bg-gray-50" />
                  </FormItem>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="costWithTax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costo (c/IVA):</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} readOnly className="bg-gray-50" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>USD</FormLabel>
                    <Input type="number" step="0.01" value="0.000" readOnly className="bg-gray-50" />
                  </FormItem>
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <Input type="number" step="0.01" value="0.000" readOnly className="bg-gray-50" />
                  </FormItem>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Descuentos del Proveedor</h4>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <FormField
                      control={form.control}
                      name="supplierDiscount1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Desc. 1 (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value)} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="supplierDiscount2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Desc. 2 (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value)} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="supplierDiscount3"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Desc. 3 (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value)} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="supplierDiscount4"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Desc. 4 (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value)} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="applySupplierDiscounts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch checked={field.value ?? false} onCheckedChange={field.onChange} data-testid="switch-apply-discounts" />
                        </FormControl>
                        <FormLabel className="font-normal">Aplicar descuentos del proveedor</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border rounded-lg p-4 bg-slate-50">
                  <h4 className="font-medium mb-3 text-center">Lista Contado</h4>
                  <FormField
                    control={form.control}
                    name="profitPercent"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>% Ganancia:</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field}
                            value={field.value ?? ""} 
                            onChange={e => field.onChange(e.target.value)}
                            className="max-w-[150px]"
                            data-testid="input-profit-percent"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <FormField
                      control={form.control}
                      name="priceNoTax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio (s/IVA):</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} value={field.value ?? ""} readOnly className="bg-gray-50" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormItem>
                      <FormLabel>ARS</FormLabel>
                      <Input type="number" step="0.01" value="0.000" readOnly className="bg-gray-50" />
                    </FormItem>
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <Input type="number" step="0.01" value="0.000" readOnly className="bg-gray-50" />
                    </FormItem>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="priceWithTax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio (c/IVA):</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              {...field}
                              value={field.value ?? ""} 
                              readOnly 
                              className="bg-blue-100 font-bold text-blue-800"
                              data-testid="input-price-with-tax"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormItem>
                      <FormLabel>ARS</FormLabel>
                      <Input type="number" step="0.01" value="0.000" readOnly className="bg-gray-50" />
                    </FormItem>
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <Input type="number" step="0.01" value="0.000" readOnly className="bg-gray-50" />
                    </FormItem>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="taxPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IVA (%):</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? "21"}>
                        <FormControl>
                          <SelectTrigger className="max-w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="10.5">10.5%</SelectItem>
                          <SelectItem value="21">21%</SelectItem>
                          <SelectItem value="27">27%</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-amber-600 flex items-center gap-2">
                  <Warehouse className="h-5 w-5" /> Detalles de Inventario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="stockQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock actual</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-stock-quantity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="minStockLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-amber-600">Mínimo de alerta</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            value={field.value ?? 5}
                            className="border-amber-300 focus:border-amber-500"
                            data-testid="input-min-stock"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reorderPoint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-600">Punto de pedido</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            value={field.value ?? 10}
                            className="border-blue-300 focus:border-blue-500"
                            data-testid="input-reorder-point"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("reorderPoint") && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Punto de Pedido</p>
                      <p className="text-sm text-amber-700">
                        Cuando el stock llegue a <strong>{form.watch("reorderPoint")}</strong> unidades, 
                        el sistema generará automáticamente un pedido al proveedor.
                      </p>
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(val ? Number(val) : null)}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-location">
                            <SelectValue placeholder="Ej: A-05" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((loc: any) => (
                            <SelectItem key={loc.id} value={loc.id.toString()}>
                              {loc.code} - {loc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {warehouses.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-3">Stock por Depósito/Sucursal</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Después de crear el producto, podrá configurar el stock en cada depósito desde la sección de Stock.
                    </p>
                    <div className="space-y-2">
                      {warehouses.map((wh) => (
                        <div key={wh.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="text-sm">
                            {wh.name} 
                            {wh.isMain && <Badge variant="secondary" className="ml-2 text-xs">Principal</Badge>}
                          </span>
                          <span className="text-sm text-muted-foreground">-</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fractional" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-purple-600 flex items-center gap-2">
                  <Layers className="h-5 w-5" /> Venta Fraccionada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="allowFractional"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-semibold">Habilitar Fraccionado</FormLabel>
                        <FormDescription>
                          Permite vender en una unidad distinta al stock.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={field.value ?? false} 
                          onCheckedChange={field.onChange}
                          data-testid="switch-allow-fractional"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("allowFractional") && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in-50">
                    <FormField
                      control={form.control}
                      name="fractionalUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidad Fraccionada</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="metro">Metro</SelectItem>
                              <SelectItem value="gramo">Gramo</SelectItem>
                              <SelectItem value="litro">Litro</SelectItem>
                              <SelectItem value="cm">Centímetro</SelectItem>
                              <SelectItem value="ml">Mililitro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fractionalRatio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ratio de Conversión</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.0001" 
                              {...field} 
                              onChange={e => field.onChange(e.target.value)}
                              value={field.value ?? "1"}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Ej: 1 rollo = 50 metros, ratio = 50
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ecommerce" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-cyan-600 flex items-center gap-2">
                  <Globe className="h-5 w-5" /> E-Commerce
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="publishOnline"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-semibold">Publicar Online</FormLabel>
                        <FormDescription>
                          El producto será visible en tu tienda online.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={field.value ?? false} 
                          onCheckedChange={field.onChange}
                          data-testid="switch-publish-online"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-4 border-t mt-4">
          <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700" data-testid="button-save-product">
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
