/**
 * Copyright © 2025 DrishtiX. All Rights Reserved.
 * 
 * Zone-Camera Mappings Configuration
 * 
 * Configure your venue's zones and camera associations here.
 * This file is the central place to manage all zone-camera relationships.
 */

export interface ZoneCameraMapping {
  zoneId: string;
  zoneName: string;
  cameraIds: string[];
  zoneType: 'GATE' | 'STAND' | 'CONCOURSE' | 'EXIT' | 'PARKING' | 'VIP' | 'SECURITY';
  capacity: number;
  areaSquareMeters: number;
  location: {
    lat: number;
    lon: number;
  };
  adjacentZones: string[];
  priority: number; // 1-5, higher = more critical
  enabled: boolean;
}

/**
 * Default Stadium Configuration
 * Modify this for your venue or create venue-specific configurations
 */
export const DEFAULT_ZONE_CAMERA_MAPPINGS: ZoneCameraMapping[] = [
  // ENTRY GATES (High Priority)
  {
    zoneId: 'north-gate-1',
    zoneName: 'North Gate 1',
    cameraIds: ['cam-ng1-01', 'cam-ng1-02'],
    zoneType: 'GATE',
    capacity: 200,
    areaSquareMeters: 100,
    location: { lat: 0, lon: 0 },
    adjacentZones: ['main-concourse', 'north-stand-lower'],
    priority: 5,
    enabled: true,
  },
  {
    zoneId: 'south-gate-1',
    zoneName: 'South Gate 1',
    cameraIds: ['cam-sg1-01', 'cam-sg1-02'],
    zoneType: 'GATE',
    capacity: 200,
    areaSquareMeters: 100,
    location: { lat: 0, lon: 0 },
    adjacentZones: ['main-concourse', 'south-stand-lower'],
    priority: 5,
    enabled: true,
  },
  {
    zoneId: 'east-gate-1',
    zoneName: 'East Gate 1',
    cameraIds: ['cam-eg1-01'],
    zoneType: 'GATE',
    capacity: 150,
    areaSquareMeters: 80,
    location: { lat: 0, lon: 0 },
    adjacentZones: ['main-concourse', 'east-stand'],
    priority: 4,
    enabled: true,
  },
  {
    zoneId: 'west-gate-1',
    zoneName: 'West Gate 1',
    cameraIds: ['cam-wg1-01'],
    zoneType: 'GATE',
    capacity: 150,
    areaSquareMeters: 80,
    location: { lat: 0, lon: 0 },
    adjacentZones: ['main-concourse', 'west-stand'],
    priority: 4,
    enabled: true,
  },

  // STANDS (Medium-High Priority)
  {
    zoneId: 'north-stand-lower',
    zoneName: 'North Stand Lower',
    cameraIds: ['cam-nsl-01', 'cam-nsl-02', 'cam-nsl-03'],
    zoneType: 'STAND',
    capacity: 1000,
    areaSquareMeters: 500,
    location: { lat: 0, lon: 0 },
    adjacentZones: ['north-stand-upper', 'main-concourse'],
    priority: 4,
    enabled: true,
  },
  {
    zoneId: 'north-stand-upper',
    zoneName: 'North Stand Upper',
    cameraIds: ['cam-nsu-01', 'cam-nsu-02'],
    zoneType: 'STAND',
    capacity: 800,
    areaSquareMeters: 400,
    location: { lat: 0, lon: 0 },
    adjacentZones: ['north-stand-lower'],
    priority: 3,
    enabled: true,
  },
  {
    zoneId: 'south-stand-lower',
    zoneName: 'South Stand Lower',
    cameraIds: ['cam-ssl-01', 'cam-ssl-02', 'cam-ssl-03'],
    zoneType: 'STAND',
    capacity: 1000,
    areaSquareMeters: 500,
    location: { lat: 0, lon: 0 },
    adjacentZones: ['south-stand-upper', 'main-concourse'],
    priority: 4,
    enabled: true,
  },
  {
    zoneId: 'south-stand-upper',
    zoneName: 'South Stand Upper',
    cameraIds: ['cam-ssu-01', 'cam-ssu-02'],
    zoneType: 'STAND',
    capacity: 800,
    areaSquareMeters: 400,
    location: { lat: 0, lon: 0 },
    adjacentZones: ['south-stand-lower'],
    priority: 3,
    enabled: true,
  },
  {
    zoneId: 'east-stand',
    zoneName: 'East Stand',
    cameraIds: ['cam-es-01', 'cam-es-02'],
    zoneType: 'STAND',
    capacity: 1200,
    areaSquareMeters: 600,
    location: { lat: 0, lon: 0 },
    adjacentZones: ['main-concourse'],
    priority: 3,
    enabled: true,
  },
  {
    zoneId: 'west-stand',
    zoneName: 'West Stand',
    cameraIds: ['cam-ws-01', 'cam-ws-02'],
    zoneType: 'STAND',
    capacity: 1200,
    areaSquareMeters: 600,
    location: { lat: 0, lon: 0 },
    adjacentZones: ['main-concourse'],
    priority: 3,
    enabled: true,
  },

  // CONCOURSES (Medium Priority)
  {
    zoneId: 'main-concourse',
    zoneName: 'Main Concourse',
    cameraIds: ['cam-mc-01', 'cam-mc-02', 'cam-mc-03', 'cam-mc-04'],
    zoneType: 'CONCOURSE',
    capacity: 800,
    areaSquareMeters: 400,
    location: { lat: 0, lon: 0 },
    adjacentZones: ['north-gate-1', 'south-gate-1', 'food-court'],
    priority: 4,
    enabled: true,
  },
  {
    zoneId: 'food-court',
    zoneName: 'Food Court',
    cameraIds: ['cam-fc-01', 'cam-fc-02'],
    zoneType: 'CONCOURSE',
    capacity: 300,
    areaSquareMeters: 200,
    location: { lat: 0, lon: 0 },
    adjacentZones: ['main-concourse'],
    priority: 3,
    enabled: true,
  },

  // EXITS (High Priority)
  {
    zoneId: 'emergency-exit-north',
    zoneName: 'Emergency Exit North',
    cameraIds: ['cam-een-01'],
    zoneType: 'EXIT',
    capacity: 100,
    areaSquareMeters: 50,
    location: { lat: 0, lon: 0 },
    adjacentZones: ['north-stand-lower'],
    priority: 5,
    enabled: true,
  },
  {
    zoneId: 'emergency-exit-south',
    zoneName: 'Emergency Exit South',
    cameraIds: ['cam-ees-01'],
    zoneType: 'EXIT',
    capacity: 100,
    areaSquareMeters: 50,
    location: { lat: 0, lon: 0 },
    adjacentZones: ['south-stand-lower'],
    priority: 5,
    enabled: true,
  },

  // PARKING (Low Priority)
  {
    zoneId: 'parking-lot-a',
    zoneName: 'Parking Lot A',
    cameraIds: ['cam-pla-01', 'cam-pla-02'],
    zoneType: 'PARKING',
    capacity: 300,
    areaSquareMeters: 1000,
    location: { lat: 0, lon: 0 },
    adjacentZones: ['north-gate-1'],
    priority: 2,
    enabled: true,
  },

  // VIP AREAS (Medium Priority)
  {
    zoneId: 'vip-section',
    zoneName: 'VIP Section',
    cameraIds: ['cam-vip-01', 'cam-vip-02'],
    zoneType: 'VIP',
    capacity: 100,
    areaSquareMeters: 200,
    location: { lat: 0, lon: 0 },
    adjacentZones: ['main-concourse'],
    priority: 3,
    enabled: true,
  },
];

/**
 * Venue-specific configurations
 * Add your custom venues here
 */
export const VENUE_CONFIGURATIONS: Record<string, ZoneCameraMapping[]> = {
  // Default stadium
  'default-stadium': DEFAULT_ZONE_CAMERA_MAPPINGS,

  // Example: Concert hall configuration
  'concert-hall-a': [
    {
      zoneId: 'main-entrance',
      zoneName: 'Main Entrance',
      cameraIds: ['cam-ce-01', 'cam-ce-02', 'cam-ce-03'],
      zoneType: 'GATE',
      capacity: 500,
      areaSquareMeters: 200,
      location: { lat: 0, lon: 0 },
      adjacentZones: ['lobby'],
      priority: 5,
      enabled: true,
    },
    {
      zoneId: 'lobby',
      zoneName: 'Main Lobby',
      cameraIds: ['cam-cl-01', 'cam-cl-02'],
      zoneType: 'CONCOURSE',
      capacity: 300,
      areaSquareMeters: 150,
      location: { lat: 0, lon: 0 },
      adjacentZones: ['main-entrance', 'concert-floor'],
      priority: 4,
      enabled: true,
    },
    {
      zoneId: 'concert-floor',
      zoneName: 'Concert Floor',
      cameraIds: ['cam-cf-01', 'cam-cf-02', 'cam-cf-03', 'cam-cf-04'],
      zoneType: 'STAND',
      capacity: 2000,
      areaSquareMeters: 1000,
      location: { lat: 0, lon: 0 },
      adjacentZones: ['lobby'],
      priority: 5,
      enabled: true,
    },
  ],

  // Add more venue configurations as needed
};

/**
 * Get zone-camera mappings for a specific venue
 */
export function getVenueConfiguration(venueId: string): ZoneCameraMapping[] {
  return VENUE_CONFIGURATIONS[venueId] || DEFAULT_ZONE_CAMERA_MAPPINGS;
}

/**
 * Get only enabled zones
 */
export function getEnabledZones(venueId?: string): ZoneCameraMapping[] {
  const config = venueId ? getVenueConfiguration(venueId) : DEFAULT_ZONE_CAMERA_MAPPINGS;
  return config.filter((zone) => zone.enabled);
}

/**
 * Get zones by type
 */
export function getZonesByType(
  type: ZoneCameraMapping['zoneType'],
  venueId?: string
): ZoneCameraMapping[] {
  const config = venueId ? getVenueConfiguration(venueId) : DEFAULT_ZONE_CAMERA_MAPPINGS;
  return config.filter((zone) => zone.zoneType === type && zone.enabled);
}

/**
 * Get high-priority zones (priority >= 4)
 */
export function getHighPriorityZones(venueId?: string): ZoneCameraMapping[] {
  const config = venueId ? getVenueConfiguration(venueId) : DEFAULT_ZONE_CAMERA_MAPPINGS;
  return config.filter((zone) => zone.priority >= 4 && zone.enabled);
}

/**
 * Validate camera coverage - ensure all cameras are assigned
 */
export function validateCameraCoverage(cameraIds: string[], venueId?: string): {
  valid: boolean;
  unassignedCameras: string[];
  assignedCameras: string[];
} {
  const config = venueId ? getVenueConfiguration(venueId) : DEFAULT_ZONE_CAMERA_MAPPINGS;
  const assignedCameras = new Set<string>();

  config.forEach((zone) => {
    zone.cameraIds.forEach((camId) => assignedCameras.add(camId));
  });

  const unassignedCameras = cameraIds.filter((camId) => !assignedCameras.has(camId));

  return {
    valid: unassignedCameras.length === 0,
    unassignedCameras,
    assignedCameras: Array.from(assignedCameras),
  };
}
