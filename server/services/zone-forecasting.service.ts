/**
 * Copyright © 2025 DrishtiX. All Rights Reserved.
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
 * Zone Forecasting Service
 * Helper functions for crowd forecasting and schedule context
 */

import { SchedulePhase } from '@prisma/client';
import organizerConfigService from './organizer-configuration.service';

class ZoneForecastingService {
  /**
   * Determine current schedule phase based on time
   */
  determineCurrentPhase(schedule: any, currentTime: Date): SchedulePhase {
    const t = currentTime.getTime();

    // Pre-event: before gates open
    if (t < schedule.gatesOpenTime.getTime()) {
      return 'PRE_EVENT';
    }

    // Early entry (VIP, special access)
    if (schedule.earlyEntryStart && t < schedule.earlyEntryStart.getTime()) {
      return 'EARLY_ENTRY';
    }

    // Main entry phase: gates open to event start
    if (t < schedule.eventStartTime.getTime()) {
      return 'MAIN_ENTRY';
    }

    // Pre-show: event started but not main action yet
    if (t < schedule.eventStartTime.getTime() + 15 * 60 * 1000) { // First 15 minutes
      return 'PRE_SHOW';
    }

    // Halftime
    if (schedule.halftimeStart && schedule.halftimeEnd) {
      if (t >= schedule.halftimeStart.getTime() && t < schedule.halftimeEnd.getTime()) {
        return 'HALFTIME';
      }
      // Post-halftime (immediately after break)
      if (t >= schedule.halftimeEnd.getTime() &&
        t < schedule.halftimeEnd.getTime() + 15 * 60 * 1000) {
        return 'POST_HALFTIME';
      }
    }

    // Main event
    if (t < schedule.eventEndTime.getTime() - 15 * 60 * 1000) {
      return 'MAIN_EVENT';
    }

    // Event ending (last 15 minutes)
    if (t < schedule.eventEndTime.getTime()) {
      return 'EVENT_ENDING';
    }

    // Exit phase
    if (t < schedule.venueCloseTime.getTime()) {
      return 'EXIT_PHASE';
    }

    // Post-event
    return 'POST_EVENT';
  }

  /**
   * Check if current time is within a peak window
   */
  isInPeakWindow(schedule: any, currentTime: Date): boolean {
    if (!schedule.peakWindows || !Array.isArray(schedule.peakWindows)) {
      return false;
    }

    const t = currentTime.getTime();

    return schedule.peakWindows.some((window: any) => {
      const start = new Date(window.start).getTime();
      const end = new Date(window.end).getTime();
      return t >= start && t <= end;
    });
  }

  /**
   * Get current mini-event if any
   */
  getCurrentMiniEvent(schedule: any, currentTime: Date): any | null {
    if (!schedule.miniEvents || !Array.isArray(schedule.miniEvents)) {
      return null;
    }

    const t = currentTime.getTime();

    const currentEvent = schedule.miniEvents.find((event: any) => {
      const start = new Date(event.start).getTime();
      const end = new Date(event.end).getTime();
      return t >= start && t <= end;
    });

    return currentEvent || null;
  }

  /**
   * Get upcoming peak windows
   */
  getUpcomingPeakWindows(schedule: any, currentTime: Date, hoursAhead: number = 2): any[] {
    if (!schedule.peakWindows || !Array.isArray(schedule.peakWindows)) {
      return [];
    }

    const t = currentTime.getTime();
    const futureLimit = t + hoursAhead * 60 * 60 * 1000;

    return schedule.peakWindows.filter((window: any) => {
      const start = new Date(window.start).getTime();
      return start > t && start <= futureLimit;
    });
  }

  /**
   * Get phase-specific crowd behavior expectations
   */
  getPhaseExpectations(phase: SchedulePhase): {
    description: string;
    expectedDensity: string;
    criticalZones: string[];
    recommendations: string[];
  } {
    switch (phase) {
      case 'PRE_EVENT':
        return {
          description: 'Event not started, venue closed',
          expectedDensity: 'NONE',
          criticalZones: [],
          recommendations: ['Prepare staff and systems', 'Verify all zones operational']
        };

      case 'EARLY_ENTRY':
        return {
          description: 'VIP and special access entry',
          expectedDensity: 'LOW',
          criticalZones: ['VIP Gates', 'VIP Lounges'],
          recommendations: ['Monitor VIP entry flow', 'Ensure premium services ready']
        };

      case 'MAIN_ENTRY':
        return {
          description: 'Primary entry phase - high inflow expected',
          expectedDensity: 'HIGH',
          criticalZones: ['Entry Gates', 'Concourses', 'Security Checkpoints'],
          recommendations: [
            'All gates operational',
            'Monitor queue lengths',
            'Deploy additional staff to bottleneck zones',
            'Enable crowd flow guidance'
          ]
        };

      case 'PRE_SHOW':
        return {
          description: 'Attendees settling in, last-minute movement',
          expectedDensity: 'MEDIUM',
          criticalZones: ['Seating Areas', 'Food Courts', 'Washrooms'],
          recommendations: [
            'Monitor seating fill rates',
            'Manage food court queues',
            'Prepare for event start'
          ]
        };

      case 'MAIN_EVENT':
        return {
          description: 'Event in progress, most attendees seated',
          expectedDensity: 'LOW_CIRCULATION',
          criticalZones: ['Washrooms', 'Emergency Exits'],
          recommendations: [
            'Monitor for medical emergencies',
            'Maintain exit readiness',
            'Minimal crowd movement expected'
          ]
        };

      case 'HALFTIME':
        return {
          description: 'Break period - high movement and service demand',
          expectedDensity: 'HIGH',
          criticalZones: ['Food Courts', 'Washrooms', 'Concourses'],
          recommendations: [
            'Maximum staff at food outlets',
            'Monitor washroom queues',
            'Manage concourse flow',
            'Time-limited - prepare for return phase'
          ]
        };

      case 'POST_HALFTIME':
        return {
          description: 'Return to seats after break',
          expectedDensity: 'MEDIUM',
          criticalZones: ['Concourses', 'Seating Areas'],
          recommendations: [
            'Guide attendees back to seats',
            'Clear concourses',
            'Resume event monitoring mode'
          ]
        };

      case 'EVENT_ENDING':
        return {
          description: 'Final moments - some early departures',
          expectedDensity: 'MEDIUM',
          criticalZones: ['Exit Routes', 'Gates'],
          recommendations: [
            'Prepare for exit surge',
            'Position staff at exits',
            'Enable all exit routes'
          ]
        };

      case 'EXIT_PHASE':
        return {
          description: 'Mass exodus - critical crowd management phase',
          expectedDensity: 'CRITICAL',
          criticalZones: ['All Exits', 'Stairs', 'Concourses', 'Parking Areas'],
          recommendations: [
            'All exits operational',
            'Maximum staff deployment',
            'Active crowd flow management',
            'Monitor for bottlenecks and crushes',
            'Coordinate with external transport'
          ]
        };

      case 'POST_EVENT':
        return {
          description: 'Event concluded, venue clearing',
          expectedDensity: 'LOW',
          criticalZones: ['Parking', 'External Areas'],
          recommendations: [
            'Complete final sweeps',
            'Assist remaining attendees',
            'Begin venue shutdown'
          ]
        };

      default:
        return {
          description: 'Unknown phase',
          expectedDensity: 'UNKNOWN',
          criticalZones: [],
          recommendations: []
        };
    }
  }

  /**
   * Calculate time until next phase
   */
  getTimeToNextPhase(schedule: any, currentTime: Date): {
    nextPhase: SchedulePhase;
    minutesUntil: number;
    timestamp: Date;
  } | null {
    const t = currentTime.getTime();
    const phases: Array<{ time: Date; phase: SchedulePhase }> = [
      { time: schedule.gatesOpenTime, phase: 'MAIN_ENTRY' },
      { time: schedule.eventStartTime, phase: 'MAIN_EVENT' }
    ];

    if (schedule.earlyEntryStart) {
      phases.push({ time: schedule.earlyEntryStart, phase: 'EARLY_ENTRY' });
    }

    if (schedule.halftimeStart) {
      phases.push({ time: schedule.halftimeStart, phase: 'HALFTIME' });
    }

    if (schedule.halftimeEnd) {
      phases.push({ time: schedule.halftimeEnd, phase: 'POST_HALFTIME' });
    }

    phases.push({ time: schedule.eventEndTime, phase: 'EXIT_PHASE' });
    phases.push({ time: schedule.venueCloseTime, phase: 'POST_EVENT' });

    // Sort by time
    phases.sort((a, b) => a.time.getTime() - b.time.getTime());

    // Find next phase
    const nextPhase = phases.find(p => p.time.getTime() > t);

    if (!nextPhase) {
      return null;
    }

    return {
      nextPhase: nextPhase.phase,
      minutesUntil: Math.floor((nextPhase.time.getTime() - t) / (60 * 1000)),
      timestamp: nextPhase.time
    };
  }

  /**
   * Generate alerts based on zone state and forecast
   */
  generateAlerts(zoneState: any, forecast?: any): any[] {
    const alerts: any[] = [];

    // High density alert
    if (zoneState.densityLevel === 'HIGH' || zoneState.densityLevel === 'CRITICAL') {
      alerts.push({
        type: 'HIGH_DENSITY',
        severity: zoneState.densityLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        message: `Zone ${zoneState.zoneId} has ${zoneState.densityLevel.toLowerCase()} crowd density`,
        recommendation: 'Consider flow management or capacity reduction',
        timestamp: new Date().toISOString()
      });
    }

    // Bottleneck alert
    if (zoneState.bottleneckScore && zoneState.bottleneckScore > 0.7) {
      alerts.push({
        type: 'BOTTLENECK',
        severity: 'HIGH',
        message: `Bottleneck detected in zone ${zoneState.zoneId}`,
        recommendation: 'Deploy staff to manage flow, consider alternative routes',
        timestamp: new Date().toISOString()
      });
    }

    // Long wait time alert
    if (zoneState.avgWaitTime && zoneState.avgWaitTime > 10) {
      alerts.push({
        type: 'LONG_WAIT',
        severity: 'MEDIUM',
        message: `Long wait times in zone ${zoneState.zoneId} (${Math.round(zoneState.avgWaitTime)} min)`,
        recommendation: 'Increase service capacity or add staff',
        timestamp: new Date().toISOString()
      });
    }

    // Risk alert
    if (zoneState.riskLevel === 'HIGH' || zoneState.riskLevel === 'CRITICAL') {
      alerts.push({
        type: 'HIGH_RISK',
        severity: zoneState.riskLevel,
        message: `Zone ${zoneState.zoneId} has ${zoneState.riskLevel.toLowerCase()} safety risk`,
        recommendation: 'Immediate attention required - deploy safety personnel',
        timestamp: new Date().toISOString()
      });
    }

    // Forecast-based alerts
    if (forecast) {
      if (forecast.predictedDensityLevel === 'CRITICAL') {
        alerts.push({
          type: 'FORECAST_CRITICAL',
          severity: 'HIGH',
          message: `Zone ${zoneState.zoneId} predicted to reach critical density in ${forecast.horizonMinutes} minutes`,
          recommendation: 'Proactive intervention recommended - prevent crowd buildup',
          timestamp: new Date().toISOString()
        });
      }
    }

    return alerts;
  }

  /**
   * Generate recommendations for zone management
   */
  generateRecommendations(zoneState: any, zoneMetadata: any, phase: SchedulePhase): string[] {
    const recommendations: string[] = [];
    const congestion = zoneState.congestionScore;

    // Phase-specific recommendations
    const phaseExpectations = this.getPhaseExpectations(phase);
    if (phaseExpectations.criticalZones.some(cz => zoneMetadata.zoneName.includes(cz))) {
      recommendations.push(`Critical zone for ${phase} phase - maintain vigilance`);
    }

    // Density-based recommendations
    if (congestion > 0.8) {
      recommendations.push('High congestion - consider flow restrictions');

      if (zoneMetadata.bottleneckProne) {
        recommendations.push('Bottleneck-prone zone - deploy flow management staff');
      }
    }

    // Queue management
    if (zoneMetadata.queueProne && zoneState.avgWaitTime > 5) {
      recommendations.push('Increase service counters or staff to reduce wait times');
    }

    // Capacity alerts
    if (congestion > 1.0) {
      recommendations.push('OVER CAPACITY - Immediate intervention required');
      recommendations.push('Stop inflow and enable emergency protocols');
    }

    // Connected zones
    if (zoneMetadata.connectedZones && zoneMetadata.connectedZones.length > 0) {
      if (congestion > 0.7) {
        recommendations.push(`Monitor connected zones: ${zoneMetadata.connectedZones.join(', ')}`);
      }
    }

    return recommendations;
  }

  /**
   * Calculate zone health score (0-100)
   * Uses organizer-specific thresholds when available
   */
  async calculateZoneHealthScore(eventId: string, zoneId: string, zoneState: any): Promise<number> {
    let score = 100;

    try {
      // Get organizer-specific thresholds
      const thresholds = await organizerConfigService.getZoneThresholds(eventId, zoneId);

      // Density penalty (adjusted based on organizer thresholds)
      const densityPenalty: Record<string, number> = {
        'LOW': 0,
        'MEDIUM': 10,
        'HIGH': 30,
        'CRITICAL': 60
      };
      score -= densityPenalty[zoneState.densityLevel as string] || 0;

      // Risk penalty (adjusted based on organizer thresholds)
      const riskPenalty: Record<string, number> = {
        'LOW': 0,
        'MEDIUM': 15,
        'HIGH': 35,
        'CRITICAL': 50
      };
      score -= riskPenalty[zoneState.riskLevel as string] || 0;

      // Bottleneck penalty (using organizer threshold)
      const bottleneckThreshold = (thresholds as any)?.bottleneck?.critical ?? 0.7;
      if (zoneState.bottleneckScore && zoneState.bottleneckScore > bottleneckThreshold) {
        score -= 20;
      }

      // Wait time penalty (using organizer threshold)
      const waitTimeWarning = (thresholds as any)?.waitTime?.warning ?? 10;
      if (zoneState.avgWaitTime && zoneState.avgWaitTime > waitTimeWarning) {
        score -= 15;
      }

      // Congestion penalty (using organizer threshold)
      const congestionCritical = (thresholds as any)?.congestion?.critical ?? 1.0;
      if (zoneState.congestionScore > congestionCritical) {
        score -= 30; // Over capacity is critical
      }

      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('[Zone Forecasting] Error calculating health score:', error);
      return this.calculateFallbackHealthScore(zoneState);
    }
  }

  /**
   * Fallback health score calculation when organizer config is unavailable
   */
  private calculateFallbackHealthScore(zoneState: any): number {
    let score = 100;

    const densityPenalty: Record<string, number> = {
      'LOW': 0,
      'MEDIUM': 10,
      'HIGH': 30,
      'CRITICAL': 60
    };
    score -= densityPenalty[zoneState.densityLevel as string] || 0;

    const riskPenalty: Record<string, number> = {
      'LOW': 0,
      'MEDIUM': 15,
      'HIGH': 35,
      'CRITICAL': 50
    };
    score -= riskPenalty[zoneState.riskLevel as string] || 0;

    if (zoneState.bottleneckScore && zoneState.bottleneckScore > 0.7) {
      score -= 20;
    }

    if (zoneState.avgWaitTime && zoneState.avgWaitTime > 10) {
      score -= 15;
    }

    if (zoneState.congestionScore > 1.0) {
      score -= 30;
    }

    return Math.max(0, Math.min(100, score));
  }
}

export const zoneForecastingService = new ZoneForecastingService();
