import { Layout } from "@/components/Layout";
import { useProducts, useCreateProduct, useDeleteProduct, useCategories } from "@/hooks/use-products";
import { useState } from "react";
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
  DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
              <Button className="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/20">
                <Plus className="mr-2 h-4 w-4" /> Agregar Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Nuevo Producto</DialogTitle>
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
                  <TableRow key={product.id} className="hover:bg-slate-50/50">
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
                          <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-orange-600">
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
  
  const form = useForm<z.infer<typeof insertProductSchema>>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      sku: "",
      price: 0,
      stockQuantity: 0,
      minStockLevel: 5,
      isActive: true,
    },
  });

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Nombre del Producto</FormLabel>
                <FormControl>
                  <Input placeholder="ej. Taladro Inalámbrico" {...field} />
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
                <FormLabel>Código (SKU)</FormLabel>
                <FormControl>
                  <Input placeholder="PROD-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select 
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
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
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stockQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Inicial</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter className="pt-4">
          <Button type="submit" disabled={isPending} className="bg-orange-600 hover:bg-orange-700">
            {isPending ? "Guardando..." : "Guardar Producto"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
