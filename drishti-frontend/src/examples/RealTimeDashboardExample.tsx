/**
 * Example: Updated Dashboard Using Real APIs
 * This shows how to integrate real data into dashboard pages
 */

import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  useEvent,
  useEventMetrics,
  useIncidents,
  useAlerts,
  usePredictions,
} from '../hooks/useRealtime';
import { wsService } from '../services';
import {
  Activity,
  AlertTriangle,
  Users,
  TrendingUp,
  Loader2,
} from 'lucide-react';

export function RealTimeDashboardExample() {
  const { eventId } = useParams<{ eventId: string }>();

  // Use real-time hooks
  const { event, loading: eventLoading } = useEvent(eventId);
  const { metrics, loading: metricsLoading } = useEventMetrics(eventId);
  const { incidents, loading: incidentsLoading } = useIncidents(eventId);
  const { alerts, loading: alertsLoading } = useAlerts(eventId);
  const { predictions, loading: predictionsLoading } = usePredictions(eventId);

  // WebSocket connection status
  const [isConnected, setIsConnected] = React.useState(false);

  useEffect(() => {
    setIsConnected(wsService.isConnected());

    // You can also listen to custom events
    const handleCustomEvent = (data: any) => {
      console.log('Custom event received:', data);
    };

    wsService.on('custom:event', handleCustomEvent);

    return () => {
      wsService.off('custom:event', handleCustomEvent);
    };
  }, []);

  const loading =
    eventLoading ||
    metricsLoading ||
    incidentsLoading ||
    alertsLoading ||
    predictionsLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Loading dashboard...</p>
          <p className="text-slate-500 text-sm mt-2">
            Connecting to real-time data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Connection Status Banner */}
      <div
        className={`px-6 py-2 text-white text-center text-sm ${
          isConnected ? 'bg-emerald-600' : 'bg-red-600'
        }`}
      >
        {isConnected ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Real-time updates active
          </span>
        ) : (
          'Reconnecting to server...'
        )}
      </div>

      {/* Main Dashboard */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Event Header */}
        <div className="mb-8">
          <h1 className="text-3xl text-slate-900 mb-2">
            {event?.name || 'Loading...'}
          </h1>
          <p className="text-slate-600">{event?.description}</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={Users}
            label="Current Attendees"
            value={metrics?.currentAttendees || 0}
            color="blue"
          />
          <MetricCard
            icon={AlertTriangle}
            label="Active Incidents"
            value={incidents.filter((i) => i.status === 'ACTIVE').length}
            color="red"
          />
          <MetricCard
            icon={Activity}
            label="Crowd Density"
            value={`${metrics?.crowdDensity || 0}%`}
            color="amber"
          />
          <MetricCard
            icon={TrendingUp}
            label="AI Predictions"
            value={predictions.length}
            color="purple"
          />
        </div>

        {/* Real-time Sections */}
        <div className="grid grid-cols-2 gap-6">
          {/* Recent Incidents */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Recent Incidents
            </h2>
            {incidents.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No incidents reported
              </p>
            ) : (
              <div className="space-y-3">
                {incidents.slice(0, 5).map((incident) => (
                  <div
                    key={incident.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          incident.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-700'
                            : incident.severity === 'HIGH'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {incident.severity}
                      </span>
                      <span className="text-slate-500 text-xs">
                        {incident.type}
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm">
                      {incident.description}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      {incident.location}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl text-slate-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Active Alerts
            </h2>
            {alerts.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No active alerts
              </p>
            ) : (
              <div className="space-y-3">
                {alerts
                  .filter((a) => a.status === 'ACTIVE')
                  .slice(0, 5)
                  .map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <h3 className="text-slate-900 font-medium mb-1">
                        {alert.title}
                      </h3>
                      <p className="text-slate-700 text-sm">{alert.message}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Metric Card Component
interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color: 'blue' | 'red' | 'amber' | 'purple';
}

function MetricCard({ icon: Icon, label, value, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-3xl text-slate-900 font-bold mb-1">{value}</p>
      <p className="text-slate-600 text-sm">{label}</p>
    </div>
  );
}
