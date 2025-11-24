// Alerts, Actions, Incident Grouping + Responders & Incidents

export interface AlertActionSuggestion {
  actionType: "dispatch_team" | "open_gate" | "broadcast" | "evacuate";
  role?: string;
  count?: number;
}

export interface AlertRecord {
  alertId: string;
  eventId: string;
  type: string;
  priority: "low" | "medium" | "high" | "critical";
  zoneId?: string;
  confidence: number; // 0-1
  summary: string;
  detectedAt: string;
  suggestedActions: AlertActionSuggestion[];
  status: "open" | "ack" | "closed";
}

export interface DispatchAction {
  actionId: string;
  alertId: string;
  type: "dispatch_team";
  assignees: string[];
  targetLocation: { lat: number; lng: number };
  routePolyline?: string;
  status: "sent" | "in_transit" | "completed";
  sentAt: string;
}

export interface IncidentGroup {
  incidentId: string;
  alerts: string[];
  category: string;
  zoneId?: string;
  startedAt: string;
}

export interface Incident {
  id: string;
  type: "medical" | "security" | "safety" | "other";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  location: string;
  coordinates: { x: number; y: number };
  timestamp: string;
  reporter?: string;
  status: "new" | "dispatched" | "responding" | "resolved";
  assignedTo?: string[];
  eta?: string;
  images?: string[];
}

export interface Responder {
  id: string;
  name: string;
  role: string;
  status: "available" | "busy" | "offline";
  location: { x: number; y: number };
  eta: string;
  distance: string;
}

export const alertsData: AlertRecord[] = [
  {
    alertId: "alert_001",
    eventId: "evt_101",
    type: "crowd_congestion",
    priority: "high",
    zoneId: "zone_main_stage",
    confidence: 0.82,
    summary: "Rising congestion near Main Stage",
    detectedAt: "2025-02-15T18:22:10Z",
    suggestedActions: [{ actionType: "dispatch_team", role: "security", count: 4 }],
    status: "open"
  }
];

export const dispatchActionsData: DispatchAction[] = [
  {
    actionId: "action_001",
    alertId: "alert_001",
    type: "dispatch_team",
    assignees: ["u101", "u102"],
    targetLocation: { lat: 18.5209, lng: 73.8570 },
    routePolyline: "encoded_polyline_here",
    status: "sent",
    sentAt: "2025-02-15T18:23:00Z"
  }
];

export const incidentGroupsData: IncidentGroup[] = [
  {
    incidentId: "inc_001",
    alerts: ["alert_001", "alert_005"],
    category: "panic",
    zoneId: "zone_main_stage",
    startedAt: "2025-02-15T18:25:00Z"
  }
];

export const incidentsData: Incident[] = [
  {
    id: "1",
    type: "medical",
    severity: "critical",
    title: "Person collapsed",
    description: "Adult male, unresponsive, crowd gathering",
    location: "Food Court, near Vendor 7",
    coordinates: { x: 45, y: 50 },
    timestamp: "2 minutes ago",
    reporter: "Security Team Alpha",
    status: "new"
  },
  {
    id: "2",
    type: "security",
    severity: "high",
    title: "Fight reported",
    description: "Two individuals in altercation",
    location: "VIP Area entrance",
    coordinates: { x: 65, y: 40 },
    timestamp: "5 minutes ago",
    status: "dispatched",
    assignedTo: ["John Smith", "Sarah Johnson"],
    eta: "2 min"
  },
  {
    id: "3",
    type: "safety",
    severity: "medium",
    title: "Spill hazard",
    description: "Large liquid spill creating slip hazard",
    location: "Main Stage, left side",
    coordinates: { x: 30, y: 35 },
    timestamp: "8 minutes ago",
    status: "responding",
    assignedTo: ["Mike Rodriguez"]
  }
];

export const respondersData: Responder[] = [
  { id: "1", name: "Dr. Emily Chen", role: "Medical", status: "available", location: { x: 50, y: 60 }, eta: "1.5 min", distance: "120m" },
  { id: "2", name: "John Smith", role: "Security", status: "busy", location: { x: 65, y: 40 }, eta: "3 min", distance: "200m" },
  { id: "3", name: "Sarah Johnson", role: "Security", status: "available", location: { x: 40, y: 45 }, eta: "2 min", distance: "150m" },
  { id: "4", name: "Mike Rodriguez", role: "Logistics", status: "available", location: { x: 35, y: 50 }, eta: "4 min", distance: "280m" }
];