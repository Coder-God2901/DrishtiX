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
 * Real-Time Metrics Worker
 * Broadcasts live metrics every 3 seconds to connected clients
 */

import { prisma } from '../index';
import { io } from '../index';

interface LiveMetricsData {
  eventId: string;
  currentAttendees: number;
  checkIns: number;
  activeVolunteers: number;
  incidentReports: number;
  crowdDensity: number;
  timestamp: number;
}

class MetricsWorker {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private activeEvents: Set<string> = new Set();

  /**
   * Start broadcasting metrics for an event
   */
  async startMetricsBroadcast(eventId: string): Promise<void> {
    if (this.intervals.has(eventId)) {
      console.log(`Metrics broadcast already running for event ${eventId}`);
      return;
    }

    this.activeEvents.add(eventId);
    console.log(`Starting metrics broadcast for event ${eventId}`);

    const interval = setInterval(async () => {
      try {
        const metrics = await this.calculateMetrics(eventId);

        // Save to database
        await prisma.liveMetric.create({
          data: metrics
        });

        // Broadcast via WebSocket
        io.to(`metrics:${eventId}`).emit('metrics:update', metrics);
        io.to(`event:${eventId}`).emit('metrics:update', metrics);
      } catch (error) {
        console.error(`Error broadcasting metrics for event ${eventId}:`, error);
      }
    }, 3000); // Every 3 seconds

    this.intervals.set(eventId, interval);
  }

  /**
   * Stop broadcasting metrics for an event
   */
  stopMetricsBroadcast(eventId: string): void {
    const interval = this.intervals.get(eventId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(eventId);
      this.activeEvents.delete(eventId);
      console.log(`Stopped metrics broadcast for event ${eventId}`);
    }
  }

  /**
   * Calculate live metrics for an event
   */
  private async calculateMetrics(eventId: string): Promise<LiveMetricsData> {
    // Get current attendees (checked in tickets)
    const checkIns = await prisma.ticket.count({
      where: {
        eventId,
        status: 'USED'
      }
    });

    // Get active volunteers
    const activeVolunteers = await prisma.volunteer.count({
      where: {
        eventId,
        status: 'ACTIVE'
      }
    });

    // Get open incident reports
    const incidentReports = await prisma.incident.count({
      where: {
        eventId,
        status: { in: ['ACTIVE', 'RESPONDING'] }
      }
    });

    // Get latest crowd density
    const latestHeatmap = await prisma.crowdHeatmapZone.findMany({
      where: {
        eventId,
        timestamp: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });

    const avgDensity = latestHeatmap.length > 0
      ? latestHeatmap.reduce((sum, z) => sum + z.density, 0) / latestHeatmap.length
      : 0;

    // Calculate current attendees (could be more sophisticated)
    const currentAttendees = Math.floor(checkIns * 0.95); // Assume 95% still present

    return {
      eventId,
      currentAttendees,
      checkIns,
      activeVolunteers,
      incidentReports,
      crowdDensity: avgDensity,
      timestamp: Date.now()
    };
  }

  /**
   * Start metrics for all active events
   */
  async startAllActiveEvents(): Promise<void> {
    const activeEvents = await prisma.event.findMany({
      where: {
        status: 'ACTIVE',
        startTime: {
          lte: new Date()
        },
        endTime: {
          gte: new Date()
        }
      },
      select: {
        id: true
      }
    });

    console.log(`Starting metrics broadcast for ${activeEvents.length} active events`);

    for (const event of activeEvents) {
      await this.startMetricsBroadcast(event.id);
    }
  }

  /**
   * Stop all broadcasts
   */
  stopAll(): void {
    for (const eventId of this.activeEvents) {
      this.stopMetricsBroadcast(eventId);
    }
  }

  /**
   * Get active event count
   */
  getActiveCount(): number {
    return this.activeEvents.size;
  }
}

export const metricsWorker = new MetricsWorker();
