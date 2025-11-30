import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Users, AlertTriangle, Download, Database } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import axios from 'axios';

interface BigQueryMetric {
  timestamp: string;
  value: number;
  category: string;
}

interface BigQuerySummary {
  totalPredictions: number;
  totalIncidents: number;
  avgCrowdDensity: number;
  criticalAlerts: number;
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [eventId] = useState<string>('evt_101');
  const [loading, setLoading] = useState<boolean>(false);

  // BigQuery data states
  const [predictionTrends, setPredictionTrends] = useState<BigQueryMetric[]>([]);
  const [incidentTrends, setIncidentTrends] = useState<BigQueryMetric[]>([]);
  const [densityTrends, setDensityTrends] = useState<BigQueryMetric[]>([]);
  const [summary, setSummary] = useState<BigQuerySummary>({
    totalPredictions: 0,
    totalIncidents: 0,
    avgCrowdDensity: 0,
    criticalAlerts: 0,
  });

  useEffect(() => {
    document.title = 'Analytics - EventSphere';
    fetchBigQueryAnalytics();
  }, [timeRange, eventId]);

  /**
   * Fetch BigQuery analytics data
   */
  const fetchBigQueryAnalytics = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

      // Fetch prediction trends from BigQuery
      const predictionRes = await axios.get(`${apiUrl}/bigquery/predictions`, {
        params: { eventId, timeRange, limit: 100 },
      });

      // Fetch incident trends
      const incidentRes = await axios.get(`${apiUrl}/bigquery/incidents`, {
        params: { eventId, timeRange, limit: 100 },
      });

      // Fetch crowd density trends
      const densityRes = await axios.get(`${apiUrl}/bigquery/crowd-density`, {
        params: { eventId, timeRange, limit: 100 },
      });

      // Process prediction data for charts
      const predictions = predictionRes.data.rows || [];
      const predictionData = predictions.map((row: any) => ({
        timestamp: new Date(row.timestamp).toLocaleDateString(),
        value: row.predicted_density || 0,
        category: 'Predictions',
      }));

      // Process incident data
      const incidents = incidentRes.data.rows || [];
      const incidentData = incidents.map((row: any) => ({
        timestamp: new Date(row.timestamp).toLocaleDateString(),
        value: 1, // Count incidents
        category: row.severity || 'MEDIUM',
      }));

      // Process density data
      const density = densityRes.data.rows || [];
      const densityData = density.map((row: any) => ({
        timestamp: new Date(row.timestamp).toLocaleDateString(),
        value: row.density_norm || 0,
        category: 'Crowd Density',
      }));

      // Aggregate data for summary
      setSummary({
        totalPredictions: predictions.length,
        totalIncidents: incidents.length,
        avgCrowdDensity:
          densityData.reduce((sum: any, d: { value: any }) => sum + d.value, 0) / (densityData.length || 1),
        criticalAlerts: incidents.filter((i: any) => i.severity === 'CRITICAL').length,
      });

      setPredictionTrends(predictionData);
      setIncidentTrends(incidentData);
      setDensityTrends(densityData);
    } catch (error) {
      console.error('Error fetching BigQuery analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Export analytics data to CSV
   */
  const exportToCSV = () => {
    const csvData = predictionTrends.map((d) => `${d.timestamp},${d.value},${d.category}`).join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${eventId}_${timeRange}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">BigQuery Analytics</h1>
          <p className="text-muted-foreground">Historical data and trend analysis</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(val: string) => setTimeRange(val as any)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPredictions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">ML forecasts in {timeRange}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalIncidents}</div>
            <p className="text-xs text-muted-foreground">{summary.criticalAlerts} critical alerts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Crowd Density</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(summary.avgCrowdDensity * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Normalized density</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{densityTrends.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">BigQuery records</p>
          </CardContent>
        </Card>
      </div>

      {/* Prediction Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Crowd Density Predictions (Vertex AI)</CardTitle>
          <CardDescription>Historical ML prediction trends from BigQuery</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={predictionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis domain={[0, 1]} label={{ value: 'Density', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" name="Predicted Density" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Incident Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Incident Frequency</CardTitle>
          <CardDescription>Incidents logged over time</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incidentTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#E02D2D" name="Incidents" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Crowd Density Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Real Crowd Density Trends</CardTitle>
          <CardDescription>Actual crowd density measurements from sensors</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={densityTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#16A34A" name="Crowd Density" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
