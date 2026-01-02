/**
 * Gate Control Page - Live Operations
 *
 * Allows organizers to:
 * - View all venue gates with real-time status
 * - Open/Close gates with visual feedback
 * - See zone accessibility impact
 * - Monitor crowd levels at each gate
 * - Visualize changes on interactive map
 */

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  DoorOpen,
  DoorClosed,
  AlertTriangle,
  Users,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Navigation,
  Filter,
  Search,
  Layers,
  Info,
  RefreshCw,
} from "lucide-react";
import { gateControlService } from '../../services/gate-control.service';
import { wsService } from '../../services/ws.service';

interface GateControlPageProps {
  onBack: () => void;
  eventId?: string;
}

type GateStatus = "open" | "closed" | "congested";

interface Gate {
  id: string;
  name: string;
  status: GateStatus;
  connectedZones: string[];
  throughput: number; // people per hour
  currentCrowd: number; // current people count
  maxCapacity: number;
  position: { x: number; y: number }; // for map display
  lastUpdated: Date;
}

interface Zone {
  id: string;
  name: string;
  gates: string[]; // gate IDs
  isAccessible: boolean;
  color: string;
  position: { x: number; y: number; width: number; height: number };
}

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "warning" | "error" | "info";
}

export function GateControlPage({ onBack, eventId = 'default-event' }: GateControlPageProps) {
  // State
  const [gates, setGates] = useState<Gate[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);
  const [hoveredGate, setHoveredGate] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | GateStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gateToDelete, setGateToDelete] = useState<Gate | null>(null);
  const [impactedZones, setImpactedZones] = useState<string[]>([]);

  // Load gates and zones from backend
  useEffect(() => {
    const loadGateData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load gates
        const gatesResponse = await gateControlService.getGates(eventId);
        if (gatesResponse.success && gatesResponse.data) {
          // Convert API gates to UI format
          const convertedGates: Gate[] = gatesResponse.data.map(g => ({
            id: g.id,
            name: g.name,
            status: g.status.toLowerCase() as GateStatus,
            connectedZones: g.zones || [],
            throughput: g.capacity || 1000,
            currentCrowd: g.currentCount || 0,
            maxCapacity: g.maxCapacity || g.capacity || 1000,
            position: g.location ? { x: g.location.x * 100, y: g.location.y * 100 } : { x: 50, y: 50 },
            lastUpdated: typeof g.lastUpdated === 'string' ? new Date(g.lastUpdated) : g.lastUpdated || new Date()
          }));
          setGates(convertedGates);
        }

        // Load zones
        const zonesResponse = await gateControlService.getZones(eventId);
        if (zonesResponse.success && zonesResponse.data) {
          const convertedZones: Zone[] = zonesResponse.data.map((z, idx) => ({
            id: z.id,
            name: z.name,
            gates: z.gates || [],
            isAccessible: z.status === 'ACCESSIBLE',
            color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'][idx % 5],
            position: { x: 20 + idx * 15, y: 20 + idx * 10, width: 25, height: 30 }
          }));
          setZones(convertedZones);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load gate data');
        console.error('Error loading gate data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadGateData();

    // Subscribe to real-time gate updates
    wsService.on('gate:update', (data: any) => {
      setGates(prev => prev.map(g => 
        g.id === data.id ? { ...g, ...data, lastUpdated: new Date() } : g
      ));
    });

    return () => {
      wsService.off('gate:update', () => {});
    };
  }, [eventId]);

  // Calculate zone accessibility whenever gates change
  useEffect(() => {
    const updatedZones = zones.map((zone) => {
      const openGates = zone.gates.filter((gateId) => {
        const gate = gates.find((g) => g.id === gateId);
        return gate && gate.status === "open";
      });

      return {
        ...zone,
        isAccessible: openGates.length > 0,
      };
    });

    setZones(updatedZones);
  }, [gates]);

  // Show toast notification
  const showToast = (
    message: string,
    type: ToastMessage["type"] = "success"
  ) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Toggle gate status
  const toggleGateStatus = async (gateId: string) => {
    const gate = gates.find(g => g.id === gateId);
    if (!gate) return;

    const newStatus = gate.status === "open" ? "closed" : "open";
    
    try {
      // Update backend
      const response = await gateControlService.updateGateStatus(gateId, newStatus.toUpperCase() as any);
      
      if (response.success) {
        // Update local state
        setGates((prev) =>
          prev.map((g) => {
            if (g.id === gateId) {
              const updatedGate = {
                ...g,
                status: newStatus as GateStatus,
                currentCrowd: newStatus === "closed" ? 0 : g.currentCrowd,
                lastUpdated: new Date(),
              };

              // Check impacted zones
              const affected = zones.filter((z) => z.gates.includes(gateId));
              setImpactedZones(affected.map((z) => z.name));

              // Show toast
              showToast(
                `${g.name} ${newStatus === "open" ? "opened" : "closed"} successfully`,
                newStatus === "closed" ? "warning" : "success"
              );

              return updatedGate;
            }
            return g;
          })
        );
      } else {
        showToast(`Failed to update ${gate.name}`, "error");
      }
    } catch (err) {
      console.error('Error updating gate status:', err);
      showToast(`Error updating ${gate.name}`, "error");
    }
  };

  // Delete gate (with confirmation)
  const confirmDeleteGate = (gate: Gate) => {
    setGateToDelete(gate);
    setShowDeleteModal(true);
  };

  const deleteGate = async () => {
    if (!gateToDelete) return;

    try {
      const response = await gateControlService.deleteGate(gateToDelete.id);
      if (response.success) {
        setGates((prev) => prev.filter((g) => g.id !== gateToDelete.id));
        showToast(`${gateToDelete.name} deleted`, "error");
      } else {
        showToast(`Failed to delete ${gateToDelete.name}`, "error");
      }
    } catch (err) {
      console.error('Error deleting gate:', err);
      showToast(`Error deleting ${gateToDelete.name}`, "error");
    } finally {
      setShowDeleteModal(false);
      setGateToDelete(null);
    }
  };

  // Filter gates
  const filteredGates = gates.filter((gate) => {
    const matchesFilter =
      filterStatus === "all" || gate.status === filterStatus;
    const matchesSearch =
      gate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gate.connectedZones.some((z) =>
        z.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesFilter && matchesSearch;
  });

  // Get gate status color
  const getGateStatusColor = (status: GateStatus) => {
    switch (status) {
      case "open":
        return "green";
      case "closed":
        return "red";
      case "congested":
        return "orange";
    }
  };

  // Get gate status icon
  const getGateStatusIcon = (status: GateStatus) => {
    switch (status) {
      case "open":
        return <DoorOpen className="w-5 h-5" />;
      case "closed":
        return <DoorClosed className="w-5 h-5" />;
      case "congested":
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  // Get crowd level indicator
  const getCrowdLevel = (
    current: number,
    max: number
  ): { level: string; color: string; icon: React.ReactNode } => {
    const percentage = (current / max) * 100;
    if (percentage >= 90)
      return {
        level: "Critical",
        color: "red",
        icon: <TrendingUp className="w-4 h-4" />,
      };
    if (percentage >= 70)
      return {
        level: "High",
        color: "orange",
        icon: <TrendingUp className="w-4 h-4" />,
      };
    if (percentage >= 40)
      return {
        level: "Moderate",
        color: "amber",
        icon: <Minus className="w-4 h-4" />,
      };
    return {
      level: "Low",
      color: "green",
      icon: <TrendingDown className="w-4 h-4" />,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all"
              >
                <ArrowLeft className="w-6 h-6 text-slate-700" />
              </button>
              <div>
                <h1 className="text-slate-900 flex items-center gap-2">
                  <DoorOpen className="w-6 h-6 text-blue-600" />
                  Gate Control Center
                </h1>
                <p className="text-slate-600 text-sm mt-0.5">
                  Manage venue access points and monitor crowd flow
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm">
                <CheckCircle2 className="w-4 h-4" />
                {gates.filter((g) => g.status === "open").length} Gates Open
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm">
                <XCircle className="w-4 h-4" />
                {gates.filter((g) => g.status === "closed").length} Gates Closed
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Interactive Map */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  Venue Map - Gate Status
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-slate-600">Open</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-slate-600">Closed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span className="text-slate-600">Congested</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Canvas */}
              <div
                className="relative bg-gradient-to-br from-slate-100 to-slate-200"
                style={{ height: "500px" }}
              >
                {/* Zones */}
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className={`absolute border-2 rounded-lg transition-all duration-300 ${
                      zone.isAccessible
                        ? "border-slate-300 bg-white/40 backdrop-blur-sm"
                        : "border-red-300 bg-red-100/60 backdrop-blur-sm"
                    }`}
                    style={{
                      left: `${zone.position.x}%`,
                      top: `${zone.position.y}%`,
                      width: `${zone.position.width}%`,
                      height: `${zone.position.height}%`,
                    }}
                  >
                    <div className="p-3">
                      <p
                        className={`text-sm font-medium ${
                          zone.isAccessible ? "text-slate-700" : "text-red-700"
                        }`}
                      >
                        {zone.name}
                      </p>
                      {!zone.isAccessible && (
                        <div className="flex items-center gap-1 mt-1">
                          <XCircle className="w-3 h-3 text-red-600" />
                          <span className="text-xs text-red-600">
                            Inaccessible
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Gates */}
                {gates.map((gate) => {
                  const statusColor = getGateStatusColor(gate.status);
                  return (
                    <button
                      key={gate.id}
                      className={`absolute w-10 h-10 rounded-full border-4 border-white shadow-xl transition-all duration-300 hover:scale-125 flex items-center justify-center ${
                        hoveredGate === gate.id ? "scale-125 z-20" : "z-10"
                      } ${
                        statusColor === "green"
                          ? "bg-green-500"
                          : statusColor === "red"
                          ? "bg-red-500"
                          : "bg-orange-500"
                      }`}
                      style={{
                        left: `${gate.position.x}%`,
                        top: `${gate.position.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      onMouseEnter={() => setHoveredGate(gate.id)}
                      onMouseLeave={() => setHoveredGate(null)}
                      onClick={() => setSelectedGate(gate)}
                    >
                      {gate.status === "open" ? (
                        <DoorOpen className="w-5 h-5 text-white" />
                      ) : gate.status === "closed" ? (
                        <DoorClosed className="w-5 h-5 text-white" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-white" />
                      )}
                    </button>
                  );
                })}

                {/* Tooltip on hover */}
                {hoveredGate &&
                  (() => {
                    const gate = gates.find((g) => g.id === hoveredGate);
                    if (!gate) return null;

                    return (
                      <div
                        className="absolute z-30 bg-white rounded-lg shadow-2xl border-2 border-slate-200 p-4 pointer-events-none"
                        style={{
                          left: `${gate.position.x}%`,
                          top: `${gate.position.y - 10}%`,
                          transform: "translate(-50%, -100%)",
                          minWidth: "200px",
                        }}
                      >
                        <p className="font-semibold text-slate-900 mb-2">
                          {gate.name}
                        </p>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs text-white ${
                                gate.status === "open"
                                  ? "bg-green-500"
                                  : gate.status === "closed"
                                  ? "bg-red-500"
                                  : "bg-orange-500"
                              }`}
                            >
                              {gate.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <MapPin className="w-3 h-3" />
                            {gate.connectedZones.join(", ")}
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Users className="w-3 h-3" />
                            {gate.currentCrowd} / {gate.maxCapacity}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            </div>

            {/* Zone Impact Summary */}
            {impactedZones.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-lg border-2 border-amber-200 p-6 animate-in fade-in slide-in-from-bottom duration-300">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-amber-900 font-semibold mb-2">
                      Zone Impact Summary
                    </h4>
                    <div className="space-y-2">
                      {zones
                        .filter((z) => impactedZones.includes(z.name))
                        .map((zone) => (
                          <div
                            key={zone.id}
                            className="flex items-center gap-2"
                          >
                            {zone.isAccessible ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-slate-700">
                                  <strong>{zone.name}</strong> remains
                                  accessible via other gates
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-red-600" />
                                <span className="text-sm text-slate-700">
                                  <strong>{zone.name}</strong> is now
                                  inaccessible
                                </span>
                              </>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Gate Control Panel */}
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search gates or zones..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open Only</option>
                  <option value="closed">Closed Only</option>
                  <option value="congested">Congested Only</option>
                </select>
              </div>
            </div>

            {/* Gate Cards */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredGates.map((gate) => {
                const crowdInfo = getCrowdLevel(
                  gate.currentCrowd,
                  gate.maxCapacity
                );
                const statusColor = getGateStatusColor(gate.status);

                return (
                  <div
                    key={gate.id}
                    className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                      selectedGate?.id === gate.id
                        ? "border-blue-500 ring-4 ring-blue-100"
                        : "border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-slate-900 font-semibold mb-1 flex items-center gap-2">
                            {getGateStatusIcon(gate.status)}
                            {gate.name}
                          </h4>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              statusColor === "green"
                                ? "bg-green-100 text-green-700"
                                : statusColor === "red"
                                ? "bg-red-100 text-red-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {gate.status.charAt(0).toUpperCase() +
                              gate.status.slice(1)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedGate(gate)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                            title="View details"
                          >
                            <Info className="w-4 h-4 text-slate-600" />
                          </button>
                          <button
                            onClick={() => confirmDeleteGate(gate)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-all"
                            title="Delete gate"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-slate-600" />
                            <span className="text-xs text-slate-600">
                              Connected Zones
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-900">
                            {gate.connectedZones.join(", ")}
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-slate-600" />
                            <span className="text-xs text-slate-600">
                              Crowd Level
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                crowdInfo.color === "red"
                                  ? "text-red-700"
                                  : crowdInfo.color === "orange"
                                  ? "text-orange-700"
                                  : crowdInfo.color === "amber"
                                  ? "text-amber-700"
                                  : "text-green-700"
                              }`}
                            >
                              {crowdInfo.level}
                            </span>
                            {crowdInfo.icon}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {gate.status !== "closed" && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-slate-600 mb-1">
                            <span>Current Occupancy</span>
                            <span>
                              {gate.currentCrowd} / {gate.maxCapacity}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                crowdInfo.color === "red"
                                  ? "bg-red-500"
                                  : crowdInfo.color === "orange"
                                  ? "bg-orange-500"
                                  : crowdInfo.color === "amber"
                                  ? "bg-amber-500"
                                  : "bg-green-500"
                              }`}
                              style={{
                                width: `${
                                  (gate.currentCrowd / gate.maxCapacity) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Throughput */}
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                        <Clock className="w-4 h-4" />
                        <span>Throughput: {gate.throughput} people/hour</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {gate.status === "closed" ? (
                          <button
                            onClick={() => toggleGateStatus(gate.id)}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                          >
                            <DoorOpen className="w-4 h-4" />
                            Open Gate
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleGateStatus(gate.id)}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                          >
                            <DoorClosed className="w-4 h-4" />
                            Close Gate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredGates.length === 0 && (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No gates match your filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-6 py-4 rounded-xl shadow-2xl border-2 flex items-center gap-3 animate-in slide-in-from-right duration-300 ${
              toast.type === "success"
                ? "bg-green-50 border-green-200"
                : toast.type === "warning"
                ? "bg-amber-50 border-amber-200"
                : toast.type === "error"
                ? "bg-red-50 border-red-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            {toast.type === "success" && (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            )}
            {toast.type === "warning" && (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
            {toast.type === "error" && (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            {toast.type === "info" && (
              <Info className="w-5 h-5 text-blue-600" />
            )}
            <span
              className={`font-medium ${
                toast.type === "success"
                  ? "text-green-900"
                  : toast.type === "warning"
                  ? "text-amber-900"
                  : toast.type === "error"
                  ? "text-red-900"
                  : "text-blue-900"
              }`}
            >
              {toast.message}
            </span>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && gateToDelete && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in duration-200">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-slate-900 text-lg font-semibold mb-2">
                    Delete Gate?
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Are you sure you want to delete{" "}
                    <strong>{gateToDelete.name}</strong>? This will affect{" "}
                    {gateToDelete.connectedZones.length} zone(s).
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteGate}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 transition-all"
                >
                  Delete Gate
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
