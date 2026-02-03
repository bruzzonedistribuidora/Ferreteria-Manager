import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Tag, FolderTree, Search } from "lucide-react";
import type { Brand, Category } from "@shared/schema";

export default function BrandsCategories() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("brands");
  const [searchBrands, setSearchBrands] = useState("");
  const [searchCategories, setSearchCategories] = useState("");

  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [brandForm, setBrandForm] = useState({ name: "" });
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });

  const { data: brands = [], isLoading: loadingBrands } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createBrandMutation = useMutation({
    mutationFn: (data: { name: string }) => apiRequest("POST", "/api/brands", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      setBrandDialogOpen(false);
      setBrandForm({ name: "" });
      toast({ title: "Marca creada exitosamente" });
    },
    onError: () => toast({ title: "Error al crear marca", variant: "destructive" }),
  });

  const updateBrandMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string } }) =>
      apiRequest("PUT", `/api/brands/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      setBrandDialogOpen(false);
      setEditingBrand(null);
      setBrandForm({ name: "" });
      toast({ title: "Marca actualizada" });
    },
    onError: () => toast({ title: "Error al actualizar marca", variant: "destructive" }),
  });

  const deleteBrandMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/brands/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({ title: "Marca eliminada" });
    },
    onError: () => toast({ title: "Error al eliminar marca", variant: "destructive" }),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiRequest("POST", "/api/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setCategoryDialogOpen(false);
      setCategoryForm({ name: "", description: "" });
      toast({ title: "Rubro creado exitosamente" });
    },
    onError: () => toast({ title: "Error al crear rubro", variant: "destructive" }),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description?: string } }) =>
      apiRequest("PUT", `/api/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryForm({ name: "", description: "" });
      toast({ title: "Rubro actualizado" });
    },
    onError: () => toast({ title: "Error al actualizar rubro", variant: "destructive" }),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Rubro eliminado" });
    },
    onError: () => toast({ title: "Error al eliminar rubro", variant: "destructive" }),
  });

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(searchBrands.toLowerCase())
  );

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchCategories.toLowerCase())
  );

  const openBrandDialog = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setBrandForm({ name: brand.name });
    } else {
      setEditingBrand(null);
      setBrandForm({ name: "" });
    }
    setBrandDialogOpen(true);
  };

  const openCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name, description: category.description || "" });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: "", description: "" });
    }
    setCategoryDialogOpen(true);
  };

  const handleSaveBrand = () => {
    if (!brandForm.name.trim()) {
      toast({ title: "El nombre es requerido", variant: "destructive" });
      return;
    }
    if (editingBrand) {
      updateBrandMutation.mutate({ id: editingBrand.id, data: brandForm });
    } else {
      createBrandMutation.mutate(brandForm);
    }
  };

  const handleSaveCategory = () => {
    if (!categoryForm.name.trim()) {
      toast({ title: "El nombre es requerido", variant: "destructive" });
      return;
    }
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryForm });
    } else {
      createCategoryMutation.mutate(categoryForm);
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Marcas y Rubros</h1>
          <p className="text-muted-foreground">Gestiona las marcas y rubros de productos</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="brands" className="flex items-center gap-2" data-testid="tab-brands">
            <Tag className="h-4 w-4" />
            Marcas ({brands.length})
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2" data-testid="tab-categories">
            <FolderTree className="h-4 w-4" />
            Rubros ({categories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="brands" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar marcas..."
                value={searchBrands}
                onChange={(e) => setSearchBrands(e.target.value)}
                className="pl-9"
                data-testid="input-search-brands"
              />
            </div>
            <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openBrandDialog()} data-testid="button-new-brand">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Marca
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBrand ? "Editar Marca" : "Nueva Marca"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input
                      value={brandForm.name}
                      onChange={(e) => setBrandForm({ name: e.target.value })}
                      placeholder="Nombre de la marca"
                      data-testid="input-brand-name"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setBrandDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveBrand}
                    disabled={createBrandMutation.isPending || updateBrandMutation.isPending}
                    data-testid="button-save-brand"
                  >
                    {editingBrand ? "Guardar Cambios" : "Crear Marca"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loadingBrands ? (
            <div className="text-center py-8 text-muted-foreground">Cargando marcas...</div>
          ) : filteredBrands.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {searchBrands ? "No se encontraron marcas" : "No hay marcas registradas"}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBrands.map((brand) => (
                <Card key={brand.id} className="hover-elevate" data-testid={`card-brand-${brand.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      {brand.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openBrandDialog(brand)}
                        data-testid={`button-edit-brand-${brand.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("¿Eliminar esta marca?")) {
                            deleteBrandMutation.mutate(brand.id);
                          }
                        }}
                        data-testid={`button-delete-brand-${brand.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar rubros..."
                value={searchCategories}
                onChange={(e) => setSearchCategories(e.target.value)}
                className="pl-9"
                data-testid="input-search-categories"
              />
            </div>
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openCategoryDialog()} data-testid="button-new-category">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Rubro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Editar Rubro" : "Nuevo Rubro"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="Nombre del rubro"
                      data-testid="input-category-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      placeholder="Descripción opcional"
                      data-testid="input-category-description"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveCategory}
                    disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    data-testid="button-save-category"
                  >
                    {editingCategory ? "Guardar Cambios" : "Crear Rubro"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loadingCategories ? (
            <div className="text-center py-8 text-muted-foreground">Cargando rubros...</div>
          ) : filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {searchCategories ? "No se encontraron rubros" : "No hay rubros registrados"}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCategories.map((category) => (
                <Card key={category.id} className="hover-elevate" data-testid={`card-category-${category.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FolderTree className="h-4 w-4 text-primary" />
                        {category.name}
                      </CardTitle>
                      {category.description && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openCategoryDialog(category)}
                        data-testid={`button-edit-category-${category.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("¿Eliminar este rubro?")) {
                            deleteCategoryMutation.mutate(category.id);
                          }
                        }}
                        data-testid={`button-delete-category-${category.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </Layout>
  );
}
