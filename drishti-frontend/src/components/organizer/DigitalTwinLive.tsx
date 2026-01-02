import { useState } from "react";
import {
  ArrowLeft,
  Cloud,
  CloudRain,
  AlertTriangle,
  Users,
  Shield,
  Heart,
  Activity,
  MapPin,
  Clock,
  Zap,
  Target,
  CheckCircle2,
  AlertCircle,
  Car,
  Truck,
  BarChart3,
  Lightbulb,
  Brain,
  TrendingUp,
  TrendingDown,
  Radio,
  Bell,
  Navigation,
} from "lucide-react";
import { IndianMap, INDIAN_VENUES } from "../shared/IndianMap";
import { LeafletMap } from "../shared/LeafletMap";

interface DigitalTwinLiveProps {
  onBack: () => void;
}

export function DigitalTwinLive({ onBack }: DigitalTwinLiveProps) {
  const [selectedAnomaly, setSelectedAnomaly] = useState<any>(null);
  const [simulationSpeed, setSimulationSpeed] = useState<"1x" | "2x" | "5x">(
    "1x"
  );
  const [mapType, setMapType] = useState<"google" | "leaflet">("leaflet");

  // Real-time Anomaly Detection
  const detectedAnomalies = [
    {
      id: 1,
      type: "Crowd Surge",
      location: "Main Stage - Center",
      severity: "critical",
      probability: 94,
      urgency: "immediate",
      timeDetected: "8:23 PM",
      prediction: "Crowd density exceeding 90% in next 3-5 minutes",
      impact: "High risk of stampede or injuries",
      recommendations: [
        "Immediately close entrance gates to Main Stage",
        "Dispatch Security Teams Alpha & Bravo",
        "Activate emergency crowd dispersal protocol",
        "Broadcast safety message to attendees",
      ],
      x: 60,
      y: 30,
    },
    {
      id: 2,
      type: "Medical Emergency Pattern",
      location: "Food Court Area",
      severity: "high",
      probability: 87,
      urgency: "high",
      timeDetected: "8:18 PM",
      prediction: "3-4 heat-related incidents likely in next 15 minutes",
      impact: "Multiple medical cases requiring attention",
      recommendations: [
        "Pre-position Medical Team Charlie near Food Court",
        "Distribute water and cooling supplies",
        "Set up additional shade/cooling station",
        "Monitor attendee conditions closely",
      ],
      x: 45,
      y: 65,
    },
    {
      id: 3,
      type: "Unauthorized Access",
      location: "Backstage - East Entrance",
      severity: "high",
      probability: 91,
      urgency: "high",
      timeDetected: "8:20 PM",
      prediction: "Potential security breach in progress",
      impact: "Safety and security compromise",
      recommendations: [
        "Dispatch Security Team Delta immediately",
        "Activate perimeter security cameras",
        "Lock down backstage access points",
        "Alert event coordinators",
      ],
      x: 80,
      y: 20,
    },
    {
      id: 4,
      type: "Equipment Malfunction Risk",
      location: "Sound Booth 2",
      severity: "medium",
      probability: 73,
      urgency: "medium",
      timeDetected: "8:15 PM",
      prediction: "Audio system showing stress patterns",
      impact: "Potential sound quality degradation",
      recommendations: [
        "Technical team to inspect audio equipment",
        "Prepare backup sound system",
        "Monitor equipment temperature levels",
        "Have spare components ready",
      ],
      x: 70,
      y: 55,
    },
    {
      id: 5,
      type: "Traffic Congestion",
      location: "Parking Lot C - Exit",
      severity: "medium",
      probability: 81,
      urgency: "medium",
      timeDetected: "8:10 PM",
      prediction: "Exit congestion expected after main event",
      impact: "Delayed attendee departure",
      recommendations: [
        "Prepare traffic control teams",
        "Open auxiliary exit routes",
        "Coordinate with parking attendants",
        "Activate digital signage for traffic flow",
      ],
      x: 25,
      y: 85,
    },
  ];

  // Real-time metrics
  const liveMetrics = {
    currentAttendance: 9485,
    capacity: 10000,
    crowdSafetyScore: 76,
    activeIncidents: 5,
    medicalCases: 8,
    securityAlerts: 3,
    weatherCondition: "Clear",
    temperature: 74,
    trend: "deteriorating",
  };

  // Crowd flow simulation data
  const crowdFlowZones = [
    {
      zone: "Main Stage",
      current: 8500,
      capacity: 10000,
      flow: "incoming",
      rate: "+45/min",
      risk: "high",
    },
    {
      zone: "Food Court",
      current: 2100,
      capacity: 3500,
      flow: "stable",
      rate: "±5/min",
      risk: "low",
    },
    {
      zone: "VIP Area",
      current: 820,
      capacity: 1000,
      flow: "stable",
      rate: "+2/min",
      risk: "low",
    },
    {
      zone: "Backstage",
      current: 165,
      capacity: 200,
      flow: "incoming",
      rate: "+8/min",
      risk: "medium",
    },
    {
      zone: "Parking Lots",
      current: 3200,
      capacity: 4000,
      flow: "incoming",
      rate: "+12/min",
      risk: "low",
    },
  ];

  // Live predictions (next 30 minutes)
  const livePredictions = [
    {
      category: "Crowd Safety",
      icon: <Users className="w-5 h-5" />,
      color: "red",
      metrics: [
        {
          label: "Expected Density Increase",
          value: "+15%",
          confidence: 92,
          status: "critical",
        },
        {
          label: "Pressure Points",
          value: "2 zones",
          confidence: 89,
          status: "warning",
        },
        {
          label: "Safe Exit Capacity",
          value: "78%",
          confidence: 85,
          status: "warning",
        },
      ],
      actions: [
        {
          action: "Activate crowd flow management",
          priority: "immediate",
          status: "recommended",
        },
        { action: "Open emergency exits", priority: "high", status: "pending" },
        {
          action: "Deploy additional security",
          priority: "high",
          status: "in-progress",
        },
      ],
    },
    {
      category: "Medical",
      icon: <Heart className="w-5 h-5" />,
      color: "blue",
      metrics: [
        {
          label: "Predicted New Cases",
          value: "4-6",
          confidence: 84,
          status: "warning",
        },
        {
          label: "Medical Team Utilization",
          value: "72%",
          confidence: 91,
          status: "normal",
        },
        {
          label: "Average Response Time",
          value: "3.2 min",
          confidence: 88,
          status: "normal",
        },
      ],
      actions: [
        {
          action: "Position additional medical staff",
          priority: "high",
          status: "recommended",
        },
        {
          action: "Stock cooling supplies",
          priority: "medium",
          status: "completed",
        },
        {
          action: "Monitor heat stress indicators",
          priority: "medium",
          status: "ongoing",
        },
      ],
    },
    {
      category: "Security",
      icon: <Shield className="w-5 h-5" />,
      color: "purple",
      metrics: [
        {
          label: "Threat Level",
          value: "Elevated",
          confidence: 87,
          status: "warning",
        },
        {
          label: "Perimeter Integrity",
          value: "94%",
          confidence: 93,
          status: "normal",
        },
        {
          label: "Active Patrols",
          value: "12/14",
          confidence: 100,
          status: "normal",
        },
      ],
      actions: [
        {
          action: "Reinforce backstage security",
          priority: "immediate",
          status: "in-progress",
        },
        {
          action: "Increase camera monitoring",
          priority: "high",
          status: "completed",
        },
        {
          action: "Brief security teams",
          priority: "medium",
          status: "completed",
        },
      ],
    },
    {
      category: "Logistics",
      icon: <Truck className="w-5 h-5" />,
      color: "amber",
      metrics: [
        {
          label: "Supply Status",
          value: "Good",
          confidence: 89,
          status: "normal",
        },
        {
          label: "Waste Management",
          value: "68% capacity",
          confidence: 86,
          status: "normal",
        },
        {
          label: "Equipment Status",
          value: "2 issues",
          confidence: 91,
          status: "warning",
        },
      ],
      actions: [
        {
          action: "Restock food vendors",
          priority: "medium",
          status: "scheduled",
        },
        {
          action: "Deploy waste collection",
          priority: "medium",
          status: "ongoing",
        },
        {
          action: "Inspect technical equipment",
          priority: "high",
          status: "recommended",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl flex items-center gap-3">
                    <Brain className="w-8 h-8" />
                    Digital Twin - Live Operations
                  </h1>
                  <span className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm flex items-center gap-2 animate-pulse">
                    <Radio className="w-4 h-4" />
                    LIVE
                  </span>
                </div>
                <p className="text-green-100">
                  Real-time AI monitoring & predictive analytics
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                <p className="text-xs text-green-100 mb-1">Safety Score</p>
                <p
                  className={`text-2xl ${
                    liveMetrics.crowdSafetyScore >= 80
                      ? "text-white"
                      : liveMetrics.crowdSafetyScore >= 60
                      ? "text-yellow-200"
                      : "text-red-200"
                  }`}
                >
                  {liveMetrics.crowdSafetyScore}%
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                <p className="text-xs text-green-100 mb-1">Attendance</p>
                <p className="text-2xl text-white">
                  {liveMetrics.currentAttendance.toLocaleString()}
                </p>
              </div>
              <select
                value={simulationSpeed}
                onChange={(e) =>
                  setSimulationSpeed(e.target.value as "1x" | "2x" | "5x")
                }
                className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="1x">1x Speed</option>
                <option value="2x">2x Speed</option>
                <option value="5x">5x Speed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Strip */}
      <div className="bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <p className="flex-1">
              <span className="opacity-90">Critical Alert:</span> Main Stage
              area approaching capacity (90%) - Immediate action required
            </p>
            <button className="px-4 py-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-all text-sm">
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Live Metrics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div
              className={`bg-white rounded-xl shadow-sm border-2 p-4 ${
                liveMetrics.crowdSafetyScore < 70
                  ? "border-red-300"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-600">Safety Score</p>
                {liveMetrics.trend === "deteriorating" ? (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                )}
              </div>
              <p
                className={`text-2xl ${
                  liveMetrics.crowdSafetyScore >= 80
                    ? "text-green-600"
                    : liveMetrics.crowdSafetyScore >= 60
                    ? "text-amber-600"
                    : "text-red-600"
                }`}
              >
                {liveMetrics.crowdSafetyScore}%
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <p className="text-xs text-slate-600 mb-2">Active Incidents</p>
              <p className="text-2xl text-red-600">
                {liveMetrics.activeIncidents}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <p className="text-xs text-slate-600 mb-2">Medical Cases</p>
              <p className="text-2xl text-blue-600">
                {liveMetrics.medicalCases}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <p className="text-xs text-slate-600 mb-2">Security Alerts</p>
              <p className="text-2xl text-purple-600">
                {liveMetrics.securityAlerts}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <p className="text-xs text-slate-600 mb-2">Weather</p>
              <p className="text-slate-900 flex items-center gap-1">
                <Cloud className="w-4 h-4" />
                {liveMetrics.temperature}°F
              </p>
            </div>
          </div>

          {/* Live Crowd Simulation Map */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-slate-900 text-xl flex items-center gap-2">
                    <Activity className="w-6 h-6 text-green-600" />
                    Live Crowd Density Simulation with Map Integration
                  </h3>
                  <p className="text-slate-600 text-sm mt-1">
                    Real-time crowd movement & anomaly detection
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMapType("google")}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      mapType === "google"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Google Map
                  </button>
                  <button
                    onClick={() => setMapType("leaflet")}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      mapType === "leaflet"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Leaflet Map
                  </button>
                  <span className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Updating Live
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div
                className="relative rounded-xl overflow-hidden"
                style={{
                  height: "500px",
                }}
              >
                {/* Background Map Layer */}
                <div className="absolute inset-0 z-0">
                  {mapType === "google" ? (
                    <IndianMap
                      location={INDIAN_VENUES.mumbai}
                      height="500px"
                      showControls={true}
                      markers={[
                        {
                          lat: 19.0653,
                          lng: 72.8691,
                          label: "Main Stage",
                          color: "red",
                        },
                        {
                          lat: 19.0648,
                          lng: 72.8698,
                          label: "Food Court",
                          color: "orange",
                        },
                        {
                          lat: 19.0658,
                          lng: 72.8685,
                          label: "VIP Area",
                          color: "green",
                        },
                      ]}
                    />
                  ) : (
                    <LeafletMap
                      center={[19.0653, 72.8691]}
                      zoom={16}
                      height="500px"
                      markers={[
                        {
                          position: [19.0653, 72.8691],
                          label: "Main Stage",
                          color: "red",
                        },
                        {
                          position: [19.0648, 72.8698],
                          label: "Food Court",
                          color: "orange",
                        },
                        {
                          position: [19.0658, 72.8685],
                          label: "VIP Area",
                          color: "green",
                        },
                        {
                          position: [19.066, 72.8675],
                          label: "Backstage",
                          color: "purple",
                        },
                      ]}
                    />
                  )}
                </div>

                {/* Real-time Density Overlays - More intense */}
                <div
                  style={{
                    position: "absolute",
                    top: "18%",
                    left: "40%",
                    width: "192px",
                    height: "192px",
                    backgroundColor: "rgba(220, 38, 38, 0.6)",
                    borderRadius: "50%",
                    filter: "blur(64px)",
                    zIndex: 10,
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "25%",
                    width: "144px",
                    height: "144px",
                    backgroundColor: "rgba(245, 158, 11, 0.5)",
                    borderRadius: "50%",
                    filter: "blur(40px)",
                    zIndex: 10,
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "25%",
                    right: "30%",
                    width: "112px",
                    height: "112px",
                    backgroundColor: "rgba(34, 197, 94, 0.4)",
                    borderRadius: "50%",
                    filter: "blur(40px)",
                    zIndex: 10,
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "15%",
                    right: "20%",
                    width: "128px",
                    height: "128px",
                    backgroundColor: "rgba(239, 68, 68, 0.6)",
                    borderRadius: "50%",
                    filter: "blur(24px)",
                    zIndex: 10,
                    pointerEvents: "none",
                  }}
                />

                {/* Live Anomaly Markers */}
                {detectedAnomalies.map((anomaly) => (
                  <button
                    key={anomaly.id}
                    onClick={() => setSelectedAnomaly(anomaly)}
                    className={`absolute w-8 h-8 rounded-full border-3 border-white shadow-lg transition-all hover:scale-125 flex items-center justify-center z-30 ${
                      anomaly.severity === "critical"
                        ? "bg-red-600 animate-pulse"
                        : anomaly.severity === "high"
                        ? "bg-orange-600"
                        : "bg-amber-600"
                    }`}
                    style={{ left: `${anomaly.x}%`, top: `${anomaly.y}%` }}
                  >
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </button>
                ))}

                {/* Zone Labels with Live Data */}
                <div
                  style={{
                    position: "absolute",
                    top: "20%",
                    left: "42%",
                    backgroundColor: "#dc2626",
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    border: "2px solid white",
                    zIndex: 20,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <Activity style={{ width: "12px", height: "12px" }} />
                    <span>Main Stage</span>
                  </div>
                  <div style={{ fontSize: "10px", opacity: 0.9 }}>
                    8,500/10,000 (85%)
                    <br />
                    <span style={{ color: "#fef08a" }}>+45/min ↑</span>
                  </div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    top: "52%",
                    left: "27%",
                    backgroundColor: "#d97706",
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    border: "2px solid white",
                    zIndex: 20,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <Activity style={{ width: "12px", height: "12px" }} />
                    <span>Food Court</span>
                  </div>
                  <div style={{ fontSize: "10px", opacity: 0.9 }}>
                    2,100/3,500 (60%)
                    <br />
                    <span>±5/min ↔</span>
                  </div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    bottom: "27%",
                    right: "32%",
                    backgroundColor: "#16a34a",
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    border: "2px solid white",
                    zIndex: 20,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <Activity style={{ width: "12px", height: "12px" }} />
                    <span>VIP Area</span>
                  </div>
                  <div style={{ fontSize: "10px", opacity: 0.9 }}>
                    820/1,000 (82%)
                    <br />
                    <span>+2/min ↑</span>
                  </div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    top: "17%",
                    right: "22%",
                    backgroundColor: "#ea580c",
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    border: "2px solid white",
                    zIndex: 20,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <Activity style={{ width: "12px", height: "12px" }} />
                    <span>Backstage</span>
                  </div>
                  <div style={{ fontSize: "10px", opacity: 0.9 }}>
                    165/200 (83%)
                    <br />
                    <span style={{ color: "#fef08a" }}>+8/min ↑</span>
                  </div>
                </div>

                {/* Live Legend */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-slate-200 z-20">
                  <p className="text-xs text-slate-900 mb-2">Live Status</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                      <span className="text-xs text-slate-700">
                        Critical (
                        {
                          detectedAnomalies.filter(
                            (a) => a.severity === "critical"
                          ).length
                        }
                        )
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-600 rounded-full" />
                      <span className="text-xs text-slate-700">
                        High Risk (
                        {
                          detectedAnomalies.filter((a) => a.severity === "high")
                            .length
                        }
                        )
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-600 rounded-full" />
                      <span className="text-xs text-slate-700">
                        Medium (
                        {
                          detectedAnomalies.filter(
                            (a) => a.severity === "medium"
                          ).length
                        }
                        )
                      </span>
                    </div>
                  </div>
                </div>

                {/* Time indicator */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-slate-200 z-20">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <span className="text-slate-900">8:23 PM</span>
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                      Live
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detected Anomalies - Sorted by Probability & Urgency */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-red-50">
              <h3 className="text-slate-900 text-xl flex items-center gap-2">
                <Zap className="w-6 h-6 text-red-600" />
                Detected Anomalies & Predictions
              </h3>
              <p className="text-slate-600 text-sm mt-1">
                Sorted by probability and urgency
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {detectedAnomalies
                  .sort((a, b) => {
                    const urgencyWeight = {
                      immediate: 3,
                      high: 2,
                      medium: 1,
                      low: 0,
                    };
                    const aScore =
                      urgencyWeight[a.urgency as keyof typeof urgencyWeight] *
                        100 +
                      a.probability;
                    const bScore =
                      urgencyWeight[b.urgency as keyof typeof urgencyWeight] *
                        100 +
                      b.probability;
                    return bScore - aScore;
                  })
                  .map((anomaly) => (
                    <div
                      key={anomaly.id}
                      className={`p-5 rounded-xl border-2 transition-all ${
                        selectedAnomaly?.id === anomaly.id
                          ? "ring-2 ring-blue-400"
                          : ""
                      } ${
                        anomaly.severity === "critical"
                          ? "bg-red-50 border-red-300"
                          : anomaly.severity === "high"
                          ? "bg-orange-50 border-orange-300"
                          : "bg-amber-50 border-amber-300"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-slate-900">{anomaly.type}</h4>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                anomaly.urgency === "immediate"
                                  ? "bg-red-600 text-white"
                                  : anomaly.urgency === "high"
                                  ? "bg-orange-600 text-white"
                                  : "bg-amber-600 text-white"
                              }`}
                            >
                              {anomaly.urgency.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {anomaly.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Detected: {anomaly.timeDetected}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="bg-white/50 rounded-lg p-3">
                              <p className="text-xs text-slate-600 mb-1">
                                AI Prediction
                              </p>
                              <p className="text-sm text-slate-900">
                                {anomaly.prediction}
                              </p>
                            </div>
                            <div className="bg-white/50 rounded-lg p-3">
                              <p className="text-xs text-slate-600 mb-1">
                                Impact Assessment
                              </p>
                              <p className="text-sm text-slate-900">
                                {anomaly.impact}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-xs text-slate-600 mb-1">
                            Probability
                          </p>
                          <p
                            className={`text-3xl mb-2 ${
                              anomaly.probability >= 90
                                ? "text-red-600"
                                : anomaly.probability >= 75
                                ? "text-orange-600"
                                : "text-amber-600"
                            }`}
                          >
                            {anomaly.probability}%
                          </p>
                          <div className="w-20 bg-slate-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                anomaly.severity === "critical"
                                  ? "bg-red-600"
                                  : anomaly.severity === "high"
                                  ? "bg-orange-600"
                                  : "bg-amber-600"
                              }`}
                              style={{ width: `${anomaly.probability}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* AI Recommendations */}
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-sm text-slate-900 mb-3 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-600" />
                          AI-Generated Actions
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {anomaly.recommendations.map(
                            (rec: string, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 bg-white rounded-lg p-3 border border-slate-200"
                              >
                                <CheckCircle2
                                  className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                                    anomaly.severity === "critical"
                                      ? "text-red-600"
                                      : anomaly.severity === "high"
                                      ? "text-orange-600"
                                      : "text-amber-600"
                                  }`}
                                />
                                <p className="text-xs text-slate-700">{rec}</p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Live Predictions (Next 30 min) */}
          <div className="space-y-4">
            {livePredictions.map((category, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div
                  className={`px-6 py-4 border-b border-slate-200 bg-gradient-to-r ${
                    category.color === "red"
                      ? "from-red-50 to-pink-50"
                      : category.color === "blue"
                      ? "from-blue-50 to-cyan-50"
                      : category.color === "purple"
                      ? "from-purple-50 to-indigo-50"
                      : "from-amber-50 to-orange-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 ${
                        category.color === "red"
                          ? "bg-red-100"
                          : category.color === "blue"
                          ? "bg-blue-100"
                          : category.color === "purple"
                          ? "bg-purple-100"
                          : "bg-amber-100"
                      } rounded-xl flex items-center justify-center ${
                        category.color === "red"
                          ? "text-red-600"
                          : category.color === "blue"
                          ? "text-blue-600"
                          : category.color === "purple"
                          ? "text-purple-600"
                          : "text-amber-600"
                      }`}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="text-slate-900">
                        {category.category} - Next 30 Minutes
                      </h3>
                      <p className="text-xs text-slate-600">
                        Live predictions and recommended actions
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Live Metrics */}
                    <div>
                      <h4 className="text-slate-900 mb-3 text-sm">
                        Predicted Metrics
                      </h4>
                      <div className="space-y-3">
                        {category.metrics.map((metric, mIdx) => (
                          <div
                            key={mIdx}
                            className={`p-3 rounded-lg border ${
                              metric.status === "critical"
                                ? "bg-red-50 border-red-200"
                                : metric.status === "warning"
                                ? "bg-amber-50 border-amber-200"
                                : "bg-green-50 border-green-200"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm text-slate-700">
                                {metric.label}
                              </p>
                              <p
                                className={`${
                                  metric.status === "critical"
                                    ? "text-red-700"
                                    : metric.status === "warning"
                                    ? "text-amber-700"
                                    : "text-green-700"
                                }`}
                              >
                                {metric.value}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 rounded-full h-1">
                                <div
                                  className={`h-1 rounded-full ${
                                    metric.status === "critical"
                                      ? "bg-red-600"
                                      : metric.status === "warning"
                                      ? "bg-amber-600"
                                      : "bg-green-600"
                                  }`}
                                  style={{ width: `${metric.confidence}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-600">
                                {metric.confidence}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Actions */}
                    <div>
                      <h4 className="text-slate-900 mb-3 text-sm">
                        Recommended Actions
                      </h4>
                      <div className="space-y-2">
                        {category.actions.map((action, aIdx) => (
                          <div
                            key={aIdx}
                            className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                action.status === "completed"
                                  ? "bg-green-100"
                                  : action.status === "in-progress"
                                  ? "bg-blue-100"
                                  : action.status === "recommended"
                                  ? "bg-amber-100"
                                  : "bg-slate-100"
                              }`}
                            >
                              {action.status === "completed" ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : action.status === "in-progress" ? (
                                <Activity className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Clock className="w-4 h-4 text-amber-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-slate-900">
                                {action.action}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded ${
                                    action.priority === "immediate"
                                      ? "bg-red-100 text-red-700"
                                      : action.priority === "high"
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {action.priority}
                                </span>
                                <span className="text-xs text-slate-600">
                                  • {action.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Crowd Flow Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-slate-900 text-xl flex items-center gap-2">
                <Navigation className="w-6 h-6 text-blue-600" />
                Live Crowd Flow Analysis
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {crowdFlowZones.map((zone, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-2 ${
                      zone.risk === "high"
                        ? "bg-red-50 border-red-200"
                        : zone.risk === "medium"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    <h4 className="text-slate-900 mb-3">{zone.zone}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Occupancy</span>
                        <span className="text-slate-900">
                          {zone.current.toLocaleString()} /{" "}
                          {zone.capacity.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            zone.risk === "high"
                              ? "bg-red-600"
                              : zone.risk === "medium"
                              ? "bg-amber-600"
                              : "bg-green-600"
                          }`}
                          style={{
                            width: `${(zone.current / zone.capacity) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Flow Rate</span>
                        <span
                          className={`flex items-center gap-1 ${
                            zone.flow === "incoming"
                              ? "text-red-700"
                              : zone.flow === "outgoing"
                              ? "text-green-700"
                              : "text-slate-700"
                          }`}
                        >
                          {zone.rate}
                          {zone.flow === "incoming" ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : zone.flow === "outgoing" ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : null}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
