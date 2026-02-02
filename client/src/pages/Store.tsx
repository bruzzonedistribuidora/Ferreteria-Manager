import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, Search, Star, Tag, Sparkles, Package, 
  ChevronRight, Heart, Phone, Mail, MapPin
} from "lucide-react";
import type { Product, EcommerceSettings, Category } from "@shared/schema";

export default function Store() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/ecommerce/products"],
  });

  const { data: settings } = useQuery<EcommerceSettings>({
    queryKey: ["/api/ecommerce/settings"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const featuredProducts = products.filter(p => p.isFeatured);
  const saleProducts = products.filter(p => p.isOnSale);
  const newProducts = products.filter(p => p.isNewArrival);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) {
        return prev.map(c => 
          c.product.id === product.id 
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const getProductPrice = (product: Product) => {
    if (product.isOnSale && product.salePrice) {
      return Number(product.salePrice);
    }
    return Number(product.priceWithTax || product.price);
  };

  const getOriginalPrice = (product: Product) => {
    return Number(product.priceWithTax || product.price);
  };

  const cartTotal = cart.reduce((sum, item) => 
    sum + getProductPrice(item.product) * item.quantity, 0
  );

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (!settings?.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800">Tienda en mantenimiento</h1>
          <p className="text-slate-500 mt-2">Pronto estaremos de vuelta</p>
        </div>
      </div>
    );
  }

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow" data-testid={`product-card-${product.id}`}>
      <div className="relative aspect-square bg-slate-100 overflow-hidden">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-slate-300" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isOnSale && (
            <Badge className="bg-red-500 text-white">
              <Tag className="h-3 w-3 mr-1" />
              Oferta
            </Badge>
          )}
          {product.isFeatured && (
            <Badge className="bg-yellow-500 text-white">
              <Star className="h-3 w-3 mr-1" />
              Destacado
            </Badge>
          )}
          {product.isNewArrival && (
            <Badge className="bg-green-500 text-white">
              <Sparkles className="h-3 w-3 mr-1" />
              Nuevo
            </Badge>
          )}
        </div>
        <Button 
          size="icon" 
          variant="ghost" 
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80"
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
        <h3 className="font-medium mt-1 line-clamp-2 min-h-[48px]">{product.name}</h3>
        <div className="mt-3 flex items-center justify-between">
          <div>
            {product.isOnSale && product.salePrice ? (
              <>
                <span className="text-lg font-bold text-red-600">
                  ${getProductPrice(product).toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground line-through ml-2">
                  ${getOriginalPrice(product).toLocaleString()}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold">
                ${getProductPrice(product).toLocaleString()}
              </span>
            )}
          </div>
          <Button 
            size="sm" 
            onClick={() => addToCart(product)}
            data-testid={`add-to-cart-${product.id}`}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const ProductSection = ({ 
    title, 
    icon: Icon, 
    products, 
    bgColor = "bg-white" 
  }: { 
    title: string; 
    icon: any; 
    products: Product[]; 
    bgColor?: string;
  }) => {
    if (products.length === 0) return null;
    return (
      <section className={`py-12 ${bgColor}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Icon className="h-6 w-6 text-orange-500" />
              <h2 className="text-2xl font-bold">{title}</h2>
            </div>
            <Button variant="ghost" className="gap-1">
              Ver todos <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.slice(0, 5).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-orange-600" data-testid="text-store-name">
                {settings?.storeName || "Mi Tienda"}
              </h1>
            </div>
            
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-store-search"
                />
              </div>
            </div>

            <Button variant="outline" className="relative" data-testid="button-cart">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                  {cartItemCount}
                </Badge>
              )}
              <span className="ml-2 hidden sm:inline">
                ${cartTotal.toLocaleString()}
              </span>
            </Button>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {settings?.storeName || "Bienvenido a nuestra tienda"}
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            {settings?.storeDescription || "Los mejores productos con la mejor atención"}
          </p>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="bg-white py-4 border-b sticky top-16 z-40">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                Todos
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      <ProductSection 
        title="Productos Destacados" 
        icon={Star} 
        products={featuredProducts}
        bgColor="bg-gradient-to-b from-yellow-50 to-white"
      />

      <ProductSection 
        title="Ofertas Especiales" 
        icon={Tag} 
        products={saleProducts}
        bgColor="bg-gradient-to-b from-red-50 to-white"
      />

      <ProductSection 
        title="Novedades" 
        icon={Sparkles} 
        products={newProducts}
        bgColor="bg-gradient-to-b from-green-50 to-white"
      />

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-orange-500" />
              <h2 className="text-2xl font-bold">
                {searchTerm || selectedCategory ? "Resultados" : "Todos los Productos"}
              </h2>
            </div>
            <Badge variant="secondary">{filteredProducts.length} productos</Badge>
          </div>
          
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <p className="text-muted-foreground">No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="bg-slate-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="text-lg font-bold mb-4">{settings?.storeName}</h3>
              <p className="text-slate-400 text-sm">{settings?.storeDescription}</p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Contacto</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{settings?.notificationWhatsapp || "Teléfono"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{settings?.notificationEmail || "Email"}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-4">Métodos de pago</h4>
              <div className="flex gap-2 flex-wrap">
                {settings?.paymentOnDeliveryEnabled && (
                  <Badge variant="secondary">Efectivo</Badge>
                )}
                {settings?.bankTransferEnabled && (
                  <Badge variant="secondary">Transferencia</Badge>
                )}
                {settings?.stripeEnabled && (
                  <Badge variant="secondary">Tarjeta</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-500">
            <p>© {new Date().getFullYear()} {settings?.storeName}. Todos los derechos reservados.</p>
            <p className="mt-1">Powered by FerreCloud</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
