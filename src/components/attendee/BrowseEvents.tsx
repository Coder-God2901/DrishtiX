/**
 * Browse Events Component
 * Allows attendees to discover and join events
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiService } from '@/services/api.service';
import { Search, MapPin, Calendar, Users, TrendingUp, ArrowLeft, Filter, ChevronRight, Star } from 'lucide-react';
import { attendeeService } from '@/services/attendee.service';

interface Event {
  id: string;
  name: string;
  description: string;
  venue: string;
  startDate: string;
  endDate: string;
  status: string;
  category?: string;
  capacity?: number;
  registered?: number;
  distance?: number;
  featured?: boolean;
}

export default function BrowseEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null);
  const navigate = useNavigate();

  const categories = ['All', 'Sports', 'Concert', 'Conference', 'Festival', 'Rally', 'Exhibition'];
  const filters = [
    { value: 'all', label: 'All Events', icon: null },
    { value: 'nearby', label: 'Nearby', icon: MapPin },
    { value: 'featured', label: 'Featured', icon: Star },
    { value: 'upcoming', label: 'Upcoming', icon: Calendar },
    { value: 'trending', label: 'Trending', icon: TrendingUp },
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategory, selectedFilter, events]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      // Fetch real events from API
      const eventsData = await apiService.events.getAll();
      if (eventsData && Array.isArray(eventsData)) {
        const formattedEvents = eventsData.map((event: any) => ({
          id: event.id,
          name: event.name,
          description: event.description || '',
          venue: event.venue?.name || event.venue || 'TBA',
          startDate: event.startDate || event.startTime,
          endDate: event.endDate || event.endTime,
          status: event.status || 'SCHEDULED',
          category: event.category || event.type || 'Other',
          capacity: event.capacity || event.expectedAttendees || 1000,
          registered: event.registeredCount || event.attendeeCount || 0,
          distance: event.distance || 0,
          featured: event.featured || false,
        }));
        setEvents(formattedEvents);
        setFilteredEvents(formattedEvents);
      }
    } catch (err) {
      console.error('Fetch events error:', err);
      toast.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((e) => e.category?.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query) ||
          e.venue.toLowerCase().includes(query)
      );
    }

    // Special filters
    if (selectedFilter === 'nearby') {
      filtered = filtered.filter((e) => (e.distance || 999) < 5);
      filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    } else if (selectedFilter === 'featured') {
      filtered = filtered.filter((e) => e.featured);
    } else if (selectedFilter === 'upcoming') {
      filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    } else if (selectedFilter === 'trending') {
      filtered.sort((a, b) => (b.registered || 0) - (a.registered || 0));
    }

    setFilteredEvents(filtered);
  };

  const joinEvent = async (eventId: string) => {
    setJoiningEventId(eventId);
    try {
      const response = await attendeeService.joinEvent(eventId, {
        joinMethod: 'BROWSE',
      });

      // Narrow the type of response before accessing its properties
      if (typeof response === 'object' && response !== null && 'success' in response) {
        if ((response as any).success) {
          toast.success('Successfully joined event!');
          navigate(`/attendee/events/${eventId}/dashboard`);
        } else {
          toast.error((response as any).error || 'Failed to join event');
        }
      } else {
        toast.error('Unexpected response from server');
      }
    } catch (err: any) {
      console.error('Join event error:', err);
      toast.error(err.message || 'Failed to join event');
    } finally {
      setJoiningEventId(null);
    }
  };

  const getOccupancyPercentage = (registered: number | undefined, capacity: number | undefined) => {
    if (!registered || !capacity) return 0;
    return Math.round((registered / capacity) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Browse Events</h1>
          <div className="w-24" /> {/* Spacer for alignment */}
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search events by name, venue, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Category Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category.toLowerCase() ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(category.toLowerCase())}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => {
                  const Icon = filter.icon;
                  return (
                    <Badge
                      key={filter.value}
                      variant={selectedFilter === filter.value ? 'default' : 'outline'}
                      className="cursor-pointer flex items-center gap-1"
                      onClick={() => setSelectedFilter(filter.value)}
                    >
                      {Icon && <Icon className="h-3 w-3" />}
                      {filter.label}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
        </div>

        {/* Events List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No events found matching your criteria</p>
              <Button variant="outline" onClick={() => setSearchQuery('')} className="mt-4">
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{event.name}</CardTitle>
                        {event.featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                      </div>
                      <CardDescription>{event.description}</CardDescription>
                    </div>
                    {event.category && (
                      <Badge variant="secondary" className="ml-2">
                        {event.category}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Event Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.venue}</span>
                      {event.distance && <span className="text-xs text-primary">({event.distance} km away)</span>}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(event.startDate).toLocaleDateString()}</span>
                      <span className="text-xs">
                        {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {event.capacity && event.registered && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Users className="h-4 w-4" />
                        <span>
                          {event.registered.toLocaleString()} / {event.capacity.toLocaleString()} registered
                        </span>
                        <span className="text-xs">({getOccupancyPercentage(event.registered, event.capacity)}%)</span>
                      </div>
                    )}
                  </div>

                  {/* Occupancy Bar */}
                  {event.capacity && event.registered && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${getOccupancyPercentage(event.registered, event.capacity)}%` }}
                      />
                    </div>
                  )}

                  {/* Action Button */}
                  <Button onClick={() => joinEvent(event.id)} disabled={joiningEventId === event.id} className="w-full">
                    {joiningEventId === event.id ? (
                      'Joining...'
                    ) : (
                      <>
                        Join Event
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
