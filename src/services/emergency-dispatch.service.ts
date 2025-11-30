/**
 * Emergency Responder Dispatch System
 * 
 * Features:
 * - Multi-incident prioritization with severity and temporal factors
 * - Traffic-aware routing using Google Maps Directions API
 * - Responder matching based on skills, availability, and proximity
 * - Escalation workflows for critical incidents
 * - Real-time status tracking and updates
 */

import { PrismaClient } from '@prisma/client';
import { fcmService } from './fcm.service';

const prisma = new PrismaClient();

export interface Responder {
  id: string;
  name: string;
  type: 'SECURITY' | 'MEDICAL' | 'FIRE' | 'LOGISTICS' | 'COORDINATOR';
  skills: string[];
  currentLocation: { lat: number; lon: number };
  status: 'AVAILABLE' | 'DISPATCHED' | 'RESPONDING' | 'ON_SCENE' | 'RETURNING' | 'OFF_DUTY';
  activeIncidents: string[];
  maxConcurrentIncidents: number;
  certifications: string[];
  equipment: string[];
  shiftEnd?: Date;
  fcmToken?: string;
}

export interface IncidentPriority {
  incidentId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  location: { lat: number; lon: number };
  reportedAt: Date;
  requiredSkills: string[];
  requiredResponders: number;
  priorityScore: number;
  waitTime: number; // minutes
}

export interface DispatchPlan {
  incidentId: string;
  assignments: Array<{
    responderId: string;
    responder: Responder;
    eta: number; // minutes
    distance: number; // meters
    route: any;
    priority: number;
  }>;
  totalResponseTime: number;
  backupResponders: Responder[];
  escalationRequired: boolean;
  escalationReason?: string;
}

export interface RouteOptions {
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  trafficModel?: 'best_guess' | 'pessimistic' | 'optimistic';
}

class EmergencyDispatchService {
  private responders: Map<string, Responder> = new Map();
  private pendingDispatches: Map<string, DispatchPlan> = new Map();

  // Priority weights for incident scoring
  private readonly SEVERITY_WEIGHTS = {
    CRITICAL: 100,
    HIGH: 50,
    MEDIUM: 20,
    LOW: 5,
  };

  private readonly TIME_FACTOR = 2; // Increases priority by 2 points per minute waiting
  private readonly MAX_RESPONSE_TIME = {
    CRITICAL: 5, // minutes
    HIGH: 10,
    MEDIUM: 20,
    LOW: 30,
  };

  /**
   * Main dispatch function - prioritizes incidents and assigns responders
   */
  async dispatchResponders(
    incidents: IncidentPriority[],
    availableResponders: Responder[]
  ): Promise<Map<string, DispatchPlan>> {
    // Update responder map
    availableResponders.forEach(r => this.responders.set(r.id, r));

    // Sort incidents by priority
    const prioritizedIncidents = this.prioritizeIncidents(incidents);

    const dispatchPlans = new Map<string, DispatchPlan>();

    for (const incident of prioritizedIncidents) {
      try {
        const plan = await this.createDispatchPlan(incident, availableResponders);

        if (plan.assignments.length > 0) {
          // Execute dispatch
          await this.executeDispatch(plan);
          dispatchPlans.set(incident.incidentId, plan);

          // Update responder availability
          plan.assignments.forEach(assignment => {
            const responder = this.responders.get(assignment.responderId);
            if (responder) {
              responder.status = 'DISPATCHED';
              responder.activeIncidents.push(incident.incidentId);
            }
          });
        } else if (plan.escalationRequired) {
          // Handle escalation
          await this.escalateIncident(incident, plan.escalationReason || 'No available responders');
        }
      } catch (error) {
        console.error(`Failed to dispatch for incident ${incident.incidentId}:`, error);
        await this.escalateIncident(incident, `Dispatch error: ${error.message}`);
      }
    }

    return dispatchPlans;
  }

  /**
   * Prioritize incidents based on severity, wait time, and other factors
   */
  private prioritizeIncidents(incidents: IncidentPriority[]): IncidentPriority[] {
    return incidents
      .map(incident => {
        const severityScore = this.SEVERITY_WEIGHTS[incident.severity] || 0;
        const timeScore = incident.waitTime * this.TIME_FACTOR;
        const slaBreachScore = this.calculateSLABreachScore(incident);

        incident.priorityScore = severityScore + timeScore + slaBreachScore;
        return incident;
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Calculate additional priority for incidents approaching SLA breach
   */
  private calculateSLABreachScore(incident: IncidentPriority): number {
    const maxResponseTime = this.MAX_RESPONSE_TIME[incident.severity];
    const timeRemaining = maxResponseTime - incident.waitTime;

    if (timeRemaining <= 0) {
      return 200; // SLA already breached
    } else if (timeRemaining <= 2) {
      return 100; // Critical - about to breach
    } else if (timeRemaining <= 5) {
      return 50; // Warning - approaching breach
    }

    return 0;
  }

  /**
   * Create dispatch plan for a single incident
   */
  private async createDispatchPlan(
    incident: IncidentPriority,
    availableResponders: Responder[]
  ): Promise<DispatchPlan> {
    // Filter responders by skills and availability
    const suitableResponders = this.findSuitableResponders(incident, availableResponders);

    if (suitableResponders.length === 0) {
      return {
        incidentId: incident.incidentId,
        assignments: [],
        totalResponseTime: 0,
        backupResponders: [],
        escalationRequired: true,
        escalationReason: 'No responders with required skills available',
      };
    }

    // Calculate routes and ETAs for all suitable responders
    const responderRoutes = await Promise.all(
      suitableResponders.map(responder =>
        this.calculateRoute(responder.currentLocation, incident.location, {
          trafficModel: 'pessimistic', // Use worst-case traffic
        })
      )
    );

    // Score and rank responders
    const rankedResponders = suitableResponders
      .map((responder, index) => ({
        responder,
        route: responderRoutes[index],
        score: this.scoreResponder(responder, responderRoutes[index], incident),
      }))
      .sort((a, b) => b.score - a.score);

    // Select top responders
    const selectedCount = Math.min(incident.requiredResponders, rankedResponders.length);
    const assignments = rankedResponders.slice(0, selectedCount).map((r, index) => ({
      responderId: r.responder.id,
      responder: r.responder,
      eta: r.route.duration,
      distance: r.route.distance,
      route: r.route,
      priority: index + 1,
    }));

    // Identify backup responders
    const backupResponders = rankedResponders
      .slice(selectedCount, selectedCount + 3)
      .map(r => r.responder);

    // Check if escalation needed
    const maxETA = Math.max(...assignments.map(a => a.eta));
    const escalationRequired =
      assignments.length < incident.requiredResponders ||
      maxETA > this.MAX_RESPONSE_TIME[incident.severity];

    return {
      incidentId: incident.incidentId,
      assignments,
      totalResponseTime: maxETA,
      backupResponders,
      escalationRequired,
      escalationReason: escalationRequired
        ? `Response time ${maxETA}min exceeds SLA of ${this.MAX_RESPONSE_TIME[incident.severity]}min`
        : undefined,
    };
  }

  /**
   * Find responders with matching skills and availability
   */
  private findSuitableResponders(
    incident: IncidentPriority,
    responders: Responder[]
  ): Responder[] {
    return responders.filter(responder => {
      // Check availability
      if (responder.status === 'OFF_DUTY' || responder.status === 'RETURNING') {
        return false;
      }

      // Check capacity
      if (responder.activeIncidents.length >= responder.maxConcurrentIncidents) {
        return false;
      }

      // Check shift end
      if (responder.shiftEnd && new Date() > responder.shiftEnd) {
        return false;
      }

      // Check skills match
      if (incident.requiredSkills.length > 0) {
        const hasRequiredSkills = incident.requiredSkills.every(skill =>
          responder.skills.includes(skill) || responder.certifications.includes(skill)
        );
        if (!hasRequiredSkills) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Score responder based on multiple factors
   */
  private scoreResponder(
    responder: Responder,
    route: { distance: number; duration: number },
    incident: IncidentPriority
  ): number {
    let score = 0;

    // Proximity score (closer is better) - max 100 points
    const maxDistance = 10000; // 10km
    score += Math.max(0, 100 - (route.distance / maxDistance) * 100);

    // ETA score (faster is better) - max 100 points
    const maxTime = 30; // 30 minutes
    score += Math.max(0, 100 - (route.duration / maxTime) * 100);

    // Skill match score - 50 points for exact match
    const skillMatch = incident.requiredSkills.filter(skill =>
      responder.skills.includes(skill)
    ).length;
    score += (skillMatch / Math.max(incident.requiredSkills.length, 1)) * 50;

    // Availability score - 30 points for fully available
    const capacityScore =
      ((responder.maxConcurrentIncidents - responder.activeIncidents.length) /
        responder.maxConcurrentIncidents) * 30;
    score += capacityScore;

    // Experience score - 20 points
    score += Math.min(responder.certifications.length * 5, 20);

    return score;
  }

  /**
   * Calculate traffic-aware route using Google Maps Directions API
   */
  private async calculateRoute(
    origin: { lat: number; lon: number },
    destination: { lat: number; lon: number },
    options: RouteOptions = {}
  ): Promise<{ distance: number; duration: number; polyline: string }> {
    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!GOOGLE_MAPS_API_KEY) {
      // Fallback to straight-line distance
      const distance = this.calculateHaversineDistance(origin, destination);
      return {
        distance,
        duration: Math.ceil(distance / 500), // Assume 500m/min avg speed
        polyline: '',
      };
    }

    try {
      const params = new URLSearchParams({
        origin: `${origin.lat},${origin.lon}`,
        destination: `${destination.lat},${destination.lon}`,
        mode: 'driving',
        departure_time: 'now',
        traffic_model: options.trafficModel || 'best_guess',
        key: GOOGLE_MAPS_API_KEY,
      });

      if (options.avoidTolls) params.append('avoid', 'tolls');
      if (options.avoidHighways) params.append('avoid', 'highways');

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?${params}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0].legs[0];
        return {
          distance: route.distance.value, // meters
          duration: Math.ceil(route.duration_in_traffic?.value || route.duration.value) / 60, // minutes
          polyline: data.routes[0].overview_polyline.points,
        };
      }
    } catch (error) {
      console.error('Google Maps API error:', error);
    }

    // Fallback
    const distance = this.calculateHaversineDistance(origin, destination);
    return {
      distance,
      duration: Math.ceil(distance / 500),
      polyline: '',
    };
  }

  /**
   * Calculate straight-line distance using Haversine formula
   */
  private calculateHaversineDistance(
    point1: { lat: number; lon: number },
    point2: { lat: number; lon: number }
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lon - point1.lon) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Execute dispatch - notify responders and update database
   */
  private async executeDispatch(plan: DispatchPlan): Promise<void> {
    const incident = await prisma.incident.findUnique({
      where: { id: plan.incidentId },
    });

    if (!incident) {
      throw new Error(`Incident ${plan.incidentId} not found`);
    }

    // Update incident in database
    await prisma.incident.update({
      where: { id: plan.incidentId },
      data: {
        status: 'assigned',
        assignedTo: plan.assignments.map(a => a.responderId),
        assignedAt: new Date(),
      },
    });

    // Notify each responder via FCM
    for (const assignment of plan.assignments) {
      const responder = assignment.responder;

      if (responder.fcmToken) {
        await fcmService.notifyResponder({
          token: responder.fcmToken,
          incidentId: plan.incidentId,
          incidentType: incident.type,
          severity: incident.severity,
          location: incident.location,
          description: incident.description || '',
          eta: assignment.eta,
          priority: assignment.priority,
        });
      }

      // Log dispatch
      await prisma.auditLog.create({
        data: {
          action: 'RESPONDER_DISPATCHED',
          userId: responder.id,
          targetId: plan.incidentId,
          targetType: 'incident',
          metadata: {
            eta: assignment.eta,
            distance: assignment.distance,
            priority: assignment.priority,
          },
        },
      });
    }

    this.pendingDispatches.set(plan.incidentId, plan);
  }

  /**
   * Escalate incident when dispatch fails or SLA is breached
   */
  private async escalateIncident(
    incident: IncidentPriority,
    reason: string
  ): Promise<void> {
    console.warn(`Escalating incident ${incident.incidentId}: ${reason}`);

    // Update incident status
    await prisma.incident.update({
      where: { id: incident.incidentId },
      data: {
        status: 'escalated',
        escalation: {
          escalated: true,
          escalatedAt: new Date(),
          reason,
        },
      },
    });

    // Notify supervisors/coordinators
    const coordinators = Array.from(this.responders.values()).filter(
      r => r.type === 'COORDINATOR' && r.status !== 'OFF_DUTY'
    );

    for (const coordinator of coordinators) {
      if (coordinator.fcmToken) {
        await fcmService.sendAlert({
          eventId: incident.incidentId,
          type: 'escalation',
          severity: 'CRITICAL',
          title: '🚨 Incident Escalated',
          message: `${incident.type} incident requires immediate attention. ${reason}`,
          data: {
            incidentId: incident.incidentId,
            escalationReason: reason,
          },
          tokens: [coordinator.fcmToken],
        });
      }
    }

    // Log escalation
    await prisma.auditLog.create({
      data: {
        action: 'INCIDENT_ESCALATED',
        userId: 'system',
        targetId: incident.incidentId,
        targetType: 'incident',
        metadata: { reason },
      },
    });
  }

  /**
   * Update responder status (called from mobile apps)
   */
  async updateResponderStatus(
    responderId: string,
    status: Responder['status'],
    currentLocation?: { lat: number; lon: number }
  ): Promise<void> {
    const responder = this.responders.get(responderId);
    if (!responder) {
      throw new Error(`Responder ${responderId} not found`);
    }

    responder.status = status;
    if (currentLocation) {
      responder.currentLocation = currentLocation;
    }

    // Update in database
    await prisma.user.update({
      where: { id: responderId },
      data: {
        metadata: {
          ...responder,
          status,
          currentLocation,
        },
      },
    });

    // Log status change
    await prisma.auditLog.create({
      data: {
        action: 'RESPONDER_STATUS_UPDATED',
        userId: responderId,
        metadata: { status, location: currentLocation },
      },
    });
  }

  /**
   * Get dispatch plan for an incident
   */
  getDispatchPlan(incidentId: string): DispatchPlan | undefined {
    return this.pendingDispatches.get(incidentId);
  }

  /**
   * Get all active dispatches
   */
  getActiveDispatches(): DispatchPlan[] {
    return Array.from(this.pendingDispatches.values());
  }
}

export const emergencyDispatchService = new EmergencyDispatchService();
