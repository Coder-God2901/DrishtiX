import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Shield,
  Ticket,
  Star,
  Search,
  Filter,
  Clock,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Navigation,
  Heart,
  Radio,
  Zap,
  DollarSign,
  Activity,
  RefreshCw,
} from "lucide-react";
import { eventService, Event as APIEvent } from "../../services/event.service";
import { wsService } from "../../services/websocket.service";

// UI-specific event type with additional display properties
interface Event extends Omit<APIEvent, 'venue'> {
  venue: string; // Make venue required
  date?: string | Date;
  expectedAttendance?: number;
  currentAttendance?: number;
  safetyScore?: number;
  category?: string;
  price?: number;
  rating?: number;
  averageRating?: number;
  queueTime?: number;
  imageUrl?: string;
  image?: string;
  time?: string;
  isFree?: boolean;
  crowdStatus?: "calm" | "moderate" | "busy" | "packed";
  wheelchairAccessible?: boolean;
  parkingAvailable?: boolean;
  foodVendors?: number;
}

interface EventBrowseProps {
  onBack: () => void;
  onEventSelect: (event: Event) => void;
}

export function EventBrowse({ onBack, onEventSelect }: EventBrowseProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["all"]);
  const [events, setEvents] = useState<Event[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [sortBy, setSortBy] = useState<
    "date" | "price" | "rating" | "attendance"
  >("date");

  useEffect(() => {
    console.log("🎉 EventBrowse: Loading events from backend");
    setIsLiveConnected(true);
    loadEvents();

    // Subscribe to real-time event updates
    const handleEventUpdate = (event: Event) => {
      console.log("🎉 Event update received:", event);
      loadEvents();
      setLastUpdate(new Date());
    };

    wsService.on('event:updated', handleEventUpdate);
    wsService.on('event:created', handleEventUpdate);
    wsService.emit('subscribe:events', 'all');

    // Subscribe to real-time attendance updates
    const updateInterval = setInterval(() => {
      setEvents((prev) =>
        prev.map((event) => ({
          ...event,
          currentAttendance: event.currentAttendance
            ? event.currentAttendance + Math.floor(Math.random() * 50 - 10)
            : Math.floor(Math.random() * (event.expectedAttendance || 1000) * 0.8),
          queueTime: Math.max(
            1,
            (event.queueTime || 5) + Math.floor(Math.random() * 5 - 2)
          ),
        }))
      );
      setLastUpdate(new Date());
    }, 8000);

    return () => {
      wsService.off('event:updated', handleEventUpdate);
      wsService.off('event:created', handleEventUpdate);
      clearInterval(updateInterval);
      setIsLiveConnected(false);
    };
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await eventService.getEvents();
      if (response.success && response.data) {
        // Convert API events to UI events with default values
        const convertedEvents: Event[] = response.data.map((e) => ({
          ...e,
          date: e.startTime,
          venue: e.venue || e.location,
          expectedAttendance: e.expectedAttendees,
          currentAttendance: e.actualAttendees || Math.floor(e.expectedAttendees * 0.7),
          safetyScore: 85,
          category: 'Event',
          price: 0,
          rating: 4.5,
          averageRating: 4.5,
          queueTime: Math.floor(Math.random() * 15),
          image: '/event-placeholder.jpg',
          time: typeof e.startTime === 'string' ? new Date(e.startTime).toLocaleTimeString() : e.startTime.toLocaleTimeString(),
          isFree: true,
          crowdStatus: 'moderate' as const,
          wheelchairAccessible: true,
          parkingAvailable: true,
          foodVendors: 5
        }));
        setEvents(convertedEvents);
        setFeaturedEvents(convertedEvents.filter((e) => (e.safetyScore || 0) > 90).slice(0, 3));
        console.log(`✅ Loaded ${response.data.length} events`);
      } else {
        setError(response.error || 'Failed to load events');
        console.error('❌ Failed to load events:', response.error);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('❌ Error loading events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filters = [
    { id: "all", label: "All Events", icon: Sparkles },
    { id: "nearby", label: "Nearby", icon: MapPin },
    { id: "today", label: "Today", icon: Calendar },
    { id: "free", label: "Free", icon: Ticket },
    { id: "paid", label: "Paid", icon: TrendingUp },
    { id: "calm", label: "Low Crowd", icon: Users },
    { id: "music", label: "Music", icon: Activity },
    { id: "tech", label: "Technology", icon: Zap },
    { id: "accessible", label: "Accessible", icon: Shield },
  ];

  const toggleFilter = (filterId: string) => {
    if (filterId === "all") {
      setSelectedFilters(["all"]);
    } else {
      const newFilters = selectedFilters.filter((f) => f !== "all");
      if (selectedFilters.includes(filterId)) {
        const filtered = newFilters.filter((f) => f !== filterId);
        setSelectedFilters(filtered.length === 0 ? ["all"] : filtered);
      } else {
        setSelectedFilters([...newFilters, filterId]);
      }
    }
  };

  const filteredEvents = events
    .filter((event) => {
      // Search filter
      if (
        searchQuery &&
        !event.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(event.venue || '').toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Category filters
      if (selectedFilters.includes("all")) return true;

      if (selectedFilters.includes("today") && event.date !== "Today")
        return false;
      if (selectedFilters.includes("free") && !event.isFree) return false;
      if (selectedFilters.includes("paid") && event.isFree) return false;
      if (selectedFilters.includes("calm") && event.crowdStatus !== "calm")
        return false;
      if (selectedFilters.includes("music") && event.category !== "Music")
        return false;
      if (selectedFilters.includes("tech") && event.category !== "Technology")
        return false;
      if (selectedFilters.includes("accessible") && !event.wheelchairAccessible)
        return false;
      if (selectedFilters.includes("nearby") && parseFloat(event.location) > 5)
        return false;

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price":
          return (a.price || 0) - (b.price || 0);
        case "rating":
          return (b.averageRating || 0) - (a.averageRating || 0);
        case "attendance":
          return (b.currentAttendance || 0) - (a.currentAttendance || 0);
        default:
          return 0;
      }
    });

  const getCrowdStatusColor = (status: Event["crowdStatus"]) => {
    switch (status) {
      case "calm":
        return "bg-green-100 text-green-700";
      case "moderate":
        return "bg-blue-100 text-blue-700";
      case "busy":
        return "bg-orange-100 text-orange-700";
      case "packed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getCrowdStatusLabel = (status: Event["crowdStatus"]) => {
    switch (status) {
      case "calm":
        return "Low Crowd";
      case "moderate":
        return "Moderate";
      case "busy":
        return "Busy";
      case "packed":
        return "Very Busy";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
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
                <Sparkles className="w-6 h-6 text-indigo-600" />
                Browse Events
                {isLiveConnected && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" />
                    Live
                  </span>
                )}
              </h1>
              <p className="text-slate-600 text-sm flex items-center gap-2">
                Discover amazing events near you
                <span className="text-xs text-slate-500">
                  • Updated {lastUpdate.toLocaleTimeString()}
                </span>
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, venues, categories..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Filter className="w-5 h-5 text-slate-600" />
              <span className="text-slate-900 font-medium">Filters</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => {
                const Icon = filter.icon;
                const isSelected = selectedFilters.includes(filter.id);
                return (
                  <button
                    key={filter.id}
                    onClick={() => toggleFilter(filter.id)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                      isSelected
                        ? "bg-indigo-100 border-indigo-500 text-indigo-700"
                        : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort Options */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-medium">Sort by:</span>
              <div className="flex gap-2">
                {[
                  { value: "date", label: "Date" },
                  { value: "price", label: "Price" },
                  { value: "rating", label: "Rating" },
                  { value: "attendance", label: "Popularity" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value as any)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      sortBy === option.value
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-slate-600">
              {filteredEvents.length} event
              {filteredEvents.length !== 1 ? "s" : ""} found
            </p>
            <button
              onClick={loadEvents}
              className="flex items-center gap-2 px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Featured Events */}
        {featuredEvents.length > 0 &&
          selectedFilters.includes("all") &&
          !searchQuery && (
            <div className="mb-8">
              <h2 className="text-2xl text-slate-900 mb-4 flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                Featured Events
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventSelect(event)}
                    className="bg-white rounded-xl shadow-lg border-2 border-indigo-200 overflow-hidden hover:shadow-2xl transition-all cursor-pointer group"
                  >
                    <div className="relative h-48">
                      <img
                        src={event.image}
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-medium flex items-center gap-1">
                        <Star className="w-4 h-4 fill-white" />
                        Featured
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <p className="text-white text-sm">{event.category}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">
                        {event.name}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="w-4 h-4" />
                          <span>{event.venue}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {typeof event.date === 'string' ? event.date : event.date?.toLocaleDateString()} • {event.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-16 text-center">
            <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-slate-900 text-2xl mb-2">No events found</h3>
            <p className="text-slate-600 mb-6">
              Try adjusting your filters or search query
            </p>
            <button
              onClick={() => {
                setSelectedFilters(["all"]);
                setSearchQuery("");
              }}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => onEventSelect(event)}
                className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-2xl hover:border-indigo-300 transition-all cursor-pointer group"
              >
                {/* Event Image */}
                <div className="relative h-48">
                  <img
                    src={event.image}
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getCrowdStatusColor(
                        event.crowdStatus
                      )}`}
                    >
                      {getCrowdStatusLabel(event.crowdStatus)}
                    </span>
                    {event.currentAttendance && (
                      <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-medium flex items-center gap-1 animate-pulse">
                        <Activity className="w-3 h-3" />
                        Live
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                      <Heart className="w-5 h-5 text-slate-600" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p className="text-white text-sm font-medium">
                      {event.category}
                    </p>
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {event.name}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {event.venue} • {event.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>{typeof event.date === 'string' ? event.date : event.date?.toLocaleDateString()}</span>
                      <Clock className="w-4 h-4 flex-shrink-0 ml-2" />
                      <span>{event.time}</span>
                    </div>
                    {event.currentAttendance && (
                      <div className="flex items-center gap-2 text-slate-600 text-sm">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1">
                          {event.currentAttendance.toLocaleString()} /{" "}
                          {(event.expectedAttendance || 0).toLocaleString()} attending
                        </span>
                        <span className="text-xs text-green-600 font-medium">
                          {Math.round(
                            (event.currentAttendance /
                              (event.expectedAttendance || 1000)) *
                              100
                          )}
                          %
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Shield className="w-3 h-3 text-green-600" />
                        <p className="text-xs text-green-600 font-medium">
                          Safety
                        </p>
                      </div>
                      <p className="text-lg font-bold text-green-700">
                        {event.safetyScore}
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-2 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="w-3 h-3 text-yellow-600" />
                        <p className="text-xs text-yellow-600 font-medium">
                          Rating
                        </p>
                      </div>
                      <p className="text-lg font-bold text-yellow-700">
                        {event.averageRating}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <p className="text-xs text-blue-600 font-medium">
                          Queue
                        </p>
                      </div>
                      <p className="text-lg font-bold text-blue-700">
                        {event.queueTime}m
                      </p>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {event.parkingAvailable && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs flex items-center gap-1">
                        🅿️ Parking
                      </span>
                    )}
                    {event.wheelchairAccessible && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs flex items-center gap-1">
                        ♿ Accessible
                      </span>
                    )}
                    {(event.foodVendors || 0) > 0 && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs flex items-center gap-1">
                        🍔 {event.foodVendors} Vendors
                      </span>
                    )}
                  </div>

                  {/* Price and Action */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div>
                      {event.isFree ? (
                        <p className="text-2xl font-bold text-green-600">
                          FREE
                        </p>
                      ) : (
                        <div>
                          <p className="text-2xl font-bold text-slate-900">
                            ₹{event.price}
                          </p>
                          <p className="text-xs text-slate-600">per person</p>
                        </div>
                      )}
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 group-hover:gap-3">
                      View Details
                      <Navigation className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
