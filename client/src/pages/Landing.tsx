import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ShoppingCart, TrendingUp, ShieldCheck, Package, Users, BarChart3 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navegación */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-orange-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold font-heading text-slate-900">FerreCloud</span>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                className="hidden md:inline-flex text-slate-600 hover:text-orange-600"
                onClick={() => window.location.href = '/api/login'}
              >
                Iniciar Sesión
              </Button>
              <Button 
                className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20"
                onClick={() => window.location.href = '/api/login'}
              >
                Comenzar
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sección Hero */}
      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-left space-y-8 animate-in slide-in-from-left duration-700 fade-in">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 font-heading leading-tight">
                Sistema de Gestión <br/>
                <span className="text-orange-600">para tu Ferretería</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
                Administra tu inventario, ventas y clientes con nuestra solución ERP en la nube, todo en uno y fácil de usar.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-slate-900 hover:bg-slate-800 h-12 px-8 text-lg shadow-xl"
                  onClick={() => window.location.href = '/api/login'}
                >
                  Comenzar Gratis
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-12 px-8 text-lg border-slate-300"
                >
                  Ver Demo
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-4 text-sm font-medium text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Sin tarjeta de crédito
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Acceso inmediato
                </div>
              </div>
            </div>
            
            <div className="relative animate-in slide-in-from-right duration-1000 fade-in delay-200">
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl opacity-20 blur-3xl"></div>
              <div className="relative bg-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-4">
                  <div className="bg-slate-800 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-orange-500" />
                      <span className="text-white font-medium">Productos en Stock</span>
                    </div>
                    <span className="text-2xl font-bold text-green-400">1,247</span>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                      <span className="text-white font-medium">Ventas del Mes</span>
                    </div>
                    <span className="text-2xl font-bold text-green-400">$2.4M</span>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-orange-500" />
                      <span className="text-white font-medium">Clientes Activos</span>
                    </div>
                    <span className="text-2xl font-bold text-green-400">328</span>
                  </div>
                </div>
              </div>
              
              {/* Widget Flotante */}
              <Card className="absolute -bottom-8 -left-8 w-64 shadow-xl border-none animate-in fade-in zoom-in duration-500 delay-500">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Crecimiento</p>
                    <p className="text-xl font-bold text-slate-900">+127%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Características */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Todo lo que necesitas para gestionar tu negocio</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Simplifica tus operaciones diarias con herramientas diseñadas específicamente para ferreterías.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Punto de Venta</h3>
                <p className="text-slate-600">
                  Interfaz intuitiva para realizar ventas rápidas. Busca productos, agrega al carrito y procesa pagos en segundos.
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Control de Inventario</h3>
                <p className="text-slate-600">
                  Mantén el control total de tu stock. Alertas de stock bajo, categorías y seguimiento de precios.
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Reportes y Estadísticas</h3>
                <p className="text-slate-600">
                  Visualiza el rendimiento de tu negocio con gráficos claros. Ventas diarias, productos más vendidos y más.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-8 w-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">FerreCloud</span>
          </div>
          <p className="text-sm">
            © 2024 FerreCloud. Sistema de gestión para ferreterías.
          </p>
        </div>
      </footer>
    </div>
  );
}
