/**
 * Attendee Event Dashboard
 * Main dashboard for attendees with 5 key features:
 * 1. Live Venue Map with crowd heatmap (USP 1)
 * 2. Event Schedule
 * 3. Crowd-aware Navigation (USP 4)
 * 4. Real-time Alerts (USP 2)
 * 5. SOS Emergency Button (USP 4)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Map,
  Calendar,
  Navigation,
  Bell,
  AlertTriangle,
  MapPin,
  Clock,
  Users,
  TrendingUp,
  Activity,
  Phone,
  ArrowLeft,
  Wifi,
  WifiOff,
  RefreshCw,
  Star,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { attendeeService } from '@/services/attendee.service';
import { apiService } from '@/services/api.service';
import VenueMapPanel from '../../components/attendee/VenueMapPanel';
import NavigationPanel from '../../components/attendee/NavigationPanel';
import AlertsPanel from '../../components/attendee/AlertsPanel';
import SOSButton from '../../components/attendee/SOSButton';
import SchedulePanel from '../../components/attendee/SchedulePanel';

interface EventData {
  id: string;
  name: string;
  description: string;
  venue: string;
  startDate: string;
  endDate: string;
  status: string;
  category?: string;
}

export default function EventDashboard() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [venueData, setVenueData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('map');
  const [isLoading, setIsLoading] = useState(true);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [eventRating, setEventRating] = useState(0);

  const loadEventData = useCallback(async () => {
    try {
      // Fetch real event data from API
      const response = await apiService.events.getById(eventId!);
      if (response.success && response.data) {
        const eventData = response.data;
        setEvent({
          id: eventData.id,
          name: eventData.name,
          description: eventData.description || '',
          venue: eventData.venue || eventData.location?.name || '',
          startDate: eventData.startDate || eventData.startTime,
          endDate: eventData.endDate || eventData.endTime,
          status: eventData.status || 'ONGOING',
          category: eventData.category || eventData.type,
        });
        setAttendeeCount(eventData.attendeeCount || 0);
        setEventRating(eventData.rating || 0);
        setLastUpdate(new Date());
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Load event error:', error);
      setIsConnected(false);
      toast.error('Failed to load event details');
    }
  }, [eventId]);

  const loadVenueMap = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = (await attendeeService.getVenueMap(eventId!)) as { success?: boolean; data?: any };
      if (response && response.success) {
        setVenueData(response.data);
        setLastUpdate(new Date());
        setIsConnected(true);
      }
    } catch (error: any) {
      console.error('Load venue map error:', error);
      setIsConnected(false);
      toast.error('Failed to load venue map');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  const loadAlerts = useCallback(async () => {
    try {
      // Fetch real alerts from API
      const response = await apiService.alerts.getByEvent(eventId!);
      const alertsData = response.data || response;
      if (alertsData && Array.isArray(alertsData)) {
        const formattedAlerts = alertsData.map((alert: any) => ({
          id: alert.id,
          type: alert.type || 'INFO',
          severity: alert.severity || 'LOW',
          title: alert.title || alert.message,
          message: alert.message || alert.description,
          timestamp: alert.timestamp || alert.createdAt,
        }));
        setAlerts(formattedAlerts);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Load alerts error:', error);
      setIsConnected(false);
    }
  }, [eventId]);

  const handleRefreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadEventData(), loadVenueMap(), loadAlerts()]);
      toast.success('Dashboard refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  }, [loadEventData, loadVenueMap, loadAlerts]);

  const getCrowdStatus = () => {
    if (!venueData?.crowdData) return { level: 'UNKNOWN', color: 'gray', percentage: 0 };

    const avgDensity =
      venueData.crowdData.reduce((sum: number, d: any) => sum + d.density, 0) / venueData.crowdData.length;

    if (avgDensity < 0.3) return { level: 'LOW', color: 'green', percentage: Math.round(avgDensity * 100) };
    if (avgDensity < 0.7) return { level: 'MEDIUM', color: 'yellow', percentage: Math.round(avgDensity * 100) };
    return { level: 'HIGH', color: 'red', percentage: Math.round(avgDensity * 100) };
  };

  const crowdStatus = useMemo(() => getCrowdStatus(), [venueData]);

  const timeRemaining = useMemo(() => {
    if (!event?.endDate) return 'N/A';
    const end = new Date(event.endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'Ended';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }, [event?.endDate]);

  const timeSinceUpdate = useMemo(() => {
    const diff = Date.now() - lastUpdate.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  }, [lastUpdate]);

  useEffect(() => {
    if (eventId) {
      loadEventData();
      loadVenueMap();
      loadAlerts();

      // Set up real-time updates
      const alertInterval = setInterval(loadAlerts, 30000); // Refresh every 30s
      const dataInterval = setInterval(() => {
        loadEventData();
        loadVenueMap();
      }, 60000); // Refresh data every 60s

      return () => {
        clearInterval(alertInterval);
        clearInterval(dataInterval);
      };
    }
  }, [eventId, loadEventData, loadVenueMap, loadAlerts]);

  return (
    <div className="min-h-screen bg-background dark:bg-dark-bg">
      {/* Connection Status Banner */}
      {!isConnected && (
        <div className="bg-destructive text-white px-4 py-2 text-center flex items-center justify-center gap-2">
          <XCircle className="h-4 w-4" />
          <span>Connection lost. Attempting to reconnect...</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefreshAll}
            className="text-white hover:bg-destructive/90 ml-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {isConnected && (
        <div className="bg-success-green text-white px-4 py-1 text-center flex items-center justify-center gap-2 text-sm">
          <CheckCircle className="h-3 h-3" />
          <span>Connected • Real-time updates active</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-card dark:bg-dark-surface border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/attendee/my-events')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{event?.name || <Skeleton className="h-6 w-48" />}</h1>
                  {isConnected ? (
                    <Wifi className="h-4 w-4 text-success-green animate-pulse" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-3 w-3" />
                    {event?.venue || 'Loading...'}
                  </div>
                  <Badge variant={event?.status === 'ONGOING' ? 'default' : 'secondary'}>
                    {event?.status || 'UNKNOWN'}
                  </Badge>
                  {eventRating > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{eventRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500">
                <div>Last update: {timeSinceUpdate}</div>
                <div className="text-gray-400">{attendeeCount.toLocaleString()} attendees</div>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefreshAll} disabled={refreshing} className="gap-1">
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {/* SOS Emergency Button */}
              <Button
                variant="destructive"
                size="lg"
                onClick={() => setShowSOSModal(true)}
                className="animate-pulse hover:animate-none"
              >
                <Phone className="h-5 w-5 mr-2" />
                SOS Emergency
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Crowd Level</p>
                      <p className={`text-2xl font-bold text-${crowdStatus.color}-600`}>{crowdStatus.level}</p>
                    </div>
                    <Activity className={`h-8 w-8 text-${crowdStatus.color}-600`} />
                  </div>
                  <Progress value={crowdStatus.percentage} className="h-2" />
                  <p className="text-xs text-gray-500">{crowdStatus.percentage}% capacity</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Alerts</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{alerts.length}</p>
                      {alerts.length > 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Bell className={`h-8 w-8 text-primary ${alerts.length > 0 ? 'animate-bounce' : ''}`} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Occupancy</p>
                      <p className="text-2xl font-bold">{crowdStatus.percentage}%</p>
                    </div>
                    <Users className="h-8 w-8 text-accent" />
                  </div>
                  <p className="text-xs text-gray-500">{attendeeCount.toLocaleString()} people</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Time Left</p>
                    <p className="text-2xl font-bold">{timeRemaining}</p>
                  </div>
                  <Clock className="h-8 w-8 text-warning-amber" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Map</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="navigation" className="flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              <span className="hidden sm:inline">Navigate</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
              {alerts.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {alerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Info</span>
            </TabsTrigger>
          </TabsList>

          {/* Venue Map Tab (USP 1: Predictions with heatmap) */}
          <TabsContent value="map" className="space-y-4">
            <VenueMapPanel eventId={eventId!} venueData={venueData} isLoading={isLoading} />
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <SchedulePanel eventId={eventId!} />
          </TabsContent>

          {/* Navigation Tab (USP 4: Crowd-aware routing) */}
          <TabsContent value="navigation" className="space-y-4">
            <NavigationPanel eventId={eventId!} venueData={venueData} />
          </TabsContent>

          {/* Alerts Tab (USP 2: Triple-layer detection) */}
          <TabsContent value="alerts" className="space-y-4">
            <AlertsPanel eventId={eventId!} alerts={alerts} onRefresh={loadAlerts} />
          </TabsContent>

          {/* Event Info Tab */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Event Information
                </CardTitle>
                <CardDescription>Details about this event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{event?.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Category</p>
                    <p className="font-medium">{event?.category || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Status</p>
                    <p className="font-medium">{event?.status}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Start Time</p>
                    <p className="font-medium">{event ? new Date(event.startDate).toLocaleString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">End Time</p>
                    <p className="font-medium">{event ? new Date(event.endDate).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>

                {/* USP Highlights */}
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-3">Platform Features Active</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span>AI Crowd Predictions</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="h-4 w-4 text-accent" />
                      <span>Triple-Layer Detection</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Navigation className="h-4 w-4 text-success-green" />
                      <span>Smart Navigation</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span>Auto-Dispatch SOS</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* SOS Modal (USP 4: Auto-dispatch) */}
      {showSOSModal && <SOSButton eventId={eventId!} onClose={() => setShowSOSModal(false)} />}
    </div>
  );
}
