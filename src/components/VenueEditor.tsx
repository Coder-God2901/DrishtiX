import React from 'react';

type LatLng = { lat: number; lng: number };
type RawZone = {
  id: string;
  name: string;
  capacity: number;
  riskLevel: 'low' | 'medium' | 'high';
  color: string;
  vertices: LatLng[];
  allowedRoles: string[];
};
type RawGate = { id: string; label: string; lat: number; lng: number; type: string };
type RawRoute = { id: string; points: LatLng[] };

function normalizeVenueData(boundaryRaw: LatLng[], zonesRaw: RawZone[], gatesRaw: RawGate[], routesRaw: RawRoute[]) {
  return {
    venueBoundary: {
      type: 'Polygon',
      coordinates: [boundaryRaw.map((v) => [v.lng, v.lat])],
    },
    zones: zonesRaw.map((z) => ({
      zoneId: z.id,
      name: z.name,
      capacity: z.capacity,
      riskLevel: z.riskLevel,
      color: z.color,
      allowedRoles: z.allowedRoles,
      shape: {
        type: 'Polygon',
        coordinates: [z.vertices.map((v) => [v.lng, v.lat])],
      },
    })),
    gates: gatesRaw.map((g) => ({
      gateId: g.id,
      label: g.label,
      location: { lat: g.lat, lng: g.lng },
      type: g.type,
    })),
    routes: routesRaw.map((r) => ({
      routeId: r.id,
      points: r.points,
    })),
  };
}

export const VenueEditor: React.FC = () => {
  const [boundary, setBoundary] = React.useState<LatLng[]>([]);
  const [zones, setZones] = React.useState<RawZone[]>([]);
  const [gates, setGates] = React.useState<RawGate[]>([]);
  const [routes, setRoutes] = React.useState<RawRoute[]>([]);
  const [output, setOutput] = React.useState<any | null>(null);

  const addBoundaryVertex = () => {
    setBoundary((b) => [...b, { lat: 18.5203 + Math.random() * 0.001, lng: 73.8568 + Math.random() * 0.001 }]);
  };
  const addZone = () => {
    const id = `zone_${zones.length + 1}`;
    setZones((z) => [
      ...z,
      {
        id,
        name: `Zone ${id}`,
        capacity: 1000,
        riskLevel: 'medium',
        color: '#FF6A00',
        allowedRoles: ['all'],
        vertices: [
          { lat: 18.5203, lng: 73.8568 },
          { lat: 18.5204, lng: 73.8569 },
          { lat: 18.5205, lng: 73.8568 },
        ],
      },
    ]);
  };
  const addGate = () => {
    const id = `gate_${gates.length + 1}`;
    setGates((g) => [...g, { id, label: `Gate ${id}`, lat: 18.5208, lng: 73.857, type: 'entry_exit' }]);
  };
  const addRoute = () => {
    const id = `route_${routes.length + 1}`;
    setRoutes((r) => [
      ...r,
      {
        id,
        points: [
          { lat: 18.5208, lng: 73.857 },
          { lat: 18.521, lng: 73.8565 },
        ],
      },
    ]);
  };

  const validateAndSave = () => {
    // Minimal validation; boundary must have at least 3 points
    if (boundary.length < 3) {
      alert('Boundary requires at least 3 vertices');
      return;
    }
    const normalized = normalizeVenueData(boundary, zones, gates, routes);
    setOutput(normalized);
    // TODO: POST to backend for persistence
  };

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">Venue Editor</h2>
      <div className="flex gap-2">
        <button className="px-3 py-1 border rounded" onClick={addBoundaryVertex}>
          Add Boundary Vertex
        </button>
        <button className="px-3 py-1 border rounded" onClick={addZone}>
          Add Zone
        </button>
        <button className="px-3 py-1 border rounded" onClick={addGate}>
          Add Gate
        </button>
        <button className="px-3 py-1 border rounded" onClick={addRoute}>
          Add Route
        </button>
        <button className="px-3 py-1 border rounded" onClick={validateAndSave}>
          Save & Validate
        </button>
      </div>
      <div className="text-xs text-muted-foreground">
        Boundary points: {boundary.length} · Zones: {zones.length} · Gates: {gates.length} · Routes: {routes.length}
      </div>
      {output && (
        <pre className="text-xs border rounded p-2 whitespace-pre-wrap">{JSON.stringify(output, null, 2)}</pre>
      )}
    </div>
  );
};
