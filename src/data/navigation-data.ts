// Navigation Graph + Gate & Routing Mock Data

export interface NavigationNode {
  id: string;
  lat: number;
  lng: number;
  type: "junction" | "stage_entrance" | "gate" | "amenity";
  gateId?: string;
}

export interface NavigationEdge {
  from: string;
  to: string;
  distance: number; // meters
  isOneWay: boolean;
}

export interface NavigationGraph {
  nodes: NavigationNode[];
  edges: NavigationEdge[];
}

export const navigationGraph: NavigationGraph = {
  nodes: [
    { id: "n1", lat: 18.5209, lng: 73.8569, type: "junction" },
    { id: "n2", lat: 18.5211, lng: 73.8572, type: "stage_entrance" },
    { id: "n3", lat: 18.5203, lng: 73.8571, type: "gate", gateId: "gateA" }
  ],
  edges: [
    { from: "n1", to: "n2", distance: 42, isOneWay: false },
    { from: "n2", to: "n3", distance: 85, isOneWay: false }
  ]
};

// Gate status mock (could be derived from live telemetry later)
export interface Gate {
  id: string;
  name: string;
  crowdLevel: "low" | "medium" | "high";
  eta: string;
  distance: string;
  waitTime: string;
}

export const gates: Gate[] = [
  { id: "A", name: "Gate A - Main Entrance", crowdLevel: "high", eta: "12 min", distance: "850m", waitTime: "~8 min" },
  { id: "B", name: "Gate B - North Entrance", crowdLevel: "low", eta: "15 min", distance: "1.1km", waitTime: "~2 min" },
  { id: "C", name: "Gate C - VIP Entrance", crowdLevel: "medium", eta: "10 min", distance: "720m", waitTime: "~5 min" }
];

// Turn‑by‑turn mock derived from a sample path (n1 -> n2 -> n3)
export interface NavigationStep {
  instruction: string;
  distance: string;
  safetyNote?: string;
}

export const navigationSteps: NavigationStep[] = [
  { instruction: "Head north on Main Street", distance: "250m" },
  { instruction: "Turn right onto Festival Avenue", distance: "180m", safetyNote: "Watch for pedestrian crossing" },
  { instruction: "Continue straight past the parking lot", distance: "200m" },
  { instruction: "Gate B entrance will be on your left", distance: "90m" }
];