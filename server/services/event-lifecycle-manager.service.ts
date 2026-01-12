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
 * Event Lifecycle Manager for Zone Forecasting
 * 
 * Automatically manages real-time data collection based on event lifecycle:
 * - Starts data collection when event becomes ACTIVE
 * - Stops data collection when event is COMPLETED or CANCELLED
 * - Monitors event status changes
 */

import { PrismaClient, EventStatus } from '@prisma/client';
import { zoneRealtimeDataService } from './zone-realtime-data.service';

const prisma = new PrismaClient();

class EventLifecycleManager {
  private activeEvents: Set<string> = new Set();
  private eventMonitorTimer: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60000; // Check every minute

  constructor() {
    console.log('[Event Lifecycle Manager] Initialized');
  }

  /**
   * Start monitoring event lifecycle
   */
  startMonitoring(): void {
    if (this.eventMonitorTimer) {
      console.log('[Event Lifecycle Manager] Already monitoring');
      return;
    }

    console.log('[Event Lifecycle Manager] Starting event monitoring');

    // Initial check
    this.checkEventStatuses();

    // Set up periodic checks
    this.eventMonitorTimer = setInterval(() => {
      this.checkEventStatuses();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Stop monitoring event lifecycle
   */
  stopMonitoring(): void {
    if (this.eventMonitorTimer) {
      clearInterval(this.eventMonitorTimer);
      this.eventMonitorTimer = null;
      console.log('[Event Lifecycle Manager] Stopped event monitoring');
    }

    // Stop all active collections
    this.activeEvents.forEach((eventId) => {
      this.stopDataCollection(eventId);
    });
  }

  /**
   * Check all event statuses and manage data collection
   */
  private async checkEventStatuses(): Promise<void> {
    try {
      const now = new Date();

      // Find events that should be active (started but not ended)
      const activeEvents = await prisma.event.findMany({
        where: {
          status: 'ACTIVE',
          startTime: { lte: now },
          endTime: { gte: now },
        },
        select: {
          id: true,
          name: true,
          startTime: true,
          endTime: true,
        },
      });

      // Find events that should start soon (within 30 minutes)
      const upcomingEvents = await prisma.event.findMany({
        where: {
          status: 'UPCOMING',
          startTime: {
            gte: now,
            lte: new Date(now.getTime() + 30 * 60 * 1000),
          },
        },
        select: {
          id: true,
          name: true,
          startTime: true,
        },
      });

      // Start collection for active events
      for (const event of activeEvents) {
        if (!this.activeEvents.has(event.id)) {
          console.log(
            `[Event Lifecycle Manager] Starting data collection for active event: ${event.name} (${event.id})`
          );
          await this.startDataCollection(event.id);
        }
      }

      // Pre-start collection for upcoming events (30 min before)
      for (const event of upcomingEvents) {
        if (!this.activeEvents.has(event.id)) {
          console.log(
            `[Event Lifecycle Manager] Pre-starting data collection for upcoming event: ${event.name} (${event.id})`
          );
          await this.startDataCollection(event.id);
        }
      }

      // Find events that have ended
      const endedEvents = await prisma.event.findMany({
        where: {
          OR: [
            { status: 'COMPLETED' },
            { status: 'CANCELLED' },
            {
              status: 'ACTIVE',
              endTime: { lt: now },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          status: true,
        },
      });

      // Stop collection for ended events
      for (const event of endedEvents) {
        if (this.activeEvents.has(event.id)) {
          console.log(
            `[Event Lifecycle Manager] Stopping data collection for ended event: ${event.name} (${event.id})`
          );
          await this.stopDataCollection(event.id);

          // Update event status if still ACTIVE
          if (event.status === 'ACTIVE') {
            await prisma.event.update({
              where: { id: event.id },
              data: { status: 'COMPLETED' },
            });
          }
        }
      }

      // Clean up orphaned active events (not in database)
      const allEventIds = [
        ...activeEvents.map((e) => e.id),
        ...upcomingEvents.map((e) => e.id),
      ];

      for (const eventId of this.activeEvents) {
        if (!allEventIds.includes(eventId)) {
          console.log(
            `[Event Lifecycle Manager] Cleaning up orphaned event collection: ${eventId}`
          );
          this.activeEvents.delete(eventId);
        }
      }
    } catch (error) {
      console.error('[Event Lifecycle Manager] Error checking event statuses:', error);
    }
  }

  /**
   * Manually start data collection for a specific event
   */
  async startDataCollection(eventId: string): Promise<void> {
    try {
      if (this.activeEvents.has(eventId)) {
        console.log(`[Event Lifecycle Manager] Data collection already active for event: ${eventId}`);
        return;
      }

      await zoneRealtimeDataService.startDataCollection(eventId);
      this.activeEvents.add(eventId);

      console.log(`[Event Lifecycle Manager] Data collection started for event: ${eventId}`);
    } catch (error) {
      console.error(`[Event Lifecycle Manager] Error starting data collection for event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Manually stop data collection for a specific event
   */
  stopDataCollection(eventId: string): void {
    if (!this.activeEvents.has(eventId)) {
      console.log(`[Event Lifecycle Manager] No active data collection for event: ${eventId}`);
      return;
    }

    // Stop data collection for this specific event
    zoneRealtimeDataService.stopDataCollection(eventId);
    this.activeEvents.delete(eventId);

    console.log(`[Event Lifecycle Manager] Data collection stopped for event: ${eventId}`);
  }

  /**
   * Check if data collection is active for an event
   */
  isCollectionActive(eventId: string): boolean {
    return this.activeEvents.has(eventId);
  }

  /**
   * Get all active event IDs
   */
  getActiveEvents(): string[] {
    return Array.from(this.activeEvents);
  }

  /**
   * Force a status check (useful for testing or manual triggers)
   */
  async forceStatusCheck(): Promise<void> {
    await this.checkEventStatuses();
  }
}

export const eventLifecycleManager = new EventLifecycleManager();
