import { useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Search,
  Filter,
  Clock,
  PlayCircle,
  CheckCircle2,
  FileText,
  TrendingUp,
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  capacity: string;
  attendees: number;
  status: string;
  statusColor: string;
  type: string;
}

interface OrganizerHomeProps {
  onSelectEvent?: (event: Event) => void;
  onCreateEvent?: () => void;
}

export function OrganizerHome({ onSelectEvent, onCreateEvent }: OrganizerHomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load events from API
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEvents();
      const eventsData = (response.data || []).map((e: any) => ({
        id: e.id,
        title: e.name,
        date: new Date(e.startTime).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        location: e.venue || e.location,
        capacity: e.expectedAttendees?.toLocaleString() || '0',
        attendees: e.actualAttendees || 0,
        status:
          e.status === 'ACTIVE'
            ? 'Live'
            : e.status === 'SCHEDULED'
              ? 'Scheduled'
              : e.status === 'COMPLETED'
                ? 'Completed'
                : 'Draft',
        statusColor:
          e.status === 'ACTIVE'
            ? 'emerald'
            : e.status === 'SCHEDULED'
              ? 'blue'
              : e.status === 'COMPLETED'
                ? 'purple'
                : 'slate',
        type: e.description || 'Event',
      }));
      setEvents(eventsData);
    } catch (error) {
      console.error('Failed to load events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const hasEvents = events.length > 0;
  const liveEvent = events.find((e) => e.status === 'Live');

  // If there's a live event, we avoid auto-navigation in this UI-only wrapper.

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || event.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const statusColors: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
  };

  // State A: No events exist
  if (!hasEvents) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-slate-900 text-3xl mb-4">Welcome to DrishtiX</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Create your first event and experience the power of AI-driven event management with real-time safety
              monitoring, crowd analytics, and intelligent operations control.
            </p>
            <button
              onClick={() => onCreateEvent && onCreateEvent()}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Create Your First Event
            </button>

            {/* What DrishtiX Offers */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-3">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-slate-900 mb-1">Venue Mapping</h3>
                <p className="text-slate-600 text-sm">Digital twin technology for complete venue visualization</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-slate-900 mb-1">Crowd Intelligence</h3>
                <p className="text-slate-600 text-sm">Real-time analytics and safety monitoring</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-3">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-slate-900 mb-1">Smart Operations</h3>
                <p className="text-slate-600 text-sm">AI-powered team coordination and incident response</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State B & C: Events exist - show event list
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-slate-900 text-3xl mb-2">My Events</h1>
              <p className="text-slate-600">Select an event to manage or create a new one</p>
            </div>
            <button
              onClick={() => onCreateEvent && onCreateEvent()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Create New Event
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search events by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-3 rounded-lg border transition-all duration-200 ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-blue-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('live')}
                className={`px-4 py-3 rounded-lg border transition-all duration-200 ${
                  filterStatus === 'live'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-600'
                }`}
              >
                Live
              </button>
              <button
                onClick={() => setFilterStatus('scheduled')}
                className={`px-4 py-3 rounded-lg border transition-all duration-200 ${
                  filterStatus === 'scheduled'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-blue-600'
                }`}
              >
                Scheduled
              </button>
              <button
                onClick={() => setFilterStatus('draft')}
                className={`px-4 py-3 rounded-lg border transition-all duration-200 ${
                  filterStatus === 'draft'
                    ? 'bg-slate-600 text-white border-slate-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-slate-600'
                }`}
              >
                Draft
              </button>
            </div>
          </div>
        </div>

        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => onSelectEvent && onSelectEvent(event.id)}
              className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1 overflow-hidden"
            >
              {/* Status Banner */}
              <div
                className={`px-6 py-3 border-b border-slate-100 flex items-center justify-between ${
                  event.status === 'Live' ? 'bg-emerald-50' : 'bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {event.status === 'Live' && <PlayCircle className="w-4 h-4 text-emerald-600" />}
                  {event.status === 'Scheduled' && <Clock className="w-4 h-4 text-blue-600" />}
                  {event.status === 'Draft' && <FileText className="w-4 h-4 text-slate-600" />}
                  {event.status === 'Completed' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                  <span className={`text-sm px-2 py-1 rounded-md border ${statusColors[event.statusColor]}`}>
                    {event.status}
                  </span>
                </div>
                <span className="text-slate-600 text-sm">{event.type}</span>
              </div>

              {/* Event Details */}
              <div className="p-6">
                <h3 className="text-slate-900 mb-3">{event.title}</h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <Calendar className="w-4 h-4" />
                    {event.date}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <Users className="w-4 h-4" />
                    {event.attendees.toLocaleString()} / {event.capacity} attendees
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Capacity</span>
                    <span className="text-slate-900">
                      {Math.round((event.attendees / parseInt(event.capacity.replace(',', ''))) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${
                        event.status === 'Live' ? 'from-emerald-500 to-emerald-600' : 'from-blue-500 to-indigo-600'
                      }`}
                      style={{
                        width: `${(event.attendees / parseInt(event.capacity.replace(',', ''))) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* View Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEvent && onSelectEvent(event);
                  }}
                  className="w-full py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-sm"
                >
                  Open Event Dashboard
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredEvents.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Filter className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-slate-900 mb-2">No events found</h3>
            <p className="text-slate-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
