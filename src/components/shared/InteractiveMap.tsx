import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapMarker {
  id: string;
  position: [number, number];
  title: string;
  type: 'team' | 'incident' | 'poi' | 'camera';
  icon?: string;
  popup?: string;
}

export interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  polygons?: Array<{
    id: string;
    coordinates: [number, number][];
    color?: string;
    label?: string;
  }>;
  heatmapData?: Array<[number, number, number]>;
  onMapClick?: (latlng: L.LatLng) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  height?: string;
}

export function InteractiveMap({
  center = [40.7128, -74.006],
  zoom = 13,
  markers = [],
  polygons = [],
  heatmapData = [],
  onMapClick,
  onMarkerClick,
  height = '600px',
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonsLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    polygonsLayerRef.current = L.layerGroup().addTo(map);

    if (onMapClick) {
      map.on('click', (e) => onMapClick(e.latlng));
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update center and zoom
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    if (!markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    markers.forEach((marker) => {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div class="marker-${marker.type}">${getMarkerIcon(marker.type)}</div>`,
        iconSize: [30, 30],
      });

      const leafletMarker = L.marker(marker.position, { icon }).bindPopup(marker.popup || marker.title);

      if (onMarkerClick) {
        leafletMarker.on('click', () => onMarkerClick(marker));
      }

      leafletMarker.addTo(markersLayerRef.current!);
    });
  }, [markers, onMarkerClick]);

  // Update polygons
  useEffect(() => {
    if (!polygonsLayerRef.current) return;

    polygonsLayerRef.current.clearLayers();

    polygons.forEach((polygon) => {
      const leafletPolygon = L.polygon(polygon.coordinates, {
        color: polygon.color || '#3388ff',
        fillOpacity: 0.2,
      }).bindPopup(polygon.label || 'Zone');

      leafletPolygon.addTo(polygonsLayerRef.current!);
    });
  }, [polygons]);

  return <div ref={mapContainerRef} style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border" />;
}

function getMarkerIcon(type: string): string {
  switch (type) {
    case 'team':
      return '👥';
    case 'incident':
      return '⚠️';
    case 'poi':
      return '📍';
    case 'camera':
      return '📹';
    default:
      return '📌';
  }
}
