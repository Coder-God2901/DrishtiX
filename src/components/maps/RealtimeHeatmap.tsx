import React from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngExpression } from 'leaflet';
import { useRealtime } from '@/providers/realtime';

export const RealtimeHeatmap: React.FC = () => {
  const { state } = useRealtime();

  const center: LatLngExpression = [18.5203, 73.8568];

  return (
    <div className="absolute inset-0">
      <MapContainer center={center} zoom={16} className="w-full h-full" scrollWheelZoom>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {state.heatgrid.map((cell) => {
          // coordinates as [lng, lat]; convert to [lat, lng]
          const latlngs: LatLngExpression[] = cell.coordinates.map(([lng, lat]) => [lat, lng]);
          const intensity = Math.min(1, cell.count / 200);
          const color = `rgba(224,45,45,${0.2 + 0.6 * intensity})`;
          return (
            <Polygon
              key={cell.cellId}
              positions={latlngs}
              pathOptions={{ color: '#E02D2D', weight: 1, fillColor: color, fillOpacity: 0.5 }}
            />
          );
        })}
        {state.teamLocations.map((loc) => {
          const icon = L.divIcon({
            className: 'realtime-marker',
            html: `<div style="background:#0B3D91;padding:4px 6px;border-radius:6px;color:#fff;font-size:10px;font-weight:600;">${loc.role || 'staff'}</div>`,
          });
          return (
            <Marker key={loc.userId + loc.timestamp} position={[loc.lat, loc.lng]} icon={icon}>
              <Popup>
                <div className="text-xs">
                  <div>
                    <strong>{loc.userId}</strong>
                  </div>
                  <div>Role: {loc.role || 'staff'}</div>
                  <div>{new Date(loc.timestamp).toLocaleTimeString()}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
