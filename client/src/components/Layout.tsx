import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Sidebar as MobileSidebarContent } from "./Sidebar"; // Re-using sidebar for mobile
import { Menu } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      
      {/* Mobile Drawer */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 bg-slate-900 border-slate-800 w-[280px]">
          <MobileSidebarContent />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-[280px] flex flex-col min-h-screen transition-all duration-300 ease-in-out">
        <Topbar onMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 p-6 md:p-8 animate-in fade-in duration-500">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
