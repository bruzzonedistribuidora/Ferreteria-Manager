import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ShoppingCart, TrendingUp, ShieldCheck } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
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
                Sign In
              </Button>
              <Button 
                className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20"
                onClick={() => window.location.href = '/api/login'}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-left space-y-8 animate-in slide-in-from-left duration-700 fade-in">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 font-heading leading-tight">
                Modern Hardware <br/>
                <span className="text-orange-600">Store Management</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
                Streamline your inventory, sales, and customer management with our powerful, all-in-one cloud ERP solution.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-slate-900 hover:bg-slate-800 h-12 px-8 text-lg shadow-xl"
                  onClick={() => window.location.href = '/api/login'}
                >
                  Start Free Trial
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-12 px-8 text-lg border-slate-300"
                >
                  View Demo
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-4 text-sm font-medium text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> 14-day free trial
                </div>
              </div>
            </div>
            
            <div className="relative animate-in slide-in-from-right duration-1000 fade-in delay-200">
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl opacity-20 blur-3xl"></div>
              <img 
                src="https://pixabay.com/get/g688031a286c51ec1e5d9694015fdec4bbb7b3c1a123a4b4d12458f0f0eb767c908fb5c62d301bdeadda28e5fbdbbee95e4c36b11d25c2e52cb66fbf2a4489b03_1280.jpg"
                alt="Dashboard Preview" 
                className="relative rounded-2xl shadow-2xl border border-white/20"
              />
              
              {/* Floating Widget 1 */}
              <Card className="absolute -bottom-8 -left-8 w-64 shadow-xl border-none animate-in fade-in zoom-in duration-500 delay-500">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Revenue Growth</p>
                    <p className="text-xl font-bold text-slate-900">+127%</p>
                  </div>
                </CardContent>
              </Card>

              {/* Floating Widget 2 */}
              <Card className="absolute -top-6 -right-6 w-48 shadow-xl border-none animate-in fade-in zoom-in duration-500 delay-700">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Secure Cloud</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
