import { Link, useLocation } from "wouter";
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
  Plug
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface MenuItem {
  icon: any;
  label: string;
  href: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: "PRINCIPAL",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    ]
  },
  {
    title: "COMERCIAL",
    items: [
      { icon: ShoppingCart, label: "Ventas", href: "/pos" },
      { icon: FileText, label: "Remitos", href: "/remitos" },
      { icon: ClipboardList, label: "Cotizaciones", href: "/quotes" },
      { icon: ShoppingBag, label: "Pedidos", href: "/orders" },
      { icon: Users, label: "Clientes", href: "/clients" },
      { icon: Heart, label: "Fidelización", href: "/loyalty" },
      { icon: Globe, label: "E-Commerce", href: "/ecommerce" },
    ]
  },
  {
    title: "PRODUCTOS & ABASTECIMIENTO",
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
    items: [
      { icon: Landmark, label: "Cajas y Pagos", href: "/cash-registers" },
      { icon: CreditCard, label: "Compras & IA", href: "/purchases" },
      { icon: Scale, label: "Saldos y Deudas", href: "/balances" },
      { icon: Calculator, label: "Cuotas Internas", href: "/installments" },
      { icon: TrendingUp, label: "Finanzas", href: "/finance" },
      { icon: FileSpreadsheet, label: "Informes e IVA", href: "/reports" },
      { icon: UserCog, label: "Personal y Accesos", href: "/users" },
      { icon: DollarSign, label: "Pagos a Personal", href: "/payroll" },
    ]
  },
  {
    title: "CONFIGURACIÓN",
    items: [
      { icon: Settings, label: "Configuración", href: "/settings" },
      { icon: Plug, label: "Integraciones", href: "/integrations" },
    ]
  }
];

export function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[280px] border-r border-slate-800 bg-slate-900 text-slate-100 hidden lg:flex flex-col shadow-2xl">
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold font-heading tracking-tight text-white">
            FerreCloud
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        {menuGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <h3 className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {group.title}
            </h3>
            <nav className="space-y-1">
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
        ))}
      </div>

      <div className="p-3 border-t border-slate-800">
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
