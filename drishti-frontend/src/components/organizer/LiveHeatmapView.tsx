import { useState, useRef, useEffect } from "react";
import {
  TrendingUp,
  Zap,
  Users,
  MapPin,
  Play,
  Pause,
  RefreshCw,
  Download,
  ChevronDown,
} from "lucide-react";

interface Zone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  congestion: number;
}

interface Route {
  id: string;
  name: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  congestion: number;
  flowRate: number;
  color: string;
  label: string;
}

interface HeatDot {
  x: number;
  y: number;
  intensity: number;
  vx: number;
  vy: number;
  color: string;
}

interface LiveHeatmapViewProps {
  onBack?: () => void;
}

export function LiveHeatmapView({ onBack }: LiveHeatmapViewProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSimulating, setIsSimulating] = useState(true);
  const [intensity, setIntensity] = useState(75);
  const [dotSize, setDotSize] = useState(4);
  const [showRoutes, setShowRoutes] = useState(true);
  const [simulationTime, setSimulationTime] = useState(0);

  // Generate many small dots for realistic heatmap
  const [heatDots, setHeatDots] = useState<HeatDot[]>(() => {
    const dots: HeatDot[] = [];

    // High density area 1 - Main Stage (350, 200)
    for (let i = 0; i < 150; i++) {
      dots.push({
        x: 350 + (Math.random() - 0.5) * 100,
        y: 200 + (Math.random() - 0.5) * 80,
        intensity: 0.8 + Math.random() * 0.2,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        color: "#ef4444",
      });
    }

    // Medium density area 2 - Main Entrance (100, 150)
    for (let i = 0; i < 80; i++) {
      dots.push({
        x: 100 + (Math.random() - 0.5) * 80,
        y: 150 + (Math.random() - 0.5) * 60,
        intensity: 0.6 + Math.random() * 0.2,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        color: "#f97316",
      });
    }

    // Medium density area 3 - Food Court (150, 360)
    for (let i = 0; i < 90; i++) {
      dots.push({
        x: 150 + (Math.random() - 0.5) * 80,
        y: 360 + (Math.random() - 0.5) * 70,
        intensity: 0.6 + Math.random() * 0.2,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        color: "#f59e0b",
      });
    }

    // Low density area 4 - VIP Area (560, 240)
    for (let i = 0; i < 40; i++) {
      dots.push({
        x: 560 + (Math.random() - 0.5) * 60,
        y: 240 + (Math.random() - 0.5) * 50,
        intensity: 0.4 + Math.random() * 0.2,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        color: "#10b981",
      });
    }

    // Very low density area 5 - Restrooms (450, 430)
    for (let i = 0; i < 30; i++) {
      dots.push({
        x: 450 + (Math.random() - 0.5) * 70,
        y: 430 + (Math.random() - 0.5) * 60,
        intensity: 0.3 + Math.random() * 0.2,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        color: "#84cc16",
      });
    }

    return dots;
  });

  const [zones, setZones] = useState<Zone[]>([
    {
      id: "1",
      name: "Main Entrance",
      x: 100,
      y: 150,
      width: 140,
      height: 100,
      congestion: 54,
    },
    {
      id: "2",
      name: "Main Stage",
      x: 350,
      y: 200,
      width: 160,
      height: 120,
      congestion: 93,
    },
    {
      id: "3",
      name: "Food Court",
      x: 150,
      y: 360,
      width: 140,
      height: 110,
      congestion: 61,
    },
    {
      id: "4",
      name: "VIP Area",
      x: 560,
      y: 240,
      width: 110,
      height: 90,
      congestion: 53,
    },
    {
      id: "5",
      name: "Restrooms",
      x: 450,
      y: 430,
      width: 130,
      height: 100,
      congestion: 31,
    },
  ]);

  const [routes, setRoutes] = useState<Route[]>([
    {
      id: "1",
      name: "Route 1",
      fromX: 170,
      fromY: 200,
      toX: 280,
      toY: 250,
      congestion: 90,
      flowRate: 63,
      color: "#f97316",
      label: "54%",
    },
    {
      id: "2",
      name: "Route 2",
      fromX: 220,
      fromY: 250,
      toX: 220,
      toY: 360,
      congestion: 55,
      flowRate: 63,
      color: "#f59e0b",
      label: "61%",
    },
    {
      id: "3",
      name: "Route 3",
      fromX: 350,
      fromY: 280,
      toX: 470,
      toY: 440,
      congestion: 56,
      flowRate: 63,
      color: "#ef4444",
      label: "89%",
    },
    {
      id: "4",
      name: "Route 4",
      fromX: 480,
      fromY: 290,
      toX: 580,
      toY: 280,
      congestion: 30,
      flowRate: 53,
      color: "#10b981",
      label: "31%",
    },
    {
      id: "5",
      name: "Route 5",
      fromX: 400,
      fromY: 320,
      toX: 600,
      toY: 320,
      congestion: 87,
      flowRate: 30,
      color: "#f97316",
      label: "53%",
    },
  ]);

  // Calculate stats from dots
  const totalDots = heatDots.length;
  const avgCongestion = Math.round(
    (heatDots.reduce((sum, dot) => sum + dot.intensity, 0) / totalDots) * 100
  );
  const avgFlowRate =
    Math.round(
      (routes.reduce((sum, r) => sum + r.flowRate, 0) / routes.length) * 10
    ) / 10;
  const totalDensity = totalDots;
  const activeZones = zones.length;

  // Simulate real-time changes with dots moving
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setSimulationTime((prev) => prev + 0.1);

      // Update dot positions and occasionally add/remove dots
      setHeatDots((prevDots) => {
        let newDots = prevDots.map((dot) => {
          // Move dots with random walk
          let newX = dot.x + dot.vx;
          let newY = dot.y + dot.vy;

          // Bounce off walls
          let newVx = dot.vx;
          let newVy = dot.vy;

          if (newX < 50 || newX > 650) newVx = -dot.vx;
          if (newY < 50 || newY > 550) newVy = -dot.vy;

          // Random velocity changes
          newVx += (Math.random() - 0.5) * 0.2;
          newVy += (Math.random() - 0.5) * 0.2;

          // Limit velocity
          newVx = Math.max(-1, Math.min(1, newVx));
          newVy = Math.max(-1, Math.min(1, newVy));

          return {
            ...dot,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            intensity: Math.max(
              0.2,
              Math.min(1, dot.intensity + (Math.random() - 0.5) * 0.1)
            ),
          };
        });

        // Randomly add or remove dots to simulate crowd changes
        if (Math.random() < 0.3 && newDots.length < 500) {
          // Add a dot in a random zone
          const zones = [
            { x: 350, y: 200, spread: 100, color: "#ef4444" },
            { x: 100, y: 150, spread: 80, color: "#f97316" },
            { x: 150, y: 360, spread: 80, color: "#f59e0b" },
          ];
          const zone = zones[Math.floor(Math.random() * zones.length)];
          newDots.push({
            x: zone.x + (Math.random() - 0.5) * zone.spread,
            y: zone.y + (Math.random() - 0.5) * zone.spread,
            intensity: 0.5 + Math.random() * 0.3,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            color: zone.color,
          });
        } else if (Math.random() < 0.2 && newDots.length > 100) {
          // Remove a random dot
          newDots.splice(Math.floor(Math.random() * newDots.length), 1);
        }

        return newDots;
      });

      setRoutes((prevRoutes) =>
        prevRoutes.map((route) => ({
          ...route,
          congestion: Math.max(
            0,
            Math.min(100, route.congestion + (Math.random() - 0.5) * 5)
          ),
          flowRate: Math.max(
            0,
            Math.min(100, route.flowRate + (Math.random() - 0.5) * 3)
          ),
        }))
      );
    }, 100); // Faster updates for smoother animation

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Draw canvas with small dots
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with dark background
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw routes first (behind dots)
    if (showRoutes) {
      routes.forEach((route) => {
        ctx.strokeStyle = route.color + "80"; // Semi-transparent
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(route.fromX, route.fromY);
        ctx.lineTo(route.toX, route.toY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw route label
        const midX = (route.fromX + route.toX) / 2;
        const midY = (route.fromY + route.toY) / 2;

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(route.label, midX, midY);
      });
    }

    // Draw zones as boxes
    zones.forEach((zone) => {
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 1;
      ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(zone.name, zone.x + 8, zone.y + 20);
    });

    // Draw heat dots - small and numerous
    heatDots.forEach((dot) => {
      const alpha = Math.round(((dot.intensity * intensity) / 100) * 255)
        .toString(16)
        .padStart(2, "0");
      ctx.fillStyle = `${dot.color}${alpha}`;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2);
      ctx.fill();

      // Add subtle glow for high intensity dots
      if (dot.intensity > 0.7) {
        const glowAlpha = Math.round(((dot.intensity * intensity) / 100) * 100)
          .toString(16)
          .padStart(2, "0");
        ctx.fillStyle = `${dot.color}${glowAlpha}`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotSize * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Add timestamp
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`Live • ${totalDots} people`, 680, 20);
  }, [heatDots, routes, zones, intensity, dotSize, showRoutes, totalDots]);

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600 text-sm">Avg Congestion</p>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-slate-900 text-3xl">{avgCongestion}%</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600 text-sm">Avg Flow Rate</p>
            <Zap className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-slate-900 text-3xl">{avgFlowRate}%</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600 text-sm">Total Density</p>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-slate-900 text-3xl">{totalDensity}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600 text-sm">Active Zones</p>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-slate-900 text-3xl">{activeZones}</p>
        </div>
      </div>

      {/* Main Heatmap */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-slate-900">Live Heatmap Visualization</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isSimulating
                  ? "bg-green-100 text-green-600 hover:bg-green-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {isSimulating ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all duration-200">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all duration-200">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 bg-slate-50">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={700}
              height={600}
              className="w-full rounded-lg shadow-lg"
            />

            {/* Crowd Density Legend */}
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3">
              <p className="text-white text-xs mb-2">Crowd Density:</p>
              <div className="flex items-center gap-2">
                <span className="text-white text-xs">Low</span>
                <div className="w-32 h-3 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 via-orange-500 to-red-500" />
                <span className="text-white text-xs">High</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sliders */}
          <div className="space-y-6">
            <div>
              <label className="text-slate-700 text-sm mb-3 block">
                Intensity
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0%</span>
                <span>{intensity}%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <label className="text-slate-700 text-sm mb-3 block">
                Dot Size
              </label>
              <input
                type="range"
                min="2"
                max="8"
                value={dotSize}
                onChange={(e) => setDotSize(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>2px</span>
                <span>{dotSize}px</span>
                <span>8px</span>
              </div>
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-4">
            <div>
              <p className="text-slate-700 text-sm mb-3">Display Options</p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRoutes}
                    onChange={(e) => setShowRoutes(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-slate-700 text-sm">Show Routes</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-slate-600 text-xs">
                Simulation Time: {simulationTime.toFixed(1)}s
              </p>
              <p className="text-slate-600 text-xs">
                Status: {isSimulating ? "Running" : "Paused"}
              </p>
              <p className="text-slate-600 text-xs">
                Total People: {totalDots}
              </p>
              <p className="text-slate-600 text-xs">
                Active Routes: {routes.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Route Congestion Details */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-slate-900 mb-4">Route Congestion Details</h3>
        <div className="space-y-3">
          {routes.map((route, index) => (
            <div key={route.id} className="flex items-center gap-4">
              <div className="w-20 text-slate-700 text-sm">
                Route {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        route.congestion >= 80
                          ? "bg-red-500"
                          : route.congestion >= 60
                          ? "bg-orange-500"
                          : route.congestion >= 40
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${route.congestion}%` }}
                    />
                  </div>
                  <span className="text-slate-700 text-sm w-12 text-right">
                    {Math.round(route.congestion)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Congestion</span>
                  <div className="flex items-center gap-4">
                    <span>Flow Rate</span>
                    <span className="text-slate-700 w-12 text-right">
                      {route.flowRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
