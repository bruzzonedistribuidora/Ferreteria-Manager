import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  variant?: "default" | "orange" | "blue" | "green";
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  trend,
  trendValue,
  className,
  variant = "default" 
}: StatsCardProps) {
  
  const variants = {
    default: "bg-white border-border text-foreground",
    orange: "bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none shadow-orange-500/20",
    blue: "bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-blue-500/20",
    green: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-emerald-500/20",
  };

  const iconVariants = {
    default: "bg-orange-100 text-orange-600",
    orange: "bg-white/20 text-white",
    blue: "bg-white/20 text-white",
    green: "bg-white/20 text-white",
  };

  return (
    <Card className={cn(
      "overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border",
      variants[variant],
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className={cn("p-3 rounded-xl", iconVariants[variant])}>
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <div className={cn(
              "flex items-center text-xs font-medium px-2 py-1 rounded-full",
              variant === 'default' 
                ? (trend === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")
                : "bg-white/20 text-white"
            )}>
              {trend === "up" ? "↑" : "↓"} {trendValue}
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className={cn(
            "text-sm font-medium opacity-80",
            variant === 'default' ? "text-muted-foreground" : "text-white/80"
          )}>
            {title}
          </p>
          <h3 className="text-2xl font-bold mt-1 tracking-tight">{value}</h3>
          {description && (
            <p className={cn(
              "text-xs mt-1 opacity-70",
              variant === 'default' ? "text-muted-foreground" : "text-white/70"
            )}>
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
