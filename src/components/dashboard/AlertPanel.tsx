import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle, Clock, MapPin, ChevronRight, X, Eye } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { useGCPRealtime } from '@/hooks/useGCPRealtime';
import { useAlertStore, type Alert, type AlertPriority } from '@/store/useAlertStore';

interface AlertPanelProps {
  eventId: string;
  maxAlerts?: number;
  className?: string;
  onAlertClick?: (alert: Alert) => void;
}

export function AlertPanel({ eventId, maxAlerts = 10, className, onAlertClick }: AlertPanelProps) {
  const { alerts, acknowledgeAlert, dismissAlert, resolveAlert } = useAlertStore();
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged'>('active');

  // Use GCP real-time alerts and incidents
  const {
    alerts: gcpAlerts,
    incidents: gcpIncidents,
    isConnected,
  } = useGCPRealtime({
    eventId,
    enablePredictions: false,
    enableVideoAnalytics: false,
    enableSocialSignals: false,
    enableAnomalies: false,
    enableAlerts: true,
    enableIncidents: true,
    enableResponderUpdates: false,
  });

  // Convert GCP alerts and incidents to Alert format
  const realtimeAlerts: Alert[] = [
    ...gcpAlerts.map((alert) => ({
      id: alert.id,
      eventId,
      type: alert.type,
      priority: alert.severity as AlertPriority,
      title: alert.title,
      summary: alert.message,
      description: alert.message,
      zone: '',
      location: alert.location ? { lat: alert.location.lat, lng: alert.location.lon } : undefined,
      confidence: 0.9,
      status: 'active' as const,
      suggestedActions: [],
      assignedTo: [],
      createdAt: alert.timestamp.toISOString(),
      updatedAt: alert.timestamp.toISOString(),
    })),
    ...gcpIncidents.map((inc) => ({
      id: inc.id,
      eventId,
      type: inc.type,
      priority: inc.severity as AlertPriority,
      title: `${inc.type.toUpperCase()} Incident`,
      summary: inc.description,
      description: inc.description,
      zone: '',
      location: inc.location ? { lat: inc.location.lat, lng: inc.location.lon } : undefined,
      confidence: 0.9,
      status: inc.status === 'resolved' ? ('resolved' as const) : ('active' as const),
      suggestedActions: [],
      assignedTo: [],
      createdAt: inc.timestamp.toISOString(),
      updatedAt: inc.timestamp.toISOString(),
    })),
  ];

  // Connection status indicator (used for UI feedback)
  const connectionStatus = isConnected ? 'connected' : 'disconnected';

  const displayAlerts = realtimeAlerts.length > 0 ? realtimeAlerts : alerts;

  const filteredAlerts = displayAlerts
    .filter((alert: Alert) => {
      if (filter === 'active') return alert.status === 'active';
      if (filter === 'acknowledged') return alert.status === 'acknowledged';
      return true;
    })
    .slice(0, maxAlerts);

  const priorityConfig = {
    critical: {
      color: 'bg-destructive text-destructive-foreground',
      icon: '🔥',
      borderColor: 'border-destructive',
    },
    high: {
      color: 'bg-warning-amber text-white',
      icon: '⚠️',
      borderColor: 'border-warning-amber',
    },
    medium: {
      color: 'bg-accent text-accent-foreground',
      icon: '📢',
      borderColor: 'border-accent',
    },
    low: {
      color: 'bg-primary/20 text-primary',
      icon: 'ℹ️',
      borderColor: 'border-primary',
    },
    info: {
      color: 'bg-muted text-muted-foreground',
      icon: '💡',
      borderColor: 'border-muted',
    },
  };

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleAcknowledge = (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    acknowledgeAlert(alertId, 'current-user');
  };

  const handleDismiss = (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dismissAlert(alertId);
  };

  const handleResolve = (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    resolveAlert(alertId);
  };

  const stats = {
    total: displayAlerts.length,
    active: displayAlerts.filter((a: Alert) => a.status === 'active').length,
    critical: displayAlerts.filter((a: Alert) => a.priority === 'critical' && a.status === 'active').length,
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Active Alerts
            {stats.critical > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.critical} Critical
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{stats.active} Active</Badge>
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'} className="text-xs">
              {connectionStatus === 'connected' ? '🟢 Live' : '⚪ Local'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              filter === 'active'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            Active ({stats.active})
          </button>
          <button
            onClick={() => setFilter('acknowledged')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              filter === 'acknowledged'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            Acknowledged
          </button>
        </div>

        {/* Alerts List */}
        <ScrollArea className="h-[400px] pr-3">
          <div className="space-y-2">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-success-green mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  No {filter === 'active' ? 'active' : filter} alerts
                </p>
                <p className="text-xs text-muted-foreground mt-1">All systems operating normally</p>
              </div>
            ) : (
              filteredAlerts.map((alert: Alert) => {
                const config = priorityConfig[alert.priority as keyof typeof priorityConfig];

                return (
                  <div
                    key={alert.id}
                    onClick={() => onAlertClick?.(alert)}
                    className={cn(
                      'border-l-4 rounded-lg p-3 transition-all cursor-pointer',
                      'hover:shadow-md hover:scale-[1.01]',
                      config.borderColor,
                      alert.status === 'active' ? 'bg-card' : 'bg-muted/50 opacity-75'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Priority Badge */}
                      <div
                        className={cn(
                          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg',
                          config.color
                        )}
                      >
                        {config.icon}
                      </div>

                      {/* Alert Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-foreground truncate">{alert.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{alert.summary}</p>
                          </div>
                          <Badge variant="outline" className={cn('text-xs shrink-0', config.color)}>
                            {alert.priority}
                          </Badge>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getTimeAgo(alert.createdAt)}
                          </div>
                          {alert.zone && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {alert.zone}
                            </div>
                          )}
                          {alert.confidence && (
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {(alert.confidence * 100).toFixed(0)}%
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {alert.status === 'active' && (
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e: React.MouseEvent) => handleAcknowledge(alert.id, e)}
                              className="h-7 text-xs"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Acknowledge
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e: React.MouseEvent) => handleResolve(alert.id, e)}
                              className="h-7 text-xs"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e: React.MouseEvent) => handleDismiss(alert.id, e)}
                              className="h-7 text-xs ml-auto"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        )}

                        {alert.status === 'acknowledged' && (
                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Acknowledged
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e: React.MouseEvent) => handleResolve(alert.id, e)}
                              className="h-7 text-xs"
                            >
                              Mark Resolved
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Summary Footer */}
        {stats.total > 0 && (
          <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {filteredAlerts.length} of {stats.total} alerts
            </span>
            {stats.critical > 0 && (
              <span className="text-destructive font-medium">{stats.critical} require immediate attention</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
