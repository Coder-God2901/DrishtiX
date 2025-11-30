import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { AlertCircle, CheckCircle, Clock, MapPin, Radio, Play, PhoneCall, Filter, X, Plus, Users } from 'lucide-react';
import { KPICard } from '../shared/kpi-card';
import { StatusChip } from '../shared/status-chip';
import { Slider } from '../ui/slider';
import { teamLocations } from '../../data/realtime-data';
import { alertsData } from '../../data/alerts-incidents-data';
import { usersData } from '../../data/team-role-data';
import { RealtimeHeatmap } from '@/components/maps/RealtimeHeatmap';
import { RiskTrendCharts } from '@/components/RiskTrendCharts';
import { RecommendationPanel } from '@/components/features/recommendation-panel';
import { WeatherPanel } from '@/components/dashboard/WeatherPanel';
import { useGCPRealtime } from '@/hooks/useGCPRealtime';
import { firebaseService } from '@/services/firebase.service';

interface Alert {
  id: string;
  type: 'critical' | 'high' | 'info';
  title: string;
  zone: string;
  time: string;
  confidence: number;
  suggestedAction: string;
}

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  location: { x: number; y: number };
  status: 'active' | 'responding' | 'available';
}

const buildTeamMembers = () => {
  return teamLocations.map((loc) => {
    const u = usersData.find((x) => x.userId === loc.userId);
    const initials = (u?.name || loc.userId)
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
    return {
      id: loc.userId,
      name: u?.name || loc.userId,
      initials,
      role: u?.roles['evt_101'] || loc.role,
      location: {
        x: 25 + Math.random() * 50, // placeholder mapping
        y: 25 + Math.random() * 50,
      },
      status: 'active' as const,
    };
  });
};

export function OperationsDashboard() {
  const [selectedEvent] = useState('Summer Music Festival 2025');
  const [timeMode, setTimeMode] = useState<'live' | 'replay' | 'simulation'>('live');
  const eventId = 'evt_101'; // Replace with actual event ID

  // Real-time GCP integration
  const {
    alerts: gcpAlerts,
    incidents: gcpIncidents,
    isConnected: gcpConnectionStatus,
  } = useGCPRealtime({
    eventId,
    enablePredictions: true,
    enableVideoAnalytics: true,
    enableSocialSignals: true,
    enableAnomalies: true,
    enableAlerts: true,
    enableIncidents: true,
    enableResponderUpdates: true,
  });

  const [alerts, setAlerts] = useState<Alert[]>(
    alertsData.map((a) => ({
      id: a.alertId,
      type: a.priority === 'critical' ? 'critical' : a.priority === 'high' ? 'high' : 'info',
      title: a.summary,
      zone: a.zoneId || 'N/A',
      time: 'Just now',
      confidence: Math.round(a.confidence * 100),
      suggestedAction: a.suggestedActions[0]?.actionType === 'dispatch_team' ? 'Dispatch team' : 'Review',
    }))
  );
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(buildTeamMembers());

  // Subscribe to real-time team locations
  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToTeamLocations((locations: any[]) => {
      const updated = locations.map((loc) => {
        const u = usersData.find((x) => x.userId === loc.userId);
        const initials = (u?.name || loc.userId)
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase();
        return {
          id: loc.userId,
          name: u?.name || loc.userId,
          initials,
          role: u?.roles['evt_101'] || loc.role,
          location: {
            x: loc.location?.lat || 25 + Math.random() * 50,
            y: loc.location?.lon || 25 + Math.random() * 50,
          },
          status: loc.status || ('active' as const),
        };
      });
      setTeamMembers(updated);
    });
    return () => unsubscribe();
  }, []);

  // Update alerts from GCP real-time data
  useEffect(() => {
    if (gcpAlerts.length > 0) {
      const realtimeAlerts = gcpAlerts.map((a) => ({
        id: a.id,
        type:
          a.severity === 'danger'
            ? ('critical' as const)
            : a.severity === 'warning'
              ? ('high' as const)
              : ('info' as const),
        title: a.title,
        zone: a.location ? `Zone ${a.location.lat.toFixed(2)}` : 'N/A',
        time: new Date(a.timestamp).toLocaleTimeString(),
        confidence: 90,
        suggestedAction: 'Review immediately',
      }));
      setAlerts((prev) => [...realtimeAlerts, ...prev].slice(0, 10));
    }
  }, [gcpAlerts]);

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter((a) => a.id !== id));
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="h-16 bg-card border-b px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2>{selectedEvent}</h2>
          <div className="flex items-center gap-2">
            <Button variant={timeMode === 'live' ? 'default' : 'ghost'} size="sm" onClick={() => setTimeMode('live')}>
              <Radio className="w-4 h-4 mr-2" />
              Live
            </Button>
            <Button
              variant={timeMode === 'replay' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeMode('replay')}
            >
              <Play className="w-4 h-4 mr-2" />
              Replay
            </Button>
            <Button
              variant={timeMode === 'simulation' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeMode('simulation')}
            >
              <Clock className="w-4 h-4 mr-2" />
              Simulation
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge
            variant="outline"
            className={gcpConnectionStatus ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            {gcpConnectionStatus ? 'GCP Connected' : 'GCP Connecting...'}
          </Badge>
          <Badge variant="outline" className="bg-[#0B3D91]/10 text-[#0B3D91]">
            <Users className="w-3 h-3 mr-1" />
            Organizer
          </Badge>
          <Button variant="destructive" size="sm">
            <PhoneCall className="w-4 h-4 mr-2" />
            SOS
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Alerts Panel */}
        <div className="w-80 bg-card border-r overflow-y-auto">
          <div className="p-4 border-b sticky top-0 bg-card z-10">
            <div className="flex items-center justify-between mb-3">
              <h3>Alerts</h3>
              <Button variant="ghost" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Badge variant="destructive" className="text-xs">
                Critical (1)
              </Badge>
              <Badge variant="secondary" className="text-xs">
                High (1)
              </Badge>
              <Badge variant="outline" className="text-xs">
                Info (1)
              </Badge>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`p-4 animate-slide-in-right cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
                  alert.type === 'critical'
                    ? 'border-l-[#E02D2D]'
                    : alert.type === 'high'
                      ? 'border-l-[#F59E0B]'
                      : 'border-l-[#0B3D91]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle
                          className={`w-4 h-4 ${
                            alert.type === 'critical'
                              ? 'text-[#E02D2D]'
                              : alert.type === 'high'
                                ? 'text-[#F59E0B]'
                                : 'text-[#0B3D91]'
                          }`}
                        />
                        <span className="text-muted-foreground">{alert.time}</span>
                      </div>
                      <h4>{alert.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{alert.zone}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => dismissAlert(alert.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Confidence</span>
                      <span>{alert.confidence}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${alert.confidence}%` }} />
                    </div>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground mb-2">Suggested Action</p>
                    <p className="text-foreground">{alert.suggestedAction}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-[#16A34A] hover:bg-[#16A34A]/90">
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Modify
                    </Button>
                    <Button size="sm" variant="ghost">
                      Dismiss
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Center: Map */}
        <div className="flex-1 relative bg-[#E5E7EB]">
          {/* Live Map with Heatgrid overlays */}
          <div className="absolute inset-0">
            <RealtimeHeatmap />
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button size="icon" variant="secondary" className="bg-white shadow-lg">
              <Plus className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="secondary" className="bg-white shadow-lg">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Legend */}
          <Card className="absolute bottom-4 left-4 p-4 bg-white/95 backdrop-blur">
            <h4 className="mb-3">Crowd Density</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-[#E02D2D]/40" />
                <span className="text-muted-foreground">Critical (~90%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-[#F59E0B]/30" />
                <span className="text-muted-foreground">High (70-90%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-[#16A34A]/30" />
                <span className="text-muted-foreground">Normal (~70%)</span>
              </div>
            </div>
          </Card>

          {/* Timeline Slider (for replay mode) */}
          {timeMode === 'replay' && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-96">
              <Card className="p-4 bg-white/95 backdrop-blur">
                <div className="flex items-center gap-3">
                  <Button size="icon" variant="ghost">
                    <Play className="w-4 h-4" />
                  </Button>
                  <Slider defaultValue={[50]} className="flex-1" />
                  <span className="text-muted-foreground text-sm">14:32</span>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Right: Action Console & Analytics */}
        <div className="w-96 bg-card border-l overflow-y-auto">
          <div className="p-4 border-b sticky top-0 bg-card z-10">
            <h3>Action Console</h3>
          </div>

          <div className="p-4 space-y-4">
            {/* Weather Panel */}
            <div className="space-y-3">
              <h4>Weather Conditions</h4>
              <WeatherPanel
                eventId="evt_101"
                location={{ lat: 37.7749, lon: -122.4194, name: 'Summer Music Festival' }}
              />
            </div>

            {/* AI Recommendations */}
            <div className="space-y-3">
              <h4>AI Recommendations</h4>
              <RecommendationPanel
                eventId="evt_101"
                onActionApproved={(actionId) => {
                  console.log(`Action ${actionId} approved and executed`);
                }}
                onActionRejected={(actionId) => {
                  console.log(`Action ${actionId} rejected`);
                }}
              />
            </div>

            {/* Risk & Anomaly Charts */}
            <RiskTrendCharts />
            {/* KPIs */}
            <div className="space-y-3">
              <h4>Key Metrics</h4>
              <KPICard
                title="Current Attendance"
                value="8,432"
                subtitle="of 12,000 capacity"
                trend="up"
                trendValue="+234"
              />
              <KPICard
                title="Avg Response Time"
                value="3.2 min"
                subtitle="Last hour"
                trend="down"
                trendValue="-0.8 min"
              />
              <KPICard
                title="Active Incidents"
                value={gcpIncidents.length.toString()}
                subtitle={`${gcpIncidents.filter((i: any) => i.severity === 'critical').length} critical, ${gcpIncidents.filter((i: any) => i.severity === 'high').length} high`}
                trend="neutral"
              />
            </div>

            {/* Team Status */}
            <div className="space-y-3">
              <h4>Team Status</h4>
              <Card className="p-4">
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">{member.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-foreground">{member.name}</p>
                          <p className="text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      <StatusChip
                        status={member.status === 'active' || member.status === 'responding' ? 'online' : 'offline'}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h4>Quick Actions</h4>
              <div className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <Radio className="w-4 h-4 mr-2" />
                  Dispatch Team
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Create Alert
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <PhoneCall className="w-4 h-4 mr-2" />
                  Emergency Broadcast
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
