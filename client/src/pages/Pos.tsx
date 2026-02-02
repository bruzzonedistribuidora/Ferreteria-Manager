import { Layout } from "@/components/Layout";
import { useProducts } from "@/hooks/use-products";
import { useClients } from "@/hooks/use-clients";
import { useCreateSale } from "@/hooks/use-sales";
import { useState, useMemo } from "react";
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, User, Check, Loader2 } from "lucide-react";
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
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: clients } = useClients();
  const { mutate: createSale, isPending: isProcessing } = useCreateSale();

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                            p.sku.toLowerCase().includes(search.toLowerCase());
      // Assuming we had category info here, skipping specific category filter logic for brevity unless data is enriched
      return matchesSearch && p.isActive;
    });
  }, [products, search]);

  const addToCart = (product: any) => {
    if (product.stockQuantity <= 0) {
      toast({
        title: "Out of Stock",
        description: "This item is currently unavailable.",
        variant: "destructive",
      });
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          toast({
            title: "Max Stock Reached",
            description: `Only ${product.stockQuantity} available.`,
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
          toast({ title: "Max Stock Reached", variant: "destructive" });
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

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    createSale({
      clientId: selectedClientId === "walk-in" ? undefined : Number(selectedClientId),
      paymentMethod,
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price
      }))
    }, {
      onSuccess: () => {
        toast({
          title: "Sale Completed",
          description: `Receipt #${Date.now().toString().slice(-6)} generated successfully.`,
        });
        setCart([]);
        setIsCheckoutOpen(false);
        setPaymentMethod("cash");
        setSelectedClientId("walk-in");
      },
      onError: (err) => {
        toast({
          title: "Transaction Failed",
          description: err.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
        
        {/* Left: Product Grid */}
        <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                className="pl-10 border-slate-200 bg-slate-50 focus-visible:ring-orange-500" 
                placeholder="Search products by name or SKU..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* Category Filter could go here */}
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
                        <Badge className="absolute top-2 right-2 bg-orange-500">Low Stock</Badge>
                      )}
                      {product.stockQuantity === 0 && (
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-[1px]">
                          <span className="text-white font-bold text-sm uppercase tracking-wider">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-slate-900 truncate" title={product.name}>{product.name}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-bold text-lg text-slate-900">${Number(product.price).toFixed(2)}</span>
                        <span className="text-xs text-slate-500">{product.stockQuantity} in stock</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right: Cart */}
        <div className="w-full lg:w-[400px] bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-orange-500" />
              <h2 className="font-semibold text-lg">Current Sale</h2>
            </div>
            <Badge variant="outline" className="text-orange-500 border-orange-500/50">
              {cart.length} Items
            </Badge>
          </div>

          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="bg-white border-slate-200">
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="Select Client" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="walk-in">Walk-in Client</SelectItem>
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
                  <p>Cart is empty</p>
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
              <span className="text-slate-500 font-medium">Total Amount</span>
              <span className="text-3xl font-bold text-slate-900">${total.toFixed(2)}</span>
            </div>
            
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full h-12 text-lg font-semibold bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/20"
                  disabled={cart.length === 0}
                >
                  Proceed to Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Confirm Payment</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">Payment Method</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['cash', 'card', 'transfer'].map((method) => (
                        <div 
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={`
                            cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all
                            ${paymentMethod === method 
                              ? 'border-orange-500 bg-orange-50 text-orange-700' 
                              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'}
                          `}
                        >
                          {method === 'cash' && <span className="text-2xl">$</span>}
                          {method === 'card' && <CreditCard className="h-6 w-6" />}
                          {method === 'transfer' && <div className="text-xl font-bold">⇄</div>}
                          <span className="capitalize text-sm font-medium">{method}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-slate-100 p-4 rounded-xl flex justify-between items-center mt-2">
                    <span className="font-medium text-slate-600">Total to Pay</span>
                    <span className="text-2xl font-bold text-slate-900">${total.toFixed(2)}</span>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={handleCheckout} 
                    disabled={isProcessing}
                    className="bg-orange-600 hover:bg-orange-700 min-w-[120px]"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                    Confirm Sale
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
