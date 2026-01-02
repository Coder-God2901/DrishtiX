import React, { useState, useEffect } from "react";
import {
  Shield,
  AlertTriangle,
  Users,
  Navigation,
  Clock,
  MapPin,
  Info,
  CheckCircle,
  X,
  TrendingUp,
  Activity,
  Zap,
  Flame,
  AlertCircle,
  MessageSquare,
  Heart,
  Route,
  ChevronRight,
  Eye,
} from "lucide-react";

interface RiskZone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  riskLevel: "low" | "medium" | "high" | "critical" | "safe";
  crowdDensity: number;
  reason: string;
  details: string;
  recommendation: string;
  lastUpdated: Date;
  trend: "improving" | "worsening" | "stable";
}

interface SafeRoute {
  id: string;
  name: string;
  duration: string;
  distance: string;
  crowdLevel: "low" | "medium" | "high";
  description: string;
  path: { x: number; y: number }[];
  waypoints: { x: number; y: number; label: string; distance: string }[];
  color: string;
}

interface SmartSafetyMapSystemProps {
  onNavigate?: (route: SafeRoute) => void;
}

export function SmartSafetyMapSystem({
  onNavigate,
}: SmartSafetyMapSystemProps) {
  const [selectedZone, setSelectedZone] = useState<RiskZone | null>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [safeRoutes, setSafeRoutes] = useState<SafeRoute[]>([]);
  const [animationKey, setAnimationKey] = useState(0);
  const [highlightedRoute, setHighlightedRoute] = useState<string | null>(null);
  const [showAllRoutes, setShowAllRoutes] = useState(false);

  const [riskZones, setRiskZones] = useState<RiskZone[]>([
    {
      id: "zone-a",
      name: "Main Stage Area",
      x: 15,
      y: 20,
      width: 30,
      height: 35,
      riskLevel: "critical",
      crowdDensity: 95,
      reason: "Extreme crowd congestion",
      details:
        "Concert headliner performance causing massive gathering. Exceeding safe capacity by 40%.",
      recommendation:
        "Avoid this area. Use alternative routes via East or West corridors.",
      lastUpdated: new Date(),
      trend: "worsening",
    },
    {
      id: "zone-b",
      name: "Food Court Plaza",
      x: 55,
      y: 15,
      width: 25,
      height: 25,
      riskLevel: "medium",
      crowdDensity: 62,
      reason: "Moderate crowd activity",
      details:
        "Peak dining hours. Multiple food vendors experiencing long queues.",
      recommendation:
        "Expect 15-20 min wait times. Consider alternative dining areas.",
      lastUpdated: new Date(),
      trend: "stable",
    },
    {
      id: "zone-c",
      name: "VIP Lounge",
      x: 15,
      y: 65,
      width: 20,
      height: 20,
      riskLevel: "safe",
      crowdDensity: 18,
      reason: "Low crowd density",
      details:
        "Spacious area with controlled access. Comfortable seating available.",
      recommendation: "Safe zone. Ideal for rest and relaxation.",
      lastUpdated: new Date(),
      trend: "stable",
    },
    {
      id: "zone-d",
      name: "East Gate Entrance",
      x: 85,
      y: 35,
      width: 12,
      height: 30,
      riskLevel: "high",
      crowdDensity: 78,
      reason: "Entry/exit bottleneck",
      details: "Major access point experiencing heavy bidirectional traffic.",
      recommendation: "Use North Gate for faster entry/exit.",
      lastUpdated: new Date(),
      trend: "worsening",
    },
    {
      id: "zone-e",
      name: "North Garden",
      x: 45,
      y: 55,
      width: 30,
      height: 25,
      riskLevel: "low",
      crowdDensity: 35,
      reason: "Calm recreational area",
      details: "Open space with good ventilation. Perfect for breaks.",
      recommendation: "Recommended for cooling down and fresh air.",
      lastUpdated: new Date(),
      trend: "improving",
    },
    {
      id: "zone-f",
      name: "South Restrooms",
      x: 20,
      y: 45,
      width: 15,
      height: 12,
      riskLevel: "medium",
      crowdDensity: 58,
      reason: "Queue formation",
      details: "Moderate wait times. Consider North facilities.",
      recommendation: "8-12 minute estimated wait.",
      lastUpdated: new Date(),
      trend: "stable",
    },
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRiskZones((prev) =>
        prev.map((zone) => {
          // More realistic coordinated updates with time-based patterns
          const timeOfDay = new Date().getHours();
          const isPeakHour = timeOfDay >= 18 && timeOfDay <= 22;

          // Coordinated crowd movement simulation
          let change = (Math.random() - 0.5) * (isPeakHour ? 15 : 8);

          // Main Stage Area attracts crowds during peak hours
          if (zone.id === "zone-a" && isPeakHour) {
            change = Math.abs(change); // Always increasing
          }

          // VIP Lounge typically less crowded
          if (zone.id === "zone-e") {
            change = change * 0.5; // Slower changes
          }

          const newDensity = Math.max(
            10,
            Math.min(98, zone.crowdDensity + change)
          );

          let newRiskLevel: RiskZone["riskLevel"] = "safe";
          if (newDensity > 80) newRiskLevel = "critical";
          else if (newDensity > 65) newRiskLevel = "high";
          else if (newDensity > 45) newRiskLevel = "medium";
          else if (newDensity > 25) newRiskLevel = "low";

          const trend: RiskZone["trend"] =
            change > 2 ? "worsening" : change < -2 ? "improving" : "stable";

          return {
            ...zone,
            crowdDensity: Math.round(newDensity),
            riskLevel: newRiskLevel,
            trend,
            lastUpdated: new Date(),
          };
        })
      );
      setAnimationKey((prev) => prev + 1);
    }, 3000); // Update every 3 seconds for real-time monitoring // Update every 3 seconds for real-time monitoring

    return () => clearInterval(interval);
  }, []);

  // Generate safe routes when zone is selected
  useEffect(() => {
    if (selectedZone && selectedZone.riskLevel !== "safe") {
      setSafeRoutes([
        {
          id: "route-1",
          name: "Via North Garden Path",
          duration: "8 mins",
          distance: "420m",
          crowdLevel: "low",
          description: "Scenic route through calm areas with minimal crowds",
          path: [
            { x: 8, y: 45 },
            { x: 25, y: 45 },
            { x: 40, y: 35 },
            { x: 58, y: 35 },
            { x: 75, y: 28 },
            { x: 85, y: 25 },
          ],
          waypoints: [
            { x: 8, y: 45, label: "Start", distance: "0m" },
            { x: 40, y: 35, label: "East Gate", distance: "180m" },
            { x: 75, y: 28, label: "Plaza", distance: "350m" },
            { x: 85, y: 25, label: "Destination", distance: "420m" },
          ],
          color: "#10b981",
        },
        {
          id: "route-2",
          name: "West Corridor Route",
          duration: "6 mins",
          distance: "380m",
          crowdLevel: "medium",
          description: "Faster route with moderate crowd levels",
          path: [
            { x: 8, y: 45 },
            { x: 12, y: 35 },
            { x: 18, y: 25 },
            { x: 35, y: 18 },
            { x: 55, y: 15 },
            { x: 75, y: 15 },
            { x: 85, y: 20 },
          ],
          waypoints: [
            { x: 8, y: 45, label: "Start", distance: "0m" },
            { x: 18, y: 25, label: "West Garden", distance: "120m" },
            { x: 55, y: 15, label: "Food Court", distance: "280m" },
            { x: 85, y: 20, label: "Destination", distance: "380m" },
          ],
          color: "#f59e0b",
        },
        {
          id: "route-3",
          name: "VIP Bypass Route",
          duration: "12 mins",
          distance: "550m",
          crowdLevel: "low",
          description: "Longest but safest route avoiding all congested zones",
          path: [
            { x: 8, y: 45 },
            { x: 8, y: 70 },
            { x: 25, y: 82 },
            { x: 50, y: 88 },
            { x: 75, y: 82 },
            { x: 88, y: 70 },
            { x: 88, y: 35 },
            { x: 85, y: 22 },
          ],
          waypoints: [
            { x: 8, y: 45, label: "Start", distance: "0m" },
            { x: 25, y: 82, label: "VIP Lounge", distance: "180m" },
            { x: 75, y: 82, label: "Quiet Zone", distance: "380m" },
            { x: 85, y: 22, label: "Destination", distance: "550m" },
          ],
          color: "#3b82f6",
        },
      ]);
    }
  }, [selectedZone]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case "safe":
        return "bg-green-500/70 border-green-400";
      case "low":
        return "bg-blue-500/70 border-blue-400";
      case "medium":
        return "bg-yellow-500/70 border-yellow-400";
      case "high":
        return "bg-orange-500/70 border-orange-400";
      case "critical":
        return "bg-red-600/80 border-red-500";
      default:
        return "bg-slate-500/70";
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case "safe":
        return "bg-green-100 text-green-800 border-green-300";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "safe":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "low":
        return <Shield className="w-5 h-5 text-blue-600" />;
      case "medium":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case "high":
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case "critical":
        return <Flame className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getTrendIndicator = (trend: string) => {
    switch (trend) {
      case "improving":
        return (
          <span className="text-green-600 text-xs flex items-center gap-1">
            <TrendingUp className="w-3 h-3 rotate-180" /> Improving
          </span>
        );
      case "worsening":
        return (
          <span className="text-red-600 text-xs flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Worsening
          </span>
        );
      case "stable":
        return (
          <span className="text-slate-600 text-xs flex items-center gap-1">
            <Activity className="w-3 h-3" /> Stable
          </span>
        );
      default:
        return null;
    }
  };

  const handleZoneClick = (zone: RiskZone) => {
    setSelectedZone(zone);
    setShowDetailedView(true);
  };

  const closeDetailedView = () => {
    setShowDetailedView(false);
    setTimeout(() => setSelectedZone(null), 300);
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden flex flex-col"
      style={{ height: "600px" }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white text-xl">Smart Safety Map</h2>
              <p className="text-blue-100 text-sm">
                Real-time risk monitoring DrishtiX AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white text-sm">Live</span>
          </div>
        </div>
      </div>

      {/* Interactive Map Area */}
      <div className="relative flex-1 bg-slate-50 overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%">
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Risk Zones */}
        {riskZones.map((zone) => (
          <button
            key={zone.id}
            onClick={() => handleZoneClick(zone)}
            className={`absolute transition-all duration-500 hover:scale-105 group ${
              zone.riskLevel === "critical" ? "z-20" : "z-10"
            }`}
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.width}%`,
              height: `${zone.height}%`,
            }}
          >
            <div
              className={`w-full h-full rounded-xl border-2 backdrop-blur-sm shadow-lg transition-colors duration-500 ${getRiskColor(
                zone.riskLevel
              )} flex flex-col items-center justify-center p-2 relative overflow-hidden`}
            >
              {/* Pulse Effect for Critical Zones */}
              {zone.riskLevel === "critical" && (
                <div className="absolute inset-0 bg-red-500/20 animate-pulse" />
              )}

              <div className="relative z-10 flex flex-col items-center text-center">
                {getRiskIcon(zone.riskLevel)}
                <span className="text-white font-bold text-sm mt-1 drop-shadow-md">
                  {zone.name}
                </span>
                <span className="text-white/90 text-xs font-medium bg-black/20 px-2 py-0.5 rounded-full mt-1">
                  {Math.round(zone.crowdDensity)}%
                </span>
              </div>
            </div>
          </button>
        ))}

        {/* Safe Routes Visualization - Enhanced Zoo-style Map with Professional Roads */}
        {selectedZone && safeRoutes.length > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none z-15"
            width="100%"
            height="100%"
          >
            <defs>
              {safeRoutes.map((route) => (
                <React.Fragment key={`defs-${route.id}`}>
                  <marker
                    id={`arrow-${route.id}`}
                    markerWidth="12"
                    markerHeight="12"
                    refX="6"
                    refY="3.5"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <path d="M0,0 L0,7 L12,3.5 z" fill={route.color} />
                  </marker>

                  {/* Glow filter for routes */}
                  <filter
                    id={`glow-${route.id}`}
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                  >
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </React.Fragment>
              ))}
            </defs>

            {safeRoutes.map((route, routeIndex) => {
              const pathString = route.path
                .map(
                  (point, i) => `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`
                )
                .join(" ");

              return (
                <g
                  key={route.id}
                  className="animate-in fade-in duration-500"
                  style={{ animationDelay: `${routeIndex * 150}ms` }}
                >
                  {/* Background white outline for contrast */}
                  <path
                    d={pathString}
                    fill="none"
                    stroke="white"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                  />

                  {/* Main route path - solid base */}
                  <path
                    d={pathString}
                    fill="none"
                    stroke={route.color}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.6"
                  />

                  {/* Animated dotted overlay - zoo map style */}
                  <path
                    d={pathString}
                    fill="none"
                    stroke={route.color}
                    strokeWidth="4"
                    strokeDasharray="12 8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={`url(#glow-${route.id})`}
                    style={{
                      opacity: highlightedRoute === route.id ? 1 : 0.85,
                    }}
                    markerEnd={`url(#arrow-${route.id})`}
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="20"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </path>

                  {/* Waypoint markers with enhanced styling */}
                  {route.waypoints.map((waypoint, wpIndex) => (
                    <g key={`${route.id}-wp-${wpIndex}`}>
                      {/* Outer pulse ring */}
                      <circle
                        cx={waypoint.x}
                        cy={waypoint.y}
                        r="10"
                        fill={route.color}
                        opacity="0.2"
                        className="animate-ping"
                      />

                      {/* Waypoint circle with white border */}
                      <circle
                        cx={waypoint.x}
                        cy={waypoint.y}
                        r="6"
                        fill="white"
                        stroke={route.color}
                        strokeWidth="3"
                        filter={`url(#glow-${route.id})`}
                      />

                      {/* Inner dot */}
                      <circle
                        cx={waypoint.x}
                        cy={waypoint.y}
                        r="2.5"
                        fill={route.color}
                      />

                      {/* Distance label background - rounded pill */}
                      <rect
                        x={waypoint.x - 30}
                        y={waypoint.y - 35}
                        width="60"
                        height="22"
                        rx="11"
                        fill={route.color}
                        opacity="0.95"
                        filter="drop-shadow(0 3px 8px rgba(0,0,0,0.25))"
                      />

                      {/* Distance text */}
                      <text
                        x={waypoint.x}
                        y={waypoint.y - 20}
                        textAnchor="middle"
                        fill="white"
                        fontSize="11"
                        fontWeight="700"
                        style={{ pointerEvents: "none" }}
                      >
                        {waypoint.distance}
                      </text>

                      {/* Waypoint label with background */}
                      <g>
                        <rect
                          x={waypoint.x - 35}
                          y={waypoint.y + 12}
                          width="70"
                          height="18"
                          rx="9"
                          fill="white"
                          opacity="0.95"
                          filter="drop-shadow(0 2px 6px rgba(0,0,0,0.15))"
                        />
                        <text
                          x={waypoint.x}
                          y={waypoint.y + 24}
                          textAnchor="middle"
                          fill={route.color}
                          fontSize="10"
                          fontWeight="700"
                          style={{ pointerEvents: "none" }}
                        >
                          {waypoint.label}
                        </text>
                      </g>
                    </g>
                  ))}

                  {/* Route identifier badge at start */}
                  <g>
                    <rect
                      x={route.path[0].x - 40}
                      y={route.path[0].y - 50}
                      width="80"
                      height="28"
                      rx="14"
                      fill={route.color}
                      opacity="0.95"
                      filter="drop-shadow(0 4px 10px rgba(0,0,0,0.3))"
                    />
                    <text
                      x={route.path[0].x}
                      y={route.path[0].y - 30}
                      textAnchor="middle"
                      fill="white"
                      fontSize="11"
                      fontWeight="800"
                      style={{ pointerEvents: "none" }}
                    >
                      Route {routeIndex + 1}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        )}

        {/* Live Stats Overlay */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-slate-200 z-30 w-64">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-blue-600" />
            <h4 className="text-slate-900 font-medium">Live Stats</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between gap-4">
              <span className="text-slate-600 text-sm">Critical Zones:</span>
              <span className="text-red-600 font-semibold">
                {riskZones.filter((z) => z.riskLevel === "critical").length}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-600 text-sm">Safe Zones:</span>
              <span className="text-green-600 font-semibold">
                {riskZones.filter((z) => z.riskLevel === "safe").length}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-600 text-sm">Total Monitored:</span>
              <span className="text-blue-600 font-semibold">
                {riskZones.length} zones
              </span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-xl border border-slate-200 z-30 flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-slate-600">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-xs text-slate-600">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xs text-slate-600">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-slate-600">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-slate-600">Safe</span>
          </div>
        </div>
      </div>

      {/* Quick Info Bar */}
      <div className="bg-slate-50 border-t-2 border-slate-200 p-3 shrink-0">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Eye className="w-4 h-4" />
            <span>Click any zone for details</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            <span>Updates every 3s</span>
          </div>
        </div>
      </div>

      {/* Detailed Zone View Modal */}
      {showDetailedView && selectedZone && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90%] overflow-hidden animate-in zoom-in slide-in-from-bottom duration-300 flex flex-col">
            {/* Modal Header */}
            <div
              className={`p-6 text-white shrink-0 ${
                selectedZone.riskLevel === "critical"
                  ? "bg-gradient-to-r from-red-600 to-red-700"
                  : selectedZone.riskLevel === "high"
                  ? "bg-gradient-to-r from-orange-600 to-orange-700"
                  : selectedZone.riskLevel === "medium"
                  ? "bg-gradient-to-r from-yellow-600 to-yellow-700"
                  : selectedZone.riskLevel === "low"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700"
                  : "bg-gradient-to-r from-green-600 to-green-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    {getRiskIcon(selectedZone.riskLevel)}
                  </div>
                  <div>
                    <h3 className="text-2xl mb-1">{selectedZone.name}</h3>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm border-2 ${getRiskBadgeColor(
                          selectedZone.riskLevel
                        )} bg-white/90`}
                      >
                        {selectedZone.riskLevel.toUpperCase()} RISK
                      </span>
                      {getTrendIndicator(selectedZone.trend)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeDetailedView}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Current Status */}
              <div className="mb-6">
                <h4 className="text-slate-900 text-lg mb-3 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Current Status
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-slate-600" />
                      <span className="text-slate-600 text-sm">
                        Crowd Density
                      </span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl text-slate-900">
                        {Math.round(selectedZone.crowdDensity)}
                      </span>
                      <span className="text-slate-600 mb-1">%</span>
                    </div>
                    <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          selectedZone.crowdDensity > 80
                            ? "bg-red-500"
                            : selectedZone.crowdDensity > 60
                            ? "bg-orange-500"
                            : selectedZone.crowdDensity > 40
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${selectedZone.crowdDensity}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-5 h-5 text-slate-600" />
                      <span className="text-slate-600 text-sm">
                        Safety Score
                      </span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl text-slate-900">
                        {Math.round(100 - selectedZone.crowdDensity)}
                      </span>
                      <span className="text-slate-600 mb-1">/100</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-600">
                      Updated{" "}
                      {Math.floor(
                        (Date.now() - selectedZone.lastUpdated.getTime()) / 1000
                      )}
                      s ago
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason & Details */}
              <div className="mb-6">
                <h4 className="text-slate-900 text-lg mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  What's Happening
                </h4>
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-4 mb-3">
                  <p className="text-blue-900 mb-2">{selectedZone.reason}</p>
                  <p className="text-blue-700 text-sm">
                    {selectedZone.details}
                  </p>
                </div>
                <div className="bg-indigo-50 border-l-4 border-indigo-500 rounded-r-xl p-4">
                  <p className="text-indigo-900 text-sm">
                    {" "}
                    {selectedZone.recommendation}
                  </p>
                </div>
              </div>

              {/* Safe Routes (if high risk) */}
              {selectedZone.riskLevel !== "safe" && safeRoutes.length > 0 && (
                <div>
                  <h4 className="text-slate-900 text-lg mb-3 flex items-center gap-2">
                    <Route className="w-5 h-5 text-green-600" />
                    Suggested Safe Routes
                  </h4>
                  <div className="space-y-3">
                    {safeRoutes.map((route) => (
                      <button
                        key={route.id}
                        onClick={() => {
                          onNavigate?.(route);
                          closeDetailedView();
                        }}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-green-500 hover:shadow-lg transition-all text-left group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Navigation className="w-5 h-5 text-green-600" />
                            <span className="text-slate-900">{route.name}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-green-600 transition-colors" />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {route.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {route.distance}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs border ${
                              route.crowdLevel === "low"
                                ? "bg-green-100 text-green-700 border-green-300"
                                : route.crowdLevel === "medium"
                                ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                                : "bg-orange-100 text-orange-700 border-orange-300"
                            }`}
                          >
                            {route.crowdLevel} crowd
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          {route.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t-2 border-slate-200 p-4 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Powered by DrishtiX AI Safety Engine</span>
              </div>
              <button
                onClick={closeDetailedView}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
