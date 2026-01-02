import { useState, useRef, useEffect } from "react";
import {
  Square,
  MapPin,
  Move,
  Trash2,
  Route,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid3x3,
  Thermometer,
  Download,
  HelpCircle,
  X,
  Plus,
  Edit2,
  Check,
  Map as MapIcon,
} from "lucide-react";
import { IndianMap, INDIAN_VENUES } from "../shared/IndianMap";
import { LeafletMap } from "../shared/LeafletMap";

interface Zone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  capacity: number;
  occupancy: number;
  color: string;
}

interface Gate {
  id: string;
  name: string;
  x: number;
  y: number;
  type: "VIP" | "Main" | "Side" | "Emergency";
  color: string;
}

type Tool = "select" | "zone" | "gate" | "route" | "delete";

interface VenueMapperViewProps {
  onBack?: () => void;
}

export function VenueMapperView({ onBack }: VenueMapperViewProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [mapType, setMapType] = useState<"none" | "google" | "leaflet">("none");
  const [zones, setZones] = useState<Zone[]>([
    {
      id: "1",
      name: "Main Stage Area",
      x: 50,
      y: 100,
      width: 150,
      height: 100,
      capacity: 5000,
      occupancy: 3500,
      color: "#f97316",
    },
    {
      id: "2",
      name: "Food Court",
      x: 250,
      y: 200,
      width: 120,
      height: 80,
      capacity: 2000,
      occupancy: 1800,
      color: "#3b82f6",
    },
    {
      id: "3",
      name: "VIP Lounge",
      x: 50,
      y: 250,
      width: 100,
      height: 80,
      capacity: 500,
      occupancy: 200,
      color: "#10b981",
    },
  ]);
  const [gates, setGates] = useState<Gate[]>([
    { id: "1", name: "VIP Gate", x: 100, y: 50, type: "VIP", color: "#10b981" },
    {
      id: "2",
      name: "Side Exit",
      x: 450,
      y: 280,
      type: "Side",
      color: "#f97316",
    },
  ]);
  const [selectedItem, setSelectedItem] = useState<{
    type: "zone" | "gate";
    id: string;
  } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [editingGate, setEditingGate] = useState<string | null>(null);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Draw zones
    zones.forEach((zone) => {
      const isSelected =
        selectedItem?.type === "zone" && selectedItem?.id === zone.id;

      // Draw zone rectangle
      ctx.fillStyle = showHeatmap
        ? `${zone.color}${Math.round((zone.occupancy / zone.capacity) * 255)
            .toString(16)
            .padStart(2, "0")}`
        : `${zone.color}40`;
      ctx.strokeStyle = isSelected ? "#3b82f6" : zone.color;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
      ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

      // Draw zone label
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        zone.name,
        zone.x + zone.width / 2,
        zone.y + zone.height / 2 - 10
      );

      ctx.font = "12px Inter, sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText(
        `${zone.occupancy.toLocaleString()} / ${zone.capacity.toLocaleString()}`,
        zone.x + zone.width / 2,
        zone.y + zone.height / 2 + 10
      );
    });

    // Draw gates
    gates.forEach((gate) => {
      const isSelected =
        selectedItem?.type === "gate" && selectedItem?.id === gate.id;

      // Draw gate circle
      ctx.fillStyle = gate.color;
      ctx.strokeStyle = isSelected ? "#3b82f6" : "#fff";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.beginPath();
      ctx.arc(gate.x, gate.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw gate label
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(gate.name, gate.x, gate.y + 25);
    });

    // Draw current drawing
    if (isDrawing && drawStart && tool === "zone") {
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(drawStart.x, drawStart.y, 100, 80);
      ctx.setLineDash([]);
    }
  }, [
    zones,
    gates,
    selectedItem,
    isDrawing,
    drawStart,
    tool,
    showGrid,
    showHeatmap,
  ]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "select") {
      // Check if clicked on a zone
      const clickedZone = zones.find(
        (zone) =>
          x >= zone.x &&
          x <= zone.x + zone.width &&
          y >= zone.y &&
          y <= zone.y + zone.height
      );
      if (clickedZone) {
        setSelectedItem({ type: "zone", id: clickedZone.id });
        return;
      }

      // Check if clicked on a gate
      const clickedGate = gates.find(
        (gate) =>
          Math.sqrt(Math.pow(x - gate.x, 2) + Math.pow(y - gate.y, 2)) <= 12
      );
      if (clickedGate) {
        setSelectedItem({ type: "gate", id: clickedGate.id });
        return;
      }

      setSelectedItem(null);
    } else if (tool === "zone") {
      const newZone: Zone = {
        id: Date.now().toString(),
        name: `Zone ${zones.length + 1}`,
        x,
        y,
        width: 100,
        height: 80,
        capacity: 1000,
        occupancy: 0,
        color: ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899"][
          zones.length % 5
        ],
      };
      setZones([...zones, newZone]);
      setSelectedItem({ type: "zone", id: newZone.id });
      setTool("select");
    } else if (tool === "gate") {
      const gateTypes: Gate["type"][] = ["VIP", "Main", "Side", "Emergency"];
      const newGate: Gate = {
        id: Date.now().toString(),
        name: `Gate ${gates.length + 1}`,
        x,
        y,
        type: gateTypes[gates.length % 4],
        color: ["#10b981", "#3b82f6", "#f97316", "#ef4444"][gates.length % 4],
      };
      setGates([...gates, newGate]);
      setSelectedItem({ type: "gate", id: newGate.id });
      setTool("select");
    } else if (tool === "delete") {
      // Delete zone or gate
      const clickedZone = zones.find(
        (zone) =>
          x >= zone.x &&
          x <= zone.x + zone.width &&
          y >= zone.y &&
          y <= zone.y + zone.height
      );
      if (clickedZone) {
        setZones(zones.filter((z) => z.id !== clickedZone.id));
        setSelectedItem(null);
        return;
      }

      const clickedGate = gates.find(
        (gate) =>
          Math.sqrt(Math.pow(x - gate.x, 2) + Math.pow(y - gate.y, 2)) <= 12
      );
      if (clickedGate) {
        setGates(gates.filter((g) => g.id !== clickedGate.id));
        setSelectedItem(null);
      }
    }
  };

  const deleteSelected = () => {
    if (!selectedItem) return;

    if (selectedItem.type === "zone") {
      setZones(zones.filter((z) => z.id !== selectedItem.id));
    } else {
      setGates(gates.filter((g) => g.id !== selectedItem.id));
    }
    setSelectedItem(null);
  };

  const updateZone = (id: string, updates: Partial<Zone>) => {
    setZones(zones.map((z) => (z.id === id ? { ...z, ...updates } : z)));
  };

  const updateGate = (id: string, updates: Partial<Gate>) => {
    setGates(gates.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  };

  const selectedZone =
    selectedItem?.type === "zone"
      ? zones.find((z) => z.id === selectedItem.id)
      : null;
  const selectedGate =
    selectedItem?.type === "gate"
      ? gates.find((g) => g.id === selectedItem.id)
      : null;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          {/* Drawing Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTool("select")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                tool === "select"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Move className="w-4 h-4" />
              Select
            </button>
            <button
              onClick={() => setTool("zone")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                tool === "zone"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Square className="w-4 h-4" />
              Zone
            </button>
            <button
              onClick={() => setTool("gate")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                tool === "gate"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <MapPin className="w-4 h-4" />
              Gate
            </button>
            <button
              onClick={() => setTool("route")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                tool === "route"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Route className="w-4 h-4" />
              Route
            </button>
            <button
              onClick={() => setTool("delete")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                tool === "delete"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-200"
            >
              <ZoomOut className="w-4 h-4 text-slate-700" />
            </button>
            <span className="px-3 py-2 bg-slate-100 rounded-lg text-slate-700 text-sm min-w-[60px] text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-200"
            >
              <ZoomIn className="w-4 h-4 text-slate-700" />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4 text-slate-700" />
            </button>

            <div className="w-px h-8 bg-slate-200 mx-2" />

            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                showGrid
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                showHeatmap
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Thermometer className="w-4 h-4" />
              Heatmap
            </button>

            <div className="w-px h-8 bg-slate-200 mx-2" />

            {/* Map Background Toggle */}
            <button
              onClick={() =>
                setMapType(
                  mapType === "none"
                    ? "leaflet"
                    : mapType === "leaflet"
                    ? "google"
                    : "none"
                )
              }
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                mapType !== "none"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <MapIcon className="w-4 h-4" />
              {mapType === "none"
                ? "No Map"
                : mapType === "google"
                ? "Google"
                : "Leaflet"}
            </button>

            <button className="flex items-center gap-2 px-3 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-200">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-3 space-y-4">
          {/* AI Assistant */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                AI Assistant
              </h3>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                {showHelp ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </button>
            </div>

            {showHelp && (
              <div className="space-y-3">
                <div className="bg-blue-50 rounded-lg p-3 text-sm">
                  <p className="text-blue-900">
                    👋 Welcome to DrishtiX Venue Mapper! I'm your AI assistant.
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Ask me anything about the venue mapper..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-500"
                />
                <div className="space-y-2">
                  <p className="text-slate-600 text-xs">Try asking:</p>
                  <button className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs text-slate-700 transition-all duration-200">
                    "How do I draw a zone?"
                  </button>
                  <button className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs text-slate-700 transition-all duration-200">
                    "What does the simulation do?"
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* System Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="text-slate-900 mb-4">System Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl text-slate-900">{gates.length}</p>
                <p className="text-slate-600 text-sm">Gates</p>
              </div>
              <div>
                <p className="text-3xl text-slate-900">{zones.length}</p>
                <p className="text-slate-600 text-sm">Zones</p>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="col-span-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-slate-900">Venue Canvas</h3>
                  <p className="text-slate-600 text-sm mt-1">
                    Draw zones, place gates, and design your venue layout
                  </p>
                </div>
                {mapType !== "none" && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs border border-green-200">
                    {mapType === "google"
                      ? "Google Map Active"
                      : "Leaflet Map Active"}
                  </span>
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-50">
              <div
                className="relative bg-white rounded-lg shadow-sm"
                style={{ width: "600px", height: "500px" }}
              >
                {/* Map Background Layer */}
                {mapType !== "none" && (
                  <div className="absolute inset-0 z-0 rounded-lg overflow-hidden">
                    {mapType === "google" ? (
                      <IndianMap
                        location={INDIAN_VENUES.mumbai}
                        height="500px"
                        showControls={false}
                        markers={[]}
                      />
                    ) : (
                      <LeafletMap
                        center={[19.0653, 72.8691]}
                        zoom={16}
                        height="500px"
                        markers={[]}
                      />
                    )}
                  </div>
                )}

                {/* Canvas Overlay Layer */}
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={500}
                  onClick={handleCanvasClick}
                  className="absolute inset-0 z-10 cursor-crosshair"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "top left",
                    background: mapType === "none" ? "white" : "transparent",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="text-slate-900 mb-4">Properties</h3>

            {!selectedItem && (
              <p className="text-slate-500 text-sm text-center py-8">
                Select a zone to edit properties
              </p>
            )}

            {selectedZone && (
              <div className="space-y-4">
                <div>
                  <label className="text-slate-700 text-sm mb-2 block">
                    Zone Name
                  </label>
                  {editingZone === selectedZone.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={selectedZone.name}
                        onChange={(e) =>
                          updateZone(selectedZone.id, { name: e.target.value })
                        }
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                      />
                      <button
                        onClick={() => setEditingZone(null)}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-all duration-200"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <p className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900">
                        {selectedZone.name}
                      </p>
                      <button
                        onClick={() => setEditingZone(selectedZone.id)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all duration-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-slate-700 text-sm mb-2 block">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={selectedZone.capacity}
                    onChange={(e) =>
                      updateZone(selectedZone.id, {
                        capacity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-slate-700 text-sm mb-2 block">
                    Occupancy
                  </label>
                  <input
                    type="number"
                    value={selectedZone.occupancy}
                    onChange={(e) =>
                      updateZone(selectedZone.id, {
                        occupancy: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-slate-700 text-sm mb-2 block">
                    Utilization
                  </label>
                  <div className="space-y-2">
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            (selectedZone.occupancy / selectedZone.capacity) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <p className="text-slate-600 text-sm">
                      {Math.round(
                        (selectedZone.occupancy / selectedZone.capacity) * 100
                      )}
                      %
                    </p>
                  </div>
                </div>

                <button
                  onClick={deleteSelected}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Zone
                </button>
              </div>
            )}

            {selectedGate && (
              <div className="space-y-4">
                <div>
                  <label className="text-slate-700 text-sm mb-2 block">
                    Gate Name
                  </label>
                  {editingGate === selectedGate.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={selectedGate.name}
                        onChange={(e) =>
                          updateGate(selectedGate.id, { name: e.target.value })
                        }
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                      />
                      <button
                        onClick={() => setEditingGate(null)}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-all duration-200"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <p className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900">
                        {selectedGate.name}
                      </p>
                      <button
                        onClick={() => setEditingGate(selectedGate.id)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all duration-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-slate-700 text-sm mb-2 block">
                    Gate Type
                  </label>
                  <select
                    value={selectedGate.type}
                    onChange={(e) =>
                      updateGate(selectedGate.id, {
                        type: e.target.value as Gate["type"],
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  >
                    <option value="VIP">VIP</option>
                    <option value="Main">Main</option>
                    <option value="Side">Side</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <button
                  onClick={deleteSelected}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Gate
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zones List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-slate-900 mb-4">Zones ({zones.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {zones.map((zone) => {
            const utilization = Math.round(
              (zone.occupancy / zone.capacity) * 100
            );
            return (
              <div
                key={zone.id}
                onClick={() => setSelectedItem({ type: "zone", id: zone.id })}
                className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  selectedItem?.type === "zone" && selectedItem?.id === zone.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: zone.color }}
                  />
                  <h4 className="text-slate-900">{zone.name}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Capacity:</span>
                    <span className="text-slate-900">
                      {zone.capacity.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Occupancy:</span>
                    <span className="text-slate-900">
                      {zone.occupancy.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Utilization:</span>
                    <span
                      className={`${
                        utilization >= 90
                          ? "text-red-600"
                          : utilization >= 70
                          ? "text-amber-600"
                          : "text-green-600"
                      }`}
                    >
                      {utilization}%
                    </span>
                  </div>
                </div>
                <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      utilization >= 90
                        ? "bg-red-500"
                        : utilization >= 70
                        ? "bg-amber-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${utilization}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
