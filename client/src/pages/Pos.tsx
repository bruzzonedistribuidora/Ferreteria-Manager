import { Layout } from "@/components/Layout";
import { useProducts } from "@/hooks/use-products";
import { useClients } from "@/hooks/use-clients";
import { useCreateSale } from "@/hooks/use-sales";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, User, Check, Loader2, Banknote, ArrowRightLeft, FileText, Receipt, Percent, FileCheck, Wallet } from "lucide-react";
import type { PaymentMethod } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
};

export default function Pos() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("walk-in");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [documentType, setDocumentType] = useState<string>("ingreso");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [createRemito, setCreateRemito] = useState(false);

  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: clients } = useClients();
  const { mutate: createSale, isPending: isProcessing } = useCreateSale();
  
  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

  const activePaymentMethods = paymentMethods.filter(pm => pm.isActive);
  
  // Sync payment method with active list
  const effectivePaymentMethod = activePaymentMethods.length > 0 
    ? (activePaymentMethods.find(pm => pm.code === paymentMethod)?.code || activePaymentMethods[0].code)
    : paymentMethod;

  const getPaymentIcon = (code: string) => {
    switch (code) {
      case 'cash': return Banknote;
      case 'card': return CreditCard;
      case 'transfer': return ArrowRightLeft;
      case 'check': return FileCheck;
      case 'credit_account': return Wallet;
      default: return Banknote;
    }
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                            p.sku.toLowerCase().includes(search.toLowerCase());
      return matchesSearch && p.isActive;
    });
  }, [products, search]);

  const addToCart = (product: any) => {
    if (product.stockQuantity <= 0) {
      toast({
        title: "Sin Stock",
        description: "Este artículo no está disponible actualmente.",
        variant: "destructive",
      });
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          toast({
            title: "Stock Máximo Alcanzado",
            description: `Solo hay ${product.stockQuantity} disponibles.`,
            variant: "destructive",
          });
          return prev;
        }
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { 
        productId: product.id, 
        name: product.name, 
        price: Number(product.price), 
        quantity: 1,
        maxStock: product.stockQuantity
      }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (newQty > item.maxStock) {
          toast({ title: "Stock Máximo Alcanzado", variant: "destructive" });
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const total = subtotal - discountAmount;

  const DOC_TYPES: Record<string, string> = {
    ingreso: "Ingreso Simple",
    factura_a: "Factura A",
    factura_b: "Factura B", 
    factura_c: "Factura C",
    presupuesto: "Presupuesto"
  };

  const handleCheckout = () => {
    createSale({
      clientId: selectedClientId === "walk-in" ? undefined : Number(selectedClientId),
      documentType,
      paymentMethod: effectivePaymentMethod,
      discountPercent,
      createRemito,
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price
      }))
    }, {
      onSuccess: () => {
        const docName = DOC_TYPES[documentType] || "Ticket";
        let description = `${docName} generado exitosamente.`;
        if (createRemito) {
          description += " Remito creado automáticamente.";
        }
        toast({
          title: documentType === "presupuesto" ? "Presupuesto Generado" : "Venta Completada",
          description,
        });
        setCart([]);
        setIsCheckoutOpen(false);
        setPaymentMethod("cash");
        setDocumentType("ingreso");
        setDiscountPercent(0);
        setSelectedClientId("walk-in");
        setCreateRemito(false);
      },
      onError: (err) => {
        toast({
          title: "Error en la Transacción",
          description: err.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
        
        {/* Izquierda: Grilla de Productos */}
        <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                className="pl-10 border-slate-200 bg-slate-50 focus-visible:ring-orange-500" 
                placeholder="Buscar productos por nombre o código..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1 p-4 bg-slate-50/50">
            {loadingProducts ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <Card 
                    key={product.id} 
                    className="cursor-pointer hover:shadow-lg hover:border-orange-200 transition-all group overflow-hidden border-slate-200"
                    onClick={() => addToCart(product)}
                  >
                    <div className="aspect-square bg-white flex items-center justify-center p-4 relative">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="object-cover h-full w-full rounded-md" />
                      ) : (
                        <PackagePlaceholder />
                      )}
                      {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                        <Badge className="absolute top-2 right-2 bg-orange-500">Stock Bajo</Badge>
                      )}
                      {product.stockQuantity === 0 && (
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-[1px]">
                          <span className="text-white font-bold text-sm uppercase tracking-wider">Sin Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-slate-900 truncate" title={product.name}>{product.name}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-bold text-lg text-slate-900">${Number(product.price).toFixed(2)}</span>
                        <span className="text-xs text-slate-500">{product.stockQuantity} en stock</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Derecha: Carrito */}
        <div className="w-full lg:w-[400px] bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-orange-500" />
              <h2 className="font-semibold text-lg">Venta Actual</h2>
            </div>
            <Badge variant="outline" className="text-orange-500 border-orange-500/50">
              {cart.length} Artículos
            </Badge>
          </div>

          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="bg-white border-slate-200">
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="Seleccionar Cliente" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="walk-in">Cliente Ocasional</SelectItem>
                {clients?.map(client => (
                  <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {cart.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl m-2">
                  <ShoppingCart className="h-8 w-8 mb-2 opacity-50" />
                  <p>El carrito está vacío</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.productId} className="flex gap-3 items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate text-slate-900">{item.name}</h4>
                      <div className="text-orange-600 font-bold text-sm">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-200">
                      <button 
                        className="p-1 hover:bg-white rounded-md transition-colors text-slate-500 hover:text-orange-600 hover:shadow-sm"
                        onClick={() => updateQuantity(item.productId, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button 
                        className="p-1 hover:bg-white rounded-md transition-colors text-slate-500 hover:text-orange-600 hover:shadow-sm"
                        onClick={() => updateQuantity(item.productId, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.productId)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="p-6 bg-slate-50 border-t border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 font-medium">Total a Pagar</span>
              <span className="text-3xl font-bold text-slate-900">${total.toFixed(2)}</span>
            </div>
            
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full h-12 text-lg font-semibold bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/20"
                  disabled={cart.length === 0}
                >
                  Cobrar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Confirmar Venta</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">Tipo de Documento</label>
                    <Select value={documentType} onValueChange={setDocumentType}>
                      <SelectTrigger className="bg-white" data-testid="select-document-type">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ingreso">Ingreso Simple</SelectItem>
                        <SelectItem value="factura_a">Factura A</SelectItem>
                        <SelectItem value="factura_b">Factura B</SelectItem>
                        <SelectItem value="factura_c">Factura C</SelectItem>
                        <SelectItem value="presupuesto">Presupuesto</SelectItem>
                      </SelectContent>
                    </Select>
                    {documentType.startsWith("factura_") && (
                      <p className="text-xs text-orange-600">Las facturas requieren validación ARCA posterior</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">Método de Pago</label>
                    <div className="grid grid-cols-3 gap-3">
                      {activePaymentMethods.length > 0 ? (
                        activePaymentMethods.map((method) => {
                          const Icon = getPaymentIcon(method.code);
                          return (
                            <div 
                              key={method.code}
                              onClick={() => setPaymentMethod(method.code)}
                              data-testid={`payment-method-${method.code}`}
                              className={`
                                cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all
                                ${paymentMethod === method.code 
                                  ? 'border-orange-500 bg-orange-50 text-orange-700' 
                                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'}
                              `}
                            >
                              <Icon className="h-6 w-6" />
                              <span className="text-sm font-medium">{method.name}</span>
                            </div>
                          );
                        })
                      ) : (
                        <>
                          {[
                            { key: 'cash', label: 'Efectivo', icon: Banknote },
                            { key: 'card', label: 'Tarjeta', icon: CreditCard },
                            { key: 'transfer', label: 'Transferencia', icon: ArrowRightLeft }
                          ].map((method) => (
                            <div 
                              key={method.key}
                              onClick={() => setPaymentMethod(method.key)}
                              data-testid={`payment-method-${method.key}`}
                              className={`
                                cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all
                                ${paymentMethod === method.key 
                                  ? 'border-orange-500 bg-orange-50 text-orange-700' 
                                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'}
                              `}
                            >
                              <method.icon className="h-6 w-6" />
                              <span className="text-sm font-medium">{method.label}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Descuento (%)
                    </label>
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      step="0.5"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="w-32"
                      data-testid="input-discount-percent"
                    />
                  </div>
                  
                  {documentType !== "presupuesto" && selectedClientId !== "walk-in" && (
                    <div className="flex items-center space-x-2 py-2 px-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Checkbox 
                        id="create-remito" 
                        checked={createRemito}
                        onCheckedChange={(checked) => setCreateRemito(checked === true)}
                        data-testid="checkbox-create-remito"
                      />
                      <Label 
                        htmlFor="create-remito" 
                        className="text-sm font-medium text-blue-700 dark:text-blue-300 cursor-pointer flex items-center gap-2"
                      >
                        <Receipt className="h-4 w-4" />
                        Generar Remito automáticamente
                      </Label>
                    </div>
                  )}

                  <div className="bg-slate-100 p-4 rounded-xl space-y-2 mt-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="text-slate-700">${subtotal.toFixed(2)}</span>
                    </div>
                    {discountPercent > 0 && (
                      <div className="flex justify-between items-center text-sm text-green-600">
                        <span>Descuento ({discountPercent}%)</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="font-medium text-slate-600">Total a Cobrar</span>
                      <span className="text-2xl font-bold text-slate-900">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>Cancelar</Button>
                  <Button 
                    onClick={handleCheckout} 
                    disabled={isProcessing}
                    className="bg-orange-600 hover:bg-orange-700 min-w-[120px]"
                    data-testid="button-confirm-sale"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                    {documentType === "presupuesto" ? "Generar Presupuesto" : "Confirmar Venta"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function PackagePlaceholder() {
  return (
    <div className="h-full w-full bg-slate-100 rounded-md flex items-center justify-center text-slate-300">
      <ShoppingCart className="h-8 w-8" />
    </div>
  );
}
