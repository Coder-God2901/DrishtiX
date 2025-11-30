/**
 * Agent Orchestration Service
 * Vertex AI Agent Builder for automated incident response
 */

/// <reference types="vite/client" />

import axios, { AxiosError } from 'axios';
import { trafficFeedService } from './traffic-feed.service';
import { firebaseService } from './firebase.service';
import { apiClient } from '@/lib/api-client';

// Dialogflow CX Session interface
interface AgentSession {
  sessionId: string;
  agentId: string;
  createdAt: number;
  lastInteractionAt: number;
  context: Record<string, any>;
}

// Function calling interface
interface FunctionCall {
  name: string;
  parameters: Record<string, any>;
}

interface FunctionResponse {
  name: string;
  response: any;
}

interface Agent {
  id: string;
  type: 'dispatcher' | 'router' | 'coordinator' | 'escalator';
  status: 'idle' | 'active' | 'busy';
  capabilities: string[];
}

interface IncidentContext {
  incidentId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: { lat: number; lon: number };
  description: string;
  timestamp: number;
  metadata?: any;
}

interface Responder {
  id: string;
  name: string;
  type: 'medical' | 'security' | 'fire' | 'police' | 'evacuation';
  location: { lat: number; lon: number };
  status: 'available' | 'dispatched' | 'responding' | 'on_scene' | 'returning';
  skills: string[];
}

interface DispatchPlan {
  incidentId: string;
  responders: Array<{
    responderId: string;
    eta: number;
    route: any;
    instructions: string[];
  }>;
  coordinationPlan: string;
  estimatedResponseTime: number;
  trafficImpact: string;
}

class AgentOrchestrationService {
  private vertexAiAgentEndpoint: string = '';
  private agents: Map<string, Agent> = new Map();
  private sessions: Map<string, AgentSession> = new Map();
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    this.vertexAiAgentEndpoint =
      import.meta.env.VITE_VERTEX_AI_AGENT_ENDPOINT || '';

    this.initializeAgents();
    this.startSessionCleanup();
  }

  /**
   * Initialize AI agents
   */
  private initializeAgents(): void {
    const agents: Agent[] = [
      {
        id: 'dispatcher_001',
        type: 'dispatcher',
        status: 'idle',
        capabilities: [
          'responder_matching',
          'priority_assignment',
          'resource_allocation',
        ],
      },
      {
        id: 'router_001',
        type: 'router',
        status: 'idle',
        capabilities: ['optimal_routing', 'traffic_analysis', 'eta_calculation'],
      },
      {
        id: 'coordinator_001',
        type: 'coordinator',
        status: 'idle',
        capabilities: [
          'multi_responder_coordination',
          'scene_management',
          'communication',
        ],
      },
      {
        id: 'escalator_001',
        type: 'escalator',
        status: 'idle',
        capabilities: [
          'severity_assessment',
          'escalation_decision',
          'authority_notification',
        ],
      },
    ];

    agents.forEach((agent) => this.agents.set(agent.id, agent));
    console.log('[AgentOrchestration] Initialized agents:', agents.length);
  }

  /**
   * Start session cleanup process
   */
  private startSessionCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, session] of this.sessions.entries()) {
        if (now - session.lastInteractionAt > this.sessionTimeout) {
          console.log(`[AgentOrchestration] Cleaning up expired session: ${sessionId}`);
          this.sessions.delete(sessionId);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Create or get agent session for context preservation
   */
  private getOrCreateSession(incidentId: string): AgentSession {
    let session = this.sessions.get(incidentId);

    if (!session) {
      session = {
        sessionId: `session_${incidentId}_${Date.now()}`,
        agentId: import.meta.env.VITE_VERTEX_AI_AGENT_ID || 'default-agent',
        createdAt: Date.now(),
        lastInteractionAt: Date.now(),
        context: {}
      };
      this.sessions.set(incidentId, session);
      console.log(`[AgentOrchestration] Created new session: ${session.sessionId}`);
    } else {
      session.lastInteractionAt = Date.now();
    }

    return session;
  }

  /**
   * Make API call to Vertex AI Agent with retry logic
   */
  private async callAgentWithRetry(
    endpoint: string,
    payload: any,
    retryCount = 0
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.vertexAiAgentEndpoint}${endpoint}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken()}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;

      // Retry on network errors or 5xx status codes
      if (
        retryCount < this.maxRetries &&
        (axiosError.code === 'ECONNABORTED' ||
          axiosError.code === 'ETIMEDOUT' ||
          (axiosError.response?.status && axiosError.response.status >= 500))
      ) {
        console.warn(
          `[AgentOrchestration] API call failed, retrying (${retryCount + 1}/${this.maxRetries})...`
        );

        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
        return this.callAgentWithRetry(endpoint, payload, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Execute function call from agent
   */
  private async executeFunctionCall(functionCall: FunctionCall): Promise<FunctionResponse> {
    console.log(`[AgentOrchestration] Executing function: ${functionCall.name}`);

    try {
      switch (functionCall.name) {
        case 'get_available_responders':
          return {
            name: functionCall.name,
            response: await this.getAvailableRespondersFunction(functionCall.parameters)
          };

        case 'calculate_route':
          return {
            name: functionCall.name,
            response: await this.calculateRouteFunction(functionCall.parameters)
          };

        case 'assess_severity':
          return {
            name: functionCall.name,
            response: await this.assessSeverityFunction(functionCall.parameters)
          };

        case 'dispatch_responder':
          return {
            name: functionCall.name,
            response: await this.dispatchResponderFunction(functionCall.parameters)
          };

        default:
          throw new Error(`Unknown function: ${functionCall.name}`);
      }
    } catch (error) {
      console.error(`[AgentOrchestration] Function execution failed:`, error);
      return {
        name: functionCall.name,
        response: { error: 'Function execution failed', details: (error as Error).message }
      };
    }
  }

  /**
   * Function implementations for agent calling
   */
  private async getAvailableRespondersFunction(params: any): Promise<any> {
    const { skills, location, maxDistance = 5 } = params;

    try {
      // Fetch real responders from backend API
      const response = await apiClient.get<{
        success: boolean;
        data: any[];
      }>('/responders', {
        params: {
          status: 'AVAILABLE',
          limit: 50,
        },
      });

      if (!response.success || !response.data) {
        return { responders: [], count: 0 };
      }

      let responders = response.data;

      // Filter by skills if provided
      if (skills && Array.isArray(skills)) {
        responders = responders.filter((r: any) =>
          skills.some((skill: string) => r.skills?.includes(skill))
        );
      }

      // Calculate distance if location provided
      if (location && location.lat && location.lon) {
        responders = responders.map((r: any) => ({
          ...r,
          distance: this.calculateDistance(location, r.location),
        })).filter((r: any) => r.distance <= maxDistance);
      }

      // Sort by distance
      responders.sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));

      return { responders, count: responders.length };
    } catch (error) {
      console.error('Error fetching responders:', error);
      return { responders: [], count: 0, error: 'Failed to fetch responders' };
    }
  }

  private async calculateRouteFunction(params: any): Promise<any> {
    const { origin, destination } = params;
    const trafficData = await trafficFeedService.fetchGoogleTrafficConditions(
      origin,
      destination
    );
    // Calculate approximate distance (in km)
    const distance = this.calculateDistance(origin, destination);
    return {
      duration: trafficData.duration,
      durationInTraffic: trafficData.durationInTraffic,
      distance,
      trafficCondition: trafficData.condition,
      eta: Math.ceil(trafficData.durationInTraffic / 60)
    };
  }

  /**
   * Calculate haversine distance between two coordinates
   */
  private calculateDistance(
    point1: { lat: number; lon: number },
    point2: { lat: number; lon: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lon - point1.lon) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private async assessSeverityFunction(params: any): Promise<any> {
    const { incidentType, description, affectedCount } = params;

    // Simple rule-based severity assessment
    let severity = 'medium';
    let shouldEscalate = false;

    if (affectedCount > 50 || incidentType === 'fire' || description.includes('critical')) {
      severity = 'critical';
      shouldEscalate = true;
    } else if (affectedCount > 20 || incidentType === 'medical') {
      severity = 'high';
    }

    return { severity, shouldEscalate, confidence: 0.85 };
  }

  private async dispatchResponderFunction(params: any): Promise<any> {
    const { responderId, incidentId, instructions } = params;

    console.log(`[AgentOrchestration] Dispatching ${responderId} to ${incidentId}`);

    // Update responder status in Firestore
    await firebaseService.updateResponderLocation({
      id: responderId,
      name: 'Responder',
      type: 'medical',
      location: { lat: 0, lon: 0 },
      status: 'dispatched',
      lastUpdate: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    });

    return {
      success: true,
      dispatchedAt: new Date().toISOString(),
      instructions
    };
  }

  /**
   * Process incident and orchestrate response with AI agent
   */
  async orchestrateResponse(incident: IncidentContext): Promise<DispatchPlan> {
    console.log(`[AgentOrchestration] Processing incident: ${incident.incidentId}`);

    // Create or get session for context continuity
    const session = this.getOrCreateSession(incident.incidentId);

    try {
      // Step 1: Use Vertex AI Agent to analyze incident and determine actions
      const agentResponse = await this.callAgentWithRetry('/sessions:detectIntent', {
        sessionId: session.sessionId,
        queryInput: {
          text: {
            text: `Incident: ${incident.type}. Severity: ${incident.severity}. Description: ${incident.description}. Location: ${incident.location.lat},${incident.location.lon}. What actions should be taken?`
          },
          languageCode: 'en'
        },
        queryParams: {
          parameters: {
            incidentId: incident.incidentId,
            incidentType: incident.type,
            severity: incident.severity,
            location: incident.location
          }
        }
      });

      // Step 2: Process function calls if agent requests them
      if (agentResponse.functionCalls && agentResponse.functionCalls.length > 0) {
        for (const functionCall of agentResponse.functionCalls) {
          const functionResponse = await this.executeFunctionCall(functionCall);

          // Send function response back to agent
          await this.callAgentWithRetry('/sessions:detectIntent', {
            sessionId: session.sessionId,
            queryInput: {
              event: {
                event: 'function_response',
                parameters: functionResponse
              }
            }
          });
        }
      }

      // Step 3: Fallback to traditional flow if agent doesn't provide complete plan
      const escalationDecision = await this.assessAndEscalate(incident);

      if (escalationDecision.shouldEscalate) {
        console.log('[AgentOrchestration] Incident escalated to authorities');
        await this.notifyAuthorities(incident, escalationDecision.reason);
      }

      // Step 4: Find suitable responders
      const availableResponders = await this.findSuitableResponders(incident);

      if (availableResponders.length === 0) {
        throw new Error('No available responders for incident');
      }

      // Step 5: Calculate optimal routes with traffic awareness
      const routePlans = await this.calculateOptimalRoutes(
        incident,
        availableResponders
      );

      // Step 6: Generate coordination plan
      const coordinationPlan = await this.generateCoordinationPlan(
        incident,
        routePlans
      );

      // Step 7: Create dispatch plan
      const dispatchPlan: DispatchPlan = {
        incidentId: incident.incidentId,
        responders: routePlans,
        coordinationPlan: coordinationPlan.instructions,
        estimatedResponseTime: Math.min(...routePlans.map((r) => r.eta)),
        trafficImpact: coordinationPlan.trafficImpact,
      };

      // Execute dispatch
      await this.executeDispatch(dispatchPlan);

      return dispatchPlan;
    } catch (error) {
      console.error(`[AgentOrchestration] Orchestration failed:`, error);
      throw new Error(`Failed to orchestrate response: ${(error as Error).message}`);
    }
  }

  /**
   * Assess severity and determine escalation
   */
  private async assessAndEscalate(
    incident: IncidentContext
  ): Promise<{ shouldEscalate: boolean; reason?: string }> {
    try {
      // Call Vertex AI Agent for escalation decision
      const response = await axios.post(
        `${this.vertexAiAgentEndpoint}/escalate`,
        {
          incident: {
            type: incident.type,
            severity: incident.severity,
            description: incident.description,
            timestamp: incident.timestamp,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${await this.getAccessToken()}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      return {
        shouldEscalate: response.data.shouldEscalate || false,
        reason: response.data.reason,
      };
    } catch (error) {
      console.error('[AgentOrchestration] Escalation assessment failed:', error);

      // Fallback: escalate if critical
      return {
        shouldEscalate: incident.severity === 'critical',
        reason: 'Critical severity threshold',
      };
    }
  }

  /**
   * Find suitable responders using Vertex AI Agent
   */
  private async findSuitableResponders(
    incident: IncidentContext
  ): Promise<Responder[]> {
    try {
      // Fetch available responders from backend API
      const response = await apiClient.get<{
        success: boolean;
        data: Responder[];
      }>('/responders', {
        params: {
          status: 'AVAILABLE',
          limit: 50,
        },
      });

      if (!response.success || !response.data || response.data.length === 0) {
        console.warn('[AgentOrchestration] No available responders found');
        return [];
      }

      const availableResponders = response.data;

      // Filter by incident type (medical, security, fire)
      const typeMatched = availableResponders.filter((r: Responder) => {
        if (incident.type === 'MEDICAL') return r.type === 'medical';
        if (incident.type === 'FIRE') return r.type === 'fire';
        if (incident.type === 'CRUSH' || incident.type === 'CROWD_SURGE') return r.type === 'security';
        return true; // Default: all types can respond
      });

      // Calculate distance from incident location
      const withDistance = typeMatched.map((r: Responder) => ({
        ...r,
        distance: this.calculateDistance(incident.location, r.location),
      }));

      // Sort by distance and return top 3
      withDistance.sort((a, b) => a.distance - b.distance);
      return withDistance.slice(0, 3);
    } catch (error) {
      console.error('[AgentOrchestration] Responder matching failed:', error);
      return [];
    }
  }

  /**
   * Calculate optimal routes with traffic awareness
   */
  private async calculateOptimalRoutes(
    incident: IncidentContext,
    responders: Responder[]
  ): Promise<
    Array<{ responderId: string; eta: number; route: any; instructions: string[] }>
  > {
    const routePlans: Array<{
      responderId: string;
      eta: number;
      route: any;
      instructions: string[];
    }> = [];

    for (const responder of responders) {
      // Check traffic conditions
      const trafficConditions = await trafficFeedService.fetchGoogleTrafficConditions(
        responder.location,
        incident.location
      );

      // Get incidents on route
      const routeIncidents = await trafficFeedService.getIncidentsOnRoute(
        responder.location,
        incident.location
      );

      const eta = trafficConditions.durationInTraffic;
      const instructions = this.generateRouteInstructions(
        responder,
        incident,
        trafficConditions,
        routeIncidents
      );

      routePlans.push({
        responderId: responder.id,
        eta,
        route: {
          origin: responder.location,
          destination: incident.location,
          duration: trafficConditions.duration,
          durationInTraffic: trafficConditions.durationInTraffic,
          trafficCondition: trafficConditions.condition,
        },
        instructions,
      });
    }

    return routePlans.sort((a, b) => a.eta - b.eta); // Sort by ETA
  }

  /**
   * Generate route instructions
   */
  private generateRouteInstructions(
    _responder: Responder,
    incident: IncidentContext,
    traffic: any,
    routeIncidents: any[]
  ): string[] {
    const instructions: string[] = [
      `Proceed to incident at coordinates: ${incident.location.lat}, ${incident.location.lon}`,
      `Estimated arrival: ${Math.ceil(traffic.durationInTraffic / 60)} minutes`,
      `Traffic condition: ${traffic.condition}`,
    ];

    if (routeIncidents.length > 0) {
      instructions.push(
        `WARNING: ${routeIncidents.length} incidents on route (${routeIncidents.map((i) => i.type).join(', ')})`
      );
    }

    if (incident.severity === 'critical') {
      instructions.push('PRIORITY: Critical incident - use emergency protocols');
    }

    return instructions;
  }

  /**
   * Generate coordination plan using Vertex AI Agent
   */
  private async generateCoordinationPlan(
    incident: IncidentContext,
    routePlans: any[]
  ): Promise<{ instructions: string; trafficImpact: string }> {
    try {
      const response = await axios.post(
        `${this.vertexAiAgentEndpoint}/coordinate`,
        {
          incident,
          routePlans,
        },
        {
          headers: {
            Authorization: `Bearer ${await this.getAccessToken()}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      return {
        instructions: response.data.coordinationPlan || 'Standard response protocol',
        trafficImpact: response.data.trafficImpact || 'Minimal',
      };
    } catch (error) {
      console.error('[AgentOrchestration] Coordination planning failed:', error);

      // Fallback coordination plan
      return {
        instructions: this.generateFallbackCoordinationPlan(incident, routePlans),
        trafficImpact: 'Unknown',
      };
    }
  }

  /**
   * Fallback coordination plan
   */
  private generateFallbackCoordinationPlan(
    incident: IncidentContext,
    routePlans: any[]
  ): string {
    return `
Multi-responder coordination for ${incident.type} incident:
1. First responder ETA: ${Math.ceil(routePlans[0]?.eta / 60 || 0)} minutes
2. Establish perimeter upon arrival
3. Assess situation and request additional resources if needed
4. Coordinate with on-site event security
5. Report status every 5 minutes
    `.trim();
  }

  /**
   * Execute dispatch
   */
  private async executeDispatch(plan: DispatchPlan): Promise<void> {
    console.log(`[AgentOrchestration] Executing dispatch for ${plan.incidentId}`);

    // Update Firestore with dispatch plan
    for (const responder of plan.responders) {
      await firebaseService.updateResponderLocation({
        id: responder.responderId,
        name: 'Responder',
        type: 'medical',
        location: { lat: 0, lon: 0 },
        status: 'dispatched',
        lastUpdate: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      });
    }

    // Update incident status
    await firebaseService.updateIncidentStatus(plan.incidentId, 'responding');

    console.log('[AgentOrchestration] Dispatch executed successfully');
  }

  /**
   * Notify authorities for escalated incidents
   */
  private async notifyAuthorities(
    incident: IncidentContext,
    reason?: string
  ): Promise<void> {
    console.log('[AgentOrchestration] Notifying authorities:', reason ?? 'N/A');

    // In production: integrate with emergency services API
    // For now, log escalation
    await firebaseService.storeAnalyticsEvent({
      eventId: incident.incidentId,
      type: 'escalation',
      data: { incident, reason: reason ?? null, timestamp: Date.now() },
    });
  }

  /**
   * Get access token
   */
  private async getAccessToken(): Promise<string> {
    return import.meta.env.VITE_GCP_ACCESS_TOKEN || '';
  }

  /**
   * Batch orchestration for multiple incidents
   */
  async orchestrateMultipleIncidents(
    incidents: IncidentContext[]
  ): Promise<Map<string, DispatchPlan>> {
    const plans = new Map<string, DispatchPlan>();

    // Sort by severity
    const sortedIncidents = incidents.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    for (const incident of sortedIncidents) {
      try {
        const plan = await this.orchestrateResponse(incident);
        plans.set(incident.incidentId, plan);
      } catch (error) {
        console.error(
          `[AgentOrchestration] Failed to orchestrate ${incident.incidentId}:`,
          error
        );
      }
    }

    return plans;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Check if Vertex AI Agent endpoint is reachable
      await axios.get(`${this.vertexAiAgentEndpoint}/health`, {
        timeout: 5000,
      });
      return true;
    } catch (error) {
      console.error('[AgentOrchestration] Health check failed:', error);
      return false;
    }
  }
}

export const agentOrchestrationService = new AgentOrchestrationService();
export default agentOrchestrationService;
