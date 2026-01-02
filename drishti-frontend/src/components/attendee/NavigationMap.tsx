import {
  ArrowLeft,
  Navigation,
  ChevronRight,
  MapPin,
  Locate,
  Volume2,
  VolumeX,
  Zap,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { IndianMap, INDIAN_VENUES } from "../shared/IndianMap";
import { LeafletMap } from "../shared/LeafletMap";

interface NavigationMapProps {
  gate: {
    id: string;
    name: string;
    distance: string;
    eta: string;
  };
  onBack: () => void;
}

export function NavigationMap({ gate, onBack }: NavigationMapProps) {
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Define unique route paths for each gate with waypoints
  const getRouteForGate = (gateId: string) => {
    const routes = {
      A: {
        path: [
          { x: 15, y: 85 },
          { x: 25, y: 75 },
          { x: 35, y: 65 },
          { x: 45, y: 55 },
          { x: 50, y: 45 },
        ],
        waypoints: [
          { x: 15, y: 85, label: "Start", distance: "0m" },
          { x: 25, y: 75, label: "Beach Rd", distance: "250m" },
          { x: 35, y: 65, label: "Junction", distance: "450m" },
          { x: 45, y: 55, label: "Main St", distance: "650m" },
          { x: 50, y: 45, label: "Gate A", distance: "850m" },
        ],
        color: "#ef4444",
        instruction: "Straight on Beach Rd, turn right at junction",
      },
      B: {
        path: [
          { x: 15, y: 85 },
          { x: 12, y: 75 },
          { x: 18, y: 65 },
          { x: 28, y: 55 },
          { x: 40, y: 48 },
          { x: 55, y: 42 },
          { x: 68, y: 38 },
        ],
        waypoints: [
          { x: 15, y: 85, label: "Start", distance: "0m" },
          { x: 12, y: 75, label: "North Path", distance: "180m" },
          { x: 28, y: 55, label: "Garden", distance: "450m" },
          { x: 55, y: 42, label: "Bridge", distance: "780m" },
          { x: 68, y: 38, label: "Gate B", distance: "1.1km" },
        ],
        color: "#10b981",
        instruction: "Via scenic north route through garden area",
      },
      C: {
        path: [
          { x: 15, y: 85 },
          { x: 22, y: 78 },
          { x: 32, y: 70 },
          { x: 42, y: 62 },
          { x: 48, y: 52 },
        ],
        waypoints: [
          { x: 15, y: 85, label: "Start", distance: "0m" },
          { x: 22, y: 78, label: "VIP Lane", distance: "150m" },
          { x: 32, y: 70, label: "Plaza", distance: "380m" },
          { x: 42, y: 62, label: "Lounge", distance: "550m" },
          { x: 48, y: 52, label: "Gate C", distance: "720m" },
        ],
        color: "#f59e0b",
        instruction: "VIP route through exclusive plaza area",
      },
    };
    return routes[gateId as keyof typeof routes] || routes["A"];
  };

  const currentRoute = getRouteForGate(gate.id);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-700 rounded-lg transition-all duration-200 text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <p className="text-slate-400 text-sm">Navigation Active</p>
                <p className="text-white">{gate.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-900/50 text-purple-200 rounded-full text-sm border border-purple-700">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              Live Navigation
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Info Bar */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Navigation className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm text-orange-100 mb-1">
                  Currently navigating to
                </p>
                <p className="text-2xl">Gate {gate.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="flex items-center gap-2 text-orange-100 text-sm mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>Distance</span>
                </div>
                <p className="text-2xl">{gate.distance}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2 text-orange-100 text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  <span>ETA</span>
                </div>
                <p className="text-2xl">{gate.eta}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative flex-1">
        {/* Leaflet Map Background with Indian Venue */}
        <div className="absolute inset-0 z-0">
          <LeafletMap
            center={[INDIAN_VENUES.pune.lat, INDIAN_VENUES.pune.lng]}
            zoom={15}
            height="100%"
            markers={[
              {
                position: [
                  INDIAN_VENUES.pune.lat + 0.002,
                  INDIAN_VENUES.pune.lng + 0.002,
                ],
                label: gate.name,
                color:
                  gate.id === "A"
                    ? "red"
                    : gate.id === "B"
                    ? "green"
                    : "orange",
              },
              {
                position: [INDIAN_VENUES.pune.lat, INDIAN_VENUES.pune.lng],
                label: "Your Location",
                color: "blue",
              },
              {
                position: [
                  INDIAN_VENUES.pune.lat + 0.001,
                  INDIAN_VENUES.pune.lng + 0.003,
                ],
                label: "Main Entrance",
                color: "purple",
              },
            ]}
          />
        </div>

        {/* Semi-transparent overlay for better route visibility */}
        <div className="absolute inset-0 z-5 bg-slate-900/20 backdrop-blur-[1px]" />

        {/* Route Overlay with Dotted Path and Distance Markers */}
        <svg
          className="absolute inset-0 pointer-events-none z-10"
          width="100%"
          height="100%"
        >
          <defs>
            <marker
              id="route-arrow"
              markerWidth="10"
              markerHeight="10"
              refX="5"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill={currentRoute.color} />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Animated route path */}
          <g className="animate-in fade-in duration-700">
            {/* Glow effect under route */}
            <path
              d={currentRoute.path
                .map(
                  (point, i) => `${i === 0 ? "M" : "L"} ${point.x}% ${point.y}%`
                )
                .join(" ")}
              fill="none"
              stroke={currentRoute.color}
              strokeWidth="8"
              strokeDasharray="12 8"
              strokeLinecap="round"
              opacity="0.3"
              filter="url(#glow)"
            />

            {/* Main route line */}
            <path
              d={currentRoute.path
                .map(
                  (point, i) => `${i === 0 ? "M" : "L"} ${point.x}% ${point.y}%`
                )
                .join(" ")}
              fill="none"
              stroke={currentRoute.color}
              strokeWidth="5"
              strokeDasharray="12 8"
              strokeLinecap="round"
              markerEnd="url(#route-arrow)"
              className="animate-pulse"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="20"
                to="0"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>

            {/* Waypoint markers */}
            {currentRoute.waypoints.map((waypoint, idx) => (
              <g
                key={`waypoint-${idx}`}
                className="animate-in zoom-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Outer pulse circle */}
                <circle
                  cx={`${waypoint.x}%`}
                  cy={`${waypoint.y}%`}
                  r="15"
                  fill={currentRoute.color}
                  opacity="0.2"
                  className="animate-ping"
                />

                {/* Waypoint marker circle */}
                <circle
                  cx={`${waypoint.x}%`}
                  cy={`${waypoint.y}%`}
                  r="8"
                  fill="white"
                  stroke={currentRoute.color}
                  strokeWidth="4"
                  filter="url(#glow)"
                />

                {/* Inner dot */}
                <circle
                  cx={`${waypoint.x}%`}
                  cy={`${waypoint.y}%`}
                  r="3"
                  fill={currentRoute.color}
                />

                {/* Distance label */}
                <g transform={`translate(${waypoint.x}%, ${waypoint.y}%)`}>
                  <rect
                    x="-30"
                    y="-40"
                    width="60"
                    height="24"
                    rx="12"
                    fill={currentRoute.color}
                    opacity="0.95"
                    filter="drop-shadow(0 4px 8px rgba(0,0,0,0.3))"
                  />
                  <text
                    x="0"
                    y="-24"
                    textAnchor="middle"
                    fill="white"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {waypoint.distance}
                  </text>
                </g>

                {/* Waypoint label */}
                <text
                  x={`${waypoint.x}%`}
                  y={`${waypoint.y + 5}%`}
                  textAnchor="middle"
                  fill={currentRoute.color}
                  fontSize="12"
                  fontWeight="700"
                  filter="drop-shadow(0 2px 4px rgba(255,255,255,0.9))"
                >
                  {waypoint.label}
                </text>
              </g>
            ))}
          </g>
        </svg>

        {/* Floating Controls */}
        <div className="absolute top-6 right-6 flex flex-col gap-3">
          <button className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-slate-50 transition-all duration-200 group">
            <Locate className="w-6 h-6 text-slate-700 group-hover:text-blue-600" />
          </button>
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-slate-50 transition-all duration-200 group"
          >
            {voiceEnabled ? (
              <Volume2 className="w-6 h-6 text-slate-700 group-hover:text-blue-600" />
            ) : (
              <VolumeX className="w-6 h-6 text-slate-700 group-hover:text-red-600" />
            )}
          </button>
        </div>

        {/* Bottom Navigation Card */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-2xl mx-auto">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-slate-600 text-sm mb-1">In {gate.eta}</p>
                <p className="text-slate-900 text-xl mb-2">
                  {currentRoute.instruction}
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span>
                    Follow the{" "}
                    {gate.id === "A"
                      ? "red"
                      : gate.id === "B"
                      ? "green"
                      : "amber"}{" "}
                    route markers
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              <div>
                <p className="text-slate-600 text-xs mb-1">Next Turn</p>
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-900">450m</span>
                </div>
              </div>
              <div>
                <p className="text-slate-600 text-xs mb-1">Traffic</p>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-500" />
                  <span className="text-slate-900">Light</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-slate-800 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="px-6 py-3 text-white hover:bg-slate-700 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              End Navigation
            </button>
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  voiceEnabled
                    ? "bg-green-900/30 text-green-400 border border-green-700"
                    : "bg-slate-700 text-slate-400 border border-slate-600"
                }`}
              >
                {voiceEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {voiceEnabled ? "Voice guidance ON" : "Voice guidance OFF"}
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 text-blue-400 rounded-lg border border-blue-700">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <span className="text-sm">GPS Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
