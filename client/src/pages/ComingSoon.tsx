import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Construction, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
                <Construction className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">{title}</h1>
            <p className="text-slate-500 mb-6">
              {description || "Este módulo está en desarrollo y estará disponible próximamente."}
            </p>
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export const Quotes = () => <ComingSoon title="Cotizaciones" description="Genera y gestiona cotizaciones para tus clientes." />;
export const Orders = () => <ComingSoon title="Pedidos" description="Administra los pedidos de tus clientes." />;
export const Loyalty = () => <ComingSoon title="Fidelización" description="Programa de puntos y beneficios para clientes frecuentes." />;
export const Ecommerce = () => <ComingSoon title="E-Commerce" description="Configura tu tienda online y vende por internet." />;
export const StockAlerts = () => <ComingSoon title="Faltantes" description="Productos con stock bajo o agotado." />;
export const StockAdjustment = () => <ComingSoon title="Ajuste de Stock" description="Realiza ajustes de inventario y correcciones." />;
export const BulkEdit = () => <ComingSoon title="Modificación Masiva" description="Edita múltiples productos a la vez." />;
export const PurchaseOrders = () => <ComingSoon title="Pedidos de Compra" description="Genera órdenes de compra para tus proveedores." />;
export const PriceLists = () => <ComingSoon title="Lista de Precios" description="Gestiona listas de precios por cliente o categoría." />;
export const ImportData = () => <ComingSoon title="Importar Datos" description="Importa productos y datos desde archivos Excel o CSV." />;
export const BrandsCategories = () => <ComingSoon title="Marcas & Rubros" description="Administra marcas y categorías de productos." />;
export const Purchases = () => <ComingSoon title="Compras & IA" description="Gestión de compras con asistencia de inteligencia artificial." />;
export const Balances = () => <ComingSoon title="Saldos y Deudas" description="Cuentas corrientes de clientes y proveedores." />;
export const Installments = () => <ComingSoon title="Cuotas Internas" description="Gestión de financiación propia." />;
export const Finance = () => <ComingSoon title="Finanzas" description="Reportes financieros y análisis de rentabilidad." />;
export const Reports = () => <ComingSoon title="Informes e IVA" description="Reportes fiscales y declaraciones de IVA." />;
export const SettingsPage = () => <ComingSoon title="Configuración" description="Configura los parámetros generales del sistema." />;
export const Integrations = () => <ComingSoon title="Integraciones" description="Conecta con servicios externos y APIs." />;
