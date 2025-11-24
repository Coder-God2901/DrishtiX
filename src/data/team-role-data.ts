// Team & Role Data + Users + Permissions + Tickets

export interface TeamRef {
  teamId: string;
  role: "security" | "medical" | "logistics" | "organizer" | "volunteer";
  name: string;
  members: string[]; // userIds
}

export interface User {
  userId: string;
  name: string;
  phone: string;
  email: string;
  roles: Record<string, string>; // eventId -> role
  lastSeen: string;
  avatarUrl?: string;
  status?: "online" | "offline";
  assignment?: string;
}

export interface RolePermissions {
  role: string;
  permissions: {
    viewHeatmap?: boolean;
    dispatch?: boolean;
    viewTeamLocations?: boolean;
    modifySchedule?: boolean;
    viewVIPZones?: boolean;
    createAlerts?: boolean;
    exportData?: boolean;
  };
}

export interface PermissionMeta {
  id: string;
  label: string;
  description: string;
}

export interface Ticket {
  ticketId: string;
  attendeeId: string;
  name: string;
  expectedEntryGate: string;
  arrivalTimeEstimate: string;
  ticketType: string;
}

export const teamsData: TeamRef[] = [
  {
    teamId: "securityTeam",
    role: "security",
    name: "Security Team A",
    members: ["u101", "u102", "u103"]
  },
  {
    teamId: "medicalTeam",
    role: "medical",
    name: "Medical Response Unit",
    members: ["u104"]
  },
  {
    teamId: "logisticsTeam",
    role: "logistics",
    name: "Logistics Crew",
    members: ["u105"]
  }
];

export const usersData: User[] = [
  {
    userId: "u101",
    name: "Amit Sharma",
    phone: "9876543210",
    email: "amit@example.com",
    roles: { evt_101: "security" },
    lastSeen: "2025-02-15T18:21:00Z",
    avatarUrl: "https://fakecdn/amit.jpg",
    status: "online",
    assignment: "Main Gate"
  },
  {
    userId: "u102",
    name: "Sarah Johnson",
    phone: "9876500001",
    email: "sarah@example.com",
    roles: { evt_101: "security" },
    lastSeen: "2025-02-15T18:22:00Z",
    status: "online",
    assignment: "Stage Area"
  },
  {
    userId: "u103",
    name: "John Smith",
    phone: "9876500002",
    email: "john@example.com",
    roles: { evt_101: "security" },
    lastSeen: "2025-02-15T17:55:00Z",
    status: "offline"
  },
  {
    userId: "u104",
    name: "Dr. Emily Chen",
    phone: "9876500003",
    email: "emily@example.com",
    roles: { evt_101: "medical" },
    lastSeen: "2025-02-15T18:20:00Z",
    status: "online",
    assignment: "Medical Tent"
  },
  {
    userId: "u105",
    name: "Mike Rodriguez",
    phone: "9876500004",
    email: "mike@example.com",
    roles: { evt_101: "logistics" },
    lastSeen: "2025-02-15T16:10:00Z",
    status: "offline"
  }
];

export const rolePermissionsData: RolePermissions[] = [
  {
    role: "security",
    permissions: {
      viewHeatmap: true,
      dispatch: true,
      viewTeamLocations: true,
      modifySchedule: false,
      viewVIPZones: false,
      createAlerts: true,
      exportData: false
    }
  },
  {
    role: "medical",
    permissions: {
      viewHeatmap: true,
      dispatch: false,
      viewTeamLocations: true,
      modifySchedule: false,
      viewVIPZones: false,
      createAlerts: true
    }
  },
  {
    role: "logistics",
    permissions: {
      viewHeatmap: true,
      dispatch: false,
      viewTeamLocations: true,
      modifySchedule: true,
      viewVIPZones: false
    }
  },
  {
    role: "organizer",
    permissions: {
      viewHeatmap: true,
      dispatch: true,
      viewTeamLocations: true,
      modifySchedule: true,
      viewVIPZones: true,
      createAlerts: true,
      exportData: true
    }
  },
  {
    role: "volunteer",
    permissions: {
      viewHeatmap: false,
      dispatch: false,
      viewTeamLocations: false,
      modifySchedule: false,
      viewVIPZones: false
    }
  }
];

export const allPermissionsMeta: PermissionMeta[] = [
  { id: "viewHeatmap", label: "View Heatmap", description: "Access crowd density visualizations" },
  { id: "dispatch", label: "Dispatch Teams", description: "Send teams to incidents" },
  { id: "viewTeamLocations", label: "View Team Locations", description: "Track team member positions" },
  { id: "modifySchedule", label: "Manage Schedule", description: "Edit team schedules and shifts" },
  { id: "viewVIPZones", label: "View VIP Zones", description: "Access restricted VIP area data" },
  { id: "createAlerts", label: "Create Alerts", description: "Generate safety alerts" },
  { id: "exportData", label: "Export Data", description: "Download event data and logs" }
];

export const ticketsData: Ticket[] = [
  {
    ticketId: "t001",
    attendeeId: "a001",
    name: "Riya Patel",
    expectedEntryGate: "Gate A",
    arrivalTimeEstimate: "2025-02-15T17:15:00Z",
    ticketType: "VIP"
  },
  {
    ticketId: "t002",
    attendeeId: "a002",
    name: "Arjun Mehta",
    expectedEntryGate: "Gate B",
    arrivalTimeEstimate: "2025-02-15T17:40:00Z",
    ticketType: "General"
  }
];