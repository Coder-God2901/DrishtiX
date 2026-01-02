import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Radio,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  MapPin,
  Activity,
  Star,
  MoreVertical,
  UserPlus,
  RefreshCw,
  Download,
  MessageSquare,
  Award,
  TrendingUp,
} from "lucide-react";
import { volunteerService, Volunteer } from "../../services/volunteer.service";
import { wsService } from "../../services/websocket.service";

interface VolunteerManagementProps {
  onBack?: () => void;
  eventId?: string; // Add eventId prop
}

export function VolunteerManagement({ onBack, eventId = 'default-event-id' }: VolunteerManagementProps) {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "available" | "assigned" | "break" | "offline"
  >("all");
  const [filterZone, setFilterZone] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "tasks" | "rating">("name");
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(
    null
  );

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    zone: "",
    contactNumber: "",
    skills: [] as string[],
  });
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    console.log("👥 VolunteerManagement: Loading volunteers for event:", eventId);
    setIsLiveConnected(true);
    loadVolunteers();

    // Subscribe to real-time volunteer updates via WebSocket
    wsService.on('volunteer:updated', handleVolunteerUpdate);
    wsService.on('volunteer:location-updated', handleLocationUpdate);
    wsService.on('volunteer:task-assigned', handleTaskUpdate);

    // Join event room for volunteer updates
    wsService.emit('subscribe:volunteers', eventId);

    return () => {
      wsService.off('volunteer:updated', handleVolunteerUpdate);
      wsService.off('volunteer:location-updated', handleLocationUpdate);
      wsService.off('volunteer:task-assigned', handleTaskUpdate);
      setIsLiveConnected(false);
    };
  }, [eventId]);

  const handleVolunteerUpdate = (volunteer: Volunteer) => {
    console.log("👥 Volunteer update received:", volunteer);
    setVolunteers(prev => {
      const index = prev.findIndex(v => v.id === volunteer.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = volunteer;
        return updated;
      } else {
        return [...prev, volunteer];
      }
    });
    setLastUpdate(new Date());
  };

  const handleLocationUpdate = (data: { volunteerId: string; location: any }) => {
    console.log("📍 Volunteer location update:", data);
    setVolunteers(prev => prev.map(v => 
      v.id === data.volunteerId ? { ...v, location: data.location } : v
    ));
    setLastUpdate(new Date());
  };

  const handleTaskUpdate = (data: any) => {
    console.log("✅ Task update received:", data);
    loadVolunteers(); // Reload to get updated task info
  };

  const loadVolunteers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await volunteerService.getVolunteers({ eventId });
      if (response.success && response.data) {
        setVolunteers(response.data);
        console.log(`✅ Loaded ${response.data.length} volunteers`);
      } else {
        setError(response.error || 'Failed to load volunteers');
        console.error('❌ Failed to load volunteers:', response.error);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('❌ Error loading volunteers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const zones = Array.from(new Set(volunteers.map((v) => v.zone)));
  const roles = Array.from(new Set(volunteers.map((v) => v.role)));

  const filteredVolunteers = volunteers
    .filter((volunteer) => {
      const matchesSearch =
        volunteer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        volunteer.role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || volunteer.status === filterStatus;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const stats = {
    total: volunteers.length,
    available: volunteers.filter((v) => v.status === "available").length,
    assigned: volunteers.filter((v) => v.status === "assigned").length,
    onBreak: volunteers.filter((v) => v.status === "break").length,
    offline: volunteers.filter((v) => v.status === "offline").length,
  };

  const handleAddVolunteer = async () => {
    if (
      !formData.name ||
      !formData.role ||
      !formData.contactNumber
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await volunteerService.createVolunteer({
        eventId,
        userId: 'temp-user-' + Date.now(), // TODO: Get from auth context
        name: formData.name,
        email: formData.contactNumber + '@event.local', // TODO: Get real email
        phone: formData.contactNumber,
        role: formData.role,
        status: "offline",
        skills: formData.skills,
      });

      if (response.success) {
        await loadVolunteers();
        setShowAddModal(false);
        resetForm();
        console.log('✅ Volunteer created successfully');
      } else {
        alert(response.error || 'Failed to create volunteer');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateVolunteer = async () => {
    if (!selectedVolunteer) return;

    setIsLoading(true);
    try {
      const response = await volunteerService.updateVolunteer(selectedVolunteer.id, {
        name: formData.name,
        role: formData.role,
        phone: formData.contactNumber,
        skills: formData.skills,
      });

      if (response.success) {
        await loadVolunteers();
        setShowEditModal(false);
        resetForm();
        console.log('✅ Volunteer updated successfully');
      } else {
        alert(response.error || 'Failed to update volunteer');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVolunteer = async () => {
    if (!selectedVolunteer) return;

    if (!confirm(`Are you sure you want to delete volunteer "${selectedVolunteer.name}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await volunteerService.deleteVolunteer(selectedVolunteer.id);
      if (response.success) {
        await loadVolunteers();
        setShowDeleteModal(false);
        setSelectedVolunteer(null);
        console.log('✅ Volunteer deleted successfully');
      } else {
        alert(response.error || 'Failed to delete volunteer');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignTask = async (volunteerId: string) => {
    const taskDescription = prompt("Enter task description:");
    if (!taskDescription) return;

    const taskType = prompt("Enter task type (e.g., 'crowd-control', 'first-aid', 'registration'):");
    if (!taskType) return;

    setIsLoading(true);
    try {
      const response = await volunteerService.assignTask(volunteerId, {
        taskType,
        description: taskDescription,
        priority: 'medium',
      });

      if (response.success) {
        await loadVolunteers();
        console.log('✅ Task assigned successfully');
      } else {
        alert(response.error || 'Failed to assign task');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (volunteerId: string, newStatus: string) => {
    setIsLoading(true);
    try {
      const response = await volunteerService.updateVolunteer(volunteerId, { 
        status: newStatus as any 
      });

      if (response.success) {
        await loadVolunteers();
        console.log(`✅ Volunteer status updated to ${newStatus}`);
      } else {
        alert(response.error || 'Failed to update status');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      zone: "",
      contactNumber: "",
      skills: [],
    });
    setSkillInput("");
  };

  const openEditModal = (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
    setFormData({
      name: volunteer.name,
      role: volunteer.role,
      zone: volunteer.zone,
      contactNumber: volunteer.contactNumber,
      skills: volunteer.skills,
    });
    setShowEditModal(true);
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const getStatusColor = (status: Volunteer["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "break":
        return "bg-yellow-100 text-yellow-700";
      case "offline":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusIcon = (status: Volunteer["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "break":
        return <Clock className="w-4 h-4" />;
      case "offline":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-slate-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Volunteer Management
                {isLiveConnected && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" />
                    Live
                  </span>
                )}
              </h1>
              <p className="text-slate-600 text-sm">
                Manage your volunteer workforce • Updated{" "}
                {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadVolunteers}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all"
              >
                <RefreshCw className="w-5 h-5 text-slate-700" />
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Add Volunteer
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Dashboard */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <p className="text-slate-600 text-sm">Total</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-green-600 animate-pulse" />
              <p className="text-slate-600 text-sm">Active</p>
            </div>
            <p className="text-2xl font-bold text-green-700">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <p className="text-slate-600 text-sm">On Break</p>
            </div>
            <p className="text-2xl font-bold text-yellow-700">
              {stats.onBreak}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-slate-600" />
              <p className="text-slate-600 text-sm">Offline</p>
            </div>
            <p className="text-2xl font-bold text-slate-700">{stats.offline}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <p className="text-slate-600 text-sm">Avg Rating</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {stats.avgRating.toFixed(1)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-slate-600 text-sm">Tasks Done</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {stats.totalTasks}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search volunteers..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="break">On Break</option>
              <option value="offline">Offline</option>
            </select>
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Zones</option>
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="tasks">Sort by Tasks</option>
              <option value="rating">Sort by Rating</option>
            </select>
          </div>
        </div>

        {/* Volunteers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Volunteer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Zone
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Tasks
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Rating
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredVolunteers.map((volunteer) => (
                  <tr
                    key={volunteer.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {volunteer.name}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                          <Phone className="w-3 h-3" />
                          {volunteer.contactNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">
                        {volunteer.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-slate-700">
                        <MapPin className="w-3 h-3" />
                        {volunteer.zone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                            volunteer.status
                          )}`}
                        >
                          {getStatusIcon(volunteer.status)}
                          {volunteer.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-slate-900 font-medium">
                          {volunteer.completedTasks}/{volunteer.assignedTasks}
                        </p>
                        <p className="text-xs text-slate-600">Completed</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium text-slate-900">
                          {volunteer.rating.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedVolunteer(volunteer);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all"
                          title="View Details"
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(volunteer)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVolunteer(volunteer);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl text-slate-900">
                {showAddModal ? "Add New Volunteer" : "Edit Volunteer"}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-slate-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter volunteer name"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-2">Role *</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Crowd Management, Medical Support"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-2">Zone *</label>
                <input
                  type="text"
                  value={formData.zone}
                  onChange={(e) =>
                    setFormData({ ...formData, zone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Section A, Main Entrance"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-2">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, contactNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-2">Skills</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addSkill()}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a skill"
                  />
                  <button
                    onClick={addSkill}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  showAddModal
                    ? setShowAddModal(false)
                    : setShowEditModal(false);
                  resetForm();
                }}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={
                  showAddModal ? handleAddVolunteer : handleUpdateVolunteer
                }
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
              >
                {showAddModal ? "Add Volunteer" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedVolunteer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-slate-200">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-2xl text-slate-900 text-center">
                Remove Volunteer?
              </h2>
            </div>
            <div className="p-6">
              <p className="text-slate-700 text-center">
                Are you sure you want to remove{" "}
                <strong>{selectedVolunteer.name}</strong> from the volunteer
                list?
              </p>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVolunteer}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedVolunteer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl text-slate-900">Volunteer Details</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  {selectedVolunteer.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedVolunteer.name}
                  </h3>
                  <p className="text-slate-600">{selectedVolunteer.role}</p>
                  <div
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm mt-2 ${getStatusColor(
                      selectedVolunteer.status
                    )}`}
                  >
                    {getStatusIcon(selectedVolunteer.status)}
                    {selectedVolunteer.status.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-600 mb-1">Zone</p>
                  <p className="text-lg font-bold text-slate-900">
                    {selectedVolunteer.zone}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-green-600 mb-1">Rating</p>
                  <p className="text-lg font-bold text-slate-900">
                    {selectedVolunteer.rating.toFixed(1)} ⭐
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-xs text-purple-600 mb-1">Tasks Assigned</p>
                  <p className="text-lg font-bold text-slate-900">
                    {selectedVolunteer.assignedTasks}
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <p className="text-xs text-amber-600 mb-1">Tasks Completed</p>
                  <p className="text-lg font-bold text-slate-900">
                    {selectedVolunteer.completedTasks}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-slate-700 font-medium mb-2">Contact</p>
                <p className="text-slate-600">
                  {selectedVolunteer.contactNumber}
                </p>
              </div>

              {selectedVolunteer.currentTask && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-slate-700 font-medium mb-2">
                    Current Task
                  </p>
                  <p className="text-slate-600">
                    {selectedVolunteer.currentTask}
                  </p>
                </div>
              )}

              <div>
                <p className="text-slate-700 font-medium mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {selectedVolunteer.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleAssignTask(selectedVolunteer.id)}
                  className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all"
                >
                  Assign Task
                </button>
                <button
                  onClick={() =>
                    handleChangeStatus(
                      selectedVolunteer.id,
                      selectedVolunteer.status === "active" ? "break" : "active"
                    )
                  }
                  className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all"
                >
                  {selectedVolunteer.status === "active"
                    ? "Set Break"
                    : "Set Active"}
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all"
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

export default VolunteerManagement;
