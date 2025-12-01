/**
 * Enhanced Venue Boundary Mapping Component
 * Integrates Google Maps Drawing Manager with real-time validation
 * Combines interactive drawing tools with comprehensive zone management
 * NOW WITH REAL-TIME FIREBASE SYNC FOR MULTI-USER COLLABORATION
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, DrawingManager, StreetViewPanorama, TrafficLayer } from '@react-google-maps/api';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Pentagon,
  Plus,
  MapPin,
  Route,
  Undo,
  Grid3x3,
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
} from 'lucide-react';
import { Slider } from '../ui/slider';
import { venueData, zoneColors, zoneRoles, Zone } from '../../data/venue-data';
import { apiClient } from '@/lib/api-client';
import { firebaseService } from '@/services/firebase.service';
import { toast } from 'sonner';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const libraries: ('drawing' | 'geometry' | 'places')[] = ['drawing', 'geometry', 'places'];

interface VenueMappingProps {
  eventId?: string;
  initialCenter?: { lat: number; lng: number };
  onSave?: (layout: any) => void;
  useGoogleMaps?: boolean; // Toggle between Google Maps and simple canvas
}

export function VenueMapping({
  eventId = 'demo-event',
  initialCenter,
  onSave,
  useGoogleMaps = false,
}: VenueMappingProps) {
  // Google Maps state
  const [, setMap] = useState<google.maps.Map | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [boundary, setBoundary] = useState<google.maps.Polygon | null>(null);
  const [boundaryCoords, setBoundaryCoords] = useState<number[][][] | null>(null);
  const streetViewRef = useRef<google.maps.StreetViewPanorama | null>(null);

  // Common state
  const [drawMode, setDrawMode] = useState<'polygon' | 'zone' | 'gate' | 'route' | 'boundary' | null>(null);
  const [zones, setZones] = useState<Zone[]>(venueData.zones);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [snapToBuildings, setSnapToBuildings] = useState(true);
  const [validation] = useState<{ valid: boolean; errors: string[] }>({ valid: true, errors: [] });
  const [isSaving, setIsSaving] = useState(false);
  const [showStreetView, setShowStreetView] = useState(false);
  const [showTrafficLayer, setShowTrafficLayer] = useState(false);

  // Zone form state
  const [zoneName, setZoneName] = useState('');
  const [zoneType, setZoneType] = useState<Zone['type']>('generic');
  const [zoneCapacity, setZoneCapacity] = useState(1000);
  const [zoneRiskLevel, setZoneRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [zoneIsVIP, setZoneIsVIP] = useState(false);

  const mapCenter = initialCenter || { lat: 18.5204, lng: 73.8567 };

  const selectedZoneData = zones.find((z) => z.zoneId === selectedZone);

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
  };

  // Firebase real-time sync for multi-user collaboration
  useEffect(() => {
    if (!eventId || eventId === 'demo-event') return;

    const unsubscribe = firebaseService.subscribeToVenueLayout(eventId, (venueLayout: any) => {
      if (venueLayout.zones) {
        setZones(venueLayout.zones);
        toast.info('Venue updated by another organizer - Map refreshed with latest changes');
      }
      if (venueLayout.boundary) {
        setBoundaryCoords(venueLayout.boundary.coordinates);
      }
    });

    return () => unsubscribe();
  }, [eventId]);

  // Socket.IO for instant collaboration notifications
  useEffect(() => {
    const socket = (window as any).socket;
    if (!socket || !eventId || eventId === 'demo-event') return;

    socket.on('venue:zone-added', (data: any) => {
      toast.success(`${data.userName} added zone: ${data.zoneName}`);
    });

    socket.on('venue:zone-updated', (data: any) => {
      toast.info(`${data.userName} modified ${data.zoneName}`);
    });

    socket.on('venue:boundary-updated', (data: any) => {
      toast.info(`${data.userName} updated venue boundary`);
    });

    socket.emit('subscribe:venue-updates', eventId);

    return () => {
      socket.off('venue:zone-added');
      socket.off('venue:zone-updated');
      socket.off('venue:boundary-updated');
    };
  }, [eventId]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onDrawingManagerLoad = useCallback((manager: google.maps.drawing.DrawingManager) => {
    setDrawingManager(manager);
  }, []);

  // Convert Google Maps polygon to GeoJSON coordinates
  const polygonToGeoJSON = (polygon: google.maps.Polygon): number[][][] => {
    const path = polygon.getPath();
    const coords: number[][] = [];

    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coords.push([point.lng(), point.lat()]);
    }

    // Close the polygon
    if (coords.length > 0) {
      coords.push([...coords[0]]);
    }

    return [coords];
  };

  // Handle boundary polygon completion
  const onBoundaryComplete = useCallback(
    (polygon: google.maps.Polygon) => {
      // Remove previous boundary if exists
      if (boundary) {
        boundary.setMap(null);
      }

      // Style the boundary
      polygon.setOptions({
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        fillColor: '#FF0000',
        fillOpacity: 0.1,
        editable: true,
      });

      setBoundary(polygon);
      const coords = polygonToGeoJSON(polygon);
      setBoundaryCoords(coords);

      // Stop drawing mode
      setDrawMode(null);
      if (drawingManager) {
        drawingManager.setDrawingMode(null);
      }

      toast.success('Boundary Created', {
        description: 'Venue boundary has been drawn. You can now add zones.',
      });
    },
    [boundary, drawingManager, toast]
  );

  // Handle zone polygon completion
  const onZoneComplete = useCallback(
    (polygon: google.maps.Polygon) => {
      if (!boundaryCoords && useGoogleMaps) {
        toast.error('Error', {
          description: 'Please draw venue boundary first',
        });
        polygon.setMap(null);
        return;
      }

      const coords = polygonToGeoJSON(polygon);
      const zoneId = `zone_${Date.now()}`;

      // Create new zone
      const newZone: Zone = {
        zoneId,
        name: zoneName || `Zone ${zones.length + 1}`,
        type: zoneType,
        capacity: zoneCapacity,
        shape: {
          type: 'Polygon',
          coordinates: coords,
        },
        color: getZoneColor(zoneType),
        riskProfile: { baseRisk: zoneRiskLevel },
        allowedRoles: zoneIsVIP ? ['vip', 'staff'] : ['all'],
      };

      // Style the zone polygon
      const zoneColor = getZoneColor(zoneType);
      polygon.setOptions({
        strokeColor: zoneColor,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: zoneColor,
        fillOpacity: 0.35,
        editable: true,
      });

      setZones((prev) => [...prev, newZone]);

      // Reset form
      setZoneName('');
      setZoneCapacity(1000);
      setDrawMode(null);
      if (drawingManager) {
        drawingManager.setDrawingMode(null);
      }

      toast.success('Zone Added', {
        description: `${newZone.name} has been created`,
      });
    },
    [
      boundaryCoords,
      zoneName,
      zoneType,
      zoneCapacity,
      zoneRiskLevel,
      zoneIsVIP,
      zones,
      drawingManager,
      toast,
      useGoogleMaps,
    ]
  );

  // Get zone color by type
  const getZoneColor = (type: Zone['type']): string => {
    const colors: Record<string, string> = {
      stage: '#FF6A00',
      gate: '#0B3D91',
      food: '#00A86B',
      medical: '#E02D2D',
      vip: '#FFD700',
      parking: '#808080',
      restroom: '#4169E1',
      restricted: '#8B0000',
      generic: '#0B3D91',
    };
    return colors[type] || '#0B3D91';
  };

  const updateZone = (zoneId: string | null, updates: Partial<Zone>) => {
    if (!zoneId) return;
    setZones(zones.map((z) => (z.zoneId === zoneId ? { ...z, ...updates } : z)));
  };

  // Save venue layout
  const handleSave = async () => {
    if (useGoogleMaps && !boundaryCoords) {
      toast.error('Error', {
        description: 'Please draw venue boundary first',
      });
      return;
    }

    setIsSaving(true);
    try {
      const layout = {
        boundary: boundaryCoords
          ? {
              type: 'Polygon',
              coordinates: boundaryCoords,
            }
          : null,
        zones: zones,
        gates: [],
        routes: [],
      };

      if (eventId && eventId !== 'demo-event') {
        await apiClient.post(`/events/${eventId}/venue-layout`, layout);
      }

      toast.success('Success', {
        description: 'Venue layout saved successfully',
      });

      if (onSave) {
        onSave(layout);
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Error', {
        description: error.response?.data?.errors?.join(', ') || 'Failed to save venue layout',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add new zone (for simple canvas mode)
  const handleAddZone = () => {
    const newZone: Zone = {
      zoneId: `zone_${Date.now()}`,
      name: `Zone ${zones.length + 1}`,
      type: 'generic',
      capacity: 1000,
      shape: {
        type: 'Polygon',
        coordinates: [
          [
            [73.8569, 18.5204],
            [73.857, 18.5204],
            [73.857, 18.5205],
            [73.8569, 18.5205],
            [73.8569, 18.5204],
          ],
        ],
      },
      color: '#0B3D91',
      riskProfile: { baseRisk: 'low' },
      allowedRoles: ['all'],
    };
    setZones([...zones, newZone]);
    setSelectedZone(newZone.zoneId);
  };

  return (
    <div className="h-screen flex">
      {/* Left Toolbar */}
      <div
        className={`${useGoogleMaps ? 'w-80' : 'w-20'} bg-card border-r flex ${useGoogleMaps ? 'flex-col overflow-y-auto' : 'flex-col items-center py-4 gap-4'}`}
      >
        {useGoogleMaps ? (
          <>
            {/* Google Maps Sidebar */}
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Venue Mapping</h2>
              <p className="text-sm text-muted-foreground mt-1">Draw venue boundary and define zones</p>
            </div>

            {/* Drawing Tools */}
            <div className="p-4 border-b space-y-2">
              <Button
                variant={drawMode === 'boundary' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => {
                  setDrawMode('boundary');
                  drawingManager?.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
                }}
              >
                <Pentagon className="w-4 h-4 mr-2" />
                Draw Venue Boundary
              </Button>

              <Button
                variant={drawMode === 'zone' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => {
                  if (!boundaryCoords) {
                    toast.error('Error', {
                      description: 'Draw venue boundary first',
                    });
                    return;
                  }
                  setDrawMode('zone');
                  drawingManager?.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
                }}
                disabled={!boundaryCoords}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Zone
              </Button>
            </div>

            {/* Zone Configuration */}
            {drawMode === 'zone' && (
              <div className="p-4 border-b space-y-4">
                <div className="space-y-2">
                  <Label>Zone Name</Label>
                  <Input
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    placeholder="e.g., Main Stage"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Zone Type</Label>
                  <Select value={zoneType} onValueChange={(v: string) => setZoneType(v as Zone['type'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stage">Stage</SelectItem>
                      <SelectItem value="gate">Gate</SelectItem>
                      <SelectItem value="food">Food Court</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="vip">VIP Area</SelectItem>
                      <SelectItem value="parking">Parking</SelectItem>
                      <SelectItem value="restroom">Restroom</SelectItem>
                      <SelectItem value="restricted">Restricted</SelectItem>
                      <SelectItem value="generic">Generic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Capacity: {zoneCapacity}</Label>
                  <Slider
                    value={[zoneCapacity]}
                    onValueChange={(v: number[]) => setZoneCapacity(v[0])}
                    min={100}
                    max={50000}
                    step={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Risk Level</Label>
                  <Select value={zoneRiskLevel} onValueChange={(v: string) => setZoneRiskLevel(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={zoneIsVIP}
                    onChange={(e) => setZoneIsVIP(e.target.checked)}
                    className="rounded"
                  />
                  <Label>VIP Area</Label>
                </div>
              </div>
            )}

            {/* Zones List */}
            <div className="flex-1 p-4 space-y-2">
              <h3 className="font-semibold mb-2">Zones ({zones.length})</h3>
              {zones.map((zone) => (
                <Card
                  key={zone.zoneId}
                  className="p-3 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedZone(zone.zoneId)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: zone.color }} />
                        <span className="font-medium text-sm">{zone.name}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        <div>Capacity: {zone.capacity}</div>
                        <Badge
                          variant="outline"
                          className={`mt-1 text-xs ${
                            zone.riskProfile.baseRisk === 'low'
                              ? 'bg-[#16A34A]/10 text-[#16A34A]'
                              : zone.riskProfile.baseRisk === 'medium'
                                ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                                : 'bg-[#E02D2D]/10 text-[#E02D2D]'
                          }`}
                        >
                          {zone.riskProfile.baseRisk}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setZones(zones.filter((z) => z.zoneId !== zone.zoneId));
                        if (selectedZone === zone.zoneId) setSelectedZone(null);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Validation Status */}
            <div className="p-4 border-t">
              {validation.errors.length > 0 ? (
                <div className="flex items-start gap-2 text-destructive">
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  <div className="text-sm">
                    {validation.errors.map((error, i) => (
                      <div key={i}>{error}</div>
                    ))}
                  </div>
                </div>
              ) : boundaryCoords ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Venue layout is valid</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Info className="w-4 h-4" />
                  <span className="text-sm">Draw venue boundary to begin</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t space-y-2">
              <Button className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Venue Layout
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Simple Canvas Toolbar */}
            <Button
              variant={drawMode === 'polygon' ? 'default' : 'ghost'}
              size="icon"
              className="w-12 h-12"
              onClick={() => setDrawMode(drawMode === 'polygon' ? null : 'polygon')}
            >
              <Pentagon className="w-5 h-5" />
            </Button>

            <Button
              variant={drawMode === 'zone' ? 'default' : 'ghost'}
              size="icon"
              className="w-12 h-12"
              onClick={() => setDrawMode(drawMode === 'zone' ? null : 'zone')}
            >
              <Plus className="w-5 h-5" />
            </Button>

            <Button
              variant={drawMode === 'gate' ? 'default' : 'ghost'}
              size="icon"
              className="w-12 h-12"
              onClick={() => setDrawMode(drawMode === 'gate' ? null : 'gate')}
            >
              <MapPin className="w-5 h-5" />
            </Button>

            <Button
              variant={drawMode === 'route' ? 'default' : 'ghost'}
              size="icon"
              className="w-12 h-12"
              onClick={() => setDrawMode(drawMode === 'route' ? null : 'route')}
            >
              <Route className="w-5 h-5" />
            </Button>

            <div className="flex-1" />

            <Button variant="ghost" size="icon" className="w-12 h-12">
              <Undo className="w-5 h-5" />
            </Button>

            <Button
              variant={snapToBuildings ? 'default' : 'ghost'}
              size="icon"
              className="w-12 h-12"
              onClick={() => setSnapToBuildings(!snapToBuildings)}
            >
              <Grid3x3 className="w-5 h-5" />
            </Button>

            {useGoogleMaps && (
              <>
                <Button
                  variant={showStreetView ? 'default' : 'ghost'}
                  size="icon"
                  className="w-12 h-12"
                  onClick={() => setShowStreetView(!showStreetView)}
                  title="Toggle Street View"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </Button>

                <Button
                  variant={showTrafficLayer ? 'default' : 'ghost'}
                  size="icon"
                  className="w-12 h-12"
                  onClick={() => setShowTrafficLayer(!showTrafficLayer)}
                  title="Toggle Traffic Layer"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 10h-3V8.86c1.72-.45 3-2 3-3.86h-3V3H7v2H4c0 1.86 1.28 3.41 3 3.86V10H4c0 1.86 1.28 3.41 3 3.86V15H4c0 1.86 1.28 3.41 3 3.86V21h10v-2.14c1.72-.45 3-2 3-3.86h-3v-1.14c1.72-.45 3-2 3-3.86zM9 5h6v1H9V5zm6 14H9v-1h6v1zm0-4H9v-1h6v1zm0-4H9v-1h6v1z" />
                  </svg>
                </Button>
              </>
            )}
          </>
        )}
      </div>

      {/* Map Canvas */}
      <div className="flex-1 relative">
        {useGoogleMaps && GOOGLE_MAPS_API_KEY ? (
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={16}
              mapTypeId="satellite"
              onLoad={onLoad}
              options={{
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true,
              }}
            >
              <DrawingManager
                onLoad={onDrawingManagerLoad}
                onPolygonComplete={drawMode === 'boundary' ? onBoundaryComplete : onZoneComplete}
                options={{
                  drawingControl: false,
                  polygonOptions: {
                    strokeColor: drawMode === 'boundary' ? '#FF0000' : getZoneColor(zoneType),
                    strokeOpacity: 0.8,
                    strokeWeight: drawMode === 'boundary' ? 3 : 2,
                    fillColor: drawMode === 'boundary' ? '#FF0000' : getZoneColor(zoneType),
                    fillOpacity: drawMode === 'boundary' ? 0.1 : 0.35,
                    editable: true,
                  },
                }}
              />

              {/* Traffic Layer */}
              {showTrafficLayer && <TrafficLayer />}

              {/* Street View Panorama */}
              {showStreetView && (
                <StreetViewPanorama
                  position={mapCenter}
                  visible={showStreetView}
                  onLoad={(panorama) => {
                    streetViewRef.current = panorama;
                  }}
                  options={{
                    enableCloseButton: true,
                    addressControl: true,
                    linksControl: true,
                    panControl: true,
                    zoomControl: true,
                  }}
                  onVisibleChanged={() => {
                    if (streetViewRef.current && !streetViewRef.current.getVisible()) {
                      setShowStreetView(false);
                    }
                  }}
                />
              )}
            </GoogleMap>
          </LoadScript>
        ) : (
          <div className="absolute inset-0 bg-[#F3F4F6]">
            {/* Simulated Map Canvas */}
            <div className="w-full h-full relative">
              {/* Grid Background */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(90deg, #E5E7EB 1px, transparent 1px)',
                  backgroundSize: '50px 50px',
                }}
              />

              {/* Zones */}
              {zones.map((zone, index) => (
                <div
                  key={zone.zoneId}
                  className={`absolute cursor-pointer hover:opacity-80 transition-opacity ${
                    selectedZone === zone.zoneId ? 'ring-2 ring-primary' : ''
                  }`}
                  style={{
                    left: `${20 + index * 15}%`,
                    top: `${30 + index * 10}%`,
                    width: '200px',
                    height: '150px',
                    backgroundColor: `${zone.color}40`,
                    border: `2px solid ${zone.color}`,
                    borderRadius: '8px',
                  }}
                  onClick={() => setSelectedZone(zone.zoneId)}
                >
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-white/90">
                      {zone.name}
                    </Badge>
                  </div>
                </div>
              ))}

              {/* Mini Map */}
              <div className="absolute top-4 right-4">
                <Card className="w-32 h-32 p-2 bg-white/95 backdrop-blur">
                  <div className="w-full h-full bg-[#E5E7EB] rounded" />
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Instructions Overlay */}
        {drawMode && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <Card className="p-4 bg-white/95 backdrop-blur">
              <p className="text-foreground">
                {drawMode === 'polygon' && 'Click to place vertices. Press Enter to complete.'}
                {drawMode === 'zone' && 'Click to place zone marker. Drag to define area.'}
                {drawMode === 'gate' && 'Click to place gate entrance marker.'}
                {drawMode === 'route' && 'Click to define route waypoints.'}
                {drawMode === 'boundary' && 'Click to place vertices for venue boundary. Close the shape to complete.'}
              </p>
            </Card>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          <Button className="bg-[#16A34A] hover:bg-[#16A34A]/90" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save & Validate
              </>
            )}
          </Button>
          <Button variant="outline">Export GeoJSON</Button>
        </div>
      </div>

      {/* Right Inspector Panel */}
      <div className="w-80 bg-card border-l p-6 overflow-y-auto">
        {selectedZoneData ? (
          <div className="space-y-6">
            {/* Zone Properties */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Zone Details</h3>
                <p className="text-sm text-muted-foreground mt-1">Edit zone properties</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zone-name">Zone Name</Label>
                <Input
                  id="zone-name"
                  value={selectedZoneData.name}
                  onChange={(e) => updateZone(selectedZone, { name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zone-capacity">Capacity</Label>
                <Input
                  id="zone-capacity"
                  type="number"
                  value={selectedZoneData.capacity}
                  onChange={(e) => updateZone(selectedZone, { capacity: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Risk Level</Label>
                <div className="flex gap-2">
                  {['low', 'medium', 'high'].map((level) => (
                    <Button
                      key={level}
                      variant={selectedZoneData.riskProfile.baseRisk === level ? 'default' : 'outline'}
                      size="sm"
                      className={`flex-1 capitalize ${
                        selectedZoneData.riskProfile.baseRisk === level && level === 'low'
                          ? 'bg-[#16A34A] hover:bg-[#16A34A]/90'
                          : selectedZoneData.riskProfile.baseRisk === level && level === 'medium'
                            ? 'bg-[#F59E0B] hover:bg-[#F59E0B]/90'
                            : selectedZoneData.riskProfile.baseRisk === level && level === 'high'
                              ? 'bg-[#E02D2D] hover:bg-[#E02D2D]/90'
                              : ''
                      }`}
                      onClick={() =>
                        updateZone(selectedZone, {
                          riskProfile: { ...selectedZoneData.riskProfile, baseRisk: level as any },
                        })
                      }
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Zone Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {zoneColors.map((color) => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded border-2 ${
                        selectedZoneData.color === color ? 'border-foreground' : 'border-border'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => updateZone(selectedZone, { color })}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Allowed Roles</Label>
                <div className="space-y-2">
                  {zoneRoles.map((role) => (
                    <div key={role} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`role-${role}`}
                        checked={selectedZoneData.allowedRoles.includes(role)}
                        onChange={(e) => {
                          const newRoles = e.target.checked
                            ? [...selectedZoneData.allowedRoles, role]
                            : selectedZoneData.allowedRoles.filter((r) => r !== role);
                          updateZone(selectedZone, { allowedRoles: newRoles });
                        }}
                        className="w-4 h-4"
                      />
                      <Label htmlFor={`role-${role}`} className="capitalize font-normal cursor-pointer">
                        {role}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    setZones(zones.filter((z) => z.zoneId !== selectedZone));
                    setSelectedZone(null);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Zone
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">Zone List</h3>
              <p className="text-sm text-muted-foreground mt-1">Select a zone to edit or add new</p>
            </div>

            <div className="space-y-2">
              {zones.map((zone) => (
                <Card
                  key={zone.zoneId}
                  className="p-4 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedZone(zone.zoneId)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: zone.color }} />
                        <h4 className="font-medium">{zone.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">Capacity: {zone.capacity}</p>
                      <Badge
                        variant="outline"
                        className={
                          zone.riskProfile.baseRisk === 'low'
                            ? 'bg-[#16A34A]/10 text-[#16A34A]'
                            : zone.riskProfile.baseRisk === 'medium'
                              ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                              : 'bg-[#E02D2D]/10 text-[#E02D2D]'
                        }
                      >
                        {zone.riskProfile.baseRisk}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Button className="w-full" onClick={handleAddZone}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Zone
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
