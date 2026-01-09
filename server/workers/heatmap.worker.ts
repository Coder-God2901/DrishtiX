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
 * Real-Time Heatmap Worker
 * Generates and broadcasts crowd heatmap every 5 seconds
 */

import { prisma } from '../index';
import { io } from '../index';

interface HeatmapZoneData {
  zoneId: string;
  zoneName: string;
  density: number;
  waitTime: number;
  coordinates: { x: number; y: number };
}

class HeatmapWorker {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private activeEvents: Set<string> = new Set();

  /**
   * Start broadcasting heatmap for an event
   */
  async startHeatmapBroadcast(eventId: string): Promise<void> {
    if (this.intervals.has(eventId)) {
      console.log(`Heatmap broadcast already running for event ${eventId}`);
      return;
    }

    this.activeEvents.add(eventId);
    console.log(`Starting heatmap broadcast for event ${eventId}`);

    const interval = setInterval(async () => {
      try {
        const heatmapData = await this.generateHeatmap(eventId);

        // Save to database
        await Promise.all(
          heatmapData.map(zone =>
            prisma.crowdHeatmapZone.create({
              data: {
                eventId,
                ...zone
              }
            })
          )
        );

        // Broadcast via WebSocket
        io.to(`heatmap:${eventId}`).emit('heatmap:update', heatmapData);
        io.to(`event:${eventId}`).emit('heatmap:update', heatmapData);
      } catch (error) {
        console.error(`Error broadcasting heatmap for event ${eventId}:`, error);
      }
    }, 5000); // Every 5 seconds

    this.intervals.set(eventId, interval);
  }

  /**
   * Stop broadcasting heatmap for an event
   */
  stopHeatmapBroadcast(eventId: string): void {
    const interval = this.intervals.get(eventId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(eventId);
      this.activeEvents.delete(eventId);
      console.log(`Stopped heatmap broadcast for event ${eventId}`);
    }
  }

  /**
   * Generate heatmap data for an event
   */
  private async generateHeatmap(eventId: string): Promise<HeatmapZoneData[]> {
    // Get venue layout zones
    const venueLayout = await prisma.venueLayout.findUnique({
      where: { eventId }
    });

    if (!venueLayout || !venueLayout.zones) {
      // Return default zones if no venue layout
      return this.generateDefaultZones();
    }

    const zones = venueLayout.zones as any[];

    // Calculate density for each zone based on various factors
    const heatmapData: HeatmapZoneData[] = await Promise.all(
      zones.map(async (zone: any) => {
        // Get recent check-ins in this zone (simplified - in production, use actual location data)
        const density = await this.calculateZoneDensity(eventId, zone.id);
        const waitTime = this.estimateWaitTime(density);

        return {
          zoneId: zone.id,
          zoneName: zone.name,
          density,
          waitTime,
          coordinates: zone.coordinates || { x: 0, y: 0 }
        };
      })
    );

    return heatmapData;
  }

  /**
   * Calculate density for a specific zone
   */
  private async calculateZoneDensity(eventId: string, zoneId: string): Promise<number> {
    // Get volunteers in zone
    const volunteersInZone = await prisma.volunteer.count({
      where: {
        eventId,
        zone: zoneId,
        status: 'ACTIVE'
      }
    });

    // Get incidents in zone
    const incidentsInZone = await prisma.incident.count({
      where: {
        eventId,
        zone: zoneId,
        status: { in: ['ACTIVE', 'RESPONDING'] }
      }
    });

    // Get help requests in zone (simplified location check)
    const helpRequests = await prisma.helpRequest.count({
      where: {
        eventId,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      }
    });

    // Calculate base density (simplified algorithm)
    // In production, use actual crowd detection from cameras/sensors
    let density = 30 + Math.random() * 30; // Base random density 30-60%

    // Adjust based on volunteers (more volunteers = more people)
    density += volunteersInZone * 5;

    // Adjust based on incidents (incidents indicate high density areas)
    density += incidentsInZone * 10;

    // Adjust based on help requests
    density += helpRequests * 3;

    // Cap at 100
    return Math.min(density, 100);
  }

  /**
   * Estimate wait time based on density
   */
  private estimateWaitTime(density: number): number {
    if (density < 30) return 0;
    if (density < 50) return Math.floor(density / 10);
    if (density < 70) return Math.floor(density / 7);
    return Math.floor(density / 5);
  }

  /**
   * Generate default zones if no venue layout exists
   */
  private generateDefaultZones(): HeatmapZoneData[] {
    const defaultZones = [
      { id: 'entrance', name: 'Main Entrance', x: 50, y: 10 },
      { id: 'stage', name: 'Stage Area', x: 50, y: 50 },
      { id: 'food', name: 'Food Court', x: 20, y: 80 },
      { id: 'restrooms', name: 'Restrooms', x: 80, y: 80 },
      { id: 'exit1', name: 'Exit 1', x: 10, y: 90 },
      { id: 'exit2', name: 'Exit 2', x: 90, y: 90 }
    ];

    return defaultZones.map(zone => ({
      zoneId: zone.id,
      zoneName: zone.name,
      density: 30 + Math.random() * 40,
      waitTime: Math.floor(Math.random() * 10),
      coordinates: { x: zone.x, y: zone.y }
    }));
  }

  /**
   * Start heatmap for all active events
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

    console.log(`Starting heatmap broadcast for ${activeEvents.length} active events`);

    for (const event of activeEvents) {
      await this.startHeatmapBroadcast(event.id);
    }
  }

  /**
   * Stop all broadcasts
   */
  stopAll(): void {
    for (const eventId of this.activeEvents) {
      this.stopHeatmapBroadcast(eventId);
    }
  }

  /**
   * Get active event count
   */
  getActiveCount(): number {
    return this.activeEvents.size;
  }
}

export const heatmapWorker = new HeatmapWorker();
