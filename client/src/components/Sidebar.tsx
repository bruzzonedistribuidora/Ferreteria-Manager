import { Link, useLocation } from "wouter";
import { LayoutDashboard, ShoppingCart, Package, Users, Receipt, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: ShoppingCart, label: "Point of Sale", href: "/pos" },
  { icon: Package, label: "Products", href: "/products" },
  { icon: Users, label: "Clients", href: "/clients" },
  { icon: Receipt, label: "Sales History", href: "/sales" },
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

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 group",
                  isActive 
                    ? "bg-orange-500/10 text-orange-500 shadow-sm border border-orange-500/20" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-orange-500" : "text-slate-400 group-hover:text-slate-100"
                )} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
