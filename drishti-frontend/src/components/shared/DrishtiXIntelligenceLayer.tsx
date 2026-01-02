import { useState, useEffect } from "react";
import {
  AlertTriangle,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  UtensilsCrossed,
  Waves,
  Coffee,
  ShoppingBag,
  Activity,
  Zap,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Clock,
} from "lucide-react";

interface DrishtiXIntelligenceLayerProps {
  isVisible?: boolean;
}

interface SafetyAlert {
  id: string;
  zone: string;
  severity: "warning" | "caution" | "info";
  message: string;
  action: string;
}

interface ZoneEnergy {
  zone: string;
  status: "Stable" | "Energetic" | "Avoid";
  level: number;
  trend: "up" | "down" | "stable";
}

interface QueuePrediction {
  id: string;
  icon: any;
  location: string;
  currentWait: number;
  predictedWait: number;
  trend: "up" | "down" | "stable";
  category: string;
}

export function DrishtiXIntelligenceLayer({
  isVisible = true,
}: DrishtiXIntelligenceLayerProps) {
  const [activeAlert, setActiveAlert] = useState<SafetyAlert | null>(null);
  const [showEnergyPanel, setShowEnergyPanel] = useState(false);
  const [showQueueDrawer, setShowQueueDrawer] = useState(false);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);

  // Mock data - simulates real-time updates
  const [zoneEnergies, setZoneEnergies] = useState<ZoneEnergy[]>([
    { zone: "Zone A - Main Stage", status: "Avoid", level: 92, trend: "up" },
    {
      zone: "Zone B - Food Court",
      status: "Energetic",
      level: 68,
      trend: "stable",
    },
    {
      zone: "Zone C - Lounge Area",
      status: "Stable",
      level: 32,
      trend: "down",
    },
    {
      zone: "Zone D - VIP Section",
      status: "Stable",
      level: 28,
      trend: "stable",
    },
    {
      zone: "Zone E - North Gate",
      status: "Energetic",
      level: 71,
      trend: "up",
    },
    {
      zone: "Zone F - East Pavilion",
      status: "Stable",
      level: 45,
      trend: "down",
    },
  ]);

  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [energyHistory, setEnergyHistory] = useState<{
    [key: string]: number[];
  }>({});

  const [queuePredictions, setQueuePredictions] = useState<QueuePrediction[]>([
    {
      id: "1",
      icon: UtensilsCrossed,
      location: "Food Court A",
      currentWait: 24,
      predictedWait: 28,
      trend: "up",
      category: "food",
    },
    {
      id: "2",
      icon: UtensilsCrossed,
      location: "Food Court B",
      currentWait: 6,
      predictedWait: 5,
      trend: "down",
      category: "food",
    },
    {
      id: "3",
      icon: Waves,
      location: "Restroom East",
      currentWait: 12,
      predictedWait: 15,
      trend: "up",
      category: "facilities",
    },
    {
      id: "4",
      icon: Waves,
      location: "Restroom West",
      currentWait: 3,
      predictedWait: 3,
      trend: "stable",
      category: "facilities",
    },
    {
      id: "5",
      icon: Coffee,
      location: "Beverage Station",
      currentWait: 8,
      predictedWait: 6,
      trend: "down",
      category: "beverage",
    },
    {
      id: "6",
      icon: ShoppingBag,
      location: "Merchandise Booth",
      currentWait: 18,
      predictedWait: 22,
      trend: "up",
      category: "merch",
    },
  ]);

  // Simulate smart alerts
  useEffect(() => {
    const alertTimer = setTimeout(() => {
      setActiveAlert({
        id: "alert-1",
        zone: "Zone C",
        severity: "warning",
        message: "Zone C ahead is congested",
        action: "Redirecting you to safer path",
      });
    }, 3000);

    return () => clearTimeout(alertTimer);
  }, []);

  // Simulate data updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update zone energies slightly with more realistic logic
      setZoneEnergies((prev) =>
        prev.map((zone) => {
          const change = (Math.random() - 0.5) * 8;
          const newLevel = Math.max(20, Math.min(95, zone.level + change));
          const newTrend = change > 2 ? "up" : change < -2 ? "down" : "stable";
          const newStatus =
            newLevel > 75 ? "Avoid" : newLevel > 50 ? "Energetic" : "Stable";

          // Update history
          setEnergyHistory((prevHistory) => ({
            ...prevHistory,
            [zone.zone]: [...(prevHistory[zone.zone] || []), newLevel].slice(
              -10
            ),
          }));

          return {
            ...zone,
            level: Math.round(newLevel),
            trend: newTrend,
            status: newStatus,
          };
        })
      );

      // Update queue predictions
      setQueuePredictions((prev) =>
        prev.map((queue) => ({
          ...queue,
          currentWait: Math.max(
            2,
            Math.round(queue.currentWait + (Math.random() - 0.5) * 4)
          ),
          predictedWait: Math.max(
            2,
            Math.round(queue.predictedWait + (Math.random() - 0.5) * 3)
          ),
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Stable":
        return "bg-green-100 text-green-700 border-green-300";
      case "Energetic":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "Avoid":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      case "stable":
        return <Minus className="w-4 h-4 text-slate-400" />;
      default:
        return null;
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* 1. SMART SAFETY ALERT - Top Floating Banner */}
      {activeAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in slide-in-from-top duration-500">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-2xl p-4 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-lg mb-1">{activeAlert.message}</p>
                <p className="text-orange-100 text-sm">{activeAlert.action}</p>
              </div>
              <button
                onClick={() => setActiveAlert(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CROWD ENERGY INDEX - Side Panel */}
      <div className="fixed right-6 top-1/3 z-40">
        <button
          onClick={() => setShowEnergyPanel(!showEnergyPanel)}
          className="bg-white rounded-l-2xl shadow-2xl p-4 hover:bg-slate-50 transition-all duration-200 border-l-4 border-purple-500"
        >
          <div className="flex flex-col items-center gap-2">
            {showEnergyPanel ? (
              <ChevronUp className="w-6 h-6 text-purple-600" />
            ) : (
              <>
                <Activity className="w-6 h-6 text-purple-600 animate-pulse" />
                <span className="text-xs font-bold text-purple-600 transform -rotate-90 whitespace-nowrap origin-center mt-8">
                  Energy Index
                </span>
              </>
            )}
          </div>
        </button>

        {showEnergyPanel && (
          <div className="fixed right-6 top-24 w-96 bg-white rounded-2xl shadow-2xl border-2 border-slate-200 overflow-hidden animate-in slide-in-from-right duration-300 z-50">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-6 h-6" />
                  <h3 className="text-xl font-black">Crowd Energy Index</h3>
                </div>
                <button
                  onClick={() => setShowEnergyPanel(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-purple-100 text-sm font-medium">
                Real-time zone stress levels & predictions
              </p>
            </div>

            <div className="p-5 max-h-[32rem] overflow-y-auto">
              <div className="space-y-4">
                {zoneEnergies.map((zone, index) => (
                  <div
                    key={index}
                    onClick={() =>
                      setSelectedZone(
                        selectedZone === zone.zone ? null : zone.zone
                      )
                    }
                    className={`bg-slate-50 rounded-xl p-4 border-2 transition-all duration-200 cursor-pointer ${
                      selectedZone === zone.zone
                        ? "border-purple-400 bg-purple-50 shadow-md"
                        : "border-slate-200 hover:border-purple-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-bold text-sm">
                          {zone.zone}
                        </span>
                        {getTrendIcon(zone.trend)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 text-sm font-bold">
                          {zone.level}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1">
                        <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full transition-all duration-500 ${
                              zone.status === "Avoid"
                                ? "bg-gradient-to-r from-red-500 to-red-600"
                                : zone.status === "Energetic"
                                ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                : "bg-gradient-to-r from-green-500 to-emerald-500"
                            }`}
                            style={{ width: `${zone.level}%` }}
                          />
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border-2 ${getStatusColor(
                          zone.status
                        )}`}
                      >
                        {zone.status}
                      </span>
                    </div>

                    {selectedZone === zone.zone && energyHistory[zone.zone] && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-600 font-semibold">
                            Energy Trend (Last 10 updates)
                          </span>
                          <Zap className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex items-end gap-1 h-16">
                          {energyHistory[zone.zone].map((val, idx) => (
                            <div
                              key={idx}
                              className="flex-1 bg-purple-200 rounded-t transition-all"
                              style={{
                                height: `${val}%`,
                                backgroundColor:
                                  val > 75
                                    ? "#ef4444"
                                    : val > 50
                                    ? "#f59e0b"
                                    : "#10b981",
                              }}
                            />
                          ))}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-slate-600 font-medium">
                              Stable
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                            <span className="text-slate-600 font-medium">
                              Busy
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <span className="text-slate-600 font-medium">
                              Avoid
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-800 font-medium">
                            {zone.status === "Avoid" &&
                              "⚠️ Consider avoiding this zone or wait for the crowd to thin out."}
                            {zone.status === "Energetic" &&
                              "💡 This zone is moderately busy. Expect some wait times."}
                            {zone.status === "Stable" &&
                              "✅ This zone has comfortable crowd levels. Good time to visit!"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <p className="text-sm text-slate-900 font-black">
                    AI-Powered Insights
                  </p>
                </div>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  Powered by DrishtiX AI • Updates every 5 seconds • Click zones
                  for detailed trends
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. QUEUE FORECASTING - Bottom Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          {showQueueDrawer && (
            <div className="bg-white rounded-t-3xl shadow-2xl border-t-4 border-blue-500 mb-0 animate-in slide-in-from-bottom duration-300">
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-slate-900 text-lg">
                        Queue Intelligence
                      </h3>
                      <p className="text-slate-600 text-sm">
                        Live + AI predictions
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowQueueDrawer(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    <ChevronDown className="w-5 h-5 text-slate-600" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {queuePredictions.map((queue) => {
                    const Icon = queue.icon;
                    const isShortWait = queue.currentWait < 10;

                    return (
                      <div
                        key={queue.id}
                        className={`rounded-xl p-4 border-2 transition-all ${
                          isShortWait
                            ? "bg-green-50 border-green-300 shadow-lg shadow-green-100"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              isShortWait ? "bg-green-100" : "bg-slate-100"
                            }`}
                          >
                            <Icon
                              className={`w-6 h-6 ${
                                isShortWait
                                  ? "text-green-600"
                                  : "text-slate-600"
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-slate-900 mb-1">
                              {queue.location}
                            </p>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-lg ${
                                  isShortWait
                                    ? "text-green-600"
                                    : "text-slate-900"
                                }`}
                              >
                                {Math.round(queue.currentWait)} mins
                              </span>
                              {getTrendIcon(queue.trend)}
                              {isShortWait && (
                                <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                                  Quick!
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowQueueDrawer(!showQueueDrawer)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-t-2xl shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <Clock className="w-5 h-5" />
            <span>Queue Predictions</span>
            {showQueueDrawer ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* 4. HEATMAP TOGGLE - Floating Button */}
      <div className="fixed left-6 bottom-28 z-40">
        <button
          onClick={() => setHeatmapEnabled(!heatmapEnabled)}
          className={`px-4 py-3 rounded-2xl shadow-2xl transition-all duration-300 flex items-center gap-3 ${
            heatmapEnabled
              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
              : "bg-white text-slate-900 border-2 border-slate-300"
          }`}
        >
          {heatmapEnabled ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
          <span className="text-sm">Crowd Density View</span>
        </button>

        {heatmapEnabled && (
          <div className="absolute left-0 bottom-full mb-4 w-64 bg-white rounded-2xl shadow-2xl p-4 border border-slate-200 animate-in slide-in-from-bottom duration-300">
            <h4 className="text-slate-900 text-sm mb-3">Density Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-400 to-blue-500" />
                <span className="text-sm text-slate-700">Safe - Low crowd</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-400" />
                <span className="text-sm text-slate-700">
                  Crowded - Be aware
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-red-500 to-red-600" />
                <span className="text-sm text-slate-700">
                  Danger - Avoid area
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200">
              <p className="text-xs text-slate-600 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Live data from DrishtiX sensors
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Overlay Effect (visual indication) */}
      {heatmapEnabled && (
        <div className="fixed inset-0 pointer-events-none z-30 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-yellow-500/5 to-red-500/5" />
        </div>
      )}

      {/* Bottom attribution */}
      <div className="fixed bottom-4 right-6 z-30">
        <div className="bg-slate-900/90 backdrop-blur-sm px-3 py-2 rounded-full text-white text-xs flex items-center gap-2 shadow-xl">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span>Protected by DrishtiX AI</span>
        </div>
      </div>
    </>
  );
}
