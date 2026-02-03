import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  FileText, 
  LogOut, 
  UserCog, 
  Truck, 
  Wallet, 
  Landmark, 
  Warehouse,
  Receipt,
  ClipboardList,
  ShoppingBag,
  Heart,
  Globe,
  AlertTriangle,
  Settings2,
  Layers,
  Building2,
  FileDown,
  Tag,
  CreditCard,
  TrendingUp,
  Scale,
  Calculator,
  DollarSign,
  FileSpreadsheet,
  Settings,
  Plug,
  Brain,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Star,
  Plus,
  X,
  Zap,
  Ticket,
  Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface MenuItem {
  icon: any;
  label: string;
  href: string;
}

interface MenuGroup {
  title: string;
  icon: any;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: "PRINCIPAL",
    icon: LayoutDashboard,
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    ]
  },
  {
    title: "COMERCIAL",
    icon: ShoppingCart,
    items: [
      { icon: ShoppingCart, label: "Ventas", href: "/pos" },
      { icon: FileText, label: "Remitos", href: "/remitos" },
      { icon: ClipboardList, label: "Cotizaciones", href: "/quotes" },
      { icon: ShoppingBag, label: "Pedidos", href: "/orders" },
      { icon: Users, label: "Clientes", href: "/clients" },
      { icon: Heart, label: "Fidelización", href: "/loyalty" },
      { icon: Ticket, label: "Cupones y Ofertas", href: "/loyalty-admin" },
      { icon: Globe, label: "E-Commerce", href: "/ecommerce" },
    ]
  },
  {
    title: "PRODUCTOS & ABASTECIMIENTO",
    icon: Package,
    items: [
      { icon: Package, label: "Inventario", href: "/products" },
      { icon: AlertTriangle, label: "Faltantes", href: "/stock-alerts" },
      { icon: Settings2, label: "Ajuste de Stock", href: "/stock-adjustment" },
      { icon: Layers, label: "Modificación Masiva", href: "/bulk-edit" },
      { icon: Warehouse, label: "Depósito", href: "/stock" },
      { icon: Receipt, label: "Pedidos Compra", href: "/purchase-orders" },
      { icon: Truck, label: "Proveedores", href: "/suppliers" },
      { icon: DollarSign, label: "Lista Precios", href: "/price-lists" },
      { icon: TrendingUp, label: "Actualizar Precios", href: "/price-update" },
      { icon: FileDown, label: "Importar Datos", href: "/import" },
      { icon: Tag, label: "Marcas & Rubros", href: "/brands-categories" },
    ]
  },
  {
    title: "ADMINISTRACIÓN & FINANZAS",
    icon: Landmark,
    items: [
      { icon: Landmark, label: "Cajas y Pagos", href: "/cash-registers" },
      { icon: CreditCard, label: "Compras & IA", href: "/purchases" },
      { icon: Scale, label: "Saldos y Deudas", href: "/balances" },
      { icon: Calculator, label: "Cuotas Internas", href: "/installments" },
      { icon: TrendingUp, label: "Finanzas", href: "/finance" },
      { icon: Brain, label: "Inteligencia Financiera", href: "/finance-intelligence" },
      { icon: FileSpreadsheet, label: "Informes e IVA", href: "/reports" },
      { icon: UserCog, label: "Personal y Accesos", href: "/users" },
      { icon: DollarSign, label: "Pagos a Personal", href: "/payroll" },
    ]
  },
  {
    title: "CONFIGURACIÓN",
    icon: Settings,
    items: [
      { icon: Settings, label: "Configuración", href: "/settings" },
      { icon: Plug, label: "Integraciones", href: "/integrations" },
    ]
  }
];

// Get all menu items flat
const allMenuItems = menuGroups.flatMap(g => g.items);

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const [location] = useLocation();
  const { logout } = useAuth();
  
  // State for expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('sidebar-expanded-groups');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    // Default: all expanded
    return menuGroups.reduce((acc, g) => ({ ...acc, [g.title]: true }), {});
  });

  // State for quick access items
  const [quickAccessItems, setQuickAccessItems] = useState<string[]>(() => {
    const saved = localStorage.getItem('sidebar-quick-access');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return ["/pos", "/products", "/clients"]; // Default quick access
  });

  const [isQuickAccessDialogOpen, setIsQuickAccessDialogOpen] = useState(false);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('sidebar-expanded-groups', JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  useEffect(() => {
    localStorage.setItem('sidebar-quick-access', JSON.stringify(quickAccessItems));
  }, [quickAccessItems]);

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const toggleQuickAccess = (href: string) => {
    setQuickAccessItems(prev => 
      prev.includes(href) 
        ? prev.filter(h => h !== href)
        : [...prev, href]
    );
  };

  const quickAccessMenuItems = allMenuItems.filter(item => quickAccessItems.includes(item.href));

  // Collapsed sidebar view (icons only)
  if (isCollapsed) {
    return (
      <aside className="fixed left-0 top-0 z-40 h-screen w-[70px] border-r border-slate-800 bg-slate-900 text-slate-100 hidden lg:flex flex-col shadow-2xl transition-all duration-300">
        <div className="flex h-16 items-center justify-center border-b border-slate-800">
          <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* Expand button */}
        <div className="p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleCollapse}
                className="w-full flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all"
                data-testid="button-expand-sidebar"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Expandir menú</TooltipContent>
          </Tooltip>
        </div>

        {/* Quick Access Icons */}
        {quickAccessMenuItems.length > 0 && (
          <div className="px-2 py-2 border-b border-slate-800">
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-3 w-3 text-orange-500" />
            </div>
            {quickAccessMenuItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link 
                      href={item.href}
                      className={cn(
                        "flex items-center justify-center rounded-lg p-2 mb-1 transition-all duration-200",
                        isActive 
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                      )}
                      data-testid={`nav-quick-${item.href.replace('/', '') || 'dashboard'}`}
                    >
                      <item.icon className="h-4 w-4" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}

        {/* Collapsed menu groups - show group icons */}
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {menuGroups.map((group) => (
            <div key={group.title} className="mb-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center p-2 text-slate-500">
                    <group.icon className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">{group.title}</TooltipContent>
              </Tooltip>
              {group.items.map((item) => {
                const isActive = location === item.href;
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link 
                        href={item.href}
                        className={cn(
                          "flex items-center justify-center rounded-lg p-2 mb-1 transition-all duration-200",
                          isActive 
                            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                        )}
                        data-testid={`nav-${item.href.replace('/', '') || 'dashboard'}`}
                      >
                        <item.icon className="h-4 w-4" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>

        <div className="p-2 border-t border-slate-800 space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/mobile">
                <div className="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-blue-500/10 hover:text-blue-400 transition-all duration-200 cursor-pointer" data-testid="link-mobile">
                  <Smartphone className="h-4 w-4" />
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Modo Móvil</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => logout()}
                className="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Cerrar Sesión</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    );
  }

  // Expanded sidebar view
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[280px] border-r border-slate-800 bg-slate-900 text-slate-100 hidden lg:flex flex-col shadow-2xl transition-all duration-300">
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold font-heading tracking-tight text-white">
            FerreCloud
          </span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all"
          data-testid="button-collapse-sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Access Section */}
      {quickAccessMenuItems.length > 0 && (
        <div className="px-3 py-3 border-b border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-orange-500" />
              <h3 className="text-xs font-semibold text-orange-500 uppercase tracking-wider">
                Accesos Rápidos
              </h3>
            </div>
            <Dialog open={isQuickAccessDialogOpen} onOpenChange={setIsQuickAccessDialogOpen}>
              <DialogTrigger asChild>
                <button 
                  className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
                  data-testid="button-edit-quick-access"
                >
                  <Settings className="h-3 w-3" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Personalizar Accesos Rápidos</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground mb-4">
                  Selecciona los módulos que deseas tener como accesos rápidos
                </p>
                <div className="space-y-4">
                  {menuGroups.map((group) => (
                    <div key={group.title}>
                      <h4 className="text-sm font-medium mb-2">{group.title}</h4>
                      <div className="space-y-2 pl-2">
                        {group.items.map((item) => (
                          <label 
                            key={item.href} 
                            className="flex items-center gap-3 cursor-pointer hover:bg-muted p-2 rounded-lg transition-colors"
                          >
                            <Checkbox
                              checked={quickAccessItems.includes(item.href)}
                              onCheckedChange={() => toggleQuickAccess(item.href)}
                              data-testid={`checkbox-quick-${item.href.replace('/', '') || 'dashboard'}`}
                            />
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <nav className="space-y-1">
            {quickAccessMenuItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 group",
                    isActive 
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  )}
                  data-testid={`nav-quick-${item.href.replace('/', '') || 'dashboard'}`}
                >
                  <item.icon className={cn(
                    "h-4 w-4 transition-colors flex-shrink-0",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-100"
                  )} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-4 px-3">
        {menuGroups.map((group) => {
          const isExpanded = expandedGroups[group.title] ?? true;
          const hasActiveItem = group.items.some(item => location === item.href);
          
          return (
            <div key={group.title} className="mb-2">
              <button
                onClick={() => toggleGroup(group.title)}
                aria-expanded={isExpanded}
                aria-controls={`group-content-${group.title.toLowerCase().replace(/\s+/g, '-')}`}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200",
                  hasActiveItem && !isExpanded
                    ? "text-orange-400 bg-orange-500/10"
                    : "text-slate-500 hover:text-slate-400 hover:bg-slate-800/50"
                )}
                data-testid={`button-toggle-group-${group.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center gap-2">
                  <group.icon className="h-3 w-3" />
                  <span>{group.title}</span>
                </div>
                <ChevronDown className={cn(
                  "h-3 w-3 transition-transform duration-200",
                  isExpanded ? "" : "-rotate-90"
                )} />
              </button>
              
              <div 
                id={`group-content-${group.title.toLowerCase().replace(/\s+/g, '-')}`}
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <nav className="space-y-1 mt-1 pl-2">
                  {group.items.map((item) => {
                    const isActive = location === item.href;
                    return (
                      <Link 
                        key={item.href} 
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group",
                          isActive 
                            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                        )}
                        data-testid={`nav-${item.href.replace('/', '') || 'dashboard'}`}
                      >
                        <item.icon className={cn(
                          "h-4 w-4 transition-colors flex-shrink-0",
                          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-100"
                        )} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-800 space-y-1">
        <Link href="/mobile">
          <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-blue-500/10 hover:text-blue-400 transition-all duration-200 cursor-pointer" data-testid="link-mobile-expanded">
            <Smartphone className="h-4 w-4" />
            Modo Móvil
          </div>
        </Link>
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
