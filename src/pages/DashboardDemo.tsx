import { useState, useEffect } from 'react';
import {
  PredictionTimeline,
  HotspotMap,
  AlertPanel,
  ResponderStatus,
  VideoFeedGrid,
  TrafficOverlay,
} from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Users, Navigation } from 'lucide-react';
import { apiService } from '@/services/api.service';
import { useRealTimePredictions, useRealTimeIncidents, useRealTimeResponders } from '@/hooks/useRealTimeData';

export default function DashboardDemo() {
  const [selectedTab, setSelectedTab] = useState<'predictions' | 'video' | 'traffic'>('predictions');

  // Get demo event ID from user's first event or use a default
  const [eventId, setEventId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState({
    predictionAccuracy: 78,
    leadTime: 18,
    falsePositives: 12,
    responseTime: -65,
    attendeeCount: 8452,
  });

  // Real-time hooks
  const { predictions, latestPrediction } = useRealTimePredictions(eventId);
  const { incidents } = useRealTimeIncidents(eventId);
  const { responders } = useRealTimeResponders();

  // State for API data
  const [apiPredictions, setApiPredictions] = useState<any[]>([]);
  const [apiIncidents, setApiIncidents] = useState<any[]>([]);
  const [apiResponders, setApiResponders] = useState<any[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [trafficIncidents] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<any[]>([]);

  // Load event ID
  useEffect(() => {
    const loadEventId = async () => {
      try {
        const events = await apiService.events.getAll();

        // Normalize various possible API shapes to an array so we can index safely.
        let items: any[] = [];
        if (Array.isArray(events)) {
          items = events;
        } else if (events && (Array.isArray((events as any).items) || Array.isArray((events as any).data))) {
          items = (events as any).items || (events as any).data;
        }

        if (items && items.length > 0) {
          setEventId(items[0].id);
        }
      } catch (error) {
        console.error('Failed to load event:', error);
        // Use a fallback event ID for demo
        setEventId('demo-event');
      }
    };
    loadEventId();
  }, []);

  // Load initial data from API
  useEffect(() => {
    if (!eventId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // helper to normalize API responses that may be arrays or wrapped in { items } / { data }
        const normalizeArray = (res: any): any[] => {
          if (!res) return [];
          if (Array.isArray(res)) return res;
          if (res && Array.isArray((res as any).items)) return (res as any).items;
          if (res && Array.isArray((res as any).data)) return (res as any).data;
          return [];
        };

        // Load predictions
                const predictionsRaw = await apiService.predictions.getAll(eventId);
                const predictionsData = normalizeArray(predictionsRaw);
                setApiPredictions(predictionsData);

        // Load incidents
        const incidentsRaw = await apiService.incidents.getByEvent(eventId);
        const incidentsData = normalizeArray(incidentsRaw);
        setApiIncidents(incidentsData);

        // Load responders
        const respondersRaw = await apiService.responders.getAll();
        const respondersData = normalizeArray(respondersRaw);
        setApiResponders(respondersData);

        // Load cameras
        const camerasRaw = await apiService.cameras.getAll({ eventId });
        const camerasData = normalizeArray(camerasRaw);
        setCameras(camerasData);

        // Load crowd density for hotspots (use getAll with eventId param; getByEvent was removed)
        const densityRaw = await apiService.crowdDensity.getAll({ eventId });
        const densityData = normalizeArray(densityRaw);
        setHotspots(densityData);

        // Calculate KPIs from real data
        if (predictionsData && predictionsData.length > 0) {
          const accurate = predictionsData.filter((p: any) => p.accuracy >= 0.75).length;
          const accuracy = Math.round((accurate / predictionsData.length) * 100);
          setKpiData((prev) => ({ ...prev, predictionAccuracy: accuracy }));
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [eventId]);

  // Merge real-time predictions with API predictions
  const allPredictions = [...predictions, ...apiPredictions];
  const allIncidents = [...incidents, ...apiIncidents];
  const allResponders = [...responders, ...apiResponders];

  // Determine current count from latest prediction or fallback
  const currentCount = latestPrediction?.predictedCount || kpiData.attendeeCount;

  // Display data: use real data if available, fallback to mock for demo
  const displayPredictions =
    allPredictions.length > 0
      ? allPredictions
      : [
          {
            time: '10:00',
            count: 5200,
            confidence: 0.85,
            density: 'medium' as const,
            timestamp: new Date('2025-01-01T10:00:00Z'),
            predictedCount: 5300,
            densityLevel: 'medium' as const,
            riskLevel: 'medium' as const,
          },
          {
            time: '10:15',
            count: 6800,
            confidence: 0.78,
            density: 'high' as const,
            timestamp: new Date('2025-01-01T10:15:00Z'),
            predictedCount: 7000,
            densityLevel: 'high' as const,
            riskLevel: 'high' as const,
          },
          {
            time: '10:30',
            count: 8900,
            confidence: 0.82,
            density: 'critical' as const,
            timestamp: new Date('2025-01-01T10:30:00Z'),
            predictedCount: 9200,
            densityLevel: 'critical' as const,
            riskLevel: 'critical' as const,
          },
        ];

  const displayIncidents = allIncidents.length > 0 ? allIncidents : [];
  const displayResponders = allResponders.length > 0 ? allResponders : [];
  const displayCameras = cameras.length > 0 ? cameras : [];
  const displayHotspots = hotspots.length > 0 ? hotspots : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Activity className="w-8 h-8 text-primary" />
              DrishtiX Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Predictive Crowd Safety Platform • Live Demo</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-success-green/10 text-success-green border-success-green">
              <div className="w-2 h-2 rounded-full bg-success-green mr-2 animate-pulse"></div>
              System Operational
            </Badge>
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent">
              <Users className="w-3 h-3 mr-1" />
              {currentCount.toLocaleString()} Attendees
            </Badge>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Prediction Accuracy</p>
              <TrendingUp className="w-4 h-4 text-success-green" />
            </div>
            <p className="text-2xl font-bold text-foreground">{kpiData.predictionAccuracy}%</p>
            <p className="text-xs text-success-green mt-1">+5% from last event</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Lead Time</p>
              <Activity className="w-4 h-4 text-accent" />
            </div>
            <p className="text-2xl font-bold text-foreground">{kpiData.leadTime} min</p>
            <p className="text-xs text-accent mt-1">15-20 min avg</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">False Positives</p>
              <Activity className="w-4 h-4 text-warning-amber" />
            </div>
            <p className="text-2xl font-bold text-foreground">{kpiData.falsePositives}%</p>
            <p className="text-xs text-success-green mt-1">Below 15% target</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Response Time</p>
              <Navigation className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{kpiData.responseTime}%</p>
            <p className="text-xs text-success-green mt-1">Significant improvement</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={selectedTab === 'predictions' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('predictions')}
        >
          Predictions & Alerts
        </Button>
        <Button variant={selectedTab === 'video' ? 'default' : 'outline'} onClick={() => setSelectedTab('video')}>
          Video Analytics
        </Button>
        <Button variant={selectedTab === 'traffic' ? 'default' : 'outline'} onClick={() => setSelectedTab('traffic')}>
          Traffic Overlay
        </Button>
      </div>

      {/* Dashboard Grid */}
      {selectedTab === 'predictions' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <PredictionTimeline predictions={displayPredictions} currentCount={currentCount} />
            <ResponderStatus
              responders={displayResponders}
              onResponderClick={(r) => console.log('Responder clicked:', r)}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <HotspotMap
              center={{ lat: 28.6139, lon: 77.209 }}
              zoom={14}
              hotspots={displayHotspots}
              incidents={displayIncidents}
              responders={displayResponders.map((r) => ({
                id: r.id,
                location: r.location,
                status: r.status,
                type: r.type,
              }))}
            />
            <AlertPanel eventId={eventId} maxAlerts={5} onAlertClick={(a) => console.log('Alert clicked:', a)} />
          </div>
        </div>
      )}

      {selectedTab === 'video' && (
        <div className="grid grid-cols-1 gap-6">
          <VideoFeedGrid
            cameras={displayCameras}
            maxCameras={8}
            onCameraClick={(c) => console.log('Camera clicked:', c)}
          />
        </div>
      )}

      {selectedTab === 'traffic' && (
        <div className="grid grid-cols-1 gap-6">
          <TrafficOverlay
            center={{ lat: 28.6139, lon: 77.209 }}
            zoom={13}
            incidents={trafficIncidents}
            onIncidentClick={(i) => console.log('Incident clicked:', i)}
            showLegend={true}
          />
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-6 border-t text-center">
        <p className="text-sm text-muted-foreground">
          DrishtiX Predictive Crowd Safety Platform • Built with React, TypeScript, Firebase & Google Cloud
        </p>
        <p className="text-xs text-muted-foreground mt-1">Professional Dashboard Components Demonstration</p>
      </div>
    </div>
  );
}
