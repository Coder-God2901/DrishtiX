import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GeofenceZone {
  id: string;
  name: string;
  description?: string;
  type: 'polygon' | 'circle';
  coordinates: [number, number][] | { center: [number, number]; radius: number };
  color: string;
  active: boolean;
  alerts: {
    onEntry: boolean;
    onExit: boolean;
    onDwell: boolean;
    dwellThreshold?: number; // minutes
    speedLimit?: number; // km/h
  };
  schedule?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    days: number[]; // 0-6 for Sun-Sat
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationPoint {
  id: string;
  entityId: string; // team member, vehicle, etc.
  entityType: 'person' | 'vehicle' | 'asset';
  entityName: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
  insideZones: string[]; // zone IDs
}

export interface GeofenceEvent {
  id: string;
  type: 'entry' | 'exit' | 'dwell' | 'speed_violation';
  zoneId: string;
  zoneName: string;
  entityId: string;
  entityName: string;
  entityType: 'person' | 'vehicle' | 'asset';
  location: [number, number];
  timestamp: Date;
  metadata?: {
    speed?: number;
    dwellTime?: number;
    previousZone?: string;
  };
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface LocationHistory {
  entityId: string;
  points: LocationPoint[];
  startTime: Date;
  endTime: Date;
}

interface GeofencingState {
  zones: GeofenceZone[];
  currentLocations: LocationPoint[];
  events: GeofenceEvent[];
  locationHistory: Record<string, LocationPoint[]>;
  tracking: boolean;

  // Actions
  addZone: (zone: GeofenceZone) => void;
  updateZone: (id: string, updates: Partial<GeofenceZone>) => void;
  deleteZone: (id: string) => void;
  toggleZoneActive: (id: string) => void;

  updateLocation: (location: LocationPoint) => void;
  updateLocations: (locations: LocationPoint[]) => void;

  addEvent: (event: GeofenceEvent) => void;
  acknowledgeEvent: (eventId: string, userId: string) => void;
  clearEvents: () => void;

  addToHistory: (entityId: string, point: LocationPoint) => void;
  getHistory: (entityId: string, startTime: Date, endTime: Date) => LocationPoint[];
  clearHistory: (entityId: string) => void;

  startTracking: () => void;
  stopTracking: () => void;

  checkGeofence: (location: LocationPoint) => GeofenceEvent[];
}

// Helper function to check if point is inside polygon
function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

// Helper function to check if point is inside circle
function isPointInCircle(
  point: [number, number],
  center: [number, number],
  radius: number
): boolean {
  const [lat1, lon1] = point;
  const [lat2, lon2] = center;

  // Haversine formula
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= radius;
}

export const useGeofencingStore = create<GeofencingState>()(
  persist(
    (set, get) => ({
      zones: [],
      currentLocations: [],
      events: [],
      locationHistory: {},
      tracking: false,

      addZone: (zone) => set((state) => ({
        zones: [...state.zones, zone],
      })),

      updateZone: (id, updates) => set((state) => ({
        zones: state.zones.map((z) =>
          z.id === id ? { ...z, ...updates, updatedAt: new Date() } : z
        ),
      })),

      deleteZone: (id) => set((state) => ({
        zones: state.zones.filter((z) => z.id !== id),
      })),

      toggleZoneActive: (id) => set((state) => ({
        zones: state.zones.map((z) =>
          z.id === id ? { ...z, active: !z.active, updatedAt: new Date() } : z
        ),
      })),

      updateLocation: (location) => {
        set((state) => {
          const newLocations = [
            ...state.currentLocations.filter((l) => l.entityId !== location.entityId),
            location,
          ];

          // Check geofences
          const newEvents = get().checkGeofence(location);

          return {
            currentLocations: newLocations,
            events: [...state.events, ...newEvents],
          };
        });

        // Add to history
        get().addToHistory(location.entityId, location);
      },

      updateLocations: (locations) => set((state) => {
        const locationMap = new Map(state.currentLocations.map((l) => [l.entityId, l]));
        locations.forEach((loc) => locationMap.set(loc.entityId, loc));

        return {
          currentLocations: Array.from(locationMap.values()),
        };
      }),

      addEvent: (event) => set((state) => ({
        events: [event, ...state.events].slice(0, 1000), // Keep last 1000 events
      })),

      acknowledgeEvent: (eventId, userId) => set((state) => ({
        events: state.events.map((e) =>
          e.id === eventId
            ? {
              ...e,
              acknowledged: true,
              acknowledgedBy: userId,
              acknowledgedAt: new Date(),
            }
            : e
        ),
      })),

      clearEvents: () => set({ events: [] }),

      addToHistory: (entityId, point) => set((state) => {
        const history = state.locationHistory[entityId] || [];
        return {
          locationHistory: {
            ...state.locationHistory,
            [entityId]: [...history, point].slice(-1000), // Keep last 1000 points
          },
        };
      }),

      getHistory: (entityId, startTime, endTime) => {
        const history = get().locationHistory[entityId] || [];
        return history.filter(
          (p) => p.timestamp >= startTime && p.timestamp <= endTime
        );
      },

      clearHistory: (entityId) => set((state) => {
        const newHistory = { ...state.locationHistory };
        delete newHistory[entityId];
        return { locationHistory: newHistory };
      }),

      startTracking: () => set({ tracking: true }),
      stopTracking: () => set({ tracking: false }),

      checkGeofence: (location) => {
        const { zones, currentLocations } = get();
        const events: GeofenceEvent[] = [];
        const point: [number, number] = [location.latitude, location.longitude];

        // Find previous location for this entity
        const prevLocation = currentLocations.find((l) => l.entityId === location.entityId);
        const prevZones = prevLocation?.insideZones || [];

        const currentZones: string[] = [];

        zones.forEach((zone) => {
          if (!zone.active) return;

          // Check schedule
          if (zone.schedule?.enabled) {
            const now = new Date();
            const currentDay = now.getDay();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const [startHour, startMin] = zone.schedule.startTime.split(':').map(Number);
            const [endHour, endMin] = zone.schedule.endTime.split(':').map(Number);
            const startTime = startHour * 60 + startMin;
            const endTime = endHour * 60 + endMin;

            if (
              !zone.schedule.days.includes(currentDay) ||
              currentTime < startTime ||
              currentTime > endTime
            ) {
              return;
            }
          }

          let isInside = false;

          if (zone.type === 'polygon' && Array.isArray(zone.coordinates)) {
            isInside = isPointInPolygon(point, zone.coordinates as [number, number][]);
          } else if (zone.type === 'circle' && 'center' in zone.coordinates) {
            const { center, radius } = zone.coordinates as { center: [number, number]; radius: number };
            isInside = isPointInCircle(point, center, radius);
          }

          if (isInside) {
            currentZones.push(zone.id);

            // Check for entry
            if (zone.alerts.onEntry && !prevZones.includes(zone.id)) {
              events.push({
                id: `${Date.now()}-${Math.random()}`,
                type: 'entry',
                zoneId: zone.id,
                zoneName: zone.name,
                entityId: location.entityId,
                entityName: location.entityName,
                entityType: location.entityType,
                location: point,
                timestamp: new Date(),
                acknowledged: false,
              });
            }

            // Check for speed violation
            if (zone.alerts.speedLimit && location.speed && location.speed > zone.alerts.speedLimit) {
              events.push({
                id: `${Date.now()}-${Math.random()}`,
                type: 'speed_violation',
                zoneId: zone.id,
                zoneName: zone.name,
                entityId: location.entityId,
                entityName: location.entityName,
                entityType: location.entityType,
                location: point,
                timestamp: new Date(),
                metadata: { speed: location.speed },
                acknowledged: false,
              });
            }
          }

          // Check for exit
          if (!isInside && zone.alerts.onExit && prevZones.includes(zone.id)) {
            events.push({
              id: `${Date.now()}-${Math.random()}`,
              type: 'exit',
              zoneId: zone.id,
              zoneName: zone.name,
              entityId: location.entityId,
              entityName: location.entityName,
              entityType: location.entityType,
              location: point,
              timestamp: new Date(),
              acknowledged: false,
            });
          }
        });

        // Update location with current zones
        location.insideZones = currentZones;

        return events;
      },
    }),
    {
      name: 'geofencing-storage',
      partialize: (state) => ({
        zones: state.zones,
        locationHistory: state.locationHistory,
      }),
    }
  )
);
