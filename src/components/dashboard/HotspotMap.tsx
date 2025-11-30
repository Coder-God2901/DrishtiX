import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Flame, AlertTriangle, Users, Navigation } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGCPRealtime } from '@/hooks/useGCPRealtime';
import { firebaseService } from '@/services/firebase.service';

interface Hotspot {
  id: string;
  location: { lat: number; lon: number };
  intensity: number; // 0-1
  radius: number; // meters
  type: 'prediction' | 'current' | 'incident';
  count?: number;
  densityLevel?: 'low' | 'medium' | 'high' | 'critical';
}

interface Incident {
  id: string;
  location: { lat: number; lon: number };
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
}

interface Responder {
  id: string;
  location: { lat: number; lon: number };
  type: string;
  status: string;
  name: string;
}

interface HotspotMapProps {
  eventId: string;
  center?: { lat: number; lon: number };
  zoom?: number;
  hotspots?: Hotspot[];
  incidents?: Incident[];
  responders?: Responder[];
  className?: string;
}

export function HotspotMap({
  eventId,
  center = { lat: 28.6139, lon: 77.209 },
  zoom = 16,
  hotspots = [],
  incidents = [],
  responders = [],
  className,
}: HotspotMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Layer[]>([]);

  const [activeLayer, setActiveLayer] = useState<'hotspots' | 'incidents' | 'responders'>('hotspots');
  const [realtimeHotspots, setRealtimeHotspots] = useState<Hotspot[]>(hotspots);

  // Use GCP real-time predictions for enhanced hotspot detection
  const { predictions: gcpPredictions } = useGCPRealtime({
    eventId,
    enablePredictions: true,
    enableVideoAnalytics: false,
    enableSocialSignals: false,
    enableAnomalies: false,
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lon],
      zoom,
      zoomControl: true,
      attributionControl: false,
    });

    // Add tile layer with professional dark theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Subscribe to real-time hotspots
  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToPredictions(eventId, (predictions: any[]) => {
      const latestPrediction = predictions[0];
      if (latestPrediction?.hotspots) {
        const mappedHotspots: Hotspot[] = latestPrediction.hotspots.map((h: any, idx: number) => ({
          id: `hotspot_${idx}`,
          location: h.location,
          intensity: h.intensity,
          radius: h.radius || 50,
          type: 'prediction' as const,
          densityLevel: (latestPrediction as any).densityLevel || ('medium' as any),
        }));
        setRealtimeHotspots(mappedHotspots);
      }
    });

    return () => unsubscribe();
  }, [eventId]);

  // Update hotspots from GCP predictions
  useEffect(() => {
    if (gcpPredictions.length > 0) {
      const latestPrediction = gcpPredictions[0];
      if (latestPrediction.hotspots && latestPrediction.hotspots.length > 0) {
        const gcpHotspots: Hotspot[] = latestPrediction.hotspots.map((h: any, idx: number) => ({
          id: `gcp_hotspot_${idx}`,
          location: h.location,
          intensity: h.intensity,
          radius: h.radius || 50,
          type: 'prediction' as const,
          densityLevel: h.densityLevel || 'medium',
        }));
        setRealtimeHotspots((prev) => {
          // Merge with existing hotspots, preferring newer GCP data
          const merged = [...gcpHotspots];
          prev.forEach((h) => {
            if (!merged.find((m) => m.id === h.id)) {
              merged.push(h);
            }
          });
          return merged;
        });
      }
    }
  }, [gcpPredictions]);

  // Update map layers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const map = mapRef.current;

    // Render based on active layer
    if (activeLayer === 'hotspots') {
      const hotspotsToRender = realtimeHotspots.length > 0 ? realtimeHotspots : hotspots;

      hotspotsToRender.forEach((hotspot) => {
        const color = getHotspotColor(hotspot.intensity);

        // Circle for hotspot area
        const circle = L.circle([hotspot.location.lat, hotspot.location.lon], {
          color: color,
          fillColor: color,
          fillOpacity: 0.3 + hotspot.intensity * 0.4,
          radius: hotspot.radius,
          weight: 2,
        }).addTo(map);

        // Popup with details
        circle.bindPopup(`
          <div style="padding: 8px;">
            <strong style="color: ${color};">Density Hotspot</strong><br/>
            <span style="font-size: 12px;">Intensity: ${(hotspot.intensity * 100).toFixed(0)}%</span><br/>
            ${hotspot.count ? `<span style="font-size: 12px;">People: ${hotspot.count}</span>` : ''}
          </div>
        `);

        markersRef.current.push(circle);
      });
    } else if (activeLayer === 'incidents') {
      incidents.forEach((incident) => {
        const icon = getIncidentIcon(incident.type);

        const marker = L.marker([incident.location.lat, incident.location.lon], {
          icon: L.divIcon({
            html: `
              <div style="
                width: 32px;
                height: 32px;
                background: ${getSeverityColor(incident.severity)};
                border: 2px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              ">
                <span style="color: white; font-size: 16px;">${icon}</span>
              </div>
            `,
            className: '',
            iconSize: [32, 32],
          }),
        }).addTo(map);

        marker.bindPopup(`
          <div style="padding: 8px;">
            <strong style="color: ${getSeverityColor(incident.severity)};">${incident.type.toUpperCase()}</strong><br/>
            <span style="font-size: 12px;">Severity: ${incident.severity}</span><br/>
            <span style="font-size: 12px;">Status: ${incident.status}</span>
          </div>
        `);

        markersRef.current.push(marker);
      });
    } else if (activeLayer === 'responders') {
      responders.forEach((responder) => {
        const color = getResponderColor(responder.status);

        const marker = L.marker([responder.location.lat, responder.location.lon], {
          icon: L.divIcon({
            html: `
              <div style="
                width: 28px;
                height: 28px;
                background: ${color};
                border: 2px solid white;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              ">
                <span style="color: white; font-size: 14px;">👤</span>
              </div>
            `,
            className: '',
            iconSize: [28, 28],
          }),
        }).addTo(map);

        marker.bindPopup(`
          <div style="padding: 8px;">
            <strong>${responder.name}</strong><br/>
            <span style="font-size: 12px;">Type: ${responder.type}</span><br/>
            <span style="font-size: 12px; color: ${color};">Status: ${responder.status}</span>
          </div>
        `);

        markersRef.current.push(marker);
      });
    }
  }, [activeLayer, hotspots, incidents, responders, realtimeHotspots]);

  const getHotspotColor = (intensity: number) => {
    if (intensity >= 0.8) return '#E02D2D'; // Critical
    if (intensity >= 0.6) return '#F59E0B'; // High
    if (intensity >= 0.4) return '#FF6A00'; // Medium
    return '#16A34A'; // Low
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#E02D2D';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#FF6A00';
      case 'low':
        return '#16A34A';
      default:
        return '#475569';
    }
  };

  const getIncidentIcon = (type: string) => {
    if (type.includes('fire')) return '🔥';
    if (type.includes('medical')) return '⚕️';
    if (type.includes('panic') || type.includes('crush')) return '⚠️';
    return '📍';
  };

  const getResponderColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#16A34A';
      case 'dispatched':
        return '#FF6A00';
      case 'responding':
        return '#F59E0B';
      case 'on_scene':
        return '#E02D2D';
      default:
        return '#475569';
    }
  };

  const layerStats = {
    hotspots: realtimeHotspots.length || hotspots.length,
    incidents: incidents.length,
    responders: responders.length,
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Live Crowd Density Map
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10">
            <Navigation className="w-3 h-3 mr-1" />
            Real-time
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Layer Toggle */}
        <div className="px-6 pb-3 flex gap-2">
          <button
            onClick={() => setActiveLayer('hotspots')}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
              activeLayer === 'hotspots'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <Users className="w-4 h-4 inline mr-1" />
            Hotspots ({layerStats.hotspots})
          </button>
          <button
            onClick={() => setActiveLayer('incidents')}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
              activeLayer === 'incidents'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            Incidents ({layerStats.incidents})
          </button>
          <button
            onClick={() => setActiveLayer('responders')}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
              activeLayer === 'responders'
                ? 'bg-success-green text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <Flame className="w-4 h-4 inline mr-1" />
            Responders ({layerStats.responders})
          </button>
        </div>

        {/* Map Container */}
        <div ref={mapContainerRef} className="w-full h-[500px] bg-dark-surface" style={{ zIndex: 0 }} />

        {/* Legend */}
        <div className="px-6 py-3 border-t bg-muted/30">
          <p className="text-xs font-medium text-muted-foreground mb-2">Legend</p>
          <div className="flex flex-wrap gap-3">
            {activeLayer === 'hotspots' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success-green"></div>
                  <span className="text-xs text-muted-foreground">Low</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent"></div>
                  <span className="text-xs text-muted-foreground">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning-amber"></div>
                  <span className="text-xs text-muted-foreground">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive"></div>
                  <span className="text-xs text-muted-foreground">Critical</span>
                </div>
              </>
            )}
            {activeLayer === 'responders' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-success-green"></div>
                  <span className="text-xs text-muted-foreground">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-accent"></div>
                  <span className="text-xs text-muted-foreground">Dispatched</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-warning-amber"></div>
                  <span className="text-xs text-muted-foreground">Responding</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-destructive"></div>
                  <span className="text-xs text-muted-foreground">On Scene</span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
