import {
  LayoutDashboard,
  FileText,
  MapPin,
  Users,
  BarChart3,
  Boxes,
  Activity,
  Flame,
  Bell,
  Radio,
  Database,
  FolderKanban,
  FileBarChart,
  Settings,
  ChevronRight,
  Shield,
  Zap,
  CalendarClock,
  UserPlus,
  DoorOpen,
  Target,
} from "lucide-react";

interface EventSidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isLive: boolean;
}

export function EventSidebar({
  currentView,
  onNavigate,
  isLive,
}: EventSidebarProps) {
  const liveOperationsItems = [
    {
      id: "monitoring",
      label: "Live Monitoring",
      icon: Activity,
      route: "live-monitoring",
    },
    {
      id: "heatmap",
      label: "Heatmap & Crowd Density",
      icon: Flame,
      route: "live-heatmap",
    },
    {
      id: "alerts",
      label: "Alerts & Incident Center",
      icon: Bell,
      route: "alerts",
    },
    {
      id: "dispatch",
      label: "Dispatch Center",
      icon: Radio,
      route: "dispatch-center",
    },
    {
      id: "gate-control",
      label: "Gate Control",
      icon: DoorOpen,
      route: "gate-control",
    },
    {
      id: "twin-live",
      label: "Digital Twin (Live Mode)",
      icon: Boxes,
      route: "digital-twin-live",
    },
  ];

  const eventSetupItems = [
    {
      id: "overview",
      label: "Event Overview",
      icon: LayoutDashboard,
      route: "event-overview",
    },
    {
      id: "details",
      label: "Event Details",
      icon: FileText,
      route: "event-details",
    },
    {
      id: "venue",
      label: "Venue Mapping",
      icon: MapPin,
      route: "venue-mapping",
    },
    { id: "teams", label: "Teams Setup", icon: Users, route: "teams-setup" },
    {
      id: "volunteers",
      label: "Volunteer Management",
      icon: UserPlus,
      route: "volunteer-management",
    },
    {
      id: "schedule",
      label: "Schedule (AI-Powered)",
      icon: CalendarClock,
      route: "schedule",
    },
    {
      id: "analytics",
      label: "Analytics Setup",
      icon: BarChart3,
      route: "analytics-setup",
    },
    {
      id: "twin-sim",
      label: "Digital Twin (Simulation Mode)",
      icon: Boxes,
      route: "digital-twin",
    },
  ];

  const managementItems = [
    {
      id: "ai-command",
      label: "AI Command Center",
      icon: Zap,
      route: "ai-command",
    },
    {
      id: "policies",
      label: "Policy & Automation Rules",
      icon: Shield,
      route: "policies",
    },
    {
      id: "intelligence",
      label: "Crowd Intelligence",
      icon: BarChart3,
      route: "intelligence",
    },
    {
      id: "post-event",
      label: "Post-Event Analysis",
      icon: FileBarChart,
      route: "post-event",
    },
    {
      id: "crud-panel",
      label: "Organizer CRUD Panel",
      icon: Target,
      route: "crud-panel",
    },
    { id: "data", label: "Data Hub", icon: Database, route: "master-data" },
    { id: "settings", label: "Settings", icon: Settings, route: "settings" },
  ];

  const SidebarItem = ({
    item,
  }: {
    item: (typeof eventSetupItems)[number];
  }) => {
    const isActive = currentView === item.route;
    const Icon = item.icon;

    return (
      <button
        type="button"
        onClick={() => onNavigate(item.route)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
          isActive
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
            : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            isActive ? "bg-white/20" : "bg-slate-100 group-hover:bg-white"
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <span className="flex-1 text-left text-sm">{item.label}</span>
        {!isActive && (
          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>
    );
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 min-h-screen sticky top-0 overflow-y-auto flex-shrink-0">
      <div className="p-4 space-y-6">
        {isLive && (
          <div>
            <h3 className="text-slate-500 text-xs uppercase tracking-wide px-4 mb-3">
              Live Operations
            </h3>
            <div className="space-y-1">
              {liveOperationsItems.map((item) => (
                <SidebarItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-slate-500 text-xs uppercase tracking-wide px-4 mb-3">
            Event Setup
          </h3>
          <div className="space-y-1">
            {eventSetupItems.map((item) => (
              <SidebarItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-slate-500 text-xs uppercase tracking-wide px-4 mb-3">
            Management
          </h3>
          <div className="space-y-1">
            {managementItems.map((item) => (
              <SidebarItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
