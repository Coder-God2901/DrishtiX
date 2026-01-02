import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Flame,
  Heart,
  Shield,
  Users,
  MapPin,
  Clock,
  Radio,
  Bell,
  Activity,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Navigation,
  Phone,
  Send,
  X,
  Filter,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { IncidentDrawer } from "../shared/IncidentDrawer";
import { incidentService, Incident as APIIncident } from "../../services/incident.service";
import { wsService } from "../../services/websocket.service";

// Incident Types
type IncidentType =
  | "Fire"
  | "Medical Emergency"
  | "Crowd Congestion"
  | "Security Threat"
  | "Equipment Failure"
  | "Lost Person"
  | "Violence"
  | "Structural Damage";

type SeverityLevel = "Critical" | "High" | "Medium" | "Low";

type IncidentStatus =
  | "New"
  | "Action Taken"
  | "Teams En Route"
  | "In Progress"
  | "Resolved";

interface ActionLog {
  id: string;
  timestamp: Date;
  action: string;
  performedBy: string;
}

// Map API types to UI types for compatibility
interface Incident {
  id: string;
  type: string; // Flexible to handle both API and local types
  severity: string;
  zone?: string;
  gate?: string;
  location: { lat: number; lng: number };
  timestamp: Date | string;
  status: string;
  description: string;
  aiAnalysis?: string;
  aiSummary?: string; // From API
  prediction?: string;
  confidence?: number; // From API
  actionsTaken: string[];
  activityLog: ActionLog[];
  color: string;
  eventId?: string;
  coordinates?: { lat: number; lng: number }; // From API
  assignedTo?: string[];
  responders?: any[];
}

interface AlertsIncidentCenterProps {
  onBack: () => void;
  eventId?: string;
}

// AI Recommendation Engine (Rule-based)
const getAIRecommendations = (incident: Incident): string[] => {
  const recommendations: string[] = [];

  switch (incident.type) {
    case "Fire":
      recommendations.push(
        "Dispatch Security",
        "Dispatch Medical",
        "Call Fire Brigade",
        "Evacuate Zone",
        "Close Nearby Gates",
        "Broadcast Emergency Alert"
      );
      break;
    case "Medical Emergency":
      recommendations.push(
        "Dispatch Medical Team",
        "Clear Access Route",
        "Notify Nearby Volunteers",
        "Call Ambulance",
        "Dispatch Security"
      );
      break;
    case "Crowd Congestion":
      recommendations.push(
        "Reroute Attendees",
        "Open Alternate Gate",
        "Dispatch Crowd Control Team",
        "Broadcast Guidance Message",
        "Close Entry to Congested Zone"
      );
      break;
    case "Security Threat":
    case "Violence":
      recommendations.push(
        "Dispatch Security",
        "Alert Law Enforcement",
        "Evacuate Immediate Area",
        "Close Nearby Gates",
        "Activate Emergency Protocol"
      );
      break;
    case "Equipment Failure":
      recommendations.push(
        "Dispatch Technical Team",
        "Notify Maintenance",
        "Setup Backup System",
        "Inform Affected Attendees"
      );
      break;
    case "Lost Person":
      recommendations.push(
        "Notify Volunteers",
        "Broadcast Description",
        "Check Last Known Location",
        "Contact Family/Guardian"
      );
      break;
    case "Structural Damage":
      recommendations.push(
        "Evacuate Zone",
        "Dispatch Structural Engineer",
        "Alert Emergency Services",
        "Close Affected Area",
        "Dispatch Security"
      );
      break;
    default:
      recommendations.push("Dispatch Security", "Assess Situation");
  }

  return recommendations;
};

// Convert API incident to UI incident format
const convertAPIIncident = (apiIncident: APIIncident): Incident => {
  // Map severity
  const severityMap: Record<string, string> = {
    'CRITICAL': 'Critical',
    'HIGH': 'High',
    'MEDIUM': 'Medium',
    'LOW': 'Low'
  };

  // Map status
  const statusMap: Record<string, string> = {
    'ACTIVE': 'New',
    'IN_PROGRESS': 'In Progress',
    'RESOLVED': 'Resolved',
    'CLOSED': 'Resolved'
  };

  // Get color based on severity
  const getColorBySeverity = (severity: string): string => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return 'red';
      case 'HIGH': return 'amber';
      case 'MEDIUM': return 'yellow';
      case 'LOW': return 'blue';
      default: return 'gray';
    }
  };

  return {
    id: apiIncident.id,
    type: apiIncident.type,
    severity: severityMap[apiIncident.severity] || apiIncident.severity,
    zone: apiIncident.location,
    location: apiIncident.coordinates || { lat: 0, lng: 0 },
    timestamp: typeof apiIncident.createdAt === 'string' 
      ? new Date(apiIncident.createdAt) 
      : apiIncident.createdAt || new Date(),
    status: statusMap[apiIncident.status] || apiIncident.status,
    description: apiIncident.description,
    aiAnalysis: apiIncident.aiSummary || '',
    prediction: apiIncident.confidence ? `${apiIncident.confidence}% confidence` : '',
    actionsTaken: apiIncident.responders?.map(r => `Assigned ${r}`) || [],
    activityLog: [
      {
        id: '1',
        timestamp: typeof apiIncident.createdAt === 'string' 
          ? new Date(apiIncident.createdAt) 
          : apiIncident.createdAt || new Date(),
        action: 'Incident created',
        performedBy: apiIncident.detectedBy || apiIncident.reportedBy || 'System'
      }
    ],
    color: getColorBySeverity(apiIncident.severity),
    eventId: apiIncident.eventId,
    assignedTo: apiIncident.assignedTo,
    responders: apiIncident.responders
  };
};

export function AlertsIncidentCenter({ onBack, eventId = 'default-event' }: AlertsIncidentCenterProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>("All");
  const [showResolved, setShowResolved] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    incident: Incident;
    action: string;
  } | null>(null);

  // Load incidents from backend
  useEffect(() => {
    const loadIncidents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await incidentService.getEventIncidents(eventId);
        if (response.success && response.data) {
          const convertedIncidents = response.data.map(convertAPIIncident);
          setIncidents(convertedIncidents);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load incidents');
        console.error('Error loading incidents:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadIncidents();
  }, [eventId]);

  // Subscribe to real-time incident updates via WebSocket
  useEffect(() => {
    const unsubscribe = incidentService.subscribeToIncidents(eventId, (apiIncident) => {
      const newIncident = convertAPIIncident(apiIncident);
      setIncidents(prev => {
        const existingIndex = prev.findIndex(inc => inc.id === newIncident.id);
        if (existingIndex >= 0) {
          // Update existing incident
          const updated = [...prev];
          updated[existingIndex] = newIncident;
          return updated;
        } else {
          // Add new incident
          return [newIncident, ...prev];
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, [eventId]);

  // Sort incidents by severity
  const sortedIncidents = [...incidents].sort((a, b) => {
    const severityOrder = {
      Critical: 0,
      High: 1,
      Medium: 2,
      Low: 3,
      Resolved: 4,
    };
    const statusOrder = {
      New: 0,
      "Action Taken": 1,
      "Teams En Route": 2,
      "In Progress": 3,
      Resolved: 4,
    };

    if (a.status === "Resolved" && b.status !== "Resolved") return 1;
    if (a.status !== "Resolved" && b.status === "Resolved") return -1;

    if (a.severity !== b.severity) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }

    return statusOrder[a.status] - statusOrder[b.status];
  });

  // Filter incidents
  const filteredIncidents = sortedIncidents.filter((incident) => {
    if (!showResolved && incident.status === "Resolved") return false;
    if (filterSeverity === "All") return true;
    if (filterSeverity === "Resolved") return incident.status === "Resolved";
    return incident.severity === filterSeverity;
  });

  const activeIncidents = incidents.filter((inc) => inc.status !== "Resolved");
  const resolvedIncidents = incidents.filter(
    (inc) => inc.status === "Resolved"
  );

  // Handle quick action with confirmation
  const handleQuickAction = (incident: Incident, action: string) => {
    setConfirmAction({ incident, action });
  };

  const confirmQuickAction = () => {
    if (!confirmAction) return;

    const { incident, action } = confirmAction;

    // Update incident
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === incident.id) {
          const updatedInc = { ...inc };

          // Add action to taken actions
          if (!updatedInc.actionsTaken.includes(action)) {
            updatedInc.actionsTaken.push(action);
          }

          // Update status
          if (updatedInc.status === "New") {
            updatedInc.status = "Action Taken";
          }

          // Add to activity log
          updatedInc.activityLog.push({
            id: `log-${Date.now()}`,
            timestamp: new Date(),
            action: action,
            performedBy: "Organizer - You",
          });

          return updatedInc;
        }
        return inc;
      })
    );

    // Show toast notification (simplified)
    setTimeout(() => {
      // Simulate status progression
      simulateStatusUpdate(incident.id);
    }, 3000);

    setConfirmAction(null);
  };

  // Simulate real-time status updates
  const simulateStatusUpdate = (incidentId: string) => {
    setTimeout(() => {
      setIncidents((prev) =>
        prev.map((inc) => {
          if (inc.id === incidentId) {
            const statusProgression: Record<IncidentStatus, IncidentStatus> = {
              New: "Action Taken",
              "Action Taken": "Teams En Route",
              "Teams En Route": "In Progress",
              "In Progress": "Resolved",
              Resolved: "Resolved",
            };

            const newStatus = statusProgression[inc.status];

            if (newStatus !== inc.status) {
              inc.activityLog.push({
                id: `log-${Date.now()}`,
                timestamp: new Date(),
                action: `Status updated to ${newStatus}`,
                performedBy: "System",
              });

              if (newStatus === "Resolved") {
                inc.color = "green";
              }
            }

            return { ...inc, status: newStatus };
          }
          return inc;
        })
      );
    }, 5000);
  };

  // Get severity badge color
  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500";
      case "High":
        return "bg-orange-500";
      case "Medium":
        return "bg-yellow-500";
      case "Low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get status badge style
  const getStatusStyle = (status: IncidentStatus) => {
    switch (status) {
      case "New":
        return "bg-red-50 text-red-700 border-red-200";
      case "Action Taken":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Teams En Route":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "In Progress":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Resolved":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // Handle marker click on map
  const handleMarkerClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-7 h-7 text-red-500" />
                Alerts & Incident Center
              </h1>
              <p className="text-slate-600 text-sm mt-0.5">
                Real-time incident monitoring and emergency response
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-700 font-semibold">
                {activeIncidents.length} Active Incidents
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-green-700 font-semibold">
                {resolvedIncidents.length} Resolved
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Vertical Layout */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 1️⃣ Incident Map Section (FULL WIDTH TOP) */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Incident Map
              </h2>
              <p className="text-slate-600 text-sm mt-0.5">
                Click on markers to view incident details
              </p>
            </div>

            {/* Map Canvas */}
            <div className="relative bg-slate-100 h-[600px]">
              {/* Simplified venue map background */}
              <svg className="w-full h-full" viewBox="0 0 800 600">
                {/* Venue boundaries */}
                <rect
                  x="50"
                  y="50"
                  width="700"
                  height="500"
                  fill="#f1f5f9"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  rx="8"
                />

                {/* Zones */}
                <rect
                  x="100"
                  y="100"
                  width="200"
                  height="200"
                  fill="#e0f2fe"
                  stroke="#0284c7"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                />
                <text
                  x="200"
                  y="140"
                  textAnchor="middle"
                  className="fill-slate-600 text-xs"
                >
                  Zone A - Main Stage
                </text>

                <rect
                  x="350"
                  y="100"
                  width="200"
                  height="200"
                  fill="#dcfce7"
                  stroke="#16a34a"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                />
                <text
                  x="450"
                  y="140"
                  textAnchor="middle"
                  className="fill-slate-600 text-xs"
                >
                  Zone B - East Entrance
                </text>

                <rect
                  x="100"
                  y="320"
                  width="200"
                  height="200"
                  fill="#fef3c7"
                  stroke="#ca8a04"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                />
                <text
                  x="200"
                  y="360"
                  textAnchor="middle"
                  className="fill-slate-600 text-xs"
                >
                  Zone C - Food Court
                </text>

                <rect
                  x="350"
                  y="320"
                  width="200"
                  height="200"
                  fill="#f3e8ff"
                  stroke="#9333ea"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                />
                <text
                  x="450"
                  y="360"
                  textAnchor="middle"
                  className="fill-slate-600 text-xs"
                >
                  Zone D - Parking Area
                </text>

                {/* Gates */}
                <circle cx="150" cy="50" r="8" fill="#6366f1" />
                <text
                  x="150"
                  y="40"
                  textAnchor="middle"
                  className="fill-slate-700 text-xs font-semibold"
                >
                  Gate 1
                </text>

                <circle cx="400" cy="50" r="8" fill="#6366f1" />
                <text
                  x="400"
                  y="40"
                  textAnchor="middle"
                  className="fill-slate-700 text-xs font-semibold"
                >
                  Gate 3
                </text>

                <circle cx="650" cy="300" r="8" fill="#6366f1" />
                <text
                  x="650"
                  y="290"
                  textAnchor="middle"
                  className="fill-slate-700 text-xs font-semibold"
                >
                  Gate 5
                </text>

                {/* Incident Markers */}
                {incidents.map((incident, index) => {
                  const x = 100 + (index % 3) * 220 + Math.random() * 50;
                  const y =
                    150 + Math.floor(index / 3) * 200 + Math.random() * 80;
                  const markerColor =
                    incident.severity === "Critical"
                      ? "#ef4444"
                      : incident.severity === "High"
                      ? "#f97316"
                      : incident.severity === "Medium"
                      ? "#eab308"
                      : incident.status === "Resolved"
                      ? "#22c55e"
                      : "#3b82f6";

                  return (
                    <g
                      key={incident.id}
                      onClick={() => handleMarkerClick(incident)}
                      className="cursor-pointer"
                    >
                      {/* Pulse animation for active incidents */}
                      {incident.status !== "Resolved" && (
                        <circle
                          cx={x}
                          cy={y}
                          r="20"
                          fill={markerColor}
                          opacity="0.3"
                          className="animate-ping"
                        />
                      )}
                      {/* Marker */}
                      <circle
                        cx={x}
                        cy={y}
                        r="12"
                        fill={markerColor}
                        stroke="white"
                        strokeWidth="2"
                      />
                      {/* Icon based on incident type */}
                      {incident.type === "Fire" && (
                        <text
                          x={x}
                          y={y + 4}
                          textAnchor="middle"
                          className="fill-white text-xs font-bold"
                        >
                          🔥
                        </text>
                      )}
                      {incident.type === "Medical Emergency" && (
                        <text
                          x={x}
                          y={y + 4}
                          textAnchor="middle"
                          className="fill-white text-xs font-bold"
                        >
                          ❤️
                        </text>
                      )}
                      {incident.type === "Crowd Congestion" && (
                        <text
                          x={x}
                          y={y + 4}
                          textAnchor="middle"
                          className="fill-white text-xs font-bold"
                        >
                          👥
                        </text>
                      )}
                      {(incident.type === "Security Threat" ||
                        incident.type === "Violence") && (
                        <text
                          x={x}
                          y={y + 4}
                          textAnchor="middle"
                          className="fill-white text-xs font-bold"
                        >
                          🛡️
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-slate-200 p-3">
                <h4 className="text-xs font-bold text-slate-900 mb-2">
                  Severity Levels
                </h4>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-xs text-slate-700">Critical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-xs text-slate-700">High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-xs text-slate-700">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs text-slate-700">Low</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs text-slate-700">Resolved</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2️⃣ Incident Controls Row */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Severity Filter */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4 text-slate-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Filter by Severity
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["All", "Critical", "High", "Medium", "Low", "Resolved"].map(
                    (filter) => (
                      <button
                        key={filter}
                        onClick={() => setFilterSeverity(filter)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          filterSeverity === filter
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {filter}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Sort Dropdown */}
              <div className="md:w-48">
                <label className="text-sm font-bold text-slate-900 block mb-2">
                  Sort By
                </label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Priority (default)</option>
                  <option>Latest first</option>
                  <option>Oldest first</option>
                </select>
              </div>

              {/* Show Resolved Toggle */}
              <div className="md:w-48">
                <label className="text-sm font-bold text-slate-900 block mb-2">
                  Resolved Incidents
                </label>
                <button
                  onClick={() => setShowResolved(!showResolved)}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    showResolved
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {showResolved ? "✓ Showing Resolved" : "Show Resolved"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3️⃣ Incident Cards Grid */}
        <div>
          {filteredIncidents.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                No incidents in this category
              </h3>
              <p className="text-slate-600">
                {filterSeverity === "All"
                  ? "All clear! No active incidents at this time."
                  : `No ${filterSeverity.toLowerCase()} severity incidents found.`}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredIncidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                onViewDetails={() => {
                  setSelectedIncident(incident);
                  setDrawerOpen(true);
                }}
                onQuickAction={handleQuickAction}
                getSeverityColor={getSeverityColor}
                getStatusStyle={getStatusStyle}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Incident Drawer */}
      {drawerOpen && selectedIncident && (
        <IncidentDrawer
          incident={selectedIncident}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setConfirmAction(null)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl border-2 border-slate-200 p-6 z-50 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Confirm Action
                </h3>
                <p className="text-slate-600 text-sm">
                  This action will be recorded
                </p>
              </div>
            </div>

            <p className="text-slate-700 mb-6">
              Are you sure you want to <strong>{confirmAction.action}</strong>{" "}
              for incident{" "}
              <strong>
                {confirmAction.incident.type} at {confirmAction.incident.zone}
              </strong>
              ?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmQuickAction}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Incident Card Component
function IncidentCard({
  incident,
  onViewDetails,
  onQuickAction,
  getSeverityColor,
  getStatusStyle,
}: {
  incident: Incident;
  onViewDetails: () => void;
  onQuickAction: (incident: Incident, action: string) => void;
  getSeverityColor: (severity: SeverityLevel) => string;
  getStatusStyle: (status: IncidentStatus) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const recommendations = getAIRecommendations(incident);
  const availableActions = recommendations.filter(
    (action) => !incident.actionsTaken.includes(action)
  );

  const isResolved = incident.status === "Resolved";
  const isCritical = incident.severity === "Critical";

  const handleActionClick = (action: string) => {
    setLoadingAction(action);
    // Simulate async behavior
    setTimeout(() => {
      onQuickAction(incident, action);
      setLoadingAction(null);
    }, 800);
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-lg border-2 transition-all hover:shadow-xl ${
        isCritical && !isResolved
          ? "border-red-500 ring-2 ring-red-200"
          : isResolved
          ? "border-green-300 opacity-75"
          : "border-slate-200"
      }`}
    >
      {/* 🔹 Card Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {/* Incident Type Icon */}
              {incident.type === "Fire" && (
                <Flame className="w-5 h-5 text-red-600" />
              )}
              {incident.type === "Medical Emergency" && (
                <Heart className="w-5 h-5 text-red-600" />
              )}
              {incident.type === "Crowd Congestion" && (
                <Users className="w-5 h-5 text-amber-600" />
              )}
              {(incident.type === "Security Threat" ||
                incident.type === "Violence") && (
                <Shield className="w-5 h-5 text-orange-600" />
              )}
              {incident.type === "Lost Person" && (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              )}
              
              <h3 className="font-bold text-lg text-slate-900">
                {incident.type}
              </h3>
            </div>

            {/* Zone & Gate */}
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{incident.zone}</span>
              </div>
              {incident.gate && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                  {incident.gate}
                </span>
              )}
            </div>
          </div>

          {/* Severity Badge */}
          <div>
            <span
              className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-bold shadow-sm ${
                incident.severity === "Critical"
                  ? "bg-red-500 text-white"
                  : incident.severity === "High"
                  ? "bg-orange-500 text-white"
                  : incident.severity === "Medium"
                  ? "bg-yellow-500 text-white"
                  : "bg-blue-500 text-white"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              {incident.severity}
            </span>
          </div>
        </div>

        {/* Timestamp & Status */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date(incident.timestamp).toLocaleString()}</span>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full border font-semibold ${getStatusStyle(
              incident.status
            )}`}
          >
            {incident.status}
          </span>
        </div>
      </div>

      {/* 🔹 Incident Summary */}
      <div className="px-6 py-4 border-b border-slate-200">
        <p className="text-slate-700 text-sm leading-relaxed">
          {incident.description}
        </p>
        
        {/* AI Analysis (for critical incidents) */}
        {isCritical && !isResolved && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-red-900 mb-1">
                  AI Analysis
                </h4>
                <p className="text-xs text-red-700">{incident.aiAnalysis}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🔹 AI Recommended Actions */}
      {!isResolved && availableActions.length > 0 && (
        <div className="px-6 py-4 border-b border-slate-200 bg-blue-50/30">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-900">
              AI Recommended Actions
            </h4>
            <span className="text-xs text-slate-500">
              ({availableActions.length} available)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableActions.slice(0, expanded ? undefined : 4).map((action) => (
              <button
                key={action}
                onClick={() => handleActionClick(action)}
                disabled={loadingAction === action}
                className={`px-4 py-2.5 rounded-lg border-2 font-semibold text-sm text-left flex items-center gap-2 transition-all ${
                  loadingAction === action
                    ? "bg-blue-100 border-blue-300 text-blue-600 cursor-wait"
                    : "bg-white border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-500 hover:shadow-md"
                }`}
              >
                {loadingAction === action ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {action.includes("Dispatch") && <Send className="w-4 h-4" />}
                    {action.includes("Call") && <Phone className="w-4 h-4" />}
                    {action.includes("Evacuate") && (
                      <Navigation className="w-4 h-4" />
                    )}
                    {action.includes("Alert") && <Bell className="w-4 h-4" />}
                    {action.includes("Broadcast") && <Radio className="w-4 h-4" />}
                    {action.includes("Reroute") && (
                      <Navigation className="w-4 h-4" />
                    )}
                    {action}
                  </>
                )}
              </button>
            ))}
          </div>

          {availableActions.length > 4 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1"
            >
              {expanded ? (
                <>
                  Show Less <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Show {availableActions.length - 4} More Actions{" "}
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* 🔹 Actions Taken (Feedback) */}
      {incident.actionsTaken.length > 0 && (
        <div className="px-6 py-4 border-b border-slate-200">
          <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Actions Taken
          </h4>
          <div className="flex flex-wrap gap-2">
            {incident.actionsTaken.map((action, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-100 text-green-700 border border-green-300 rounded-lg font-semibold"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {action}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 🔹 Card Footer */}
      <div className="px-6 py-4">
        <button
          onClick={onViewDetails}
          className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
        >
          <Info className="w-4 h-4" />
          View Full Details & Activity Log
        </button>
      </div>
    </div>
  );
}
