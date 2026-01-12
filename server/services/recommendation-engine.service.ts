/**
 * Copyright Â© 2025 DrishtiX. All Rights Reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * This software is the proprietary information of DrishtiX.
 * Unauthorized copying, distribution, modification, or use of this software,
 * via any medium, is strictly prohibited without the express written permission
 * of DrishtiX.
 * 
 * This software is provided "as is" without warranty of any kind, express or implied.
 * 
 * For licensing inquiries: licensing@drishtix.com
 * License: See LICENSE file in the project root
 */
/**
 * Recommendation Engine Service
 * Implements Learning-to-Rank for actionable crowd management interventions
 * Based on Technical Design Document 3: Risk Scoring & Recommendation Engine
 */

import { prisma } from '../index';
import { io } from '../index';
import { azureServiceBusMessagingService as pubSubService } from './azure-service-bus-messaging.service';

export interface RiskContext {
  eventId: string;
  zoneId?: string;
  forecastedDensity: number;
  anomalyScore: number;
  staticVulnerability: number; // 0-1, is this a bottleneck?
  activeIncidents: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  currentDensity: number;
  trend: 'RISING' | 'FALLING' | 'STABLE';
}

export interface Action {
  id: string;
  type: 'REROUTE_TRAFFIC' | 'DISPATCH_STAFF' | 'THROTTLE_GATE' | 'BROADCAST_ALERT' | 'PAUSE_EVENT' | 'OPEN_GATE' | 'INCREASE_VENTILATION';
  title: string;
  description: string;
  impact: number; // Expected effectiveness 0-1
  cost: number; // Resource cost 1-10
  executionTime: number; // Minutes to implement
  score?: number; // Calculated ranking score
}

export interface RankedRecommendation {
  action: Action;
  rank: number;
  confidence: number;
  reason: string;
  estimatedImpact: string;
}

class RecommendationEngineService {
  private actionLibrary: Action[] = [
    {
      id: 'REROUTE_TRAFFIC',
      type: 'REROUTE_TRAFFIC',
      title: 'Reroute Traffic Flow',
      description: 'Update digital signage to redirect crowd movement away from congested areas',
      impact: 0.7,
      cost: 2,
      executionTime: 5,
    },
    {
      id: 'DISPATCH_STAFF',
      type: 'DISPATCH_STAFF',
      title: 'Dispatch Security Staff',
      description: 'Send nearest available security personnel to manage crowd',
      impact: 0.8,
      cost: 5,
      executionTime: 3,
    },
    {
      id: 'THROTTLE_GATE',
      type: 'THROTTLE_GATE',
      title: 'Throttle Entry Gate',
      description: 'Slow down entry turnstile speed to control inflow rate',
      impact: 0.9,
      cost: 3,
      executionTime: 1,
    },
    {
      id: 'OPEN_GATE',
      type: 'OPEN_GATE',
      title: 'Open Additional Gate',
      description: 'Activate secondary entrance to distribute crowd load',
      impact: 0.85,
      cost: 4,
      executionTime: 8,
    },
    {
      id: 'BROADCAST_ALERT',
      type: 'BROADCAST_ALERT',
      title: 'Broadcast Alert',
      description: 'Push notification to attendee mobile apps with guidance',
      impact: 0.6,
      cost: 1,
      executionTime: 2,
    },
    {
      id: 'INCREASE_VENTILATION',
      type: 'INCREASE_VENTILATION',
      title: 'Increase Ventilation',
      description: 'Boost HVAC systems to improve air quality in dense areas',
      impact: 0.5,
      cost: 2,
      executionTime: 5,
    },
    {
      id: 'PAUSE_EVENT',
      type: 'PAUSE_EVENT',
      title: 'Pause Event (Emergency)',
      description: 'Temporarily halt activities to allow crowd dispersal',
      impact: 1.0,
      cost: 10,
      executionTime: 1,
    },
  ];

  /**
   * Phase 1: Rule-based ranking
   * Maps risk type to best action
   */
  private getRuleLookup(context: RiskContext): string[] {
    const { riskLevel, forecastedDensity, trend } = context;

    // CRITICAL - Emergency interventions
    if (riskLevel === 'CRITICAL') {
      if (forecastedDensity > 0.95) {
        return ['PAUSE_EVENT', 'THROTTLE_GATE', 'DISPATCH_STAFF', 'BROADCAST_ALERT'];
      }
      return ['DISPATCH_STAFF', 'THROTTLE_GATE', 'BROADCAST_ALERT'];
    }

    // HIGH - Aggressive interventions
    if (riskLevel === 'HIGH') {
      if (trend === 'RISING') {
        return ['THROTTLE_GATE', 'OPEN_GATE', 'DISPATCH_STAFF', 'REROUTE_TRAFFIC'];
      }
      return ['DISPATCH_STAFF', 'REROUTE_TRAFFIC', 'BROADCAST_ALERT'];
    }

    // MEDIUM - Preventive measures
    if (riskLevel === 'MEDIUM') {
      if (forecastedDensity > 0.7) {
        return ['REROUTE_TRAFFIC', 'OPEN_GATE', 'BROADCAST_ALERT'];
      }
      return ['BROADCAST_ALERT', 'REROUTE_TRAFFIC'];
    }

    // LOW - Monitoring only
    return [];
  }

  /**
   * Phase 2: Contextual scoring (simplified ML ranking)
   * Calculates score based on context-action fit
   */
  private calculateScore(action: Action, context: RiskContext): number {
    let score = action.impact; // Base score from expected impact

    // Adjust for urgency
    if (context.riskLevel === 'CRITICAL') {
      score *= 1.5; // Boost all actions in critical scenarios
    } else if (context.riskLevel === 'HIGH') {
      score *= 1.2;
    }

    // Penalize high-cost actions for non-critical situations
    if (context.riskLevel !== 'CRITICAL') {
      score -= action.cost * 0.05;
    }

    // Boost quick-to-execute actions when time is critical
    if (context.forecastedDensity > 0.9 && action.executionTime <= 3) {
      score += 0.2;
    }

    // Specific context adjustments
    if (action.type === 'THROTTLE_GATE' && context.trend === 'RISING') {
      score += 0.15; // Very effective for rising crowds
    }

    if (action.type === 'OPEN_GATE' && context.staticVulnerability > 0.7) {
      score += 0.2; // Great for bottleneck areas
    }

    if (action.type === 'INCREASE_VENTILATION' && context.activeIncidents > 0) {
      score += 0.1; // Helps with medical incidents
    }

    return Math.max(0, Math.min(1, score)); // Clamp to 0-1
  }

  /**
   * Main ranking function
   * Returns prioritized list of recommendations
   */
  async generateRecommendations(context: RiskContext): Promise<RankedRecommendation[]> {
    // Phase 1: Get rule-based priority list
    const priorityActions = this.getRuleLookup(context);

    // If no recommendations needed (LOW risk), return empty
    if (priorityActions.length === 0) {
      return [];
    }

    // Filter action library to priority actions
    const relevantActions = this.actionLibrary.filter((a) => priorityActions.includes(a.id));

    // Phase 2: Score each action
    const scoredActions = relevantActions.map((action) => ({
      ...action,
      score: this.calculateScore(action, context),
    }));

    // Sort by score descending
    scoredActions.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Convert to ranked recommendations
    const recommendations: RankedRecommendation[] = scoredActions.map((action, index) => ({
      action,
      rank: index + 1,
      confidence: action.score || 0,
      reason: this.generateReason(action, context),
      estimatedImpact: this.estimateImpact(action, context),
    }));

    // Store recommendations in database
    await this.storeRecommendations(context, recommendations);

    // Emit to frontend via Socket.IO
    io.to(`recommendations:${context.eventId}`).emit('recommendations:new', {
      eventId: context.eventId,
      zoneId: context.zoneId,
      riskLevel: context.riskLevel,
      recommendations,
      timestamp: new Date().toISOString(),
    });

    return recommendations;
  }

  /**
   * Generate human-readable reason for recommendation
   */
  private generateReason(action: Action, context: RiskContext): string {
    const reasons: string[] = [];

    if (context.riskLevel === 'CRITICAL') {
      reasons.push('Critical risk level requires immediate intervention');
    }

    if (context.forecastedDensity > 0.9) {
      reasons.push(`Forecasted density at ${(context.forecastedDensity * 100).toFixed(0)}%`);
    }

    if (context.trend === 'RISING') {
      reasons.push('Crowd density trending upward');
    }

    if (context.staticVulnerability > 0.7) {
      reasons.push('High-risk bottleneck area');
    }

    if (action.type === 'THROTTLE_GATE') {
      reasons.push('Controls inflow rate effectively');
    }

    if (action.executionTime <= 3) {
      reasons.push(`Fast implementation (${action.executionTime} min)`);
    }

    return reasons.join('. ') || 'Recommended based on current risk profile';
  }

  /**
   * Estimate impact in human-readable form
   */
  private estimateImpact(action: Action, context: RiskContext): string {
    const densityReduction = (action.impact * 100 * (context.forecastedDensity - context.currentDensity)).toFixed(0);

    if (action.type === 'PAUSE_EVENT') {
      return 'Complete crowd dispersal within 10-15 minutes';
    }

    if (action.type === 'THROTTLE_GATE') {
      return `Reduce density increase rate by ${(action.impact * 100).toFixed(0)}%`;
    }

    if (action.type === 'OPEN_GATE') {
      return `Redistribute ${Math.abs(Number(densityReduction))}% of crowd to new entry point`;
    }

    return `Expected density reduction: ${(action.impact * 100).toFixed(0)}% within ${action.executionTime + 5} minutes`;
  }

  /**
   * Store recommendations in database for feedback loop
   */
  private async storeRecommendations(context: RiskContext, recommendations: RankedRecommendation[]): Promise<void> {
    try {
      // Create alert with embedded recommendations
      await prisma.alert.create({
        data: {
          eventId: context.eventId,
          type: 'RECOMMENDATION',
          priority: context.riskLevel === 'CRITICAL' ? 'CRITICAL' : context.riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM',
          status: 'ACTIVE',
          title: `${context.riskLevel} Risk - ${recommendations.length} Actions Recommended`,
          summary: recommendations.map((r) => `${r.rank}. ${r.action.title}`).join('\n'),
          confidence: recommendations[0]?.confidence || 0.5,
          suggestedActions: recommendations.map((r) => r.action.title),
          assignedTo: [],
          description: JSON.stringify({
            zoneId: context.zoneId,
            riskLevel: context.riskLevel,
            recommendations: recommendations.map((r) => ({
              actionId: r.action.id,
              rank: r.rank,
              confidence: r.confidence,
              reason: r.reason,
            })),
            context: {
              forecastedDensity: context.forecastedDensity,
              anomalyScore: context.anomalyScore,
              trend: context.trend,
            },
          }),
        },
      });
    } catch (error) {
      console.error('Failed to store recommendations:', error);
      // Don't throw - recommendations still returned to caller
    }
  }

  /**
   * Record feedback when organizer approves/rejects recommendation
   * Used for future model retraining (Learning-to-Rank)
   */
  async recordFeedback(
    eventId: string,
    actionId: string,
    decision: 'APPROVED' | 'REJECTED',
    outcome?: {
      densityChange: number;
      timeToEffect: number;
      success: boolean;
    },
    userId?: string
  ): Promise<void> {
    const feedbackData = {
      eventId,
      actionId,
      decision,
      timestamp: new Date(),
      outcome,
    };

    // Store in audit log
    await prisma.auditLog.create({
      data: {
        userId: userId || 'system',
        action: `RECOMMENDATION_${decision}`,
        entityType: 'recommendation',
        entityId: actionId,
        metadata: feedbackData,
        ipAddress: '0.0.0.0',
      },
    });

    // Publish to Service Bus for analytics
    await pubSubService.publishMessage('recommendation-feedback', feedbackData);

    console.log(`Recommendation feedback recorded: ${actionId} - ${decision}`);
  }

  /**
   * Get recommendation effectiveness statistics
   * Used to improve ranking algorithm over time
   */
  async getEffectivenessStats(eventId?: string): Promise<{
    totalRecommendations: number;
    approved: number;
    rejected: number;
    successRate: number;
    topActions: { actionId: string; approvalRate: number; avgImpact: number }[];
  }> {
    const filters: any = {
      action: { in: ['RECOMMENDATION_APPROVED', 'RECOMMENDATION_REJECTED'] },
    };

    if (eventId) {
      filters.details = { path: ['eventId'], equals: eventId };
    }

    const logs = await prisma.auditLog.findMany({
      where: filters,
      select: {
        action: true,
        metadata: true,
      },
    });

    const approved = logs.filter((l: any) => l.action === 'RECOMMENDATION_APPROVED').length;
    const rejected = logs.filter((l: any) => l.action === 'RECOMMENDATION_REJECTED').length;
    const total = logs.length;

    // Calculate per-action statistics
    const actionStats = new Map<string, { approved: number; rejected: number; totalImpact: number }>();

    logs.forEach((log: any) => {
      const details = log.metadata as any;
      const actionId = details?.actionId || 'UNKNOWN';

      if (!actionStats.has(actionId)) {
        actionStats.set(actionId, { approved: 0, rejected: 0, totalImpact: 0 });
      }

      const stats = actionStats.get(actionId)!;

      if (log.action === 'RECOMMENDATION_APPROVED') {
        stats.approved++;
        stats.totalImpact += Math.abs(details?.outcome?.densityChange || 0);
      } else {
        stats.rejected++;
      }
    });

    const topActions = Array.from(actionStats.entries())
      .map(([actionId, stats]) => ({
        actionId,
        approvalRate: stats.approved / (stats.approved + stats.rejected),
        avgImpact: stats.totalImpact / stats.approved || 0,
      }))
      .sort((a, b) => b.approvalRate - a.approvalRate)
      .slice(0, 5);

    return {
      totalRecommendations: total,
      approved,
      rejected,
      successRate: total > 0 ? approved / total : 0,
      topActions,
    };
  }
}

export const recommendationEngineService = new RecommendationEngineService();
