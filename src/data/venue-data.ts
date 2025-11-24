// Venue Data (boundary, zones, gates, routes)

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeoPolygon {
  type: "Polygon";
  coordinates: number[][][]; // [ [ [lng, lat], ... ] ]
}

export interface Zone {
  zoneId: string;
  name: string;
  type: string;
  capacity: number;
  shape: GeoPolygon;
  color: string;
  riskProfile: {
    baseRisk: "low" | "medium" | "high";
    priority?: "low" | "medium" | "high" | "critical";
  };
  allowedRoles: string[];
}

export interface Gate {
  gateId: string;
  label: string;
  location: GeoPoint;
  type: "entry_exit" | "emergency" | "staff" | "vip";
  widthMeters: number;
}

export interface Route {
  routeId: string;
  points: GeoPoint[];
}

export interface VenueData {
  boundary: GeoPolygon;
  zones: Zone[];
  gates: Gate[];
  routes: Route[];
}

export const venueData: VenueData = {
  boundary: {
    type: "Polygon",
    coordinates: [
      [
        [73.8568, 18.5203],
        [73.8575, 18.5203],
        [73.8575, 18.5211],
        [73.8568, 18.5211],
        [73.8568, 18.5203]
      ]
    ]
  },
  zones: [
    {
      zoneId: "zone_main_stage",
      name: "Main Stage",
      type: "stage",
      capacity: 20000,
      shape: {
        type: "Polygon",
        coordinates: [
          [
            [73.8570, 18.5205],
            [73.8573, 18.5205],
            [73.8573, 18.5208],
            [73.8570, 18.5208],
            [73.8570, 18.5205]
          ]
        ]
      },
      color: "#FF6A00",
      riskProfile: { baseRisk: "medium", priority: "high" },
      allowedRoles: ["all"]
    },
    {
      zoneId: "zone_food_court",
      name: "Food Court",
      type: "food",
      capacity: 8000,
      shape: {
        type: "Polygon",
        coordinates: [
          [
            [73.8571, 18.5208],
            [73.8574, 18.5208],
            [73.8574, 18.5210],
            [73.8571, 18.5210],
            [73.8571, 18.5208]
          ]
        ]
      },
      color: "#0B3D91",
      riskProfile: { baseRisk: "low", priority: "medium" },
      allowedRoles: ["staff", "medical", "security"]
    }
  ],
  gates: [
    {
      gateId: "gateA",
      label: "Gate A",
      location: { lat: 18.5208, lng: 73.8570 },
      type: "entry_exit",
      widthMeters: 12
    }
  ],
  routes: [
    {
      routeId: "route_1",
      points: [
        { lat: 18.5208, lng: 73.8570 },
        { lat: 18.5210, lng: 73.8565 }
      ]
    }
  ]
};

export const zoneColors = ["#FF6A00", "#0B3D91", "#16A34A", "#F59E0B", "#E02D2D"];
export const zoneRoles = ["all", "vip", "security", "medical", "staff"];