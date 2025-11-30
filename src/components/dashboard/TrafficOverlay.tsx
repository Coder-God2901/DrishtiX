import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, Navigation, Clock } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { firebaseService } from '@/services/firebase.service';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TrafficIncident {
  id: string;
  source: 'waze' | 'osm' | 'google_maps' | 'crowdsource';
  type: 'construction' | 'accident' | 'jam' | 'hazard' | 'closure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: { lat: number; lon: number };
  affectedRoads: string[];
  description: string;
  reportedAt: Date;
  estimatedClearTime?: Date;
  verificationStatus: 'unverified' | 'verified' | 'resolved';
}

interface TrafficOverlayProps {
  eventId?: string;
  incidents?: TrafficIncident[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  onIncidentClick?: (incident: TrafficIncident) => void;
  showLegend?: boolean;
}

export function TrafficOverlay({
  eventId,
  incidents = [],
  center = [28.6139, 77.209],
  zoom = 13,
  className,
  onIncidentClick,
  showLegend = true,
}: TrafficOverlayProps) {
  const [realtimeIncidents, setRealtimeIncidents] = useState<TrafficIncident[]>(incidents);
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterTimeRange, setFilterTimeRange] = useState<'1h' | '6h' | '24h'>('6h');
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Subscribe to real-time traffic incidents
  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = firebaseService.subscribeToTrafficIncidents((incidentsData: any[]) => {
      const mapped: TrafficIncident[] = incidentsData.map((incident) => ({
        id: incident.id,
        source: incident.source,
        type: incident.type,
        severity: incident.severity,
        location: incident.location,
        affectedRoads: incident.affectedRoads || [],
        description: incident.description,
        reportedAt: new Date(incident.reportedAt?.toMillis() || Date.now()),
        estimatedClearTime: incident.estimatedClearTime ? new Date(incident.estimatedClearTime.toMillis()) : undefined,
        verificationStatus: incident.verificationStatus,
      }));
      setRealtimeIncidents(mapped);
    });

    return () => unsubscribe();
  }, [eventId]);

  const displayIncidents = realtimeIncidents.length > 0 ? realtimeIncidents : incidents;

  // Filter incidents by source and time range
  const filteredIncidents = displayIncidents.filter((incident) => {
    const sourceMatch = filterSource === 'all' || incident.source === filterSource;

    const hoursDiff = (Date.now() - incident.reportedAt.getTime()) / (1000 * 60 * 60);
    const timeMatch =
      (filterTimeRange === '1h' && hoursDiff <= 1) ||
      (filterTimeRange === '6h' && hoursDiff <= 6) ||
      (filterTimeRange === '24h' && hoursDiff <= 24);

    return sourceMatch && timeMatch;
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView(center, zoom);

    // Add dark theme tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors, © CartoDB',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map center
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Update traffic incident markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    filteredIncidents.forEach((incident) => {
      const icon = getTrafficIcon(incident.type, incident.severity);

      const marker = L.marker([incident.location.lat, incident.location.lon], {
        icon: L.divIcon({
          html: icon,
          className: 'traffic-incident-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        }),
      });

      const popup = `
        <div class="p-2 min-w-[200px]">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg">${getTrafficEmoji(incident.type)}</span>
            <span class="font-semibold text-sm capitalize">${incident.type}</span>
          </div>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Source:</span>
              <span class="font-medium capitalize">${incident.source.replace('_', ' ')}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Severity:</span>
              <span class="font-medium capitalize ${getSeverityColor(incident.severity)}">${incident.severity}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Status:</span>
              <span class="font-medium capitalize">${incident.verificationStatus}</span>
            </div>
          </div>
          <p class="text-xs mt-2 text-foreground">${incident.description}</p>
          ${
            incident.affectedRoads.length > 0
              ? `
            <div class="mt-2">
              <p class="text-xs font-semibold mb-1">Affected Roads:</p>
              <ul class="text-xs space-y-0.5">
                ${incident.affectedRoads
                  .slice(0, 3)
                  .map((road) => `<li>• ${road}</li>`)
                  .join('')}
                ${incident.affectedRoads.length > 3 ? `<li class="text-muted-foreground">+${incident.affectedRoads.length - 3} more</li>` : ''}
              </ul>
            </div>
          `
              : ''
          }
          <p class="text-xs text-muted-foreground mt-2">
            Reported ${getTimeAgo(incident.reportedAt)}
          </p>
        </div>
      `;

      marker.bindPopup(popup);
      marker.on('click', () => onIncidentClick?.(incident));
      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);
    });
  }, [filteredIncidents, onIncidentClick]);

  const stats = {
    total: filteredIncidents.length,
    critical: filteredIncidents.filter((i) => i.severity === 'critical').length,
    unverified: filteredIncidents.filter((i) => i.verificationStatus === 'unverified').length,
    byType: {
      construction: filteredIncidents.filter((i) => i.type === 'construction').length,
      accident: filteredIncidents.filter((i) => i.type === 'accident').length,
      jam: filteredIncidents.filter((i) => i.type === 'jam').length,
      hazard: filteredIncidents.filter((i) => i.type === 'hazard').length,
      closure: filteredIncidents.filter((i) => i.type === 'closure').length,
    },
  };

  const sourceIcons = {
    waze: '🚗',
    osm: '🗺️',
    google_maps: '📍',
    crowdsource: '👥',
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Traffic Incidents
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
              {stats.critical} Critical
            </Badge>
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent">
              {stats.total} Active
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Filters */}
        <div className="space-y-2">
          {/* Source Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setFilterSource('all')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                filterSource === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              All Sources ({displayIncidents.length})
            </button>
            {(['waze', 'osm', 'google_maps', 'crowdsource'] as const).map((source) => {
              const count = displayIncidents.filter((i) => i.source === source).length;
              return (
                <button
                  key={source}
                  onClick={() => setFilterSource(source)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5',
                    filterSource === source
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  <span>{sourceIcons[source]}</span>
                  {source.replace('_', ' ').toUpperCase()} ({count})
                </button>
              );
            })}
          </div>

          {/* Time Range Filter */}
          <div className="flex gap-2">
            {(['1h', '6h', '24h'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setFilterTimeRange(range)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5',
                  filterTimeRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <Clock className="w-3 h-3" />
                Last {range}
              </button>
            ))}
          </div>
        </div>

        {/* Traffic Map */}
        <div className="relative">
          <div ref={mapContainerRef} className="h-[400px] rounded-lg overflow-hidden border-2 border-border" />

          {/* Legend */}
          {showLegend && (
            <div className="absolute top-3 right-3 bg-background/90 backdrop-blur rounded-lg p-3 shadow-lg border border-border max-w-[200px]">
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Incident Types
              </h4>
              <div className="space-y-1.5">
                {[
                  { type: 'construction', label: 'Construction', emoji: '🚧' },
                  { type: 'accident', label: 'Accident', emoji: '🚗' },
                  { type: 'jam', label: 'Traffic Jam', emoji: '🚦' },
                  { type: 'hazard', label: 'Hazard', emoji: '⚠️' },
                  { type: 'closure', label: 'Road Closure', emoji: '🚫' },
                ].map(({ type, label, emoji }) => (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span>{emoji}</span>
                      <span className="text-foreground">{label}</span>
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {stats.byType[type as keyof typeof stats.byType]}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t space-y-1">
                <h4 className="text-xs font-semibold mb-1.5">Severity</h4>
                {[
                  { level: 'critical', color: 'bg-destructive', label: 'Critical' },
                  { level: 'high', color: 'bg-warning-amber', label: 'High' },
                  { level: 'medium', color: 'bg-accent', label: 'Medium' },
                  { level: 'low', color: 'bg-success-green', label: 'Low' },
                ].map(({ level, color, label }) => (
                  <div key={level} className="flex items-center gap-2 text-xs">
                    <div className={cn('w-3 h-3 rounded-full', color)}></div>
                    <span className="text-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Incidents List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-8">
              <Navigation className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No traffic incidents in the selected time range
              </p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting the filters</p>
            </div>
          ) : (
            filteredIncidents.slice(0, 10).map((incident) => (
              <div
                key={incident.id}
                onClick={() => onIncidentClick?.(incident)}
                className={cn(
                  'bg-card border-l-4 rounded-lg p-3 hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer',
                  getSeverityBorderColor(incident.severity)
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 text-2xl">{getTrafficEmoji(incident.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-sm text-foreground capitalize">{incident.type}</h4>
                      <Badge
                        variant="outline"
                        className={cn('text-xs shrink-0', getSeverityBadgeColor(incident.severity))}
                      >
                        {incident.severity}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{incident.description}</p>

                    {incident.affectedRoads.length > 0 && (
                      <div className="flex items-center gap-1 mb-2 text-xs">
                        <Navigation className="w-3 h-3 text-accent flex-shrink-0" />
                        <span className="text-foreground font-medium truncate">
                          {incident.affectedRoads[0]}
                          {incident.affectedRoads.length > 1 && ` +${incident.affectedRoads.length - 1}`}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span>{sourceIcons[incident.source]}</span>
                        <span className="capitalize">{incident.source.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(incident.reportedAt)}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          incident.verificationStatus === 'verified'
                            ? 'bg-success-green/10 text-success-green border-success-green'
                            : incident.verificationStatus === 'resolved'
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-warning-amber/10 text-warning-amber border-warning-amber'
                        )}
                      >
                        {incident.verificationStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Footer */}
        <div className="pt-3 border-t grid grid-cols-5 gap-2">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-lg font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Critical</p>
            <p className="text-lg font-bold text-destructive">{stats.critical}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Accidents</p>
            <p className="text-lg font-bold text-accent">{stats.byType.accident}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Jams</p>
            <p className="text-lg font-bold text-warning-amber">{stats.byType.jam}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Unverified</p>
            <p className="text-lg font-bold text-muted-foreground">{stats.unverified}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions
function getTrafficEmoji(type: string): string {
  const emojis: Record<string, string> = {
    construction: '🚧',
    accident: '🚗',
    jam: '🚦',
    hazard: '⚠️',
    closure: '🚫',
  };
  return emojis[type] || '📍';
}

function getTrafficIcon(type: string, severity: string): string {
  const emoji = getTrafficEmoji(type);
  const color =
    severity === 'critical'
      ? '#E02D2D'
      : severity === 'high'
        ? '#F59E0B'
        : severity === 'medium'
          ? '#FF6A00'
          : '#16A34A';

  return `
    <div style="
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      background: ${color};
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">
      ${emoji}
    </div>
  `;
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: 'text-destructive',
    high: 'text-warning-amber',
    medium: 'text-accent',
    low: 'text-success-green',
  };
  return colors[severity] || 'text-foreground';
}

function getSeverityBorderColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: 'border-l-destructive',
    high: 'border-l-warning-amber',
    medium: 'border-l-accent',
    low: 'border-l-success-green',
  };
  return colors[severity] || 'border-l-border';
}

function getSeverityBadgeColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: 'bg-destructive/10 text-destructive border-destructive',
    high: 'bg-warning-amber/10 text-warning-amber border-warning-amber',
    medium: 'bg-accent/10 text-accent border-accent',
    low: 'bg-success-green/10 text-success-green border-success-green',
  };
  return colors[severity] || '';
}

function getTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
