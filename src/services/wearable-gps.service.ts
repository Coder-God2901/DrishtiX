/**
 * Wearable GPS Service
 * Real-time location tracking for team members using wearable devices
 */

import { PubSubService } from './pubsub.service';

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  deviceId: string;
  currentLocation?: GPSCoordinates;
  lastUpdate?: Date;
  status: 'active' | 'inactive' | 'offline';
}

export class WearableGPSService {
  private pubsubService: PubSubService;
  private trackingActive: boolean = false;
  private watchId?: number;

  constructor() {
    this.pubsubService = new PubSubService();
  }

  async startTracking(teamMemberId: string, eventId: string): Promise<void> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    this.trackingActive = true;

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        await this.publishLocation(teamMemberId, eventId, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined
        });
      },
      (error) => console.error('GPS error:', error),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }

  stopTracking(): void {
    if (this.watchId !== undefined) {
      navigator.geolocation.clearWatch(this.watchId);
      this.trackingActive = false;
    }
  }

  private async publishLocation(
    teamMemberId: string,
    eventId: string,
    coords: GPSCoordinates
  ): Promise<void> {
    await this.pubsubService.publishGPSTracking({
      teamMemberId,
      eventId,
      location: coords,
      timestamp: new Date().toISOString(),
      battery: await this.getBatteryLevel()
    });
  }

  private async getBatteryLevel(): Promise<number> {
    if ('getBattery' in navigator) {
      const battery: any = await (navigator as any).getBattery();
      return battery.level * 100;
    }
    return 100;
  }
}

export default WearableGPSService;
