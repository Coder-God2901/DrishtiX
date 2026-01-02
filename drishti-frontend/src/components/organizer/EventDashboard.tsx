import { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Users,
  AlertTriangle,
  Shield,
  Activity,
  ChevronDown,
  Plus,
  Radio,
  Zap,
  Heart,
  AlertCircle,
  CheckCircle2,
  Clock,
  PlayCircle,
  FileText,
  Bell,
  Send,
  DoorOpen,
  CloudRain,
  ChevronRight,
  Thermometer,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Map,
  AlertOctagon,
} from "lucide-react";
import { IncidentDrawer } from "../shared/IncidentDrawer";
import {
  useIncidents,
  useIncidentStatistics,
} from "../../services/incidentContext";
import type { Incident } from "../../services/incidentManagementService";

interface EventDashboardProps {
  eventId: string;
  onNavigate: (view: string) => void;
  onBack: () => void;
  onSwitchEvent: () => void;
  onCreateEvent: () => void;
}

export function EventDashboard({
  eventId,
  onNavigate,
  onBack,
  onSwitchEvent,
  onCreateEvent,
}: EventDashboardProps) {
  const [showEventSwitcher, setShowEventSwitcher] = useState(false);
  const [activeMapLayer, setActiveMapLayer] = useState("Heatmap");
  const [showOperationsLog, setShowOperationsLog] = useState(false);
  const [activeIncidentFilter, setActiveIncidentFilter] = useState("All");
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [showIncidentDrawer, setShowIncidentDrawer] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState<
    "medical" | "security" | "gate" | "broadcast" | "reroute" | null
  >(null);
  const [mapSrc, setMapSrc] = useState<string>(
    "https://www.google.com/maps?q=Bayfront%20Beach%2C%20USA&z=13&output=embed"
  );
  const [locError, setLocError] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState<boolean>(false);

  // Use incident context to get real-time incidents
  const { incidents: allIncidents, isLoading: incidentsLoading } =
    useIncidents();
  const incidentStats = useIncidentStatistics();

  const getEmbedUrl = (lat: number, lng: number) => {
    // Use the embed-specific Google Maps URL format
    return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${lat},${lng}!5e0!3m2!1sen!2sin!4v1234567890`;
  };

  const refreshLocation = () => {
    setLocError(null);
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const url = getEmbedUrl(latitude, longitude);
          setMapSrc(url);
        },
        () => {
          setLocError(
            "Location access denied or unavailable. Showing default map."
          );
          setMapSrc(getEmbedUrl(37.7749, -122.4194)); // San Francisco fallback
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      setLocError("Geolocation not supported. Showing default map.");
      setMapSrc(getEmbedUrl(37.7749, -122.4194)); // San Francisco fallback
    }
  };

  useEffect(() => {
    refreshLocation();
  }, []);

  // Mock event data
  const event = {
    id: eventId,
    name: "Summer Music Festival 2025",
    status: "Live", // 'Draft', 'Scheduled', 'Live', 'Completed'
    date: "June 20, 2025",
    location: "Bayfront Beach, USA",
    capacity: 10000,
    currentAttendees: 9485,
    statusColor: "emerald",
    healthScore: 92,
    healthStatus: "Stable",
  };

  const isLive = event.status === "Live";
  const isDraft = event.status === "Draft";
  const isScheduled = event.status === "Scheduled";

  // Critical stats for the alert strip
  const criticalStats = [
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      label: "Critical Alerts",
      value: isLive ? "2" : "0",
      color: "red",
      bgColor: "bg-red-100",
      textColor: "text-red-700",
      borderColor: "border-red-200",
    },
    {
      icon: <AlertCircle className="w-5 h-5" />,
      label: "Warnings",
      value: isLive ? "5" : "0",
      color: "amber",
      bgColor: "bg-amber-100",
      textColor: "text-amber-700",
      borderColor: "border-amber-200",
    },
    {
      icon: <CheckCircle2 className="w-5 h-5" />,
      label: "Safe Zones",
      value: isLive ? "12/15" : "15",
      color: "emerald",
      bgColor: "bg-emerald-100",
      textColor: "text-emerald-700",
      borderColor: "border-emerald-200",
    },
    {
      icon: <Heart className="w-5 h-5" />,
      label: "Medical",
      value: isLive
        ? String(
            allIncidents.filter(
              (i) =>
                i.source === "attendee-medical" || i.type.includes("Medical")
            ).length
          )
        : "0",
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: "Security",
      value: isLive
        ? String(
            allIncidents.filter(
              (i) => i.source === "attendee-sos" || i.type.includes("SOS")
            ).length
          )
        : "0",
      color: "purple",
      bgColor: "bg-purple-100",
      textColor: "text-purple-700",
      borderColor: "border-purple-200",
    },
  ];

  // Convert incidents from service to component format
  const incidents = allIncidents.map((incident) => ({
    type: incident.type,
    location: incident.location,
    time: new Date(incident.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    status:
      incident.severity === "critical" || incident.severity === "high"
        ? "Critical"
        : incident.severity === "medium"
        ? "Warning"
        : incident.status === "resolved"
        ? "Resolved"
        : "In Progress",
    color: incident.color,
    description: incident.description,
    aiAnalysis: incident.aiAnalysis,
    prediction: incident.prediction,
    x: incident.x || 50,
    y: incident.y || 50,
    source: incident.source,
    severity: incident.severity,
  }));

  // Helper function to open incident drawer
  // Helper function to open incident drawer
  const openIncidentDrawer = (incident: any) => {
    setSelectedIncident(incident);
    setShowIncidentDrawer(true);
  };

  // Filter incidents based on active filter
  const filteredIncidents = incidents.filter((incident) => {
    if (activeIncidentFilter === "All") return true;
    if (activeIncidentFilter === "Critical")
      return incident.status === "Critical";
    if (activeIncidentFilter === "Warning")
      return incident.status === "Warning";
    if (activeIncidentFilter === "Info")
      return incident.status === "In Progress";
    if (activeIncidentFilter === "Resolved")
      return incident.status === "Resolved";
    return true;
  });

  // Workflow steps (for draft/scheduled events)
  const workflowSteps = [
    {
      id: 1,
      title: "Event Information",
      description: "Basic details and event type",
      status: "completed",
      route: "event-details",
    },
    {
      id: 2,
      title: "Venue Mapping",
      description: "Digital twin and zone creation",
      status: isDraft ? "current" : "completed",
      route: "venue-mapping",
    },
    {
      id: 3,
      title: "Teams & Schedules",
      description: "Staff and volunteer assignments",
      status: isDraft ? "pending" : "completed",
      route: "teams-setup",
    },
    {
      id: 4,
      title: "Analytics Setup",
      description: "Configure monitoring and alerts",
      status: "pending",
      route: "analytics-setup",
    },
    {
      id: 5,
      title: "Go Live",
      description: "Final review and launch",
      status: "pending",
      route: "go-live",
    },
  ];

  const statusColors: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Event Header Bar */}
      <div className="bg-white border-b border-slate-200 z-40 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                ← Back
              </button>

              <div className="h-8 w-px bg-slate-300" />

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-slate-900 text-xl">{event.name}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className={`text-xs px-2 py-1 rounded-md border ${
                        statusColors[event.statusColor]
                      }`}
                    >
                      {event.status}
                    </span>
                    <span className="text-slate-600 text-sm">{event.date}</span>
                    <span className="text-slate-600 text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {event.location}
                    </span>
                  </div>
                </div>
              </div>

              {/* Event Switcher */}
              <div className="relative ml-4">
                <button
                  onClick={() => setShowEventSwitcher(!showEventSwitcher)}
                  className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="text-slate-700 text-sm">Switch Event</span>
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                </button>
                {showEventSwitcher && (
                  <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-slate-200 min-w-[200px] z-50">
                    <button
                      onClick={() => {
                        setShowEventSwitcher(false);
                        onSwitchEvent();
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors text-sm"
                    >
                      View All Events
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => onNavigate("go-live")}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 flex items-center gap-2 shadow-lg"
            >
              <PlayCircle className="w-5 h-5" />
              Go Live
            </button>
          </div>
        </div>
      </div>

      {/* Critical Alerts Strip */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {criticalStats.map((stat, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-lg border p-4 hover:shadow-md transition-all duration-200 ${stat.borderColor}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center ${stat.textColor}`}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-slate-600 text-xs">{stat.label}</p>
                    <p className={`text-2xl ${stat.textColor}`}>{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLive ? (
          // LIVE EVENT VIEW
          <div className="space-y-6">
            {/* Live Operations Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Large Center Map */}
              <div className="lg:col-span-2">
                <div
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                  style={{ height: "500px" }}
                >
                  {/* Map Header */}
                  <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-slate-900">Live Operations Map</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveMapLayer("Heatmap")}
                        className={`px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors ${
                          activeMapLayer === "Heatmap" ? "bg-slate-50" : ""
                        }`}
                      >
                        Heatmap
                      </button>
                      <button
                        onClick={() => setActiveMapLayer("Incidents")}
                        className={`px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors ${
                          activeMapLayer === "Incidents" ? "bg-slate-50" : ""
                        }`}
                      >
                        Incidents
                      </button>
                      <button
                        onClick={() => setActiveMapLayer("Teams")}
                        className={`px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors ${
                          activeMapLayer === "Teams" ? "bg-slate-50" : ""
                        }`}
                      >
                        Teams
                      </button>
                    </div>
                  </div>

                  {/* Live Venue Visualization Map */}
                  <div
                    className="h-[calc(100%-60px)] relative"
                    style={{
                      background:
                        "linear-gradient(to bottom right, #f1f5f9, #cbd5e1)",
                    }}
                  >
                    {/* Map Placeholder */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 0,
                        pointerEvents: "none",
                      }}
                    >
                      <div style={{ textAlign: "center" }}>
                        <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600">Live Venue Map</p>
                      </div>
                    </div>

                    {/* Overlay header badge */}
                    <div
                      className="absolute top-4 left-4 bg-white/95 rounded-lg shadow-md px-4 py-2 border border-slate-200"
                      style={{ zIndex: 20 }}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-slate-900">9,485 Attendees</span>
                      </div>
                    </div>

                    {/* Incident markers overlay */}
                    {activeMapLayer === "Incidents" && (
                      <>
                        {incidents.map((incident, idx) => (
                          <button
                            key={idx}
                            onClick={() => openIncidentDrawer(incident)}
                            className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg transition-transform hover:scale-125 flex items-center justify-center"
                            style={{
                              left: `${incident.x}%`,
                              top: `${incident.y}%`,
                              backgroundColor:
                                incident.color === "red"
                                  ? "#ef4444"
                                  : incident.color === "amber"
                                  ? "#f59e0b"
                                  : incident.color === "blue"
                                  ? "#3b82f6"
                                  : "#10b981",
                              zIndex: 30,
                            }}
                          >
                            <AlertTriangle className="w-3 h-3 text-white" />
                          </button>
                        ))}
                      </>
                    )}

                    {/* Heatmap overlay with enhanced blur */}
                    {activeMapLayer === "Heatmap" && (
                      <>
                        <div
                          style={{
                            position: "absolute",
                            top: "35%",
                            left: "50%",
                            width: "180px",
                            height: "180px",
                            backgroundColor: "rgba(239, 68, 68, 0.7)",
                            borderRadius: "50%",
                            filter: "blur(60px)",
                            zIndex: 10,
                            transform: "translateX(-50%)",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: "45%",
                            left: "25%",
                            width: "140px",
                            height: "140px",
                            backgroundColor: "rgba(245, 158, 11, 0.6)",
                            borderRadius: "50%",
                            filter: "blur(45px)",
                            zIndex: 10,
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            bottom: "100px",
                            right: "100%",
                            width: "110px",
                            height: "110px",
                            backgroundColor: "rgba(34, 197, 94, 0.5)",
                            borderRadius: "50%",
                            filter: "blur(40px)",
                            zIndex: 10,
                          }}
                        />

                        {/* Zone Labels for Heatmap */}
                        <div
                          style={{
                            position: "absolute",
                            top: "200px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            backgroundColor: "#ef4444",
                            color: "white",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            border: "2px solid white",
                            zIndex: 20,
                          }}
                        >
                          <div style={{ fontWeight: "600" }}>Main Stage</div>
                          <div style={{ fontSize: "9px", opacity: 0.9 }}>
                            High Density
                          </div>
                        </div>

                        <div
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: "22%",
                            backgroundColor: "#f59e0b",
                            color: "white",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            border: "2px solid white",
                            zIndex: 20,
                          }}
                        >
                          <div style={{ fontWeight: "600" }}>Food Court</div>
                          <div style={{ fontSize: "9px", opacity: 0.9 }}>
                            Medium Density
                          </div>
                        </div>

                        <div
                          style={{
                            position: "absolute",
                            top: "50%",
                            right: "18%",
                            backgroundColor: "#16a34a",
                            color: "white",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            border: "2px solid white",
                            zIndex: 20,
                          }}
                        >
                          <div style={{ fontWeight: "600" }}>Exit Area</div>
                          <div style={{ fontSize: "9px", opacity: 0.9 }}>
                            Low Density
                          </div>
                        </div>
                      </>
                    )}

                    {/* Teams overlay labels */}
                    {activeMapLayer === "Teams" && (
                      <>
                        <div className="absolute top-[25%] left-[20%] bg-blue-600 text-white px-2 py-1 rounded text-xs shadow-md flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          Medical Alpha
                        </div>
                        <div className="absolute top-[60%] left-[50%] bg-blue-600 text-white px-2 py-1 rounded text-xs shadow-md flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          Medical Bravo
                        </div>
                        <div className="absolute top-[15%] right-[25%] bg-purple-600 text-white px-2 py-1 rounded text-xs shadow-md flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Security Alpha
                        </div>
                        <div className="absolute bottom-[20%] left-[70%] bg-purple-600 text-white px-2 py-1 rounded text-xs shadow-md flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Security Bravo
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Incident Timeline */}
              <div
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                style={{ height: "500px" }}
              >
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-slate-900">Incident Timeline</h3>
                  <p className="text-slate-600 text-sm mt-1">
                    Real-time event monitoring
                  </p>

                  {/* Filter Controls */}
                  <div className="flex gap-1 mt-3 flex-wrap">
                    {["All", "Critical", "Warning", "Info", "Resolved"].map(
                      (filter) => (
                        <button
                          key={filter}
                          onClick={() => setActiveIncidentFilter(filter)}
                          className={`px-2.5 py-1 text-xs rounded transition-colors ${
                            activeIncidentFilter === filter
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {filter}
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div
                  className="overflow-y-auto"
                  style={{ height: "calc(100% - 145px)" }}
                >
                  <div className="p-4 space-y-3">
                    {filteredIncidents.map((incident, idx) => (
                      <button
                        key={idx}
                        onClick={() => openIncidentDrawer(incident)}
                        className="w-full text-left bg-slate-50 rounded-lg p-3 border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 ${
                              incident.color === "red"
                                ? "bg-red-500"
                                : incident.color === "amber"
                                ? "bg-amber-500"
                                : incident.color === "blue"
                                ? "bg-blue-500"
                                : "bg-green-500"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-900 text-sm">
                              {incident.type}
                            </p>
                            <p className="text-slate-600 text-xs mt-0.5">
                              {incident.location}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-500 text-xs">
                                {incident.time}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${
                                  incident.status === "Critical"
                                    ? "bg-red-100 text-red-700"
                                    : incident.status === "Warning"
                                    ? "bg-amber-100 text-amber-700"
                                    : incident.status === "In Progress"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {incident.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-slate-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  className="px-4 py-3 bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-2 justify-center"
                  onClick={() => setShowDispatchModal("medical")}
                >
                  <Heart className="w-4 h-4" />
                  Dispatch Medical
                </button>
                <button
                  className="px-4 py-3 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors flex items-center gap-2 justify-center"
                  onClick={() => setShowDispatchModal("security")}
                >
                  <Shield className="w-4 h-4" />
                  Dispatch Security
                </button>
                <button
                  className="px-4 py-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-2 justify-center"
                  onClick={() => setShowDispatchModal("gate")}
                >
                  <DoorOpen className="w-4 h-4" />
                  Open/Close Gate
                </button>
                <button
                  className="px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center gap-2 justify-center"
                  onClick={() => setShowDispatchModal("broadcast")}
                >
                  <Bell className="w-4 h-4" />
                  Broadcast Message
                </button>
                <button
                  className="px-4 py-3 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-2 justify-center"
                  onClick={() => setShowDispatchModal("reroute")}
                >
                  <Send className="w-4 h-4" />
                  Reroute Attendees
                </button>
                <button
                  className="px-4 py-3 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-2 justify-center"
                  onClick={() => onNavigate("live-monitoring")}
                >
                  <Activity className="w-4 h-4" />
                  Open Live Monitoring
                </button>
                <button
                  className="px-4 py-3 bg-rose-50 text-rose-700 rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-2 justify-center"
                  onClick={() => onNavigate("alerts-center")}
                >
                  <AlertOctagon className="w-4 h-4" />
                  Open Alerts Center
                </button>
                <button
                  className="px-4 py-3 bg-cyan-50 text-cyan-700 rounded-lg border border-cyan-200 hover:bg-cyan-100 transition-colors flex items-center gap-2 justify-center"
                  onClick={() => onNavigate("live-heatmap")}
                >
                  <Map className="w-4 h-4" />
                  Open Heatmap
                </button>
              </div>
            </div>

            {/* AI Safety Recommendations */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-slate-900 mb-4">AI Safety Recommendations</h3>
              <div className="space-y-3">
                {/* Recommendation Card 1 */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Left: Incident Summary */}
                    <div className="md:col-span-4 flex gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5" />
                      <div>
                        <p className="text-slate-900">Crowd Density Alert</p>
                        <p className="text-slate-600 text-sm mt-1">
                          Main Stage Area reaching capacity threshold
                        </p>
                      </div>
                    </div>

                    {/* Center: AI Suggested Action */}
                    <div className="md:col-span-5">
                      <p className="text-slate-700 text-sm mb-1">
                        Recommended Action
                      </p>
                      <p className="text-slate-900">
                        Reroute attendees via Gate C and close Gate A
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        Crowd density rising 18% in 4 min
                      </p>
                    </div>

                    {/* Right: Quick Action */}
                    <div className="md:col-span-3 flex flex-col gap-2">
                      <button className="px-3 py-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors text-sm flex items-center gap-2 justify-center">
                        <Send className="w-3 h-3" />
                        Reroute Now
                      </button>
                      <button className="text-blue-600 text-xs hover:text-blue-700 flex items-center gap-1 justify-center">
                        View Details <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recommendation Card 2 */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4 flex gap-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5" />
                      <div>
                        <p className="text-slate-900">Security Risk Detected</p>
                        <p className="text-slate-600 text-sm mt-1">
                          Unauthorized access detected near backstage
                        </p>
                      </div>
                    </div>

                    <div className="md:col-span-5">
                      <p className="text-slate-700 text-sm mb-1">
                        Recommended Action
                      </p>
                      <p className="text-slate-900">
                        Dispatch Security Team Bravo immediately
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        Security-risk score high • 2 incidents in zone
                      </p>
                    </div>

                    <div className="md:col-span-3 flex flex-col gap-2">
                      <button className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors text-sm flex items-center gap-2 justify-center">
                        <Shield className="w-3 h-3" />
                        Dispatch Security
                      </button>
                      <button className="text-blue-600 text-xs hover:text-blue-700 flex items-center gap-1 justify-center">
                        View Details <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-slate-600 text-xs">Medical Teams</p>
                    <p className="text-slate-900 text-lg">5 Active, 2 Idle</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <p className="text-slate-600 text-xs">Security Teams</p>
                    <p className="text-slate-900 text-lg">8 Active, 1 Idle</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-slate-600 text-xs">Operations Teams</p>
                    <p className="text-slate-900 text-lg">12 Active</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Gate Status & Attendance Analytics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gate Status Overview */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-slate-900 mb-4">Gate Status Overview</h3>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <DoorOpen className="w-5 h-5 text-slate-600" />
                  <p className="text-slate-900">1 Closed</p>
                  <span className="text-slate-400">•</span>
                  <p className="text-amber-700">2 Congested</p>
                  <span className="text-slate-400">•</span>
                  <p className="text-emerald-700">5 Normal</p>
                </div>
              </div>

              {/* Attendance Analytics */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-slate-900 mb-4">Attendance Analytics</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-slate-600 text-xs mb-1">Current</p>
                    <p className="text-slate-900 text-lg">9,485</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-slate-600 text-xs mb-1 flex items-center gap-1">
                      Inflow <TrendingUp className="w-3 h-3 text-emerald-600" />
                    </p>
                    <p className="text-emerald-700 text-lg">+142</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-slate-600 text-xs mb-1 flex items-center gap-1">
                      Outflow <TrendingDown className="w-3 h-3 text-blue-600" />
                    </p>
                    <p className="text-blue-700 text-lg">-87</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Weather Widget */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CloudRain className="w-6 h-6 text-blue-700" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-900">Weather Conditions</p>
                  <p className="text-slate-600 text_sm">
                    Partly cloudy • 72°F • 20% rain probability
                  </p>
                </div>
              </div>
            </div>

            {/* Operations Log */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button
                onClick={() => setShowOperationsLog(!showOperationsLog)}
                className="w-full px-6 py-4 flex justify_between items-center hover:bg-slate-50 transition-colors"
              >
                <h3 className="text-slate-900">Recent Operations Log</h3>
                <ChevronDown
                  className={`w-5 h-5 text-slate-600 transition-transform ${
                    showOperationsLog ? "rotate-180" : ""
                  }`}
                />
              </button>
              {showOperationsLog && (
                <div className="border-t border-slate-200 p-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-slate-900 text-sm">
                          Medical Team Alpha dispatched
                        </p>
                        <p className="text-slate-600 text-xs mt-1">
                          10:45 AM • Gate 3 - VIP Zone
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-slate-900 text-sm">
                          Gate A closed by AI recommendation
                        </p>
                        <p className="text-slate-600 text-xs mt-1">
                          10:42 AM • System Auto-Action
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-slate-900 text-sm">
                          Security Team Bravo dispatched
                        </p>
                        <p className="text-slate-600 text-xs mt-1">
                          10:30 AM • Backstage Area
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-slate-900 text-sm">
                          Broadcast message sent
                        </p>
                        <p className="text-slate-600 text-xs mt-1">
                          10:15 AM • All Zones
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // DRAFT/SCHEDULED EVENT VIEW - Workflow Steps
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify_between items-center mb-6">
                <div>
                  <h2 className="text-slate-900 text-2xl mb-2">
                    Event Setup Workflow
                  </h2>
                  <p className="text-slate-600">
                    Complete these steps to prepare your event
                  </p>
                </div>
                <button
                  onClick={() => onNavigate("workflow")}
                  className="px-6 py-3 bg-gradient_to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md"
                >
                  Continue Setup
                </button>
              </div>

              <div className="space-y-4">
                {workflowSteps.map((step, idx) => (
                  <div
                    key={step.id}
                    onClick={() => onNavigate(step.route)}
                    className={`p-5 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                      step.status === "completed"
                        ? "border-emerald-200 bg-emerald-50 hover:shadow-md"
                        : step.status === "current"
                        ? "border-blue-300 bg-blue-50 hover:shadow-md"
                        : "border-slate-200 bg-white hover:bg-slate-50 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Step Number/Icon */}
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify_center ${
                          step.status === "completed"
                            ? "bg-emerald-600 text-white"
                            : step.status === "current"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {step.status === "completed" ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <span className="text-lg">{step.id}</span>
                        )}
                      </div>

                      {/* Step Info */}
                      <div className="flex-1">
                        <h3 className="text-slate-900 mb-1">{step.title}</h3>
                        <p className="text-slate-600 text-sm">
                          {step.description}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {step.status === "completed" && (
                          <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-md text-sm border border-emerald-200">
                            Completed
                          </span>
                        )}
                        {step.status === "current" && (
                          <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm border border-blue-200">
                            In Progress
                          </span>
                        )}
                        {step.status === "pending" && (
                          <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md text-sm border border-slate-200">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Incident Drawer */}
      {showIncidentDrawer && selectedIncident && (
        <IncidentDrawer
          incident={selectedIncident}
          onClose={() => setShowIncidentDrawer(false)}
        />
      )}

      {/* Dispatch Modals */}
      {showDispatchModal === "medical" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient_to-r from-red-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify_between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl">Dispatch Medical Team</h2>
                </div>
                <button
                  onClick={() => setShowDispatchModal(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-slate-700 text-sm mb-2 block">
                  Select Team
                </label>
                <select className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline_none focus:ring-2 focus:ring-red-500">
                  <option>Medical Team Alpha</option>
                  <option>Medical Team Bravo</option>
                  <option>Medical Team Charlie</option>
                </select>
              </div>
              <div>
                <label className="text-slate-700 text-sm mb-2 block">
                  Location
                </label>
                <select className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option>Gate 3 - VIP Zone</option>
                  <option>Main Stage Area</option>
                  <option>Food Court</option>
                  <option>Backstage Area</option>
                </select>
              </div>
              <div>
                <label className="text-slate-700 text-sm mb-2 block">
                  Priority
                </label>
                <select className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <div>
                <label className="text-slate-700 text-sm mb-2 block">
                  Notes
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="Add dispatch notes..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDispatchModal(null)}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert("Medical team dispatched!");
                    setShowDispatchModal(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all shadow-lg"
                >
                  Dispatch Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDispatchModal === "security" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify_center p-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify_between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl">Dispatch Security Team</h2>
                </div>
                <button
                  onClick={() => setShowDispatchModal(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-slate-700 text-sm mb-2 block">
                  Select Team
                </label>
                <select className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option>Security Team Alpha</option>
                  <option>Security Team Bravo</option>
                  <option>Security Team Charlie</option>
                </select>
              </div>
              <div>
                <label className="text-slate-700 text-sm mb-2 block">
                  Location
                </label>
                <select className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option>Backstage Area</option>
                  <option>Main Stage Area</option>
                  <option>VIP Zone</option>
                  <option>Parking Lot</option>
                </select>
              </div>
              <div>
                <label className="text-slate-700 text-sm mb-2 block">
                  Threat Level
                </label>
                <select className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <div>
                <label className="text-slate-700 text-sm mb-2 block">
                  Instructions
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Add security instructions..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDispatchModal(null)}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert("Security team dispatched!");
                    setShowDispatchModal(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient_to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
                >
                  Dispatch Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDispatchModal === "broadcast" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify_between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl">Broadcast Message</h2>
                </div>
                <button
                  onClick={() => setShowDispatchModal(null)}
                  className="p-2 hover:bg_white/20 rounded-lg transition-all text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-slate-700 text-sm mb-2 block">
                  Target Zones
                </label>
                <select className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>All Zones</option>
                  <option>Main Stage Area</option>
                  <option>VIP Zone</option>
                  <option>Food Court</option>
                </select>
              </div>
              <div>
                <label className="text-slate-700 text-sm mb-2 block">
                  Message Type
                </label>
                <select className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>General Announcement</option>
                  <option>Safety Alert</option>
                  <option>Emergency</option>
                  <option>Information</option>
                </select>
              </div>
              <div>
                <label className="text-slate-700 text-sm mb-2 block">
                  Message
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                  placeholder="Enter broadcast message..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDispatchModal(null)}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert("Message broadcasted!");
                    setShowDispatchModal(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg"
                >
                  Broadcast
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDashboard;
