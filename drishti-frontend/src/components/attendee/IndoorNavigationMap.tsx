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
  Users,
  DoorOpen,
  UtensilsCrossed,
  Heart,
  Waves,
} from "lucide-react";
import { useState } from "react";
import { INDIAN_VENUES } from "../shared/IndianMap";
import { RealTimeNotifications } from "../shared/RealTimeNotifications";
import { LeafletMap } from "../shared/LeafletMap";

interface IndoorNavigationMapProps {
  location: {
    name: string;
    distance: string;
    waitTime: string;
    category: string;
  };
  onBack: () => void;
}

export function IndoorNavigationMap({
  location,
  onBack,
}: IndoorNavigationMapProps) {
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Define zones with custom colors and markers
  const zones = [
    {
      id: "gate-a",
      name: "Gate A",
      icon: DoorOpen,
      x: "15%",
      y: "80%",
      color: "from-emerald-500 to-green-600",
      markerColor: "bg-emerald-500",
      borderColor: "border-emerald-300",
      status: "✓ Open - Low Queue",
      statusColor: "text-emerald-300",
    },
    {
      id: "gate-b",
      name: "Gate B",
      icon: DoorOpen,
      x: "85%",
      y: "75%",
      color: "from-amber-500 to-yellow-600",
      markerColor: "bg-amber-500",
      borderColor: "border-amber-300",
      status: "⚠ Medium Queue",
      statusColor: "text-amber-300",
    },
    {
      id: "gate-c",
      name: "Gate C",
      icon: DoorOpen,
      x: "50%",
      y: "90%",
      color: "from-red-500 to-rose-600",
      markerColor: "bg-red-500",
      borderColor: "border-red-300",
      status: "⛔ Congested",
      statusColor: "text-red-300",
    },
    {
      id: "main-stage",
      name: "Main Stage",
      icon: MapPin,
      x: "50%",
      y: "15%",
      color: "from-purple-500 to-fuchsia-600",
      markerColor: "bg-purple-500",
      borderColor: "border-purple-300",
      status: "🎵 Live Performance",
      statusColor: "text-purple-300",
    },
    {
      id: "food-court",
      name: "Food Court",
      icon: UtensilsCrossed,
      x: "75%",
      y: "30%",
      color: "from-orange-500 to-red-500",
      markerColor: "bg-orange-500",
      borderColor: "border-orange-300",
      status: "🍔 ~5 min wait",
      statusColor: "text-orange-300",
    },
    {
      id: "medical",
      name: "Medical Station",
      icon: Heart,
      x: "10%",
      y: "20%",
      color: "from-rose-500 to-pink-600",
      markerColor: "bg-rose-500",
      borderColor: "border-rose-300",
      status: "🏥 Available 24/7",
      statusColor: "text-rose-300",
    },
    {
      id: "restrooms",
      name: "Restrooms",
      icon: Waves,
      x: "15%",
      y: "45%",
      color: "from-blue-500 to-cyan-600",
      markerColor: "bg-blue-500",
      borderColor: "border-blue-300",
      status: "🚻 Low queue",
      statusColor: "text-blue-300",
    },
    {
      id: "zone-b",
      name: "Zone B",
      icon: MapPin,
      x: "35%",
      y: "55%",
      color: "from-teal-500 to-emerald-600",
      markerColor: "bg-teal-500",
      borderColor: "border-teal-300",
      status: "✨ Safe Path",
      statusColor: "text-teal-300",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Real-time Notifications */}
      <RealTimeNotifications />
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
                <p className="text-slate-400 text-sm">
                  Indoor Navigation Active
                </p>
                <p className="text-white">{location.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/50 text-blue-200 rounded-full text-sm border border-blue-700">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              Live Navigation
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Info Bar */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Navigation className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm text-blue-100 mb-1">
                  Currently navigating to
                </p>
                <p className="text-2xl">{location.name}</p>
                <p className="text-blue-100 text-sm mt-1">
                  {location.category}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>Distance</span>
                </div>
                <p className="text-2xl">{location.distance}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Est. Time</span>
                </div>
                <p className="text-2xl">2 min</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container - Full Screen */}
      <div className="relative flex-1 bg-slate-900">
        {/* Full Screen Leaflet Map */}
        <div className="absolute inset-0">
          <LeafletMap
            center={[19.076, 72.8777]}
            zoom={17}
            height="100%"
            markers={zones.map((zone) => ({
              position: [
                19.076 + (parseFloat(zone.y) - 50) * 0.00012,
                72.8777 + (parseFloat(zone.x) - 50) * 0.00012,
              ] as [number, number],
              label: zone.name,
              color:
                zone.markerColor === "bg-emerald-500"
                  ? "green"
                  : zone.markerColor === "bg-amber-500"
                  ? "orange"
                  : zone.markerColor === "bg-red-500"
                  ? "red"
                  : zone.markerColor === "bg-purple-500"
                  ? "purple"
                  : zone.markerColor === "bg-orange-500"
                  ? "orange"
                  : "blue",
            }))}
          />
        </div>

        {/* Light overlay for UI contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/5 via-transparent to-slate-900/10 pointer-events-none" />

        {/* Enhanced Venue Layout with Zone Overlays */}
        <div className="absolute inset-0 p-12 pointer-events-none">
          {/* Render all zones with custom markers */}
          {zones.map((zone, index) => {
            const Icon = zone.icon;
            return (
              <div
                key={zone.id}
                className="absolute group animate-in fade-in zoom-in"
                style={{
                  left: zone.x,
                  top: zone.y,
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Zone marker with custom styling */}
                <div
                  className={`relative ${
                    zone.id === location.name.toLowerCase().replace(/\s+/g, "-")
                      ? "scale-125 z-20"
                      : "z-10"
                  }`}
                >
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${
                      zone.color
                    } rounded-xl border-2 ${
                      zone.borderColor
                    } shadow-xl flex items-center justify-center transform transition-all hover:scale-125 hover:rotate-3 cursor-pointer ${
                      zone.id ===
                      location.name.toLowerCase().replace(/\s+/g, "-")
                        ? "animate-bounce"
                        : ""
                    }`}
                    style={{
                      boxShadow:
                        "0 5px 20px rgba(0,0,0,0.3), 0 0 10px rgba(59, 130, 246, 0.5)",
                      animation:
                        zone.id ===
                        location.name.toLowerCase().replace(/\s+/g, "-")
                          ? "pulse 2s ease-in-out infinite"
                          : "",
                    }}
                  >
                    <Icon className="w-5 h-5 text-white drop-shadow-lg" />
                  </div>

                  {/* Zone info popup on hover - Enhanced */}
                  <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none w-40 z-50">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 ${zone.borderColor} rounded-xl p-3 shadow-xl backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-2 h-2 ${zone.markerColor} rounded-full animate-pulse`}
                        />
                        <p className="text-white font-bold text-xs">
                          {zone.name}
                        </p>
                      </div>
                      <p
                        className={`${zone.statusColor} text-xs mb-1 font-medium`}
                      >
                        {zone.status}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Zap className="w-2.5 h-2.5" />
                        <span>Tap for navigation</span>
                      </div>
                    </div>
                  </div>

                  {/* Animated ring indicator */}
                  <div className="absolute inset-0 -m-2">
                    <div
                      className={`w-full h-full border-2 ${zone.borderColor} rounded-xl animate-ping opacity-20`}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Target Location (Enhanced with animation) */}
          {location.name && (
            <div className="absolute top-1/2 left-1/3 animate-in zoom-in duration-500 z-20">
              <div className="relative">
                <div
                  className="w-14 h-14 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 border-2 border-white rounded-2xl flex items-center justify-center shadow-xl"
                  style={{
                    boxShadow:
                      "0 10px 30px rgba(59, 130, 246, 0.6), 0 0 20px rgba(6, 182, 212, 0.4)",
                    animation: "pulse 2s ease-in-out infinite",
                  }}
                >
                  <div className="text-center">
                    <MapPin className="w-6 h-6 text-white mx-auto mb-0.5 animate-bounce" />
                    <p className="text-white text-xs font-bold">Target</p>
                  </div>
                </div>

                {/* Destination label - Enhanced */}
                <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-600 border-2 border-white px-3 py-1.5 rounded-xl shadow-xl">
                    <p className="text-white font-bold text-xs">
                      {location.name}
                    </p>
                    <p className="text-blue-100 text-xs">{location.category}</p>
                  </div>
                </div>

                {/* Multiple Pulsing rings for emphasis */}
                <div className="absolute inset-0 -m-2">
                  <div className="w-full h-full border-2 border-blue-400 rounded-2xl animate-ping opacity-40" />
                </div>
                <div className="absolute inset-0 -m-4">
                  <div
                    className="w-full h-full border-2 border-cyan-400 rounded-2xl animate-ping opacity-20"
                    style={{ animationDelay: "0.5s" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Your Location Marker (Enhanced Professional) */}
          <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 z-30">
            <div className="relative">
              <div
                className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center"
                style={{
                  boxShadow:
                    "0 5px 20px rgba(239, 68, 68, 0.6), 0 0 15px rgba(244, 63, 94, 0.4)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              >
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                <div className="w-2 h-2 bg-white rounded-full absolute" />
              </div>
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <div className="bg-gradient-to-r from-red-600 to-rose-600 border-2 border-white px-3 py-1.5 rounded-lg shadow-xl">
                  <p className="text-white text-xs font-bold flex items-center gap-1.5">
                    <span className="text-sm">📍</span> You are here
                  </p>
                </div>
              </div>

              {/* Multiple Pulsing location rings */}
              <div className="absolute inset-0 -m-3">
                <div className="w-full h-full border-2 border-red-400 rounded-full animate-ping opacity-30" />
              </div>
              <div className="absolute inset-0 -m-5">
                <div
                  className="w-full h-full border-2 border-rose-400 rounded-full animate-ping opacity-20"
                  style={{ animationDelay: "0.3s" }}
                />
              </div>
            </div>
          </div>

          {/* Enhanced Navigation Path with gradient and glow */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{
              filter: "drop-shadow(0 0 15px rgba(59, 130, 246, 0.8))",
            }}
          >
            <defs>
              <marker
                id="arrowhead-enhanced"
                markerWidth="14"
                markerHeight="14"
                refX="13"
                refY="7"
                orient="auto"
              >
                <polygon points="0 0, 14 7, 0 14" fill="url(#pathGradient)" />
              </marker>
              <linearGradient
                id="pathGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#3b82f6">
                  <animate
                    attributeName="stop-color"
                    values="#3b82f6; #06b6d4; #14b8a6; #3b82f6"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="50%" stopColor="#06b6d4">
                  <animate
                    attributeName="stop-color"
                    values="#06b6d4; #14b8a6; #3b82f6; #06b6d4"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="100%" stopColor="#14b8a6">
                  <animate
                    attributeName="stop-color"
                    values="#14b8a6; #3b82f6; #06b6d4; #14b8a6"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </stop>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M 50% 66% Q 45% 58%, 38% 52%"
              stroke="url(#pathGradient)"
              strokeWidth="6"
              fill="none"
              strokeDasharray="20,10"
              markerEnd="url(#arrowhead-enhanced)"
              strokeLinecap="round"
              filter="url(#glow)"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="30"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          </svg>

          {/* Zone Legend - Enhanced Professional Design */}
          <div className="absolute top-6 left-6 bg-gradient-to-br from-slate-900/98 via-slate-800/95 to-slate-900/98 backdrop-blur-md border-2 border-slate-600/50 rounded-3xl p-5 shadow-2xl max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-bold text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                Live Zone Status
              </h4>
              <div className="flex items-center gap-1 bg-green-500/20 px-3 py-1 rounded-full border border-green-400/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-300 text-xs font-medium">Live</span>
              </div>
            </div>
            <div className="space-y-3">
              {zones.slice(0, 6).map((zone) => {
                const Icon = zone.icon;
                return (
                  <div
                    key={zone.id}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-700/50 transition-all cursor-pointer group"
                  >
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${zone.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">
                        {zone.name}
                      </p>
                      <p
                        className={`${zone.statusColor} text-xs truncate font-medium`}
                      >
                        {zone.status}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-slate-400 text-xs flex items-center gap-2">
                <Zap className="w-3 h-3 text-yellow-400" />
                Tap any zone for instant navigation
              </p>
            </div>
          </div>
        </div>

        {/* Floating Controls - Enhanced Professional Design */}
        <div className="absolute top-6 right-6 flex flex-col gap-3 z-40">
          <button className="w-16 h-16 bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-200 group border-2 border-slate-200 hover:border-blue-400">
            <Locate className="w-7 h-7 text-slate-700 group-hover:text-blue-600 transition-colors" />
          </button>
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`w-16 h-16 bg-gradient-to-br rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-200 group border-2 ${
              voiceEnabled
                ? "from-green-500 to-emerald-600 border-green-300"
                : "from-slate-500 to-slate-600 border-slate-400"
            }`}
          >
            {voiceEnabled ? (
              <Volume2 className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
            ) : (
              <VolumeX className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
            )}
          </button>
        </div>

        {/* Bottom Navigation Card - Enhanced Professional */}
        <div className="absolute bottom-6 left-6 right-6 z-40">
          <div className="bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl shadow-2xl border-2 border-slate-200 p-6 max-w-3xl mx-auto backdrop-blur-sm">
            <div className="flex items-start gap-5 mb-5">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                    In 2 minutes
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-600 text-xs font-medium">
                      Active Navigation
                    </span>
                  </div>
                </div>
                <p className="text-slate-900 text-xl font-bold mb-2">
                  Walk straight past Main Stage
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span>Then turn left at the Food Court junction</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-5 border-t-2 border-slate-200">
              <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <p className="text-slate-600 text-xs mb-2 font-medium">
                  Next Turn
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Navigation className="w-5 h-5 text-blue-600" />
                  <span className="text-slate-900 text-lg font-bold">45m</span>
                </div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <p className="text-slate-600 text-xs mb-2 font-medium">
                  Crowd Level
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-slate-900 text-lg font-bold">Low</span>
                </div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                <p className="text-slate-600 text-xs mb-2 font-medium">
                  Wait Time
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-slate-900 text-lg font-bold">
                    {location.waitTime}
                  </span>
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
                  {voiceEnabled ? "Voice ON" : "Voice OFF"}
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 text-blue-400 rounded-lg border border-blue-700">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <span className="text-sm">Indoor GPS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
