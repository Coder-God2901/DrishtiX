import { useState, useEffect } from "react";
import { dispatchService } from "../../services/dispatch.service";
import { gateControlService } from "../../services/gate-control.service";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Save,
  X,
  Users,
  MapPin,
  Shield,
  Heart,
  Radio,
  CheckCircle,
  AlertCircle,
  Eye,
  Calendar,
} from "lucide-react";

interface CRUDItem {
  id: string;
  name: string;
  type: string;
  status: string;
  details: any;
  createdAt: string;
  updatedAt: string;
}

type CRUDCategory =
  | "teams"
  | "zones"
  | "alerts"
  | "medical"
  | "security"
  | "broadcasts";

interface OrganizerCRUDPanelProps {
  onBack?: () => void;
}

export function OrganizerCRUDPanel({ onBack }: OrganizerCRUDPanelProps) {
  const [activeCategory, setActiveCategory] = useState<CRUDCategory>("teams");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Load data from API
  const [teamsData, setTeamsData] = useState<CRUDItem[]>([]);
  const [zonesData, setZonesData] = useState<CRUDItem[]>([]);

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const loadData = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const [teams, zones] = await Promise.all([
        dispatchService.getTeams(eventId),
        gateControlService.getZones(eventId)
      ]);
      
      setTeamsData((teams.data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        type: t.type,
        status: t.status,
        details: { members: t.members?.length || 0, location: t.location, shift: 'Day' },
        createdAt: new Date(t.createdAt).toISOString().split('T')[0],
        updatedAt: new Date(t.updatedAt).toISOString().split('T')[0]
      })));
      
      setZonesData((zones.data || []).map((z: any) => ({
        id: z.id,
        name: z.name,
        type: 'Zone',
        status: z.density > 70 ? 'Critical' : 'Normal',
        details: { capacity: z.capacity, currentOccupancy: z.currentOccupancy, safetyScore: z.safetyScore || 85 },
        createdAt: new Date(z.createdAt || Date.now()).toISOString().split('T')[0],
        updatedAt: new Date(z.updatedAt || Date.now()).toISOString().split('T')[0]
      })));
    } catch (error) {
      console.error('Failed to load CRUD data:', error);
    } finally {
      setLoading(false);
    }
  };
      name: "VIP Lounge",
      type: "Zone",
      status: "Normal",
      details: { capacity: 1000, currentOccupancy: 820, safetyScore: 95 },
      createdAt: "2025-01-10",
      updatedAt: "2025-01-15",
    },
  ]);

  const [alertsData, setAlertsData] = useState<CRUDItem[]>([
    {
      id: "1",
      name: "Crowd Surge Alert",
      type: "Critical",
      status: "Active",
      details: {
        location: "Main Stage",
        severity: "High",
        affectedPeople: 450,
      },
      createdAt: "2025-01-15 08:23 PM",
      updatedAt: "2025-01-15 08:23 PM",
    },
    {
      id: "2",
      name: "Medical Emergency",
      type: "Medical",
      status: "Resolved",
      details: {
        location: "Food Court",
        severity: "Medium",
        responseTime: "3 min",
      },
      createdAt: "2025-01-15 07:45 PM",
      updatedAt: "2025-01-15 08:10 PM",
    },
  ]);

  const categories = [
    { id: "teams" as CRUDCategory, label: "Teams", icon: Users, color: "blue" },
    {
      id: "zones" as CRUDCategory,
      label: "Zones",
      icon: MapPin,
      color: "green",
    },
    {
      id: "alerts" as CRUDCategory,
      label: "Alerts",
      icon: AlertCircle,
      color: "red",
    },
    {
      id: "medical" as CRUDCategory,
      label: "Medical",
      icon: Heart,
      color: "pink",
    },
    {
      id: "security" as CRUDCategory,
      label: "Security",
      icon: Shield,
      color: "purple",
    },
    {
      id: "broadcasts" as CRUDCategory,
      label: "Broadcasts",
      icon: Radio,
      color: "orange",
    },
  ];

  const getCurrentData = () => {
    switch (activeCategory) {
      case "teams":
        return teamsData;
      case "zones":
        return zonesData;
      case "alerts":
        return alertsData;
      default:
        return [];
    }
  };

  const setCurrentData = (data: CRUDItem[]) => {
    switch (activeCategory) {
      case "teams":
        setTeamsData(data);
        break;
      case "zones":
        setZonesData(data);
        break;
      case "alerts":
        setAlertsData(data);
        break;
    }
  };

  const filteredData = getCurrentData().filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      name: "",
      type: "",
      status: "Active",
      details: {},
    });
  };

  const handleEdit = (item: CRUDItem) => {
    setIsEditing(item.id);
    setFormData(item);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      const currentData = getCurrentData();
      setCurrentData(currentData.filter((item) => item.id !== id));
    }
  };

  const handleSave = () => {
    const currentData = getCurrentData();

    if (isCreating) {
      const newItem: CRUDItem = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      };
      setCurrentData([...currentData, newItem]);
      setIsCreating(false);
    } else if (isEditing) {
      setCurrentData(
        currentData.map((item) =>
          item.id === isEditing
            ? { ...formData, updatedAt: new Date().toISOString().split("T")[0] }
            : item
        )
      );
      setIsEditing(null);
    }

    setFormData({});
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(null);
    setFormData({});
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "normal":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "on break":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "resolved":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const renderForm = () => {
    if (!isCreating && !isEditing) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
            <h3 className="text-slate-900 text-xl">
              {isCreating ? "Create New Item" : "Edit Item"}
            </h3>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-slate-100 rounded-lg transition-all"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm text-slate-700 mb-2">Name</label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter name"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-2">Type</label>
              <input
                type="text"
                value={formData.type || ""}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter type"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-2">
                Status
              </label>
              <select
                value={formData.status || "Active"}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Normal">Normal</option>
                <option value="Critical">Critical</option>
                <option value="On Break">On Break</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {activeCategory === "teams" && (
              <>
                <div>
                  <label className="block text-sm text-slate-700 mb-2">
                    Members Count
                  </label>
                  <input
                    type="number"
                    value={formData.details?.members || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        details: {
                          ...formData.details,
                          members: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter member count"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.details?.location || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        details: {
                          ...formData.details,
                          location: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter location"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-2">
                    Shift
                  </label>
                  <select
                    value={formData.details?.shift || "Day"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        details: { ...formData.details, shift: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Day">Day</option>
                    <option value="Night">Night</option>
                    <option value="Full">Full</option>
                  </select>
                </div>
              </>
            )}

            {activeCategory === "zones" && (
              <>
                <div>
                  <label className="block text-sm text-slate-700 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={formData.details?.capacity || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        details: {
                          ...formData.details,
                          capacity: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter capacity"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-2">
                    Current Occupancy
                  </label>
                  <input
                    type="number"
                    value={formData.details?.currentOccupancy || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        details: {
                          ...formData.details,
                          currentOccupancy: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter current occupancy"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-2">
                    Safety Score (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.details?.safetyScore || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        details: {
                          ...formData.details,
                          safetyScore: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter safety score"
                  />
                </div>
              </>
            )}
          </div>

          <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-slate-900 text-3xl mb-2">
                Organizer CRUD Panel
              </h1>
              <p className="text-slate-600">
                Manage teams, zones, alerts, and resources
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create New
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Category Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-6">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? `bg-${category.color}-600 text-white`
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm text-slate-600">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm text-slate-600">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm text-slate-600">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm text-slate-600">
                    Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm text-slate-600">
                    Updated
                  </th>
                  <th className="px-6 py-4 text-right text-sm text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td className="px-6 py-4 text-slate-900">{item.name}</td>
                    <td className="px-6 py-4 text-slate-600">{item.type}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-lg text-sm border ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {Object.entries(item.details)
                        .slice(0, 2)
                        .map(([key, value]) => (
                          <div key={key}>
                            <span className="text-slate-500">{key}:</span>{" "}
                            {String(value)}
                          </div>
                        ))}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.updatedAt}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredData.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No items found</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-slate-600 text-sm">Total Items</p>
                <p className="text-slate-900 text-2xl">
                  {getCurrentData().length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-slate-600 text-sm">Active Items</p>
                <p className="text-slate-900 text-2xl">
                  {getCurrentData().filter((i) => i.status === "Active").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-slate-600 text-sm">Critical Items</p>
                <p className="text-slate-900 text-2xl">
                  {
                    getCurrentData().filter((i) => i.status === "Critical")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {renderForm()}
    </div>
  );
}
