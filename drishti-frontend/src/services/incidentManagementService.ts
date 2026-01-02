/**
 * Incident Management Service
 * 
 * Provides a centralized, event-driven system for managing incidents across
 * the DrishtiX platform. This service handles:
 * - Attendee-side help requests (Medical, SOS, Volunteer requests)
 * - System-generated incidents (Crowd congestion, equipment failures, etc.)
 * - Real-time incident propagation to organizer dashboards
 * 
 * Architecture:
 * - Event-driven using EventTarget API
 * - In-memory incident store (simulates backend)
 * - Severity-based categorization
 * - Real-time listener notifications
 */

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type IncidentStatus = 'active' | 'in-progress' | 'resolved' | 'closed';
export type IncidentSource = 'attendee-sos' | 'attendee-medical' | 'attendee-volunteer' | 'system' | 'staff';

export interface Incident {
  id: string;
  type: string;
  source: IncidentSource;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: string;
  zone?: string;
  description: string;
  timestamp: Date;

  // Additional context
  attendeeInfo?: {
    name?: string;
    contact?: string;
    isHelpingOther?: boolean;
  };

  // AI-generated insights
  aiAnalysis: string;
  prediction: string;

  // Response tracking
  responder?: string;
  eta?: string;

  // Visual mapping (for map overlays)
  x?: number;
  y?: number;
  color: 'red' | 'amber' | 'blue' | 'green';
}

export interface CreateIncidentPayload {
  type: string;
  source: IncidentSource;
  severity: IncidentSeverity;
  location: string;
  zone?: string;
  description: string;
  attendeeInfo?: {
    name?: string;
    contact?: string;
    isHelpingOther?: boolean;
  };
  metadata?: Record<string, any>;
}

class IncidentManagementService extends EventTarget {
  private incidents: Map<string, Incident> = new Map();
  private listeners: Set<(incidents: Incident[]) => void> = new Set();

  constructor() {
    super();
    this.initializeMockIncidents();
  }

  /**
   * Initialize with some mock system-generated incidents
   */
  private initializeMockIncidents() {
    const mockIncidents: Incident[] = [
      {
        id: this.generateId(),
        type: 'Crowd Congestion',
        source: 'system',
        severity: 'medium',
        status: 'active',
        location: 'Main Stage Area',
        zone: 'Zone A',
        description: 'Crowd density exceeding safe threshold in main stage area',
        timestamp: new Date(Date.now() - 3 * 60000), // 3 minutes ago
        aiAnalysis: 'Density reached 82% of maximum capacity',
        prediction: 'Risk of escalation to critical in 8-12 minutes',
        responder: 'Bravo Team',
        eta: '5 mins',
        x: 60,
        y: 30,
        color: 'amber'
      },
      {
        id: this.generateId(),
        type: 'Equipment Failure',
        source: 'system',
        severity: 'low',
        status: 'in-progress',
        location: 'Sound Booth 2',
        zone: 'Zone D',
        description: 'Audio equipment malfunction affecting sound quality',
        timestamp: new Date(Date.now() - 7 * 60000), // 7 minutes ago
        aiAnalysis: 'Technical issue contained to single booth',
        prediction: 'Repair estimated in 15 minutes',
        responder: 'Tech Support',
        eta: '10 mins',
        x: 70,
        y: 55,
        color: 'blue'
      }
    ];

    mockIncidents.forEach(incident => {
      this.incidents.set(incident.id, incident);
    });
  }

  /**
   * Generate a unique incident ID
   */
  private generateId(): string {
    return `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Map incident source and severity to color
   */
  private getIncidentColor(severity: IncidentSeverity): 'red' | 'amber' | 'blue' | 'green' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'red';
      case 'medium':
        return 'amber';
      case 'low':
      case 'info':
        return 'blue';
      default:
        return 'blue';
    }
  }

  /**
   * Generate AI analysis based on incident type and severity
   */
  private generateAIAnalysis(payload: CreateIncidentPayload): string {
    const { source, severity, type } = payload;

    if (source === 'attendee-sos') {
      return 'URGENT: SOS signal detected from attendee. Immediate response required. Security and medical teams alerted automatically.';
    }

    if (source === 'attendee-medical') {
      return severity === 'critical' || severity === 'high'
        ? 'High priority medical situation requiring immediate response. Medical team dispatched with priority routing.'
        : 'Medical assistance request acknowledged. Routing to nearest available medical responder.';
    }

    if (source === 'attendee-volunteer') {
      return 'Attendee assistance request received. Matching with nearest available volunteer based on request type and location.';
    }

    return 'Incident detected and logged. Response team notified.';
  }

  /**
   * Generate prediction based on incident details
   */
  private generatePrediction(payload: CreateIncidentPayload): string {
    const { source, severity } = payload;

    if (source === 'attendee-sos' || (source === 'attendee-medical' && severity === 'critical')) {
      return 'Estimated response time: 2-3 minutes. Priority dispatch active.';
    }

    if (source === 'attendee-medical') {
      return 'Estimated medical team arrival: 5-7 minutes.';
    }

    if (source === 'attendee-volunteer') {
      return 'Volunteer assignment expected within 3-5 minutes.';
    }

    return 'Response timeline: 10-15 minutes.';
  }

  /**
   * Generate a random map position for visualization
   */
  private generateMapPosition(): { x: number; y: number } {
    return {
      x: 20 + Math.random() * 60, // 20-80% from left
      y: 20 + Math.random() * 60  // 20-80% from top
    };
  }

  /**
   * Create a new incident from attendee help request or system event
   */
  createIncident(payload: CreateIncidentPayload): Incident {
    const position = this.generateMapPosition();

    const incident: Incident = {
      id: this.generateId(),
      type: payload.type,
      source: payload.source,
      severity: payload.severity,
      status: 'active',
      location: payload.location,
      zone: payload.zone,
      description: payload.description,
      timestamp: new Date(),
      attendeeInfo: payload.attendeeInfo,
      aiAnalysis: this.generateAIAnalysis(payload),
      prediction: this.generatePrediction(payload),
      color: this.getIncidentColor(payload.severity),
      x: position.x,
      y: position.y,
      responder: this.assignResponder(payload.source, payload.severity),
      eta: this.calculateETA(payload.severity)
    };

    // Store incident
    this.incidents.set(incident.id, incident);

    // Emit event for real-time listeners
    this.dispatchEvent(new CustomEvent('incident-created', {
      detail: incident
    }));

    // Notify all subscribers
    this.notifyListeners();

    console.log('✅ Incident Created:', {
      id: incident.id,
      type: incident.type,
      source: incident.source,
      severity: incident.severity,
      location: incident.location
    });

    return incident;
  }

  /**
   * Assign responder team based on incident type
   */
  private assignResponder(source: IncidentSource, severity: IncidentSeverity): string {
    if (source === 'attendee-sos') {
      return 'Emergency Response Team';
    }

    if (source === 'attendee-medical') {
      return severity === 'critical' || severity === 'high'
        ? 'Alpha Medical Team'
        : 'Medical Support Team';
    }

    if (source === 'attendee-volunteer') {
      return 'Volunteer Coordinator';
    }

    return 'Command Center';
  }

  /**
   * Calculate estimated time of arrival
   */
  private calculateETA(severity: IncidentSeverity): string {
    if (severity === 'critical') return '2 mins';
    if (severity === 'high') return '5 mins';
    if (severity === 'medium') return '8 mins';
    return '15 mins';
  }

  /**
   * Get all incidents, optionally filtered
   */
  getIncidents(filters?: {
    severity?: IncidentSeverity[];
    status?: IncidentStatus[];
    source?: IncidentSource[];
  }): Incident[] {
    let incidents = Array.from(this.incidents.values());

    if (filters) {
      if (filters.severity) {
        incidents = incidents.filter(i => filters.severity!.includes(i.severity));
      }
      if (filters.status) {
        incidents = incidents.filter(i => filters.status!.includes(i.status));
      }
      if (filters.source) {
        incidents = incidents.filter(i => filters.source!.includes(i.source));
      }
    }

    // Sort by timestamp (newest first)
    return incidents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get a single incident by ID
   */
  getIncident(id: string): Incident | undefined {
    return this.incidents.get(id);
  }

  /**
   * Update incident status
   */
  updateIncidentStatus(id: string, status: IncidentStatus): void {
    const incident = this.incidents.get(id);
    if (incident) {
      incident.status = status;
      this.incidents.set(id, incident);

      this.dispatchEvent(new CustomEvent('incident-updated', {
        detail: incident
      }));

      this.notifyListeners();
    }
  }

  /**
   * Subscribe to incident changes
   */
  subscribe(callback: (incidents: Incident[]) => void): () => void {
    this.listeners.add(callback);

    // Immediately call with current incidents
    callback(this.getIncidents());

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of incident changes
   */
  private notifyListeners(): void {
    const incidents = this.getIncidents();
    this.listeners.forEach(callback => callback(incidents));
  }

  /**
   * Get incident statistics
   */
  getStatistics() {
    const incidents = Array.from(this.incidents.values());

    return {
      total: incidents.length,
      critical: incidents.filter(i => i.severity === 'critical').length,
      high: incidents.filter(i => i.severity === 'high').length,
      medium: incidents.filter(i => i.severity === 'medium').length,
      low: incidents.filter(i => i.severity === 'low').length,
      active: incidents.filter(i => i.status === 'active').length,
      inProgress: incidents.filter(i => i.status === 'in-progress').length,
      resolved: incidents.filter(i => i.status === 'resolved').length,
      fromAttendees: incidents.filter(i =>
        i.source === 'attendee-sos' ||
        i.source === 'attendee-medical' ||
        i.source === 'attendee-volunteer'
      ).length,
      fromSystem: incidents.filter(i => i.source === 'system').length
    };
  }
}

// Singleton instance
export const incidentService = new IncidentManagementService();

// Convenience functions for creating specific incident types
export const createSOSIncident = (location: string, zone?: string, description?: string) => {
  return incidentService.createIncident({
    type: 'SOS Emergency Alert',
    source: 'attendee-sos',
    severity: 'critical',
    location,
    zone,
    description: description || 'Emergency assistance requested by attendee via SOS button'
  });
};

export const createMedicalIncident = (
  medicalType: string,
  location: string,
  zone?: string,
  description?: string,
  isUrgent?: boolean,
  attendeeInfo?: any
) => {
  return incidentService.createIncident({
    type: `Medical Assistance: ${medicalType}`,
    source: 'attendee-medical',
    severity: isUrgent ? 'critical' : 'high',
    location,
    zone,
    description: description || `Medical assistance requested: ${medicalType}`,
    attendeeInfo
  });
};

export const createVolunteerIncident = (
  requestType: string,
  location: string,
  zone?: string,
  description?: string,
  attendeeInfo?: any
) => {
  return incidentService.createIncident({
    type: `Volunteer Request: ${requestType}`,
    source: 'attendee-volunteer',
    severity: 'medium',
    location,
    zone,
    description: description || `Volunteer assistance requested: ${requestType}`,
    attendeeInfo
  });
};
