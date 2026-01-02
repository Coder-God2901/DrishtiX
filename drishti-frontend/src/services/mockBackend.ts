// Comprehensive Mock Backend Service with Real-time Simulation
// This simulates a real backend with WebSocket-like updates, CRUD operations, and live data

type Listener<T> = (data: T) => void;

class EventEmitter<T> {
  private listeners: Listener<T>[] = [];

  subscribe(listener: Listener<T>): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(data: T): void {
    this.listeners.forEach(listener => listener(data));
  }
}

// ====================
// DATA MODELS
// ====================

export interface LiveMetrics {
  currentAttendees: number;
  checkIns: number;
  activeVolunteers: number;
  incidentReports: number;
  crowdDensity: number;
  timestamp: number;
}

export interface CrowdHeatmap {
  zoneId: string;
  zoneName: string;
  density: number; // 0-100
  waitTime: number; // minutes
  coordinates: { x: number; y: number };
}

export interface Incident {
  id: string;
  type: 'medical' | 'security' | 'crowd' | 'safety' | 'lost_found';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  coordinates: { x: number; y: number };
  description: string;
  reportedBy: string;
  status: 'open' | 'in_progress' | 'resolved';
  assignedTo?: string;
  timestamp: number;
  updates: Array<{
    timestamp: number;
    message: string;
    updatedBy: string;
  }>;
}

export interface Volunteer {
  id: string;
  name: string;
  role: string;
  zone: string;
  status: 'active' | 'break' | 'offline';
  assignedTasks: number;
  completedTasks: number;
  currentTask?: string;
  lastLocation: string;
  contactNumber: string;
  joinedAt: number;
  skills: string[];
  rating: number;
}

export interface Ticket {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  quantity: number;
  totalPaid: number;
  purchaseDate: string;
  entryGate: string;
  qrCode: string;
  status: 'active' | 'used' | 'expired' | 'cancelled' | 'refunded';
  seatSection?: string;
  seatNumbers?: string[];
  attendeeNames?: string[];
  specialRequirements?: string[];
}

export interface Event {
  id: string;
  name: string;
  image: string;
  location: string;
  venue: string;
  date: string;
  time: string;
  endTime: string;
  crowdStatus: 'calm' | 'moderate' | 'busy' | 'very_busy';
  safetyScore: number;
  price: number;
  isFree: boolean;
  category: string;
  description: string;
  expectedAttendance: number;
  currentAttendance?: number;
  hostName: string;
  bestGate: string;
  queueTime: number;
  averageRating: number;
  totalReviews: number;
  amenities: string[];
  parkingAvailable: boolean;
  wheelchairAccessible: boolean;
  foodVendors: number;
  securityCheckpoints: number;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'alert';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface NavigationRoute {
  id: string;
  from: string;
  to: string;
  distance: number; // meters
  estimatedTime: number; // minutes
  crowdLevel: number; // 0-100
  accessibilityScore: number; // 0-100
  safetyScore: number; // 0-100
  steps: Array<{
    instruction: string;
    distance: number;
    landmark?: string;
  }>;
  alternativeRoutes: number;
  hasEscalator: boolean;
  hasElevator: boolean;
  hasRestroom: boolean;
}

// ====================
// MOCK BACKEND CLASS
// ====================

class MockBackendService {
  // Event Emitters for real-time updates
  private metricsEmitter = new EventEmitter<LiveMetrics>();
  private heatmapEmitter = new EventEmitter<CrowdHeatmap[]>();
  private incidentEmitter = new EventEmitter<Incident>();
  private volunteerEmitter = new EventEmitter<Volunteer>();
  private notificationEmitter = new EventEmitter<Notification>();
  private ticketEmitter = new EventEmitter<Ticket>();
  private eventUpdateEmitter = new EventEmitter<Event>();

  // Data stores
  private incidents: Map<string, Incident> = new Map();
  private volunteers: Map<string, Volunteer> = new Map();
  private tickets: Map<string, Ticket> = new Map();
  private events: Map<string, Event> = new Map();
  private notifications: Notification[] = [];
  private currentMetrics: LiveMetrics = {
    currentAttendees: 3245,
    checkIns: 3180,
    activeVolunteers: 48,
    incidentReports: 7,
    crowdDensity: 67,
    timestamp: Date.now()
  };

  private simulationIntervals: NodeJS.Timeout[] = [];

  constructor() {
    this.initializeData();
    this.startSimulations();
  }

  // ====================
  // INITIALIZATION
  // ====================

  private initializeData() {
    // Initialize Events
    this.events.set('evt-1', {
      id: 'evt-1',
      name: 'Summer Music Festival',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
      location: '2.3 km away',
      venue: 'Central Arena',
      date: 'Today',
      time: '6:00 PM',
      endTime: '11:00 PM',
      crowdStatus: 'busy',
      safetyScore: 94,
      price: 499,
      isFree: false,
      category: 'Music',
      description: 'Experience electrifying performances from top artists in a state-of-the-art venue with world-class sound and lighting.',
      expectedAttendance: 5000,
      currentAttendance: 3245,
      hostName: 'MegaEvents Productions',
      bestGate: 'Gate B',
      queueTime: 12,
      averageRating: 4.7,
      totalReviews: 1234,
      amenities: ['WiFi', 'Food Court', 'Medical Bay', 'VIP Lounge', 'Parking'],
      parkingAvailable: true,
      wheelchairAccessible: true,
      foodVendors: 15,
      securityCheckpoints: 8
    });

    this.events.set('evt-2', {
      id: 'evt-2',
      name: 'Tech Innovation Summit 2025',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      location: '5.1 km away',
      venue: 'Convention Center',
      date: 'Tomorrow',
      time: '9:00 AM',
      endTime: '6:00 PM',
      crowdStatus: 'moderate',
      safetyScore: 98,
      price: 0,
      isFree: true,
      category: 'Technology',
      description: 'Discover cutting-edge innovations, network with industry leaders, and explore the future of technology.',
      expectedAttendance: 2500,
      currentAttendance: 0,
      hostName: 'TechVentures Inc',
      bestGate: 'Gate A',
      queueTime: 5,
      averageRating: 4.9,
      totalReviews: 856,
      amenities: ['WiFi', 'Coffee Bar', 'Exhibition Hall', 'Meeting Rooms'],
      parkingAvailable: true,
      wheelchairAccessible: true,
      foodVendors: 8,
      securityCheckpoints: 4
    });

    this.events.set('evt-3', {
      id: 'evt-3',
      name: 'Food & Culture Carnival',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
      location: '1.8 km away',
      venue: 'City Park Grounds',
      date: 'This Weekend',
      time: '11:00 AM',
      endTime: '10:00 PM',
      crowdStatus: 'calm',
      safetyScore: 91,
      price: 199,
      isFree: false,
      category: 'Food & Culture',
      description: 'Celebrate diverse cuisines and cultural performances in an open-air festival atmosphere.',
      expectedAttendance: 1800,
      currentAttendance: 450,
      hostName: 'Cultural Celebrations Ltd',
      bestGate: 'North Entrance',
      queueTime: 3,
      averageRating: 4.5,
      totalReviews: 623,
      amenities: ['Open Air', 'Kids Zone', 'Cultural Stages', 'Art Gallery'],
      parkingAvailable: true,
      wheelchairAccessible: true,
      foodVendors: 35,
      securityCheckpoints: 5
    });

    // Initialize Tickets
    this.tickets.set('tkt-1', {
      id: 'tkt-1',
      eventId: 'evt-1',
      eventName: 'Summer Music Festival',
      eventDate: 'Today',
      eventTime: '6:00 PM',
      venue: 'Central Arena',
      quantity: 2,
      totalPaid: 998,
      purchaseDate: 'Dec 10, 2025',
      entryGate: 'Gate B',
      qrCode: 'SMF-2025-AB123XY',
      status: 'active',
      seatSection: 'VIP Section A',
      seatNumbers: ['A-15', 'A-16'],
      attendeeNames: ['Rahul Kumar', 'Priya Sharma'],
      specialRequirements: ['Wheelchair Access']
    });

    this.tickets.set('tkt-2', {
      id: 'tkt-2',
      eventId: 'evt-2',
      eventName: 'Tech Innovation Summit 2025',
      eventDate: 'Tomorrow',
      eventTime: '9:00 AM',
      venue: 'Convention Center',
      quantity: 1,
      totalPaid: 0,
      purchaseDate: 'Dec 8, 2025',
      entryGate: 'Gate A',
      qrCode: 'TIS-2025-CD456ZW',
      status: 'active',
      attendeeNames: ['Rahul Kumar']
    });

    // Initialize Incidents
    this.incidents.set('inc-1', {
      id: 'inc-1',
      type: 'medical',
      severity: 'medium',
      location: 'Section C - Food Court',
      coordinates: { x: 450, y: 320 },
      description: 'Attendee feeling dizzy, requires medical attention',
      reportedBy: 'Volunteer #24',
      status: 'in_progress',
      assignedTo: 'Medical Team Alpha',
      timestamp: Date.now() - 15 * 60 * 1000,
      updates: [
        {
          timestamp: Date.now() - 10 * 60 * 1000,
          message: 'Medical team dispatched',
          updatedBy: 'System'
        },
        {
          timestamp: Date.now() - 5 * 60 * 1000,
          message: 'Patient being assessed, vitals stable',
          updatedBy: 'Dr. Mehta'
        }
      ]
    });

    this.incidents.set('inc-2', {
      id: 'inc-2',
      type: 'crowd',
      severity: 'high',
      location: 'Main Stage - Front',
      coordinates: { x: 500, y: 200 },
      description: 'High crowd density detected, potential safety risk',
      reportedBy: 'AI Crowd Monitor',
      status: 'in_progress',
      assignedTo: 'Security Team Bravo',
      timestamp: Date.now() - 8 * 60 * 1000,
      updates: [
        {
          timestamp: Date.now() - 3 * 60 * 1000,
          message: 'Security redirecting crowd flow, situation monitored',
          updatedBy: 'Chief Security'
        }
      ]
    });

    // Initialize Volunteers
    this.volunteers.set('vol-1', {
      id: 'vol-1',
      name: 'Amit Patel',
      role: 'Crowd Management',
      zone: 'Section A',
      status: 'active',
      assignedTasks: 8,
      completedTasks: 6,
      currentTask: 'Monitor main entrance flow',
      lastLocation: 'Gate B',
      contactNumber: '+91 98765 43210',
      joinedAt: Date.now() - 4 * 60 * 60 * 1000,
      skills: ['First Aid', 'Crowd Control', 'Communication'],
      rating: 4.8
    });

    this.volunteers.set('vol-2', {
      id: 'vol-2',
      name: 'Sneha Reddy',
      role: 'Medical Support',
      zone: 'Medical Bay',
      status: 'active',
      assignedTasks: 5,
      completedTasks: 3,
      currentTask: 'Attending to patient in Food Court',
      lastLocation: 'Section C',
      contactNumber: '+91 98765 43211',
      joinedAt: Date.now() - 3 * 60 * 60 * 1000,
      skills: ['EMT Certified', 'CPR', 'First Aid'],
      rating: 4.9
    });

    this.volunteers.set('vol-3', {
      id: 'vol-3',
      name: 'Vikram Singh',
      role: 'Guest Services',
      zone: 'Information Desk',
      status: 'break',
      assignedTasks: 12,
      completedTasks: 10,
      lastLocation: 'Main Lobby',
      contactNumber: '+91 98765 43212',
      joinedAt: Date.now() - 5 * 60 * 60 * 1000,
      skills: ['Multilingual', 'Customer Service', 'Navigation'],
      rating: 4.7
    });

    // Initialize Notifications
    this.notifications = [
      {
        id: 'notif-1',
        type: 'warning',
        title: 'Weather Alert',
        message: 'Light rain expected in 45 minutes. Event continues as planned. Covered areas available.',
        timestamp: Date.now() - 5 * 60 * 1000,
        read: false,
        priority: 'medium'
      },
      {
        id: 'notif-2',
        type: 'info',
        title: 'Next Performance',
        message: 'The Midnight Riders performing at Main Stage in 30 minutes',
        timestamp: Date.now() - 12 * 60 * 1000,
        read: false,
        priority: 'low'
      },
      {
        id: 'notif-3',
        type: 'success',
        title: 'Parking Available',
        message: 'Lot B has 45 spots available. 10 mins walk to venue.',
        timestamp: Date.now() - 25 * 60 * 1000,
        read: true,
        priority: 'low'
      }
    ];
  }

  // ====================
  // REAL-TIME SIMULATIONS
  // ====================

  private startSimulations() {
    // Simulate live metrics updates every 3 seconds
    const metricsInterval = setInterval(() => {
      this.currentMetrics = {
        currentAttendees: this.currentMetrics.currentAttendees + Math.floor(Math.random() * 20 - 5),
        checkIns: this.currentMetrics.checkIns + Math.floor(Math.random() * 5),
        activeVolunteers: 48 + Math.floor(Math.random() * 6 - 3),
        incidentReports: this.incidents.size,
        crowdDensity: Math.max(0, Math.min(100, this.currentMetrics.crowdDensity + Math.random() * 10 - 5)),
        timestamp: Date.now()
      };
      this.metricsEmitter.emit(this.currentMetrics);
    }, 3000);

    // Simulate crowd heatmap updates every 5 seconds
    const heatmapInterval = setInterval(() => {
      const heatmap = this.generateHeatmap();
      this.heatmapEmitter.emit(heatmap);
    }, 5000);

    // Simulate random incidents every 30-60 seconds
    const incidentInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        this.generateRandomIncident();
      }
    }, 45000);

    // Simulate notifications every 20-40 seconds
    const notificationInterval = setInterval(() => {
      if (Math.random() > 0.6) {
        this.generateRandomNotification();
      }
    }, 30000);

    // Simulate volunteer status updates every 10 seconds
    const volunteerInterval = setInterval(() => {
      this.updateVolunteerStatuses();
    }, 10000);

    this.simulationIntervals.push(
      metricsInterval,
      heatmapInterval,
      incidentInterval,
      notificationInterval,
      volunteerInterval
    );
  }

  private generateHeatmap(): CrowdHeatmap[] {
    const zones = [
      { id: 'zone-1', name: 'Main Stage', base: 85 },
      { id: 'zone-2', name: 'Food Court', base: 65 },
      { id: 'zone-3', name: 'Restrooms', base: 45 },
      { id: 'zone-4', name: 'Merchandise', base: 55 },
      { id: 'zone-5', name: 'VIP Lounge', base: 30 },
      { id: 'zone-6', name: 'Parking Lot', base: 40 },
      { id: 'zone-7', name: 'Gate B', base: 70 },
      { id: 'zone-8', name: 'Medical Bay', base: 20 }
    ];

    return zones.map((zone, index) => ({
      zoneId: zone.id,
      zoneName: zone.name,
      density: Math.max(0, Math.min(100, zone.base + Math.random() * 20 - 10)),
      waitTime: Math.floor(Math.random() * 15),
      coordinates: {
        x: 100 + (index % 3) * 200,
        y: 100 + Math.floor(index / 3) * 150
      }
    }));
  }

  private generateRandomIncident() {
    const types: Incident['type'][] = ['medical', 'security', 'crowd', 'safety', 'lost_found'];
    const severities: Incident['severity'][] = ['low', 'medium', 'high'];
    const locations = [
      'Main Stage Area',
      'Food Court Section',
      'Restroom Block C',
      'Parking Lot B',
      'VIP Entrance',
      'Merchandise Tent',
      'Side Stage',
      'Guest Services Desk'
    ];

    const type = types[Math.floor(Math.random() * types.length)];
    const incident: Incident = {
      id: `inc-${Date.now()}`,
      type,
      severity: severities[Math.floor(Math.random() * severities.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      coordinates: {
        x: Math.floor(Math.random() * 800) + 100,
        y: Math.floor(Math.random() * 600) + 100
      },
      description: this.getIncidentDescription(type),
      reportedBy: Math.random() > 0.5 ? `Volunteer #${Math.floor(Math.random() * 50)}` : 'Attendee Report',
      status: 'open',
      timestamp: Date.now(),
      updates: []
    };

    this.incidents.set(incident.id, incident);
    this.incidentEmitter.emit(incident);

    // Auto-assign and update after delay
    setTimeout(() => {
      incident.status = 'in_progress';
      incident.assignedTo = `Team ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`;
      incident.updates.push({
        timestamp: Date.now(),
        message: 'Team dispatched to location',
        updatedBy: 'System'
      });
      this.incidentEmitter.emit(incident);
    }, 5000);
  }

  private getIncidentDescription(type: Incident['type']): string {
    const descriptions = {
      medical: [
        'Attendee requires first aid assistance',
        'Minor injury reported, medical attention needed',
        'Guest feeling unwell, requesting medical support'
      ],
      security: [
        'Suspicious activity reported',
        'Unauthorized access attempt detected',
        'Disturbance requiring security intervention'
      ],
      crowd: [
        'High crowd density in area',
        'Crowd flow congestion detected',
        'Potential overcrowding situation'
      ],
      safety: [
        'Spill hazard reported',
        'Barrier damage detected',
        'Safety concern raised by staff'
      ],
      lost_found: [
        'Lost child reported',
        'Lost item - phone/wallet',
        'Separated group members'
      ]
    };

    const options = descriptions[type];
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateRandomNotification() {
    const notifications = [
      {
        type: 'info' as const,
        title: 'Performance Update',
        message: 'Next act starting in 15 minutes at Main Stage',
        priority: 'low' as const
      },
      {
        type: 'success' as const,
        title: 'Facility Update',
        message: 'New restroom facilities now open in Section D',
        priority: 'low' as const
      },
      {
        type: 'warning' as const,
        title: 'Crowd Alert',
        message: 'Heavy traffic near Food Court. Consider alternative routes.',
        priority: 'medium' as const
      },
      {
        type: 'info' as const,
        title: 'Special Offer',
        message: '20% off merchandise for next 30 minutes!',
        priority: 'low' as const
      }
    ];

    const notif = notifications[Math.floor(Math.random() * notifications.length)];
    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      ...notif,
      timestamp: Date.now(),
      read: false
    };

    this.notifications.unshift(newNotification);
    if (this.notifications.length > 20) {
      this.notifications = this.notifications.slice(0, 20);
    }
    this.notificationEmitter.emit(newNotification);
  }

  private updateVolunteerStatuses() {
    this.volunteers.forEach(volunteer => {
      // Random status changes
      if (Math.random() > 0.9) {
        const statuses: Volunteer['status'][] = ['active', 'break', 'offline'];
        volunteer.status = statuses[Math.floor(Math.random() * statuses.length)];
      }

      // Update task progress
      if (volunteer.status === 'active' && Math.random() > 0.7) {
        volunteer.completedTasks++;
      }

      this.volunteerEmitter.emit(volunteer);
    });
  }

  // ====================
  // SUBSCRIPTION METHODS
  // ====================

  subscribeToMetrics(callback: Listener<LiveMetrics>) {
    callback(this.currentMetrics); // Send initial data
    return this.metricsEmitter.subscribe(callback);
  }

  subscribeToHeatmap(callback: Listener<CrowdHeatmap[]>) {
    callback(this.generateHeatmap()); // Send initial data
    return this.heatmapEmitter.subscribe(callback);
  }

  subscribeToIncidents(callback: Listener<Incident>) {
    return this.incidentEmitter.subscribe(callback);
  }

  subscribeToVolunteers(callback: Listener<Volunteer>) {
    return this.volunteerEmitter.subscribe(callback);
  }

  subscribeToNotifications(callback: Listener<Notification>) {
    return this.notificationEmitter.subscribe(callback);
  }

  subscribeToTickets(callback: Listener<Ticket>) {
    return this.ticketEmitter.subscribe(callback);
  }

  subscribeToEventUpdates(callback: Listener<Event>) {
    return this.eventUpdateEmitter.subscribe(callback);
  }

  // ====================
  // CRUD OPERATIONS - TICKETS
  // ====================

  getAllTickets(): Ticket[] {
    return Array.from(this.tickets.values());
  }

  getTicket(id: string): Ticket | undefined {
    return this.tickets.get(id);
  }

  createTicket(ticket: Omit<Ticket, 'id'>): Ticket {
    const newTicket: Ticket = {
      ...ticket,
      id: `tkt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    this.tickets.set(newTicket.id, newTicket);
    this.ticketEmitter.emit(newTicket);
    return newTicket;
  }

  updateTicket(id: string, updates: Partial<Ticket>): Ticket | null {
    const ticket = this.tickets.get(id);
    if (!ticket) return null;

    const updatedTicket = { ...ticket, ...updates };
    this.tickets.set(id, updatedTicket);
    this.ticketEmitter.emit(updatedTicket);
    return updatedTicket;
  }

  deleteTicket(id: string): boolean {
    const deleted = this.tickets.delete(id);
    if (deleted) {
      const ticket = this.tickets.get(id);
      if (ticket) {
        this.ticketEmitter.emit({ ...ticket, status: 'cancelled' });
      }
    }
    return deleted;
  }

  cancelTicket(id: string): Ticket | null {
    return this.updateTicket(id, { status: 'cancelled' });
  }

  refundTicket(id: string): Ticket | null {
    return this.updateTicket(id, { status: 'refunded' });
  }

  // ====================
  // CRUD OPERATIONS - EVENTS
  // ====================

  getAllEvents(): Event[] {
    return Array.from(this.events.values());
  }

  getEvent(id: string): Event | undefined {
    return this.events.get(id);
  }

  createEvent(event: Omit<Event, 'id'>): Event {
    const newEvent: Event = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    this.events.set(newEvent.id, newEvent);
    this.eventUpdateEmitter.emit(newEvent);
    return newEvent;
  }

  updateEvent(id: string, updates: Partial<Event>): Event | null {
    const event = this.events.get(id);
    if (!event) return null;

    const updatedEvent = { ...event, ...updates };
    this.events.set(id, updatedEvent);
    this.eventUpdateEmitter.emit(updatedEvent);
    return updatedEvent;
  }

  deleteEvent(id: string): boolean {
    return this.events.delete(id);
  }

  // ====================
  // CRUD OPERATIONS - INCIDENTS
  // ====================

  getAllIncidents(): Incident[] {
    return Array.from(this.incidents.values());
  }

  getIncident(id: string): Incident | undefined {
    return this.incidents.get(id);
  }

  createIncident(incident: Omit<Incident, 'id'>): Incident {
    const newIncident: Incident = {
      ...incident,
      id: `inc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    this.incidents.set(newIncident.id, newIncident);
    this.incidentEmitter.emit(newIncident);
    return newIncident;
  }

  updateIncident(id: string, updates: Partial<Incident>): Incident | null {
    const incident = this.incidents.get(id);
    if (!incident) return null;

    const updatedIncident = { ...incident, ...updates };
    this.incidents.set(id, updatedIncident);
    this.incidentEmitter.emit(updatedIncident);
    return updatedIncident;
  }

  addIncidentUpdate(id: string, message: string, updatedBy: string): Incident | null {
    const incident = this.incidents.get(id);
    if (!incident) return null;

    incident.updates.push({
      timestamp: Date.now(),
      message,
      updatedBy
    });
    this.incidentEmitter.emit(incident);
    return incident;
  }

  resolveIncident(id: string): Incident | null {
    return this.updateIncident(id, { status: 'resolved' });
  }

  deleteIncident(id: string): boolean {
    return this.incidents.delete(id);
  }

  // ====================
  // CRUD OPERATIONS - VOLUNTEERS
  // ====================

  getAllVolunteers(): Volunteer[] {
    return Array.from(this.volunteers.values());
  }

  getVolunteer(id: string): Volunteer | undefined {
    return this.volunteers.get(id);
  }

  createVolunteer(volunteer: Omit<Volunteer, 'id'>): Volunteer {
    const newVolunteer: Volunteer = {
      ...volunteer,
      id: `vol-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    this.volunteers.set(newVolunteer.id, newVolunteer);
    this.volunteerEmitter.emit(newVolunteer);
    return newVolunteer;
  }

  updateVolunteer(id: string, updates: Partial<Volunteer>): Volunteer | null {
    const volunteer = this.volunteers.get(id);
    if (!volunteer) return null;

    const updatedVolunteer = { ...volunteer, ...updates };
    this.volunteers.set(id, updatedVolunteer);
    this.volunteerEmitter.emit(updatedVolunteer);
    return updatedVolunteer;
  }

  deleteVolunteer(id: string): boolean {
    return this.volunteers.delete(id);
  }

  assignVolunteerTask(id: string, task: string): Volunteer | null {
    const volunteer = this.volunteers.get(id);
    if (!volunteer) return null;

    return this.updateVolunteer(id, {
      currentTask: task,
      assignedTasks: volunteer.assignedTasks + 1
    });
  }

  // ====================
  // CRUD OPERATIONS - NOTIFICATIONS
  // ====================

  getAllNotifications(): Notification[] {
    return this.notifications;
  }

  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  markNotificationAsRead(id: string): boolean {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  markAllNotificationsAsRead(): void {
    this.notifications.forEach(n => n.read = true);
  }

  deleteNotification(id: string): boolean {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      return true;
    }
    return false;
  }

  // ====================
  // NAVIGATION & ROUTING
  // ====================

  calculateRoute(from: string, to: string, preferences?: {
    preferAccessible?: boolean;
    avoidCrowds?: boolean;
    fastest?: boolean;
  }): NavigationRoute {
    const distance = Math.floor(Math.random() * 500) + 100;
    const baseTime = Math.floor(distance / 50);
    const crowdMultiplier = preferences?.avoidCrowds ? 0.8 : 1.2;

    return {
      id: `route-${Date.now()}`,
      from,
      to,
      distance,
      estimatedTime: Math.floor(baseTime * crowdMultiplier),
      crowdLevel: preferences?.avoidCrowds ? 30 : 65,
      accessibilityScore: preferences?.preferAccessible ? 95 : 75,
      safetyScore: 88,
      steps: [
        { instruction: `Head ${['north', 'south', 'east', 'west'][Math.floor(Math.random() * 4)]} from ${from}`, distance: Math.floor(distance * 0.3), landmark: 'Main Entrance' },
        { instruction: 'Continue straight past the Food Court', distance: Math.floor(distance * 0.4) },
        { instruction: `Turn right towards ${to}`, distance: Math.floor(distance * 0.3), landmark: to }
      ],
      alternativeRoutes: Math.floor(Math.random() * 3) + 1,
      hasEscalator: Math.random() > 0.5,
      hasElevator: preferences?.preferAccessible || Math.random() > 0.6,
      hasRestroom: Math.random() > 0.5
    };
  }

  // ====================
  // ANALYTICS & STATS
  // ====================

  getEventAnalytics(eventId: string) {
    return {
      totalCheckIns: Math.floor(Math.random() * 5000) + 1000,
      peakAttendance: Math.floor(Math.random() * 4000) + 2000,
      averageStayTime: Math.floor(Math.random() * 180) + 120, // minutes
      satisfactionScore: (Math.random() * 1.5 + 3.5).toFixed(1),
      repeatVisitors: Math.floor(Math.random() * 30) + 20, // percentage
      crowdFlowEfficiency: Math.floor(Math.random() * 20) + 75,
      incidentRate: (Math.random() * 2).toFixed(2),
      responseTime: Math.floor(Math.random() * 8) + 3 // minutes
    };
  }

  getVolunteerAnalytics() {
    return {
      totalActive: this.getAllVolunteers().filter(v => v.status === 'active').length,
      totalVolunteers: this.volunteers.size,
      averageTasksCompleted: 7.5,
      topPerformers: this.getAllVolunteers()
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5),
      zonesCovered: ['A', 'B', 'C', 'D', 'E', 'Medical', 'Security'],
      averageResponseTime: 4.2 // minutes
    };
  }

  // ====================
  // CLEANUP
  // ====================

  destroy() {
    this.simulationIntervals.forEach(interval => clearInterval(interval));
    this.simulationIntervals = [];
  }
}

// Singleton instance
export const mockBackend = new MockBackendService();

// Helper hooks for React components
export const useLiveMetrics = (callback: Listener<LiveMetrics>) => {
  return mockBackend.subscribeToMetrics(callback);
};

export const useLiveHeatmap = (callback: Listener<CrowdHeatmap[]>) => {
  return mockBackend.subscribeToHeatmap(callback);
};

export const useLiveIncidents = (callback: Listener<Incident>) => {
  return mockBackend.subscribeToIncidents(callback);
};

export const useLiveVolunteers = (callback: Listener<Volunteer>) => {
  return mockBackend.subscribeToVolunteers(callback);
};

export const useLiveNotifications = (callback: Listener<Notification>) => {
  return mockBackend.subscribeToNotifications(callback);
};
