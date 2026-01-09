/**
 * Agent Builder Service
 * Automated emergency dispatch using Azure OpenAI
 */

import { azureOpenAIService } from './azure-openai.service';
import { azureMapsService } from './azure-maps.service';
import { azureConfig } from '../config/azure.config';
import { drishtiXConfig } from '../config/drishtix.config';

export interface DispatchRequest {
  eventId: string;
  incidentId?: string;
  alertId: string;
  incidentType: 'PANIC' | 'FIRE' | 'VIOLENCE' | 'SURGE' | 'MEDICAL' | 'OTHER';
  location: { lat: number; lon: number; address?: string };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  estimatedCrowd?: number;
  timestamp: Date;
}

export interface Responder {
  id: string;
  type: 'POLICE' | 'FIRE' | 'AMBULANCE' | 'SECURITY' | 'MEDICAL';
  name: string;
  currentLocation: { lat: number; lon: number };
  status: 'AVAILABLE' | 'BUSY' | 'EN_ROUTE' | 'ON_SCENE';
  specializations?: string[];
  contactNumber?: string;
}

export interface DispatchResult {
  dispatchId: string;
  status: 'PENDING' | 'APPROVED' | 'DISPATCHED' | 'REJECTED';
  assignedResponders: AssignedResponder[];
  estimatedResponseTime: number; // minutes
  routes: RouteInfo[];
  recommendations: string[];
  requiresHumanApproval: boolean;
  timestamp: Date;
}

export interface AssignedResponder {
  responder: Responder;
  route: RouteInfo;
  eta: number; // minutes
  distance: number; // meters
  priority: number; // 1-5, 5 being highest
}

export interface RouteInfo {
  origin: { lat: number; lon: number };
  destination: { lat: number; lon: number };
  distance: number; // meters
  duration: number; // seconds
  durationInTraffic?: number; // seconds
  polyline: string;
  steps: RouteStep[];
  alternativeRoutes?: RouteInfo[];
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver?: string;
}

class AgentBuilderService {
  constructor() {
    console.log('[Agent Builder] Initialized with Azure OpenAI and Azure Maps');
  }

  /**
   * Create and execute dispatch plan
   */
  async createDispatchPlan(
    request: DispatchRequest,
    availableResponders: Responder[]
  ): Promise<DispatchResult> {
    try {
      // Step 1: Use AI to analyze the incident and determine response requirements
      const analysis = await this.analyzeIncident(request);

      // Step 2: Select best responders based on AI recommendations
      const selectedResponders = this.selectResponders(
        availableResponders,
        request,
        analysis
      );

      // Step 3: Calculate optimal routes for each responder
      const routes = await this.calculateRoutes(selectedResponders, request.location);

      // Step 4: Assign responders with route info
      const assignments = selectedResponders.map((responder, index) => ({
        responder,
        route: routes[index],
        eta: Math.ceil(routes[index].durationInTraffic || routes[index].duration / 60),
        distance: routes[index].distance,
        priority: this.calculatePriority(responder, request, routes[index]),
      }));

      // Step 5: Sort by priority and ETA
      assignments.sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return a.eta - b.eta;
      });

      // Step 6: Generate recommendations
      const recommendations = await this.generateRecommendations(request, assignments, analysis);

      // Step 7: Determine if human approval needed
      const requiresHumanApproval = this.requiresHumanApproval(request);

      const estimatedResponseTime = assignments.length > 0 ? Math.min(...assignments.map(a => a.eta)) : 0;

      return {
        dispatchId: `DISPATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: requiresHumanApproval ? 'PENDING' : 'DISPATCHED',
        assignedResponders: assignments.slice(0, 5), // Top 5 responders
        estimatedResponseTime,
        routes: routes.slice(0, 5),
        recommendations,
        requiresHumanApproval,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error creating dispatch plan:', error);
      throw new Error(`Dispatch planning failed: ${error}`);
    }
  }

  /**
   * Analyze incident using AI
   */
  private async analyzeIncident(request: DispatchRequest): Promise<any> {
    const prompt = `
You are an emergency dispatch AI for the DrishtiX crowd safety platform. Analyze this incident and provide dispatch recommendations.

**INCIDENT DETAILS:**
- Type: ${request.incidentType}
- Severity: ${request.severity}
- Description: ${request.description}
- Location: ${request.location.address || `${request.location.lat}, ${request.location.lon}`}
- Estimated Crowd: ${request.estimatedCrowd || 'Unknown'}
- Time: ${request.timestamp.toISOString()}

**ANALYSIS REQUIRED:**
1. Determine the appropriate response team types needed (Police, Fire, Ambulance, Medical, Security)
2. Estimate the number of units required for each type
3. Assess urgency level (1-5, 5 being most urgent)
4. Identify potential complications or secondary risks
5. Suggest tactical approach for crowd management
6. Estimate response time target

**OUTPUT FORMAT (JSON):**
{
  "requiredTeams": [
    {
      "type": "POLICE" | "FIRE" | "AMBULANCE" | "MEDICAL" | "SECURITY",
      "units": number,
      "specialization": string,
      "priority": number
    }
  ],
  "urgencyLevel": number,
  "complications": string[],
  "tacticalApproach": string[],
  "responseTimeTarget": number,
  "additionalResources": string[]
}
`;

    try {
      const messages = [
        { role: 'user' as const, content: prompt },
      ];

      const text = await azureOpenAIService.generateText(messages);

      // Extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.getDefaultAnalysis(request);
    } catch (error) {
      console.error('Error analyzing incident:', error);
      return this.getDefaultAnalysis(request);
    }
  }

  /**
   * Get default analysis if AI fails
   */
  private getDefaultAnalysis(request: DispatchRequest): any {
    const teamMap: Record<string, string[]> = {
      PANIC: ['POLICE', 'MEDICAL', 'SECURITY'],
      FIRE: ['FIRE', 'AMBULANCE', 'POLICE'],
      VIOLENCE: ['POLICE', 'MEDICAL'],
      SURGE: ['POLICE', 'SECURITY', 'MEDICAL'],
      MEDICAL: ['AMBULANCE', 'MEDICAL'],
      OTHER: ['SECURITY', 'POLICE'],
    };

    const teams = teamMap[request.incidentType] || ['SECURITY'];

    return {
      requiredTeams: teams.map((type, idx) => ({
        type,
        units: request.severity === 'CRITICAL' ? 3 : 2,
        specialization: 'General',
        priority: teams.length - idx,
      })),
      urgencyLevel: request.severity === 'CRITICAL' ? 5 : 3,
      complications: [],
      tacticalApproach: ['Approach with caution', 'Establish perimeter', 'Coordinate with command center'],
      responseTimeTarget: request.severity === 'CRITICAL' ? 3 : 5,
      additionalResources: [],
    };
  }

  /**
   * Select best responders
   */
  private selectResponders(
    availableResponders: Responder[],
    request: DispatchRequest,
    analysis: any
  ): Responder[] {
    const selected: Responder[] = [];

    // Filter by required teams
    const requiredTypes = new Set(analysis.requiredTeams.map((t: any) => t.type));

    for (const type of requiredTypes) {
      const typeResponders = availableResponders.filter(
        r => r.type === type && r.status === 'AVAILABLE'
      );

      // Select closest responders of this type
      const sorted = typeResponders.sort((a, b) => {
        const distA = this.calculateCrowDistance(a.currentLocation, request.location);
        const distB = this.calculateCrowDistance(b.currentLocation, request.location);
        return distA - distB;
      });

      // Take top 2 per type
      selected.push(...sorted.slice(0, 2));
    }

    return selected;
  }

  /**
   * Calculate crow-fly distance
   */
  private calculateCrowDistance(
    from: { lat: number; lon: number },
    to: { lat: number; lon: number }
  ): number {
    const R = 6371e3;
    const φ1 = from.lat * Math.PI / 180;
    const φ2 = to.lat * Math.PI / 180;
    const Δφ = (to.lat - from.lat) * Math.PI / 180;
    const Δλ = (to.lon - from.lon) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calculate optimal routes using Google Maps Routes API
   */
  private async calculateRoutes(
    responders: Responder[],
    destination: { lat: number; lon: number }
  ): Promise<RouteInfo[]> {
    const routes: RouteInfo[] = [];

    for (const responder of responders) {
      try {
        const routeResult = await azureMapsService.calculateRoute(
          responder.currentLocation,
          destination
        );

        if (routeResult) {
          routes.push({
            origin: responder.currentLocation,
            destination,
            distance: routeResult.distance,
            duration: routeResult.duration,
            durationInTraffic: routeResult.duration, // Azure Maps includes traffic by default
            polyline: routeResult.polyline || '',
            steps: routeResult.instructions.map((instruction: string, index: number) => ({
              instruction,
              distance: Math.round(routeResult.distance / routeResult.instructions.length),
              duration: Math.round(routeResult.duration / routeResult.instructions.length),
              maneuver: undefined,
            })),
            alternativeRoutes: response.data.routes.slice(1, 3).map(route => ({
              origin: responder.currentLocation,
              destination,
              distance: route.legs[0].distance.value,
              duration: route.legs[0].duration.value,
              durationInTraffic: route.legs[0].duration_in_traffic?.value,
              polyline: route.overview_polyline.points,
              steps: [],
            })),
          });
        }
      } catch (error) {
        console.error(`Error calculating route for responder ${responder.id}:`, error);

        // Fallback: estimate based on crow-fly distance
        const distance = this.calculateCrowDistance(responder.currentLocation, destination);
        routes.push({
          origin: responder.currentLocation,
          destination,
          distance,
          duration: Math.ceil(distance / 15), // Assume 15 m/s average
          polyline: '',
          steps: [],
        });
      }
    }

    return routes;
  }

  /**
   * Calculate responder priority
   */
  private calculatePriority(
    responder: Responder,
    request: DispatchRequest,
    route: RouteInfo
  ): number {
    let priority = 3; // Base priority

    // Increase priority based on incident type match
    const incidentTeamMap: Record<string, string[]> = {
      FIRE: ['FIRE', 'AMBULANCE'],
      PANIC: ['POLICE', 'MEDICAL'],
      VIOLENCE: ['POLICE'],
      MEDICAL: ['AMBULANCE', 'MEDICAL'],
    };

    if (incidentTeamMap[request.incidentType]?.includes(responder.type)) {
      priority += 1;
    }

    // Increase priority for closer responders
    if (route.duration < 180) priority += 2; // < 3 min
    else if (route.duration < 300) priority += 1; // < 5 min

    // Increase priority based on severity
    if (request.severity === 'CRITICAL') priority += 2;
    else if (request.severity === 'HIGH') priority += 1;

    return Math.min(priority, 5);
  }

  /**
   * Generate AI recommendations
   */
  private async generateRecommendations(
    request: DispatchRequest,
    assignments: AssignedResponder[],
    analysis: any
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // ETA-based recommendations
    const minEta = Math.min(...assignments.map(a => a.eta));
    if (minEta > drishtiXConfig.emergencyResponse.responseTimeTargetMinutes) {
      recommendations.push(`Response time (${minEta} min) exceeds target. Consider dispatching additional units.`);
    }

    // Tactical recommendations from AI
    if (analysis.tacticalApproach) {
      recommendations.push(...analysis.tacticalApproach);
    }

    // Severity-based
    if (request.severity === 'CRITICAL') {
      recommendations.push('Establish incident command post immediately');
      recommendations.push('Request backup units on standby');
    }

    // Incident-specific
    if (request.incidentType === 'FIRE') {
      recommendations.push('Ensure clear evacuation routes');
      recommendations.push('Coordinate with building/venue management');
    } else if (request.incidentType === 'PANIC') {
      recommendations.push('Use calm communication to prevent escalation');
      recommendations.push('Deploy crowd control barriers if available');
    }

    return recommendations;
  }

  /**
   * Determine if human approval is required
   */
  private requiresHumanApproval(request: DispatchRequest): boolean {
    if (!drishtiXConfig.emergencyResponse.humanValidationRequired) {
      return false;
    }

    // Always require approval for critical incidents
    if (request.severity === 'CRITICAL') {
      return true;
    }

    // Require approval for fire and violence
    if (['FIRE', 'VIOLENCE'].includes(request.incidentType)) {
      return true;
    }

    return false;
  }
}

export const agentBuilderService = new AgentBuilderService();
export default agentBuilderService;
