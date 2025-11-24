// Real-Time Telemetry (Heatgrid + Team Locations)

export interface HeatCell {
  cellId: string;
  coordinates: [number, number][]; // [lng, lat]
  count: number;
  updatedAt: string;
}

export interface TeamLocation {
  userId: string;
  lat: number;
  lng: number;
  timestamp: string;
  role: "security" | "medical" | "logistics" | "organizer" | "volunteer";
}

export const heatgrid: HeatCell[] = [
  {
    cellId: "r12c08",
    coordinates: [
      [73.8570, 18.5205],
      [73.8572, 18.5205],
      [73.8572, 18.5207],
      [73.8570, 18.5207]
    ],
    count: 85,
    updatedAt: "2025-02-15T18:21:00Z"
  }
];

export const teamLocations: TeamLocation[] = [
  {
    userId: "u101",
    lat: 18.5209,
    lng: 73.8571,
    timestamp: "2025-02-15T18:21:00Z",
    role: "security"
  },
  {
    userId: "u104",
    lat: 18.5207,
    lng: 73.8573,
    timestamp: "2025-02-15T18:21:30Z",
    role: "medical"
  }
];
