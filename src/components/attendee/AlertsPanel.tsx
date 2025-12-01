/**
 * Alerts Panel Component
 * Displays real-time safety alerts from triple-layer anomaly detection (USP 2)
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Bell, AlertTriangle, Info, Shield, Activity, TrendingUp, RefreshCw, ChevronRight, X } from 'lucide-react';

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  timestamp: string;
  detectionMethod?: string;
  zone?: string;
}

interface AlertsPanelProps {
  eventId: string;
  alerts: Alert[];
  onRefresh: () => void;
}

export default function AlertsPanel({ eventId, alerts, onRefresh }: AlertsPanelProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Track event context for analytics
  const eventContext = eventId ? `Event: ${eventId}` : 'Global';

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary';
      case 'MEDIUM':
        return 'bg-warning-amber/10 text-warning-amber dark:bg-warning-amber/20 dark:text-warning-amber';
      case 'HIGH':
        return 'bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent';
      case 'CRITICAL':
        return 'bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return <Info className="h-4 w-4" />;
      case 'MEDIUM':
        return <Bell className="h-4 w-4" />;
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4" />;
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4 animate-pulse" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getDetectionMethodIcon = (method: string) => {
    switch (method) {
      case 'RULES':
        return <Shield className="h-3 w-3" />;
      case 'ISOLATION_FOREST':
        return <Activity className="h-3 w-3" />;
      case 'AUTOENCODER':
        return <TrendingUp className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts([...dismissedAlerts, alertId]);
    toast.success('Alert dismissed');
  };

  const visibleAlerts = alerts.filter((alert) => !dismissedAlerts.includes(alert.id));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Safety Alerts
              </CardTitle>
              <CardDescription>Real-time alerts from triple-layer anomaly detection</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {visibleAlerts.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-success-green mb-4" />
              <p className="text-lg font-medium text-success-green">All Clear</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">No active safety alerts at this time</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedAlert(alert)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold">{alert.title}</p>
                          <Badge variant="outline" className="text-xs">
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{alert.message}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                          {alert.zone && (
                            <span className="flex items-center gap-1">
                              <span>•</span>
                              <span>{alert.zone}</span>
                            </span>
                          )}
                          {alert.detectionMethod && (
                            <span className="flex items-center gap-1">
                              {getDetectionMethodIcon(alert.detectionMethod)}
                              <span>{alert.detectionMethod.replace('_', ' ')}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleDismiss(alert.id);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <Card className="border-blue-600">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                {getSeverityIcon(selectedAlert.severity)}
                Alert Details - {eventContext}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedAlert(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">Title</p>
              <p className="text-sm text-gray-600">{selectedAlert.title}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Message</p>
              <p className="text-sm text-gray-600">{selectedAlert.message}</p>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Severity</p>
                <Badge className={getSeverityColor(selectedAlert.severity)}>{selectedAlert.severity}</Badge>
              </div>
              {selectedAlert.zone && (
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Zone</p>
                  <p className="text-sm text-gray-600">{selectedAlert.zone}</p>
                </div>
              )}
            </div>
            {selectedAlert.detectionMethod && (
              <div>
                <p className="text-sm font-medium mb-1">Detection Method</p>
                <div className="flex items-center gap-2">
                  {getDetectionMethodIcon(selectedAlert.detectionMethod)}
                  <p className="text-sm text-gray-600">{selectedAlert.detectionMethod.replace('_', ' ')}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm font-medium mb-1">Timestamp</p>
              <p className="text-sm text-gray-600">{new Date(selectedAlert.timestamp).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* USP 2 Info Card */}
      <Card className="border-accent">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            Triple-Layer Anomaly Detection (USP 2)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-medium">Layer 1: Rules Engine</span>
            <span className="text-xs text-muted-foreground">- Threshold-based detection</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-success-green" />
            <span className="font-medium">Layer 2: Isolation Forest</span>
            <span className="text-xs text-muted-foreground">- Statistical outliers</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            <span className="font-medium">Layer 3: Autoencoder</span>
            <span className="text-xs text-muted-foreground">- Deep pattern analysis</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
