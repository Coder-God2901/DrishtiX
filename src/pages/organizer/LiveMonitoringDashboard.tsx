/**
 * Live Monitoring Dashboard Component
 * Real-time event monitoring with 6 key panels (USP 1, 2, 4 integration)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  TrendingUp,
  Shield,
  Bell,
  Users,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Zap,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { apiService } from '@/services/api.service';

interface CrowdData {
  zoneId: string;
  zoneName: string;
  density: number;
  occupancy: number;
  predicted?: boolean;
  timestamp: string;
}

interface Prediction {
  timestamp: string;
  zoneId: string;
  zoneName: string;
  predictedDensity: number;
  confidence: number;
  timeAhead: number;
}

interface Anomaly {
  id: string;
  type: string;
  severity: string;
  zoneId: string;
  zoneName: string;
  detectionMethod: string;
  description: string;
  timestamp: string;
  status: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: string;
  currentZone?: string;
  assignedAlerts: number;
}

export default function LiveMonitoringDashboard() {
  const { eventId } = useParams();
  const [crowdData, setCrowdData] = useState<CrowdData[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [analytics, setAnalytics] = useState({
    totalAttendees: 0,
    peakOccupancy: 0,
    activeAlerts: 0,
    resolvedAlerts: 0,
    avgResponseTime: 0,
  });

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // 30s polling
    return () => clearInterval(interval);
  }, [eventId]);

  const loadDashboardData = async () => {
    if (!eventId) return;

    try {
      // Fetch real crowd density data from API
      const crowdResponse = await apiService.crowdDensity.getLatest(eventId);
      if (crowdResponse && Array.isArray(crowdResponse)) {
        const formattedCrowdData = crowdResponse.map((item: any) => ({
          zoneId: item.zoneId || item.id,
          zoneName: item.zoneName || item.location || 'Unknown Zone',
          density: item.density || item.densityLevel || 0,
          occupancy: item.occupancy || Math.round((item.density || 0) * 100),
          predicted: false,
          timestamp: item.timestamp || new Date().toISOString(),
        }));
        setCrowdData(formattedCrowdData);
      }

      // Fetch predictions from API
      const predictionsResponse = await apiService.predictions.getByEvent(eventId);
      if (predictionsResponse && Array.isArray(predictionsResponse)) {
        const formattedPredictions = predictionsResponse
          .filter((p: any) => new Date(p.timestamp) > new Date())
          .slice(0, 10)
          .map((p: any) => ({
            timestamp: p.timestamp,
            zoneId: p.zoneId || p.id,
            zoneName: p.zoneName || 'Unknown Zone',
            predictedDensity: p.predictedDensity || p.densityLevel || 0,
            confidence: p.confidence || p.accuracy || 0.85,
            timeAhead: Math.round((new Date(p.timestamp).getTime() - Date.now()) / 60000),
          }));
        setPredictions(formattedPredictions);
      }

      // Fetch incidents (anomalies) from API
      const incidentsResponse = await apiService.incidents.getByEvent(eventId);
      if (incidentsResponse && Array.isArray(incidentsResponse)) {
        const formattedAnomalies = incidentsResponse.map((inc: any) => ({
          id: inc.id,
          type: inc.type || 'UNKNOWN',
          severity: inc.severity || 'MEDIUM',
          zoneId: inc.zoneId || inc.location?.zone || 'unknown',
          zoneName: inc.zoneName || inc.location?.name || 'Unknown Zone',
          detectionMethod: inc.detectionMethod || 'ML_MODEL',
          description: inc.description || 'Incident detected',
          timestamp: inc.timestamp || inc.createdAt,
          status: inc.status || 'ACTIVE',
        }));
        setAnomalies(formattedAnomalies);
      }

      // Fetch alerts from API
      const alertsResponse = await apiService.alerts.getByEvent(eventId);
      if (alertsResponse && Array.isArray(alertsResponse)) {
        setAlerts(alertsResponse);
      }

      // Fetch responders (team members) from API
      const respondersResponse = await apiService.responders.getAll();
      if (respondersResponse && Array.isArray(respondersResponse)) {
        const formattedTeam = respondersResponse.map((r: any) => ({
          id: r.id,
          name: r.name,
          role: r.type?.toUpperCase() || 'STAFF',
          status: r.status?.toUpperCase() || 'AVAILABLE',
          currentZone: r.currentZone || r.location?.zone,
          assignedAlerts: r.assignedAlerts || 0,
        }));
        setTeamMembers(formattedTeam);
      }

      // Calculate analytics from real data
      setAnalytics({
        totalAttendees: Array.isArray(crowdResponse?.data)
          ? crowdResponse.data.reduce((sum: number, c: any) => sum + (c.peopleCount || 0), 0)
          : 0,
        peakOccupancy: Array.isArray(crowdResponse?.data)
          ? Math.max(...(crowdResponse.data.map((c: any) => c.occupancy || 0) || [0]))
          : 0,
        activeAlerts: Array.isArray(alertsResponse?.data)
          ? alertsResponse.data.filter((a: any) => a.status === 'ACTIVE').length
          : 0,
        resolvedAlerts: Array.isArray(alertsResponse?.data)
          ? alertsResponse.data.filter((a: any) => a.status === 'RESOLVED').length
          : 0,
        avgResponseTime: 0, // Calculate from incident resolution times
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  useEffect(() => {
    if (eventId) {
      loadDashboardData();
    }
  }, [eventId]);

  const getDensityColor = (density: number) => {
    if (density < 0.3) return 'bg-green-500';
    if (density < 0.5) return 'bg-yellow-500';
    if (density < 0.7) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return 'bg-blue-100 text-blue-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600';
      case 'RESPONDING':
        return 'text-orange-600';
      case 'AVAILABLE':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Live Monitoring Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Real-time event monitoring with AI-powered insights</p>
          </div>
          <Button onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold">{analytics.totalAttendees}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Attendees</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Activity className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                <p className="text-2xl font-bold">{analytics.peakOccupancy}%</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Peak Occupancy</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Bell className="h-8 w-8 mx-auto text-red-600 mb-2" />
                <p className="text-2xl font-bold">{analytics.activeAlerts}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Active Alerts</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold">{analytics.resolvedAlerts}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Resolved Alerts</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <p className="text-2xl font-bold">{analytics.avgResponseTime} min</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Avg Response Time</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Panels */}
        <Tabs defaultValue="heatmap" className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="heatmap">
              <Activity className="h-4 w-4 mr-2" />
              Heatmap
            </TabsTrigger>
            <TabsTrigger value="predictions">
              <TrendingUp className="h-4 w-4 mr-2" />
              Predictions
            </TabsTrigger>
            <TabsTrigger value="anomalies">
              <Shield className="h-4 w-4 mr-2" />
              Anomalies
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <Bell className="h-4 w-4 mr-2" />
              Alerts ({alerts.length})
            </TabsTrigger>
            <TabsTrigger value="teams">
              <Users className="h-4 w-4 mr-2" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Panel 1: Live Heatmap (USP 1) */}
          <TabsContent value="heatmap">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Live Crowd Heatmap
                </CardTitle>
                <CardDescription>Real-time crowd density across all zones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {crowdData.map((zone) => (
                    <Card
                      key={zone.zoneId}
                      className={zone.predicted ? 'border-2 border-dashed border-purple-600' : ''}
                    >
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{zone.zoneName}</h3>
                            {zone.predicted && <Badge className="text-xs">AI Predicted</Badge>}
                          </div>
                          <div className="w-full h-32 rounded-lg relative overflow-hidden">
                            <div
                              className={`absolute inset-0 ${getDensityColor(zone.density)} transition-all`}
                              style={{ opacity: zone.density }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center text-white font-bold">
                                <p className="text-3xl">{Math.round(zone.density * 100)}%</p>
                                <p className="text-xs">Density</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <p className="text-xs text-gray-500">Occupancy</p>
                              <p className="font-semibold">{zone.occupancy}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Updated</p>
                              <p className="font-semibold">{new Date(zone.timestamp).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card className="mt-4 border-blue-600">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2 text-sm">
                      <TrendingUp className="h-5 w-5 text-blue-600 mt-1" />
                      <div>
                        <p className="font-semibold mb-1">USP 1: ConvLSTM Prediction (5-30 min ahead)</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Dashed borders indicate AI-predicted crowd levels using deep learning forecasting.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Panel 2: Predictions Chart (USP 1) */}
          <TabsContent value="predictions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  AI Crowd Predictions
                </CardTitle>
                <CardDescription>ConvLSTM forecasting for next 30 minutes (USP 1)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {predictions.map((pred, idx) => (
                  <Card key={idx} className="border-purple-600">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <h3 className="font-semibold">{pred.zoneName}</h3>
                            <Badge variant="outline">+{pred.timeAhead} min</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <p className="text-xs text-gray-500">Predicted Density</p>
                              <p className="text-xl font-bold text-orange-600">
                                {Math.round(pred.predictedDensity * 100)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Confidence</p>
                              <p className="font-semibold">{Math.round(pred.confidence * 100)}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Time</p>
                              <p className="font-semibold">{new Date(pred.timestamp).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="w-24 h-24">
                          <div className="relative w-full h-full rounded-full border-8 border-gray-200 dark:border-gray-700">
                            <div
                              className="absolute inset-0 rounded-full border-8 transition-all"
                              style={{
                                borderColor:
                                  pred.predictedDensity > 0.7
                                    ? '#ef4444'
                                    : pred.predictedDensity > 0.5
                                      ? '#f59e0b'
                                      : '#10b981',
                                clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin((pred.predictedDensity * 360 * Math.PI) / 180)}% ${50 - 50 * Math.cos((pred.predictedDensity * 360 * Math.PI) / 180)}%, 50% 50%)`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Panel 3: Anomalies (USP 2) */}
          <TabsContent value="anomalies">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Anomaly Detection
                </CardTitle>
                <CardDescription>
                  Triple-layer detection: Rules + Isolation Forest + Autoencoder (USP 2)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {anomalies.map((anomaly) => (
                  <Card key={anomaly.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                            <h3 className="font-semibold">{anomaly.type.replace('_', ' ')}</h3>
                            <Badge className={getSeverityColor(anomaly.severity)}>{anomaly.severity}</Badge>
                            <Badge variant="outline" className="text-xs">
                              {anomaly.detectionMethod.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{anomaly.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{anomaly.zoneName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(anomaly.timestamp).toLocaleString()}</span>
                            </div>
                            <Badge variant={anomaly.status === 'ACTIVE' ? 'default' : 'outline'} className="text-xs">
                              {anomaly.status}
                            </Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Investigate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Card className="border-purple-600">
                  <CardContent className="pt-4 text-sm">
                    <div className="flex items-start gap-2">
                      <Shield className="h-5 w-5 text-purple-600 mt-1" />
                      <div>
                        <p className="font-semibold mb-2">USP 2: Triple-Layer Anomaly Detection</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-600 rounded" />
                            <span>Layer 1: Rules Engine - Threshold-based detection</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-600 rounded" />
                            <span>Layer 2: Isolation Forest - Statistical outlier detection</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-600 rounded" />
                            <span>Layer 3: Autoencoder - Deep learning pattern analysis</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Panel 4: Active Alerts */}
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Active Alerts
                </CardTitle>
                <CardDescription>Real-time safety and operational alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.map((alert) => (
                  <Card key={alert.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Bell className="h-4 w-4" />
                            <h3 className="font-semibold">{alert.type.replace('_', ' ')}</h3>
                            <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{alert.zone}</span>
                            <span>•</span>
                            <span>{new Date(alert.createdAt).toLocaleString()}</span>
                            <Badge variant="outline">{alert.status}</Badge>
                          </div>
                        </div>
                        <Button size="sm">Respond</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Panel 5: Team Status */}
          <TabsContent value="teams">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Status
                </CardTitle>
                <CardDescription>Live team member tracking and assignments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {teamMembers.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${member.status === 'ACTIVE' ? 'bg-green-600' : member.status === 'RESPONDING' ? 'bg-orange-600' : 'bg-blue-600'}`}
                          />
                          <div>
                            <h3 className="font-semibold">{member.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Badge variant="outline">{member.role}</Badge>
                              {member.currentZone && (
                                <>
                                  <span>•</span>
                                  <MapPin className="h-3 w-3" />
                                  <span>{member.currentZone}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${getStatusColor(member.status)}`}>{member.status}</p>
                          <p className="text-xs text-gray-500">{member.assignedAlerts} assigned alerts</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Panel 6: Analytics */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Event Analytics
                </CardTitle>
                <CardDescription>Performance metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Alert Response Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Active Alerts</span>
                        <span className="font-bold text-red-600">{analytics.activeAlerts}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Resolved Alerts</span>
                        <span className="font-bold text-green-600">{analytics.resolvedAlerts}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Avg Response Time</span>
                        <span className="font-bold">{analytics.avgResponseTime} min</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Success Rate</span>
                        <span className="font-bold text-green-600">
                          {Math.round(
                            (analytics.resolvedAlerts / (analytics.activeAlerts + analytics.resolvedAlerts)) * 100
                          )}
                          %
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Crowd Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Attendees</span>
                        <span className="font-bold">{analytics.totalAttendees}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Peak Occupancy</span>
                        <span className="font-bold text-orange-600">{analytics.peakOccupancy}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Crowded Zones</span>
                        <span className="font-bold">{crowdData.filter((z) => z.density > 0.7).length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>AI Predictions</span>
                        <span className="font-bold text-purple-600">{predictions.length}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card className="mt-4 border-green-600">
                  <CardContent className="pt-4 text-sm">
                    <div className="flex items-start gap-2">
                      <Zap className="h-5 w-5 text-green-600 mt-1" />
                      <div>
                        <p className="font-semibold mb-1">USP 4: Actions, Not Just Warnings</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          When alerts trigger, teams are auto-dispatched, routes are re-calculated, and attendees are
                          guided - all without manual intervention.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
