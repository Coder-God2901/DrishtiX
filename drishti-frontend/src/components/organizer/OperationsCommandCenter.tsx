import {
  X,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Radio,
  Activity,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  ChevronRight,
  Search,
  Filter,
  Shield,
  Zap,
} from "lucide-react";
import { IndianMap, INDIAN_VENUES } from "../shared/IndianMap";
import {
  useIncidents,
  useIncidentStatistics,
} from "../../services/incidentContext";

interface OperationsCommandCenterProps {
  onClose: () => void;
}

export function OperationsCommandCenter({
  onClose,
}: OperationsCommandCenterProps) {
  // Use incident context to get real-time incidents
  const { incidents: allIncidents } = useIncidents();
  const incidentStats = useIncidentStatistics();

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
    responder: incident.responder || "Unassigned",
    eta: incident.eta || "Calculating...",
  }));

  const analytics = [
    {
      label: "Total Attendees",
      value: "12,847",
      change: "+342 last hour",
      trend: "up",
      icon: Users,
    },
    {
      label: "Safety Score",
      value: "94%",
      change: "+2% vs target",
      trend: "up",
      icon: Shield,
    },
    {
      label: "Incident Resolution",
      value: "2.8 min",
      change: "-0.5 min avg",
      trend: "down",
      icon: Clock,
    },
    {
      label: "Active Alerts",
      value: String(incidentStats.active),
      change: `${incidentStats.resolved} resolved today`,
      trend: "stable",
      icon: AlertTriangle,
    },
  ];

  const recentActivity = [
    {
      time: "10:47 AM",
      event: "Emergency medical team dispatched to VIP Zone",
      type: "critical",
    },
    {
      time: "10:45 AM",
      event: "Crowd density alert triggered in Main Stage Area",
      type: "warning",
    },
    {
      time: "10:42 AM",
      event: "Lost child successfully reunited with parents",
      type: "success",
    },
    {
      time: "10:40 AM",
      event: "Parking lot C redirecting traffic to Lot D",
      type: "info",
    },
    {
      time: "10:38 AM",
      event: "Technical team addressing sound system issue",
      type: "info",
    },
    {
      time: "10:35 AM",
      event: "Weather monitoring: light rain expected in 30 mins",
      type: "warning",
    },
    {
      time: "10:32 AM",
      event: "Security sweep completed in backstage area",
      type: "success",
    },
    {
      time: "10:30 AM",
      event: "First aid station restocked and ready",
      type: "success",
    },
  ];

  const teams = [
    {
      name: "Alpha Team",
      leader: "John Anderson",
      status: "Active",
      location: "Gate 3 - VIP Zone",
      members: 8,
      color: "red",
      task: "Medical Emergency Response",
      lastUpdate: "2 mins ago",
      efficiency: 98,
    },
    {
      name: "Bravo Team",
      leader: "Sarah Mitchell",
      status: "Standby",
      location: "Main Stage Area",
      members: 6,
      color: "blue",
      task: "Crowd Management",
      lastUpdate: "5 mins ago",
      efficiency: 95,
    },
    {
      name: "Charlie Team",
      leader: "Mike Rodriguez",
      status: "Active",
      location: "Food Court Zone",
      members: 5,
      color: "green",
      task: "General Patrol",
      lastUpdate: "1 min ago",
      efficiency: 92,
    },
    {
      name: "Delta Team",
      leader: "Emma Thompson",
      status: "En Route",
      location: "Parking Lot C",
      members: 7,
      color: "purple",
      task: "Traffic Control",
      lastUpdate: "3 mins ago",
      efficiency: 90,
    },
  ];

  const venueAreas = [
    {
      name: "VIP LOUNGE",
      capacity: "250/300",
      percentage: 83,
      status: "High",
      color: "amber",
      trend: "stable",
      peakTime: "8:00 PM",
    },
    {
      name: "MAIN STAGE",
      capacity: "4,800/5,000",
      percentage: 96,
      status: "Critical",
      color: "red",
      trend: "rising",
      peakTime: "9:00 PM",
    },
    {
      name: "FOOD COURT",
      capacity: "890/1,500",
      percentage: 59,
      status: "Normal",
      color: "green",
      trend: "stable",
      peakTime: "7:30 PM",
    },
    {
      name: "PARKING LOT A",
      capacity: "180/200",
      percentage: 90,
      status: "High",
      color: "amber",
      trend: "stable",
      peakTime: "6:45 PM",
    },
    {
      name: "RESTROOM AREA 1",
      capacity: "45/50",
      percentage: 90,
      status: "High",
      color: "amber",
      trend: "fluctuating",
      peakTime: "Ongoing",
    },
    {
      name: "MERCH ZONE",
      capacity: "320/500",
      percentage: 64,
      status: "Normal",
      color: "green",
      trend: "rising",
      peakTime: "8:30 PM",
    },
    {
      name: "SECTION A SEATS",
      capacity: "1,200/1,200",
      percentage: 100,
      status: "Full",
      color: "red",
      trend: "stable",
      peakTime: "Now",
    },
    {
      name: "EMERGENCY EXIT 2",
      capacity: "Clear",
      percentage: 100,
      status: "Normal",
      color: "green",
      trend: "monitored",
      peakTime: "N/A",
    },
    {
      name: "BAR AREA",
      capacity: "150/200",
      percentage: 75,
      status: "Normal",
      color: "green",
      trend: "rising",
      peakTime: "9:30 PM",
    },
    {
      name: "BACKSTAGE ZONE",
      capacity: "40/50",
      percentage: 80,
      status: "Normal",
      color: "green",
      trend: "stable",
      peakTime: "Now",
    },
    {
      name: "MEDIA CENTER",
      capacity: "25/30",
      percentage: 83,
      status: "High",
      color: "amber",
      trend: "stable",
      peakTime: "Now",
    },
    {
      name: "FIRST AID STATION",
      capacity: "2/10",
      percentage: 20,
      status: "Normal",
      color: "green",
      trend: "ready",
      peakTime: "N/A",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto">
      <div className="min-h-screen w-full py-8 px-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-7xl mx-auto overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Radio className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white text-2xl">
                      Operations Command Center
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                      Live monitoring with GPS tracking and team deployment
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Bar */}
            <div className="mt-6 grid grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2 text-white mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm">Active Incidents</span>
                </div>
                <p className="text-white text-2xl">3</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2 text-white mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Teams Deployed</span>
                </div>
                <p className="text-white text-2xl">4</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2 text-white mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Zones Monitored</span>
                </div>
                <p className="text-white text-2xl">12</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2 text-white mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Avg Response Time</span>
                </div>
                <p className="text-white text-2xl">2.3m</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
            <div className="space-y-6">
              {/* Analytics Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {analytics.map((metric, index) => {
                  const Icon = metric.icon;
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-10 h-10 rounded-lg ${
                            metric.trend === "up"
                              ? "bg-green-100"
                              : metric.trend === "down"
                              ? "bg-red-100"
                              : "bg-blue-100"
                          } flex items-center justify-center`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              metric.trend === "up"
                                ? "text-green-600"
                                : metric.trend === "down"
                                ? "text-red-600"
                                : "text-blue-600"
                            }`}
                          />
                        </div>
                        {metric.trend === "up" && (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        )}
                        {metric.trend === "down" && (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-slate-600 text-sm mb-1">
                        {metric.label}
                      </p>
                      <p className="text-slate-900 text-2xl mb-1">
                        {metric.value}
                      </p>
                      <p className="text-slate-500 text-xs">{metric.change}</p>
                    </div>
                  );
                })}
              </div>

              {/* Recent Activity Feed */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-slate-900 flex items-center gap-2">
                      Recent Activity
                      <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
                    </h3>
                    <p className="text-slate-600 text-sm mt-1">
                      Live event stream from all systems
                    </p>
                  </div>
                  <button className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1">
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-all"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          activity.type === "critical"
                            ? "bg-red-500 animate-pulse"
                            : activity.type === "warning"
                            ? "bg-amber-500"
                            : activity.type === "success"
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-slate-700 text-sm">
                          {activity.event}
                        </p>
                        <p className="text-slate-500 text-xs mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map and Incident Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live Venue Map */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <div>
                      <h3 className="text-slate-900 flex items-center gap-2">
                        Live Venue Map
                        <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                      </h3>
                      <p className="text-slate-600 text-sm mt-1">
                        Real-time team positions and incident markers
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all duration-200">
                        <Search className="w-4 h-4 text-slate-600" />
                      </button>
                      <button className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all duration-200">
                        <Filter className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <IndianMap
                      location={INDIAN_VENUES.delhi}
                      height="384px"
                      showControls={true}
                      markers={[
                        {
                          lat: INDIAN_VENUES.delhi.lat + 0.002,
                          lng: INDIAN_VENUES.delhi.lng + 0.003,
                          label: "Critical Incident - Medical",
                          color: "red",
                        },
                        {
                          lat: INDIAN_VENUES.delhi.lat - 0.001,
                          lng: INDIAN_VENUES.delhi.lng + 0.002,
                          label: "Security Team Alpha",
                          color: "blue",
                        },
                        {
                          lat: INDIAN_VENUES.delhi.lat + 0.003,
                          lng: INDIAN_VENUES.delhi.lng - 0.002,
                          label: "Medical Team Bravo",
                          color: "green",
                        },
                        {
                          lat: INDIAN_VENUES.delhi.lat - 0.002,
                          lng: INDIAN_VENUES.delhi.lng - 0.001,
                          label: "Warning - Crowd Buildup",
                          color: "red",
                        },
                      ]}
                    />
                    {/* Map Overlays */}
                    <div className="absolute top-20 left-4 flex flex-col gap-2 z-20">
                      <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-slate-700">3 Critical</span>
                      </div>
                      <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
                        <div className="w-3 h-3 bg-amber-500 rounded-full" />
                        <span className="text-slate-700">2 Warnings</span>
                      </div>
                      <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full" />
                        <span className="text-slate-700">4 Teams Active</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Incident Timeline */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="p-4 border-b border-slate-200">
                    <h3 className="text-slate-900">Incident Timeline</h3>
                    <p className="text-slate-600 text-sm mt-1">
                      Real-time incident updates
                    </p>
                  </div>
                  <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    {incidents.map((incident, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-l-4 ${
                          incident.color === "red"
                            ? "bg-red-50 border-red-500"
                            : incident.color === "amber"
                            ? "bg-amber-50 border-amber-500"
                            : incident.color === "blue"
                            ? "bg-blue-50 border-blue-500"
                            : "bg-green-50 border-green-500"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {incident.color === "red" && (
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            )}
                            {incident.color === "amber" && (
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                            )}
                            {incident.color === "blue" && (
                              <Activity className="w-4 h-4 text-blue-600" />
                            )}
                            {incident.color === "green" && (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                            <span
                              className={`text-sm ${
                                incident.color === "red"
                                  ? "text-red-900"
                                  : incident.color === "amber"
                                  ? "text-amber-900"
                                  : incident.color === "blue"
                                  ? "text-blue-900"
                                  : "text-green-900"
                              }`}
                            >
                              {incident.type}
                            </span>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              incident.color === "red"
                                ? "bg-red-200 text-red-800"
                                : incident.color === "amber"
                                ? "bg-amber-200 text-amber-800"
                                : incident.color === "blue"
                                ? "bg-blue-200 text-blue-800"
                                : "bg-green-200 text-green-800"
                            }`}
                          >
                            {incident.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 text-xs mb-1">
                          <MapPin className="w-3 h-3" />
                          <span>{incident.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                          <Clock className="w-3 h-3" />
                          <span>{incident.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Team Deployment Grid */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="mb-4">
                  <h3 className="text-slate-900">Team Deployment</h3>
                  <p className="text-slate-600 text-sm mt-1">
                    Active teams and their current assignments
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {teams.map((team, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={`w-12 h-12 rounded-lg ${
                            team.color === "red"
                              ? "bg-red-100"
                              : team.color === "blue"
                              ? "bg-blue-100"
                              : team.color === "green"
                              ? "bg-green-100"
                              : "bg-purple-100"
                          } flex items-center justify-center`}
                        >
                          <span
                            className={`text-xl ${
                              team.color === "red"
                                ? "text-red-600"
                                : team.color === "blue"
                                ? "text-blue-600"
                                : team.color === "green"
                                ? "text-green-600"
                                : "text-purple-600"
                            }`}
                          >
                            {team.name.charAt(0)}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            team.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : team.status === "Standby"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {team.status}
                        </span>
                      </div>
                      <div className="mb-3">
                        <p className="text-slate-900">{team.name}</p>
                        <p className="text-slate-600 text-sm">{team.leader}</p>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users className="w-3 h-3" />
                          <span>{team.members} Members</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="w-3 h-3" />
                          <span>{team.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Activity className="w-3 h-3" />
                          <span>{team.task}</span>
                        </div>
                      </div>
                      <button className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-sm transition-all duration-200">
                        <MessageSquare className="w-3 h-3" />
                        Contact Team
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Venue Status Grid */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="mb-4">
                  <h3 className="text-slate-900">Venue Status Overview</h3>
                  <p className="text-slate-600 text-sm mt-1">
                    Live capacity and status monitoring across all zones
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {venueAreas.map((area, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-4 border border-slate-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-slate-900 text-sm">{area.name}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            area.color === "red"
                              ? "bg-red-100 text-red-700"
                              : area.color === "amber"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {area.status}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm mb-3">
                        {area.capacity}
                      </p>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            area.color === "red"
                              ? "bg-red-500"
                              : area.color === "amber"
                              ? "bg-amber-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${area.percentage}%` }}
                        />
                      </div>
                      <p className="text-slate-500 text-xs mt-2">
                        {area.percentage}% Capacity
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
