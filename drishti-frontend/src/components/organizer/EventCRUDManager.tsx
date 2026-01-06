import { useState } from 'react';
import {
  ArrowLeft,
  Database,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  Users,
  Clock,
  Filter,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';

interface EventCRUDManagerProps {
  onBack: () => void;
}

interface Event {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string;
  venue: string;
  attendees: number;
  status: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
  capacity: number;
}

export function EventCRUDManager({ onBack }: EventCRUDManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      name: 'Summer Music Festival 2025',
      type: 'Music Festival',
      date: '2025-07-15',
      time: '15:00',
      venue: 'Vagator Beach, Goa',
      attendees: 8432,
      status: 'live',
      capacity: 10000
    },
    {
      id: '2',
      name: 'Tech Conference 2025',
      type: 'Conference',
      date: '2025-08-20',
      time: '09:00',
      venue: 'Convention Center, Bangalore',
      attendees: 2500,
      status: 'scheduled',
      capacity: 3000
    },
    {
      id: '3',
      name: 'Food & Wine Festival',
      type: 'Food Festival',
      date: '2025-09-10',
      time: '12:00',
      venue: 'Marine Drive, Mumbai',
      attendees: 0,
      status: 'draft',
      capacity: 5000
    },
    {
      id: '4',
      name: 'Marathon 2025',
      type: 'Sports',
      date: '2025-06-01',
      time: '06:00',
      venue: 'City Stadium, Delhi',
      attendees: 5200,
      status: 'completed',
      capacity: 5000
    },
    {
      id: '5',
      name: 'Art Exhibition',
      type: 'Exhibition',
      date: '2025-10-15',
      time: '10:00',
      venue: 'National Gallery, Kolkata',
      attendees: 0,
      status: 'scheduled',
      capacity: 2000
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-700';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'live':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-purple-100 text-purple-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <Activity className="w-4 h-4 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteEvent = (id: string) => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      setEvents(events.filter(e => e.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-slate-900 flex items-center gap-2">
                <Database className="w-6 h-6 text-indigo-600" />
                Event CRUD Manager
              </h1>
              <p className="text-slate-600 text-sm">Create, read, update, and delete event information</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <Database className="w-8 h-8 text-blue-600 mb-3" />
            <p className="text-2xl text-slate-900 mb-1">{events.length}</p>
            <p className="text-slate-600 text-sm">Total Events</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <Activity className="w-8 h-8 text-green-600 mb-3 animate-pulse" />
            <p className="text-2xl text-slate-900 mb-1">{events.filter(e => e.status === 'live').length}</p>
            <p className="text-slate-600 text-sm">Live Now</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <Calendar className="w-8 h-8 text-blue-600 mb-3" />
            <p className="text-2xl text-slate-900 mb-1">{events.filter(e => e.status === 'scheduled').length}</p>
            <p className="text-slate-600 text-sm">Scheduled</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <CheckCircle className="w-8 h-8 text-purple-600 mb-3" />
            <p className="text-2xl text-slate-900 mb-1">{events.filter(e => e.status === 'completed').length}</p>
            <p className="text-slate-600 text-sm">Completed</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <Users className="w-8 h-8 text-indigo-600 mb-3" />
            <p className="text-2xl text-slate-900 mb-1">{events.reduce((sum, e) => sum + e.attendees, 0).toLocaleString()}</p>
            <p className="text-slate-600 text-sm">Total Attendees</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by name, venue, or type..."
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-600" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm text-slate-600">Event Name</th>
                  <th className="px-6 py-4 text-left text-sm text-slate-600">Type</th>
                  <th className="px-6 py-4 text-left text-sm text-slate-600">Date & Time</th>
                  <th className="px-6 py-4 text-left text-sm text-slate-600">Venue</th>
                  <th className="px-6 py-4 text-left text-sm text-slate-600">Attendees</th>
                  <th className="px-6 py-4 text-left text-sm text-slate-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEvents.map(event => (
                  <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-slate-900">{event.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-600 text-sm">{event.type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600 text-sm">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                        <Clock className="w-3 h-3" />
                        {event.time}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600 text-sm">
                        <MapPin className="w-4 h-4" />
                        {event.venue}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900">{event.attendees.toLocaleString()}</div>
                      <div className="text-slate-500 text-xs">/ {event.capacity.toLocaleString()} capacity</div>
                      <div className="w-full bg-slate-200 rounded-full h-1 mt-1">
                        <div
                          className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                          style={{ width: `${(event.attendees / event.capacity) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(event.status)} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(event.status)}
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
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

          {filteredEvents.length === 0 && (
            <div className="p-12 text-center">
              <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-slate-900 text-lg mb-2">No events found</h3>
              <p className="text-slate-600 mb-6">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first event'}
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Event
                </button>
              )}
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-slate-900 text-2xl">Create New Event</h2>
                <p className="text-slate-600 text-sm mt-1">Fill in the details to create a new event</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-700 mb-2">Event Name</label>
                    <input
                      type="text"
                      placeholder="Enter event name"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 mb-2">Event Type</label>
                      <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>Music Festival</option>
                        <option>Conference</option>
                        <option>Sports</option>
                        <option>Exhibition</option>
                        <option>Food Festival</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-2">Capacity</label>
                      <input
                        type="number"
                        placeholder="Max attendees"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 mb-2">Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-2">Time</label>
                      <input
                        type="time"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-2">Venue</label>
                    <input
                      type="text"
                      placeholder="Enter venue location"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Create Event
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
