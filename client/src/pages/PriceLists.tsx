import { Layout } from "@/components/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, List, RefreshCw, Pencil, Star, Percent } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PriceList } from "@shared/schema";

export default function PriceLists() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<PriceList | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [adjustmentPercent, setAdjustmentPercent] = useState("0");
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const { data: priceLists = [], isLoading } = useQuery<PriceList[]>({
    queryKey: ["/api/price-lists"],
  });

  const createPriceList = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/price-lists", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      toast({ title: "Lista Creada", description: "La lista de precios se creó exitosamente." });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const updatePriceList = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/price-lists/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      toast({ title: "Lista Actualizada" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setEditingList(null);
    setName("");
    setCode("");
    setDescription("");
    setAdjustmentPercent("0");
    setIsDefault(false);
    setIsActive(true);
  };

  const openEditDialog = (list: PriceList) => {
    setEditingList(list);
    setName(list.name);
    setCode(list.code || "");
    setDescription(list.description || "");
    setAdjustmentPercent(list.adjustmentPercent?.toString() || "0");
    setIsDefault(list.isDefault || false);
    setIsActive(list.isActive !== false);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name) return;
    
    const data = {
      name,
      code: code || null,
      description: description || null,
      adjustmentPercent: parseFloat(adjustmentPercent) || 0,
      isDefault,
      isActive
    };

    if (editingList) {
      updatePriceList.mutate({ id: editingList.id, data });
    } else {
      createPriceList.mutate(data);
    }
  };

  const isPending = createPriceList.isPending || updatePriceList.isPending;

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Listas de Precios</h1>
            <p className="text-slate-500 dark:text-slate-400">Gestiona diferentes listas de precios para mayoristas, minoristas, etc.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-list">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Lista
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingList ? "Editar Lista de Precios" : "Nueva Lista de Precios"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Mayorista"
                      data-testid="input-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Código</Label>
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Ej: MAY"
                      data-testid="input-code"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción de la lista..."
                    data-testid="input-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ajuste de Precio (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={adjustmentPercent}
                      onChange={(e) => setAdjustmentPercent(e.target.value)}
                      placeholder="0"
                      data-testid="input-adjustment"
                    />
                    <span className="text-sm text-muted-foreground">% sobre precio base</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Positivo para aumentar, negativo para descuento.
                  </p>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label>Lista Predeterminada</Label>
                    <p className="text-xs text-muted-foreground">Usar como lista por defecto para nuevos clientes.</p>
                  </div>
                  <Switch 
                    checked={isDefault} 
                    onCheckedChange={setIsDefault}
                    data-testid="switch-default"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label>Activa</Label>
                    <p className="text-xs text-muted-foreground">Lista disponible para usar.</p>
                  </div>
                  <Switch 
                    checked={isActive} 
                    onCheckedChange={setIsActive}
                    data-testid="switch-active"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!name || isPending}
                  data-testid="button-save"
                >
                  {isPending ? "Guardando..." : (editingList ? "Guardar Cambios" : "Crear Lista")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Listas de Precios
            </CardTitle>
            <CardDescription>
              Las listas de precios permiten aplicar ajustes porcentuales automáticos sobre el precio base de los productos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Ajuste</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceLists.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        No hay listas de precios registradas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    priceLists.map(list => (
                      <TableRow key={list.id} data-testid={`row-list-${list.id}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {list.name}
                            {list.isDefault && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">{list.code || "-"}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {list.description || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Percent className="h-3 w-3 text-muted-foreground" />
                            <span className={Number(list.adjustmentPercent) > 0 ? 'text-green-600' : Number(list.adjustmentPercent) < 0 ? 'text-red-600' : ''}>
                              {Number(list.adjustmentPercent) > 0 ? '+' : ''}{list.adjustmentPercent}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={list.isActive ? "default" : "secondary"}>
                            {list.isActive ? "Activa" : "Inactiva"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => openEditDialog(list)}
                            data-testid={`button-edit-${list.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
