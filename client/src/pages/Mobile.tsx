import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEmployeeAuth } from "@/hooks/useEmployeeAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ShoppingCart, 
  Package, 
  FileText, 
  Users, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  LogOut,
  Menu,
  X,
  DollarSign,
  Barcode,
  Phone,
  MapPin,
  Check,
  AlertCircle,
  Home
} from "lucide-react";
import { Link } from "wouter";

interface Product {
  id: number;
  name: string;
  code: string;
  barcode?: string;
  salePrice: string;
  currentStock: number;
  unit: string;
  brand?: { name: string };
  category?: { name: string };
}

interface Client {
  id: number;
  name: string;
  cuit?: string;
  phone?: string;
  address?: string;
  email?: string;
  balance?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  price: number;
}

type MobileView = "menu" | "pos" | "stock" | "remitos" | "clients";

export default function Mobile() {
  const { employee, logout } = useEmployeeAuth();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<MobileView>("menu");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Fetch products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch clients
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Filter products based on search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchTerm))
  );

  // Filter clients based on search
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.cuit && c.cuit.includes(searchTerm)) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  // Cart functions
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, price: parseFloat(product.salePrice) }];
    });
    toast({ title: "Agregado", description: product.name });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => 
      prev.map(item => {
        if (item.product.id === productId) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      return apiRequest("POST", "/api/sales", saleData);
    },
    onSuccess: () => {
      toast({ title: "Venta realizada", description: `Total: $${cartTotal.toFixed(2)}` });
      setCart([]);
      setSelectedClient(null);
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSale = () => {
    if (cart.length === 0) {
      toast({ title: "Carrito vacío", variant: "destructive" });
      return;
    }

    createSaleMutation.mutate({
      clientId: selectedClient?.id || null,
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.price * item.quantity,
      })),
      total: cartTotal,
      paymentMethod: "efectivo",
      status: "completed",
    });
  };

  // Menu View
  const MenuView = () => (
    <div className="p-4 space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-orange-600">FerreCloud</h1>
        <p className="text-sm text-muted-foreground">Modo Móvil</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card 
          className="cursor-pointer hover-elevate" 
          onClick={() => { setCurrentView("pos"); setSearchTerm(""); }}
          data-testid="mobile-menu-pos"
        >
          <CardContent className="p-6 flex flex-col items-center gap-2">
            <ShoppingCart className="h-10 w-10 text-orange-500" />
            <span className="font-medium">POS Rápido</span>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover-elevate" 
          onClick={() => { setCurrentView("stock"); setSearchTerm(""); }}
          data-testid="mobile-menu-stock"
        >
          <CardContent className="p-6 flex flex-col items-center gap-2">
            <Package className="h-10 w-10 text-blue-500" />
            <span className="font-medium">Stock/Precios</span>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover-elevate" 
          onClick={() => { setCurrentView("remitos"); setSearchTerm(""); }}
          data-testid="mobile-menu-remitos"
        >
          <CardContent className="p-6 flex flex-col items-center gap-2">
            <FileText className="h-10 w-10 text-green-500" />
            <span className="font-medium">Remitos</span>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover-elevate" 
          onClick={() => { setCurrentView("clients"); setSearchTerm(""); }}
          data-testid="mobile-menu-clients"
        >
          <CardContent className="p-6 flex flex-col items-center gap-2">
            <Users className="h-10 w-10 text-purple-500" />
            <span className="font-medium">Clientes</span>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4 space-y-2">
        <Link href="/">
          <Button variant="outline" className="w-full gap-2" data-testid="mobile-go-desktop">
            <Home className="h-4 w-4" />
            Ir a versión completa
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          className="w-full gap-2 text-red-500" 
          onClick={() => logout()}
          data-testid="mobile-logout"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground pt-4">
        {employee?.firstName} {employee?.lastName}
      </p>
    </div>
  );

  // POS View
  const PosView = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("menu")} data-testid="pos-back">
            <X className="h-5 w-5" />
          </Button>
          <h2 className="font-bold text-lg flex-1">POS Rápido</h2>
          <Badge variant="secondary">{cart.length} items</Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="pos-search"
          />
        </div>
      </div>

      {/* Products list */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {filteredProducts.slice(0, 50).map(product => (
            <Card 
              key={product.id} 
              className="cursor-pointer"
              onClick={() => addToCart(product)}
              data-testid={`pos-product-${product.id}`}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{product.code}</span>
                    <Badge variant={product.currentStock > 0 ? "default" : "destructive"} className="text-xs">
                      {product.currentStock} {product.unit}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-orange-600">${parseFloat(product.salePrice).toFixed(2)}</p>
                  <Button size="sm" variant="ghost" className="h-7">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Cart summary */}
      {cart.length > 0 && (
        <div className="border-t bg-background p-3 space-y-3">
          <div className="max-h-32 overflow-y-auto space-y-1">
            {cart.map(item => (
              <div key={item.product.id} className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">{item.product.name}</span>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <span className="w-16 text-right">${(item.price * item.quantity).toFixed(2)}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => removeFromCart(item.product.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span className="text-orange-600">${cartTotal.toFixed(2)}</span>
          </div>
          <Button 
            className="w-full bg-orange-500 hover:bg-orange-600" 
            onClick={handleSale}
            disabled={createSaleMutation.isPending}
            data-testid="pos-checkout"
          >
            <Check className="h-4 w-4 mr-2" />
            {createSaleMutation.isPending ? "Procesando..." : "Cobrar"}
          </Button>
        </div>
      )}
    </div>
  );

  // Stock View
  const StockView = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("menu")} data-testid="stock-back">
            <X className="h-5 w-5" />
          </Button>
          <h2 className="font-bold text-lg">Stock y Precios</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, código o código de barras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="stock-search"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {filteredProducts.slice(0, 100).map(product => (
            <Card key={product.id} data-testid={`stock-product-${product.id}`}>
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{product.name}</p>
                    <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Barcode className="h-3 w-3" />
                        {product.code}
                      </span>
                      {product.barcode && (
                        <span>| {product.barcode}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-orange-600">${parseFloat(product.salePrice).toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {product.brand && <Badge variant="outline">{product.brand.name}</Badge>}
                    {product.category && <Badge variant="secondary">{product.category.name}</Badge>}
                  </div>
                  <Badge 
                    variant={product.currentStock > 10 ? "default" : product.currentStock > 0 ? "secondary" : "destructive"}
                    className="text-sm"
                  >
                    {product.currentStock > 0 ? (
                      <>{product.currentStock} {product.unit}</>
                    ) : (
                      <><AlertCircle className="h-3 w-3 mr-1" /> Sin stock</>
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredProducts.length === 0 && searchTerm && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron productos
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // Remitos View
  const RemitosView = () => {
    const { data: remitos = [] } = useQuery<any[]>({
      queryKey: ["/api/delivery-notes"],
    });

    const pendingRemitos = remitos.filter(r => r.status === "pending");
    const completedRemitos = remitos.filter(r => r.status !== "pending").slice(0, 20);

    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b bg-background sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setCurrentView("menu")} data-testid="remitos-back">
              <X className="h-5 w-5" />
            </Button>
            <h2 className="font-bold text-lg">Remitos</h2>
          </div>
        </div>

        <ScrollArea className="flex-1 p-2">
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="w-full mb-3">
              <TabsTrigger value="pending" className="flex-1">
                Pendientes ({pendingRemitos.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex-1">
                Completados
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-2">
              {pendingRemitos.map(remito => (
                <Card key={remito.id} data-testid={`remito-${remito.id}`}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">#{remito.number}</p>
                        <p className="text-sm text-muted-foreground">{remito.client?.name || "Sin cliente"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(remito.date).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                      <Badge variant="secondary">Pendiente</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {pendingRemitos.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay remitos pendientes
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-2">
              {completedRemitos.map(remito => (
                <Card key={remito.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">#{remito.number}</p>
                        <p className="text-sm text-muted-foreground">{remito.client?.name || "Sin cliente"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(remito.date).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                      <Badge variant="outline">{remito.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </div>
    );
  };

  // Clients View
  const ClientsView = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("menu")} data-testid="clients-back">
            <X className="h-5 w-5" />
          </Button>
          <h2 className="font-bold text-lg">Clientes</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, CUIT o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="clients-search"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {filteredClients.slice(0, 50).map(client => (
            <Card key={client.id} data-testid={`client-${client.id}`}>
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{client.name}</p>
                    {client.cuit && (
                      <p className="text-sm text-muted-foreground">CUIT: {client.cuit}</p>
                    )}
                  </div>
                  {client.balance && parseFloat(client.balance) !== 0 && (
                    <Badge variant={parseFloat(client.balance) > 0 ? "destructive" : "default"}>
                      <DollarSign className="h-3 w-3" />
                      {parseFloat(client.balance).toFixed(2)}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {client.phone && (
                    <a href={`tel:${client.phone}`} className="flex items-center gap-1 text-blue-500">
                      <Phone className="h-3 w-3" />
                      {client.phone}
                    </a>
                  )}
                  {client.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {client.address}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredClients.length === 0 && searchTerm && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron clientes
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // Render current view
  return (
    <div className="h-screen bg-slate-50 flex flex-col" data-testid="mobile-container">
      {currentView === "menu" && <MenuView />}
      {currentView === "pos" && <PosView />}
      {currentView === "stock" && <StockView />}
      {currentView === "remitos" && <RemitosView />}
      {currentView === "clients" && <ClientsView />}
    </div>
  );
}
