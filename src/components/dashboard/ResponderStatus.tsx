import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Navigation, User, Clock, MapPin, Phone, AlertCircle } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { firebaseService } from '@/services/firebase.service';

interface Responder {
  id: string;
  name: string;
  type: 'medical' | 'security' | 'fire' | 'police' | 'evacuation' | 'coordinator';
  status: 'available' | 'dispatched' | 'responding' | 'on_scene' | 'returning' | 'offline';
  location?: { lat: number; lon: number };
  lastUpdate: Date;
  currentIncidentId?: string;
  eta?: number; // seconds
  phone?: string;
}

interface ResponderStatusProps {
  eventId?: string;
  responders?: Responder[];
  className?: string;
  onResponderClick?: (responder: Responder) => void;
}

export function ResponderStatus({ eventId, responders = [], className, onResponderClick }: ResponderStatusProps) {
  const [realtimeResponders, setRealtimeResponders] = useState<Responder[]>(responders);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Subscribe to real-time responder updates
  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = firebaseService.subscribeToResponders((respondersData: any[]) => {
      const mapped: Responder[] = respondersData.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        status: r.status,
        location: r.location,
        lastUpdate: new Date(r.lastUpdate?.toMillis() || Date.now()),
        currentIncidentId: r.currentIncidentId,
        eta: r.eta,
        phone: r.phone,
      }));
      setRealtimeResponders(mapped);
    });

    return () => unsubscribe();
  }, [eventId]);

  const displayResponders = realtimeResponders.length > 0 ? realtimeResponders : responders;

  const filteredResponders = displayResponders.filter((r) => filterStatus === 'all' || r.status === filterStatus);

  const stats = {
    total: displayResponders.length,
    available: displayResponders.filter((r) => r.status === 'available').length,
    active: displayResponders.filter(
      (r) => r.status === 'dispatched' || r.status === 'responding' || r.status === 'on_scene'
    ).length,
    offline: displayResponders.filter((r) => r.status === 'offline').length,
  };

  const statusConfig = {
    available: {
      color: 'bg-success-green text-white',
      dotColor: 'bg-success-green',
      label: 'Available',
    },
    dispatched: {
      color: 'bg-accent text-accent-foreground',
      dotColor: 'bg-accent',
      label: 'Dispatched',
    },
    responding: {
      color: 'bg-warning-amber text-white',
      dotColor: 'bg-warning-amber',
      label: 'En Route',
    },
    on_scene: {
      color: 'bg-destructive text-destructive-foreground',
      dotColor: 'bg-destructive',
      label: 'On Scene',
    },
    returning: {
      color: 'bg-primary text-primary-foreground',
      dotColor: 'bg-primary',
      label: 'Returning',
    },
    offline: {
      color: 'bg-muted text-muted-foreground',
      dotColor: 'bg-muted-foreground',
      label: 'Offline',
    },
  };

  const typeIcons = {
    medical: '⚕️',
    security: '🛡️',
    fire: '🚒',
    police: '👮',
    evacuation: '🚨',
    coordinator: '📋',
  };

  const formatETA = (seconds?: number) => {
    if (!seconds) return null;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 1) return '<1 min';
    return `${minutes} min`;
  };

  const getTimeSinceUpdate = (lastUpdate: Date) => {
    const diff = Date.now() - lastUpdate.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            Responder Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-success-green/10 text-success-green border-success-green">
              {stats.available} Available
            </Badge>
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent">
              {stats.active} Active
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
              filterStatus === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            All ({stats.total})
          </button>
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = displayResponders.filter((r) => r.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5',
                  filterStatus === status ? config.color : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <div className={cn('w-2 h-2 rounded-full', config.dotColor)}></div>
                {config.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Responders List */}
        <ScrollArea className="h-[400px] pr-3">
          <div className="space-y-2">
            {filteredResponders.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  No{' '}
                  {filterStatus === 'all'
                    ? ''
                    : statusConfig[filterStatus as keyof typeof statusConfig]?.label.toLowerCase()}{' '}
                  responders
                </p>
              </div>
            ) : (
              filteredResponders.map((responder) => {
                const config = statusConfig[responder.status];

                return (
                  <div
                    key={responder.id}
                    onClick={() => onResponderClick?.(responder)}
                    className="bg-card border rounded-lg p-3 hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      {/* Type Icon */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                        {typeIcons[responder.type]}
                      </div>

                      {/* Responder Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                              {responder.name}
                              <div className={cn('w-2 h-2 rounded-full animate-pulse', config.dotColor)}></div>
                            </h4>
                            <p className="text-xs text-muted-foreground capitalize">{responder.type} Team</p>
                          </div>
                          <Badge variant="outline" className={cn('text-xs shrink-0', config.color)}>
                            {config.label}
                          </Badge>
                        </div>

                        {/* ETA for active responders */}
                        {responder.eta && (responder.status === 'dispatched' || responder.status === 'responding') && (
                          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-accent">
                            <Clock className="w-3 h-3" />
                            ETA: {formatETA(responder.eta)}
                          </div>
                        )}

                        {/* Incident Assignment */}
                        {responder.currentIncidentId && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <AlertCircle className="w-3 h-3" />
                            Assigned to incident #{responder.currentIncidentId.slice(-6)}
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            ID: {responder.id.slice(-6)}
                          </div>
                          {responder.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {responder.phone}
                            </div>
                          )}
                        </div>

                        {/* Location & Last Update */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {responder.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {responder.location.lat.toFixed(4)}, {responder.location.lon.toFixed(4)}
                            </div>
                          )}
                          <div className="flex items-center gap-1 ml-auto">
                            <Clock className="w-3 h-3" />
                            Updated {getTimeSinceUpdate(responder.lastUpdate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Summary Footer */}
        <div className="pt-3 border-t grid grid-cols-4 gap-2">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-lg font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Available</p>
            <p className="text-lg font-bold text-success-green">{stats.available}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Active</p>
            <p className="text-lg font-bold text-accent">{stats.active}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Offline</p>
            <p className="text-lg font-bold text-muted-foreground">{stats.offline}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
