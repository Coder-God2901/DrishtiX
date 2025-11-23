import { Badge } from "../ui/badge";

interface RoleChipProps {
  role: "security" | "logistics" | "medical" | "organizer" | "volunteer";
  className?: string;
}

const roleConfig = {
  security: { label: "Security", color: "bg-[#E02D2D]/10 text-[#E02D2D] border-[#E02D2D]/20" },
  logistics: { label: "Logistics", color: "bg-[#0B3D91]/10 text-[#0B3D91] border-[#0B3D91]/20" },
  medical: { label: "Medical", color: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20" },
  organizer: { label: "Organizer", color: "bg-[#FF6A00]/10 text-[#FF6A00] border-[#FF6A00]/20" },
  volunteer: { label: "Volunteer", color: "bg-[#475569]/10 text-[#475569] border-[#475569]/20" },
};

export function RoleChip({ role, className = "" }: RoleChipProps) {
  const config = roleConfig[role];
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.color} uppercase tracking-wide ${className}`}
    >
      {config.label}
    </Badge>
  );
}
