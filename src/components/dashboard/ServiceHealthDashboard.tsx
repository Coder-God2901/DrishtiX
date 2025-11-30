/**
 * GCP Service Health Dashboard Component
 * Monitors all GCP services health and performance
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Cloud, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { useEffect, useState } from 'react';
import { gcpServiceManager } from '@/lib/gcp-service-manager';

interface ServiceHealthDashboardProps {
  className?: string;
}

export function ServiceHealthDashboard({ className }: ServiceHealthDashboardProps) {
  const [healthStatus, setHealthStatus] = useState(new Map());
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Update health status every 10 seconds
    const updateHealth = () => {
      setHealthStatus(gcpServiceManager.getHealthStatus());
      setLastUpdate(new Date());
    };

    updateHealth();
    const interval = setInterval(updateHealth, 10000);

    return () => clearInterval(interval);
  }, []);

  const services = Array.from(healthStatus.entries());
  const healthyCount = services.filter(([_, health]) => health.status === 'healthy').length;
  const degradedCount = services.filter(([_, health]) => health.status === 'degraded').length;
  const downCount = services.filter(([_, health]) => health.status === 'down').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-success-green" />;
      case 'degraded':
        return <AlertCircle className="w-4 h-4 text-warning-amber" />;
      case 'down':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-success-green bg-success-green/10';
      case 'degraded':
        return 'text-warning-amber bg-warning-amber/10';
      case 'down':
        return 'text-destructive bg-destructive/10';
      default:
        return 'text-muted-foreground bg-muted/10';
    }
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            GCP Services Health
          </CardTitle>
          <div className="text-xs text-muted-foreground">Updated: {lastUpdate.toLocaleTimeString()}</div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-success-green/10 p-3 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-1 text-success-green" />
            <div className="text-2xl font-bold text-success-green">{healthyCount}</div>
            <div className="text-xs text-muted-foreground">Healthy</div>
          </div>
          <div className="rounded-lg bg-warning-amber/10 p-3 text-center">
            <AlertCircle className="w-6 h-6 mx-auto mb-1 text-warning-amber" />
            <div className="text-2xl font-bold text-warning-amber">{degradedCount}</div>
            <div className="text-xs text-muted-foreground">Degraded</div>
          </div>
          <div className="rounded-lg bg-destructive/10 p-3 text-center">
            <XCircle className="w-6 h-6 mx-auto mb-1 text-destructive" />
            <div className="text-2xl font-bold text-destructive">{downCount}</div>
            <div className="text-xs text-muted-foreground">Down</div>
          </div>
        </div>

        {/* Service List */}
        <div className="space-y-2">
          {services.map(([name, health]) => (
            <div
              key={name}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(health.status)}
                <div>
                  <div className="font-medium text-sm">{name}</div>
                  {health.error && <div className="text-xs text-destructive">{health.error}</div>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {health.latency !== undefined && (
                  <div className="text-xs text-muted-foreground">{health.latency}ms</div>
                )}
                <Badge variant="outline" className={cn('text-xs', getStatusColor(health.status))}>
                  {health.status}
                </Badge>
              </div>
            </div>
          ))}

          {services.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Cloud className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No services monitored</p>
            </div>
          )}
        </div>

        {/* System Info */}
        <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
          <div className="flex justify-between mb-1">
            <span>Total Services:</span>
            <span className="font-semibold">{services.length}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Health Rate:</span>
            <span className="font-semibold text-success-green">
              {services.length > 0 ? ((healthyCount / services.length) * 100).toFixed(0) : 0}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Pub/Sub Subscriptions:</span>
            <span className="font-semibold">7 topics active</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
