import { Badge } from "../ui/badge";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

interface StatusChipProps {
  status: "safe" | "caution" | "critical" | "online" | "offline";
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  safe: { 
    label: "Safe", 
    color: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20",
    icon: CheckCircle 
  },
  caution: { 
    label: "Caution", 
    color: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
    icon: AlertTriangle 
  },
  critical: { 
    label: "Critical", 
    color: "bg-[#E02D2D]/10 text-[#E02D2D] border-[#E02D2D]/20",
    icon: AlertCircle 
  },
  online: { 
    label: "Online", 
    color: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20",
    icon: CheckCircle 
  },
  offline: { 
    label: "Offline", 
    color: "bg-[#475569]/10 text-[#475569] border-[#475569]/20",
    icon: AlertCircle 
  },
};

export function StatusChip({ status, showIcon = false, className = "" }: StatusChipProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.color} uppercase tracking-wide ${className}`}
    >
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}
