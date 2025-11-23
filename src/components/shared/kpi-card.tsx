import { Card } from "../ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  className = "" 
}: KPICardProps) {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <p className="text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-foreground">{value}</p>
            {trendValue && (
              <span className={`
                ${trend === 'up' ? 'text-[#16A34A]' : ''}
                ${trend === 'down' ? 'text-[#E02D2D]' : ''}
                ${trend === 'neutral' ? 'text-[#475569]' : ''}
              `}>
                {trendValue}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
    </Card>
  );
}
