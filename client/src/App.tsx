import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Clients from "@/pages/Clients";
import Pos from "@/pages/Pos";
import SalesHistory from "@/pages/SalesHistory";
import Remitos from "@/pages/Remitos";
import Users from "@/pages/Users";
import Suppliers from "@/pages/Suppliers";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/not-found";

function PrivateRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Don't redirect here, let the main Router handle it by showing Landing
      // This is just a backup check
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
          <p className="text-slate-500 text-sm font-medium">Loading FerreCloud...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Component /> : <Landing />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // If not authenticated, always show Landing (which has login button)
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Authenticated Routes
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/pos" component={Pos} />
      <Route path="/products" component={Products} />
      <Route path="/clients" component={Clients} />
      <Route path="/sales" component={SalesHistory} />
      <Route path="/remitos" component={Remitos} />
      <Route path="/suppliers" component={Suppliers} />
      <Route path="/users" component={Users} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
