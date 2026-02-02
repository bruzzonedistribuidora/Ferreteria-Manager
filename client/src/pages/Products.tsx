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
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct(id, {
        onSuccess: () => toast({ title: "Product deleted" }),
        onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
      });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventory</h1>
            <p className="text-slate-500">Manage your products, stock levels, and prices.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/20">
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
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
              placeholder="Search products..." 
              className="pl-10 border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="border-slate-200 text-slate-600">
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[100px]">SKU</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Loading inventory...
                  </TableCell>
                </TableRow>
              ) : products?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No products found. Add one to get started.
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
                        {product.stockQuantity} units
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
                            <Pencil className="mr-2 h-4 w-4" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 cursor-pointer focus:text-red-600"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Product
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
        toast({ title: "Product created successfully" });
        onSuccess();
      },
      onError: (err) => {
        toast({ title: "Failed to create product", description: err.message, variant: "destructive" });
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
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Cordless Drill" {...field} />
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
                <FormLabel>SKU</FormLabel>
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
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
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
                <FormLabel>Price ($)</FormLabel>
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
                <FormLabel>Initial Stock</FormLabel>
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
            {isPending ? "Creating..." : "Save Product"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
