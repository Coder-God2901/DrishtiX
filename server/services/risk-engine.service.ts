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
import { prisma } from '../index';
import { io } from '../index';
import { pubSubService } from './pubsub.service';
import { recommendationEngineService, RiskContext } from './recommendation-engine.service';

export interface RiskEngineEvent {
  eventId: string;
  zoneId?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  anomalies?: any[];
  recommendations?: string[];
  timestamp?: string;
  forecastedDensity?: number;
  currentDensity?: number;
  anomalyScore?: number;
  activeIncidents?: number;
}

export interface RiskScore {
  overall: number; // 0-100
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: {
    forecastedDensity: number;
    anomalyPresence: number;
    staticVulnerability: number;
    historicalIncidents: number;
    trend: number;
  };
  confidence: number;
}

class RiskEngineService {
  /**
   * Main handler for risk engine events from Pub/Sub
   */
  async handle(message: RiskEngineEvent) {
    const { eventId, severity, anomalies = [], zoneId, forecastedDensity, currentDensity, anomalyScore, activeIncidents } = message;

    // Calculate comprehensive risk score
    const riskScore = await this.calculateRiskScore(eventId, {
      zoneId,
      forecastedDensity: forecastedDensity || 0,
      currentDensity: currentDensity || 0,
      anomalyScore: anomalyScore || 0,
      activeIncidents: activeIncidents || 0,
      anomalies,
    });

    // Generate recommendations if risk is elevated
    let recommendations: any[] = [];
    if (riskScore.level === 'HIGH' || riskScore.level === 'CRITICAL') {
      const context: RiskContext = {
        eventId,
        zoneId,
        forecastedDensity: forecastedDensity || 0,
        anomalyScore: anomalyScore || 0,
        staticVulnerability: await this.getStaticVulnerability(eventId, zoneId),
        activeIncidents: activeIncidents || 0,
        riskLevel: riskScore.level,
        currentDensity: currentDensity || 0,
        trend: this.determineTrend(currentDensity || 0, forecastedDensity || 0),
      };

      recommendations = await recommendationEngineService.generateRecommendations(context);
    }

    // Create alert on HIGH/CRITICAL
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      const alert = await prisma.alert.create({
        data: {
          eventId,
          type: 'RISK',
          severity,
          title: `Risk escalation (${severity})${zoneId ? ' in ' + zoneId : ''}`,
          message:
            anomalies.map((a) => a.reason || a.type || 'anomaly').join('; ').slice(0, 500) ||
            'Risk engine escalation',
          status: 'ACTIVE',
          actionRequired: true,
          metadata: {
            riskScore: riskScore.overall,
            factors: riskScore.factors,
            confidence: riskScore.confidence,
            recommendations: recommendations.slice(0, 3).map((r) => ({
              action: r.action.title,
              rank: r.rank,
              reason: r.reason,
            })),
          },
        },
      });

      io.to(`alerts:${eventId}`).emit('alert:new', alert);
      await pubSubService.publishAlert(alert);
    }

    return { riskScore, recommendations };
  }

  /**
   * Calculate comprehensive risk score using multi-factor analysis
   * Phase 1: Heuristic-based (simplified XGBoost alternative)
   */
  async calculateRiskScore(
    eventId: string,
    input: {
      zoneId?: string;
      forecastedDensity: number;
      currentDensity: number;
      anomalyScore: number;
      activeIncidents: number;
      anomalies: any[];
    }
  ): Promise<RiskScore> {
    const { forecastedDensity, currentDensity, anomalyScore, activeIncidents, anomalies } = input;

    // Factor 1: Forecasted Density (0-100)
    const densityFactor = Math.min(100, forecastedDensity * 100);

    // Factor 2: Anomaly Presence (0-100)
    const hasAnomalies = anomalies.length > 0;
    const anomalyFactor = hasAnomalies ? Math.min(100, Math.abs(anomalyScore) * 100 + anomalies.length * 20) : 0;

    // Factor 3: Static Vulnerability (0-100)
    const staticVulnerability = (await this.getStaticVulnerability(eventId, input.zoneId)) * 100;

    // Factor 4: Historical Incidents (0-100)
    const historicalFactor = await this.getHistoricalIncidentScore(eventId, input.zoneId);

    // Factor 5: Trend Analysis (0-100)
    const trendFactor = this.calculateTrendFactor(currentDensity, forecastedDensity);

    // Weighted combination (mimicking XGBoost feature importance)
    const overall =
      densityFactor * 0.35 + // Density is most important
      anomalyFactor * 0.25 + // Anomalies are critical
      staticVulnerability * 0.15 + // Venue characteristics
      historicalFactor * 0.15 + // Past behavior
      trendFactor * 0.1; // Current momentum

    // Map to risk level
    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (overall >= 85) level = 'CRITICAL';
    else if (overall >= 70) level = 'HIGH';
    else if (overall >= 50) level = 'MEDIUM';
    else level = 'LOW';

    // Confidence calculation
    const dataAvailability = [forecastedDensity > 0, anomalies.length >= 0, activeIncidents >= 0].filter(Boolean).length;
    const confidence = dataAvailability / 3;

    return {
      overall: Math.round(overall),
      level,
      factors: {
        forecastedDensity: Math.round(densityFactor),
        anomalyPresence: Math.round(anomalyFactor),
        staticVulnerability: Math.round(staticVulnerability),
        historicalIncidents: Math.round(historicalFactor),
        trend: Math.round(trendFactor),
      },
      confidence,
    };
  }

  /**
   * Get static vulnerability score for a zone (e.g., is it a bottleneck?)
   */
  private async getStaticVulnerability(eventId: string, zoneId?: string): Promise<number> {
    if (!zoneId) return 0.3; // Default medium-low vulnerability

    try {
      // Check venue layout for zone characteristics
      const layout = await prisma.venueLayout.findFirst({
        where: { eventId },
      });

      if (!layout || !layout.zones) return 0.3;

      const zones = layout.zones as any[];
      const zone = zones.find((z) => z.id === zoneId || z.name === zoneId);

      if (!zone) return 0.3;

      // Higher vulnerability for narrow areas, entrances, exits
      let vulnerability = 0.3;

      if (zone.type === 'entrance' || zone.type === 'exit') vulnerability = 0.8;
      if (zone.type === 'corridor' || zone.type === 'walkway') vulnerability = 0.7;
      if (zone.type === 'stage' || zone.type === 'performance') vulnerability = 0.6;
      if (zone.capacity && zone.capacity < 1000) vulnerability += 0.1; // Small areas more vulnerable

      return Math.min(1, vulnerability);
    } catch (error) {
      console.error('Error calculating static vulnerability:', error);
      return 0.3;
    }
  }

  /**
   * Get historical incident score for a zone
   */
  private async getHistoricalIncidentScore(eventId: string, zoneId?: string): Promise<number> {
    try {
      const where: any = { eventId };
      if (zoneId) {
        where.location = { path: ['zone'], equals: zoneId };
      }

      const incidents = await prisma.incident.count({
        where,
      });

      // Normalize: 0 incidents = 0, 5+ incidents = 100
      return Math.min(100, incidents * 20);
    } catch (error) {
      console.error('Error calculating historical score:', error);
      return 0;
    }
  }

  /**
   * Calculate trend factor (rising vs falling density)
   */
  private calculateTrendFactor(currentDensity: number, forecastedDensity: number): number {
    const delta = forecastedDensity - currentDensity;

    if (delta > 0.2) return 100; // Rapidly rising
    if (delta > 0.1) return 75; // Rising
    if (delta > 0.05) return 50; // Slowly rising
    if (delta < -0.05) return 25; // Falling (good)
    return 40; // Stable
  }

  /**
   * Determine trend direction
   */
  private determineTrend(currentDensity: number, forecastedDensity: number): 'RISING' | 'FALLING' | 'STABLE' {
    const delta = forecastedDensity - currentDensity;

    if (delta > 0.05) return 'RISING';
    if (delta < -0.05) return 'FALLING';
    return 'STABLE';
  }

  /**
   * Get risk statistics for dashboard
   */
  async getRiskStats(eventId: string): Promise<{
    currentRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    averageRiskScore: number;
    highRiskZones: string[];
    activeAlerts: number;
  }> {
    const alerts = await prisma.alert.findMany({
      where: {
        eventId,
        status: 'ACTIVE',
        type: 'RISK',
      },
      orderBy: { createdAt: 'desc' },
    });

    const highRiskZones = alerts
      .filter((a: any) => a.severity === 'HIGH' || a.severity === 'CRITICAL')
      .map((a: any) => (a.metadata as any)?.zoneId)
      .filter(Boolean) as string[];

    const riskScores = alerts.map((a: any) => (a.metadata as any)?.riskScore || 0);
    const avgScore = riskScores.length > 0 ? riskScores.reduce((a: number, b: number) => a + b, 0) / riskScores.length : 0;

    let currentRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (avgScore >= 85) currentRiskLevel = 'CRITICAL';
    else if (avgScore >= 70) currentRiskLevel = 'HIGH';
    else if (avgScore >= 50) currentRiskLevel = 'MEDIUM';

    return {
      currentRiskLevel,
      averageRiskScore: Math.round(avgScore),
      highRiskZones: [...new Set(highRiskZones)],
      activeAlerts: alerts.length,
    };
  }
}

export const riskEngineService = new RiskEngineService();
