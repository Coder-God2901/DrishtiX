import { useState } from "react";
import { Button } from "./components/ui/button";
import { 
  LayoutDashboard,
  Calendar,
  Map,
  Users,
  Radio,
  Zap,
  AlertCircle,
  Navigation,
  Activity,
  Menu,
  X
} from "lucide-react";
import { EventCreator } from "./components/features/event-creator";
import { VenueMapping } from "./components/features/venue-mapping";
import { TeamManagement } from "./components/features/team-management";
import { OperationsDashboard } from "./components/features/operations-dashboard";
import { PredictiveScheduling } from "./components/features/predictive-scheduling";
import { AlertsDispatch } from "./components/features/alerts-dispatch";
import { AttendeeRouting } from "./components/features/attendee-routing";
import { DigitalTwin } from "./components/features/digital-twin";

type View = 
  | "landing"
  | "event-creator"
  | "venue-mapping"
  | "team-management"
  | "operations"
  | "predictive"
  | "alerts"
  | "routing"
  | "simulation";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("landing");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { id: "operations" as View, label: "Operations Dashboard", icon: LayoutDashboard, color: "text-[#FF6A00]" },
    { id: "event-creator" as View, label: "Create Event", icon: Calendar, color: "text-[#0B3D91]" },
    { id: "venue-mapping" as View, label: "Venue Mapping", icon: Map, color: "text-[#16A34A]" },
    { id: "team-management" as View, label: "Team & Roles", icon: Users, color: "text-[#F59E0B]" },
    { id: "predictive" as View, label: "AI Scheduling", icon: Zap, color: "text-[#FF6A00]" },
    { id: "alerts" as View, label: "Alerts & Dispatch", icon: AlertCircle, color: "text-[#E02D2D]" },
    { id: "routing" as View, label: "Attendee Routing", icon: Navigation, color: "text-[#0B3D91]" },
    { id: "simulation" as View, label: "Digital Twin", icon: Activity, color: "text-[#475569]" },
  ];

  const renderView = () => {
    switch (currentView) {
      case "event-creator":
        return <EventCreator />;
      case "venue-mapping":
        return <VenueMapping />;
      case "team-management":
        return <TeamManagement />;
      case "operations":
        return <OperationsDashboard />;
      case "predictive":
        return <PredictiveScheduling />;
      case "alerts":
        return <AlertsDispatch />;
      case "routing":
        return <AttendeeRouting />;
      case "simulation":
        return <DigitalTwin />;
      default:
        return <LandingView onNavigate={setCurrentView} navigation={navigation} />;
    }
  };

  if (currentView === "landing") {
    return renderView();
  }

  // Full app layout with sidebar
  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-[#0B3D91] transition-all duration-300 overflow-hidden flex flex-col`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FF6A00] rounded-lg flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <span className="text-white">EventSafe</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start ${
                  isActive 
                    ? "bg-white/10 text-white hover:bg-white/20" 
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
                onClick={() => setCurrentView(item.id)}
              >
                <Icon className={`w-4 h-4 mr-3 ${isActive ? item.color : ""}`} />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <Button
            variant="ghost"
            className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white"
            onClick={() => setCurrentView("landing")}
          >
            <LayoutDashboard className="w-4 h-4 mr-3" />
            Home
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Menu Button */}
        {!sidebarOpen && (
          <div className="h-16 flex items-center px-6 border-b bg-card">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* View Content */}
        <div className="flex-1 overflow-hidden">
          {renderView()}
        </div>
      </div>
    </div>
  );
}

function LandingView({ 
  onNavigate, 
  navigation 
}: { 
  onNavigate: (view: View) => void;
  navigation: Array<{ id: View; label: string; icon: any; color: string }>;
}) {
  const features = [
    {
      id: "event-creator" as View,
      title: "Dynamic Event Creator",
      description: "Create events with intelligent, type-driven forms that adapt to your event needs",
      icon: Calendar,
      color: "bg-[#0B3D91]/10 text-[#0B3D91]",
      highlight: "Meta-driven forms",
    },
    {
      id: "venue-mapping" as View,
      title: "Venue Boundary Mapping",
      description: "Draw precise venue polygons, define zones, and set geofences with easy tools",
      icon: Map,
      color: "bg-[#16A34A]/10 text-[#16A34A]",
      highlight: "Interactive drawing",
    },
    {
      id: "team-management" as View,
      title: "Team & Role Management",
      description: "Manage teams, assign roles, and configure permissions with RBAC",
      icon: Users,
      color: "bg-[#F59E0B]/10 text-[#F59E0B]",
      highlight: "Permission matrix",
    },
    {
      id: "operations" as View,
      title: "Real-Time Operations Dashboard",
      description: "Crystal-clear situational awareness with live heatmaps and prioritized alerts",
      icon: LayoutDashboard,
      color: "bg-[#FF6A00]/10 text-[#FF6A00]",
      highlight: "Live monitoring",
    },
    {
      id: "predictive" as View,
      title: "Predictive Scheduling AI",
      description: "AI-powered recommendations to optimize operations and prevent incidents",
      icon: Zap,
      color: "bg-[#FF6A00]/10 text-[#FF6A00]",
      highlight: "AI-powered",
    },
    {
      id: "alerts" as View,
      title: "Automated Alerts & Dispatch",
      description: "Fast incident response with smart team dispatch and routing",
      icon: AlertCircle,
      color: "bg-[#E02D2D]/10 text-[#E02D2D]",
      highlight: "Smart dispatch",
    },
    {
      id: "routing" as View,
      title: "Attendee Routing",
      description: "Clear, calm navigation for attendees with crowd-aware routing",
      icon: Navigation,
      color: "bg-[#0B3D91]/10 text-[#0B3D91]",
      highlight: "Crowd-aware",
    },
    {
      id: "simulation" as View,
      title: "Digital Twin Simulation",
      description: "Test scenarios and train teams with realistic event simulations",
      icon: Activity,
      color: "bg-[#475569]/10 text-[#475569]",
      highlight: "Scenario testing",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B3D91] via-[#0B3D91] to-[#0F1722]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-24">
          {/* Header */}
          <div className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#FF6A00] rounded-xl flex items-center justify-center">
                <Radio className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-white">EventSafe</h1>
                <p className="text-white/70">Event Safety Platform</p>
              </div>
            </div>
          </div>

          {/* Hero Content */}
          <div className="text-center mb-20">
            <div className="inline-block mb-4">
              <div className="px-4 py-2 bg-[#FF6A00]/20 border border-[#FF6A00]/30 rounded-full">
                <span className="text-[#FF6A00]">🎯 8 Powerful Features</span>
              </div>
            </div>
            <h1 className="text-white mb-6 max-w-4xl mx-auto">
              Complete Event Safety Platform
            </h1>
            <p className="text-white/80 text-xl max-w-2xl mx-auto mb-8">
              From planning to execution - manage events with AI-powered insights, 
              real-time monitoring, and predictive safety controls
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-[#FF6A00] hover:bg-[#FF6A00]/90 h-12 px-8"
                onClick={() => onNavigate("operations")}
              >
                <LayoutDashboard className="w-5 h-5 mr-2" />
                Launch Dashboard
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-12 px-8"
                onClick={() => onNavigate("event-creator")}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Create Event
              </Button>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  className="group relative bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all cursor-pointer"
                  onClick={() => onNavigate(feature.id)}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="px-2 py-1 bg-[#FF6A00]/20 rounded text-xs text-[#FF6A00]">
                        {feature.highlight}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white mb-2">{feature.title}</h3>
                      <p className="text-white/70 text-sm">{feature.description}</p>
                    </div>
                    <div className="flex items-center text-[#FF6A00] opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm">Explore</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { label: "Features", value: "8" },
              { label: "Real-Time Monitoring", value: "24/7" },
              { label: "AI-Powered", value: "Yes" },
              { label: "Response Time", value: "<3 min" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-white text-3xl mb-2">{stat.value}</p>
                <p className="text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
