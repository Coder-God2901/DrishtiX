/**
 * Copyright © 2025 DrishtiX. All Rights Reserved.
 * 
 * Organizer Configuration Types
 * 
 * Defines all customizable settings that organizers can configure
 * for their events, venues, zones, and crowd management thresholds.
 */

import { DensityLevel, RiskLevel, SchedulePhase } from '@prisma/client';

// =============================================================================
// Organizer Profile Configuration
// =============================================================================

export interface OrganizerProfile {
  id: string;
  organizerId: string;
  organizationName: string;
  organizationType: 'SPORTS' | 'CONCERT' | 'FESTIVAL' | 'CONFERENCE' | 'RELIGIOUS' | 'POLITICAL' | 'OTHER';
  contactEmail: string;
  contactPhone: string;
  preferences: OrganizerPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizerPreferences {
  alertSensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
  notificationChannels: ('EMAIL' | 'SMS' | 'PUSH' | 'DASHBOARD')[];
  language: string;
  timezone: string;
  measurementUnits: 'METRIC' | 'IMPERIAL';
}

// =============================================================================
// Venue Configuration (Organizer-Specific)
// =============================================================================

export interface VenueConfiguration {
  id: string;
  organizerId: string;
  venueId: string;
  venueName: string;
  venueType: 'STADIUM' | 'ARENA' | 'CONCERT_HALL' | 'CONVENTION_CENTER' | 'OUTDOOR_PARK' | 'OTHER';

  // Physical characteristics
  totalCapacity: number;
  totalArea: number; // square meters
  floors: number;

  // Geographic data
  location: {
    lat: number;
    lon: number;
    address: string;
    city: string;
    country: string;
  };

  // Zones configured by organizer
  zones: ZoneConfiguration[];

  // Gates configured by organizer
  gates: GateConfiguration[];

  // Emergency facilities
  emergencyExits: EmergencyExitConfiguration[];
  medicalStations: MedicalStationConfiguration[];

  // Venue-specific thresholds
  thresholds: VenueThresholds;

  // Custom metadata
  metadata?: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Zone Configuration (Fully Customizable by Organizer)
// =============================================================================

export interface ZoneConfiguration {
  zoneId: string;
  zoneName: string;

  // Zone type (organizer selects)
  zoneType: 'ENTRY_GATE' | 'EXIT_GATE' | 'SEATING_STAND' | 'FOOD_COURT' | 'WASHROOM' |
  'CONCOURSE' | 'VIP_AREA' | 'PARKING' | 'EMERGENCY_EXIT' | 'MEDICAL_STATION' |
  'SECURITY_CHECK' | 'MERCHANDISE' | 'CUSTOM';

  // Capacity & area (organizer defines)
  maxCapacity: number;
  normalCapacity: number; // comfortable capacity (usually 80% of max)
  areaSqMeters: number;

  // Physical characteristics (organizer sets)
  fixedSeating: boolean;
  seatingCount?: number;

  // Flow characteristics
  bottleneckProne: boolean;
  queueProne: boolean;
  highTrafficZone: boolean;

  // Priority (organizer assigns)
  zonePriority: 1 | 2 | 3 | 4 | 5; // 5 = critical, 1 = low priority

  // Geographic data
  floor: number;
  coordinates: {
    type: 'Polygon' | 'Point';
    coordinates: number[][] | number[];
  };

  // Connected zones
  adjacentZones: string[];
  connectedGates: string[];

  // Camera coverage (organizer assigns)
  cameraIds: string[];
  cameraAngles?: string[];

  // Zone-specific thresholds
  thresholds: ZoneThresholds;

  // Custom attributes
  customAttributes?: Record<string, any>;
}

// =============================================================================
// Gate Configuration
// =============================================================================

export interface GateConfiguration {
  gateId: string;
  gateName: string;
  gateType: 'MAIN_ENTRANCE' | 'VIP_ENTRANCE' | 'STAFF_ENTRANCE' | 'EMERGENCY_EXIT' | 'SERVICE_GATE';

  // Capacity
  maxThroughput: number; // people per minute
  lanes: number;

  // Schedule
  opensAt: Date;
  closesAt: Date;

  // Security
  securityCheckRequired: boolean;
  securityCheckDuration: number; // seconds per person

  // Ticketing
  ticketScanningEnabled: boolean;
  scanSpeed: number; // scans per minute

  // Location
  location: {
    lat: number;
    lon: number;
  };

  // Connected zones
  leadsToZones: string[];

  // Camera coverage
  cameraIds: string[];
}

// =============================================================================
// Emergency Configuration
// =============================================================================

export interface EmergencyExitConfiguration {
  exitId: string;
  exitName: string;
  capacity: number; // people per minute
  location: {
    lat: number;
    lon: number;
  };
  leadsToZones: string[];
  alwaysAccessible: boolean;
}

export interface MedicalStationConfiguration {
  stationId: string;
  stationName: string;
  capacity: number; // simultaneous patients
  staffCount: number;
  location: {
    lat: number;
    lon: number;
  };
  equipment: string[];
  nearbyZones: string[];
}

// =============================================================================
// Threshold Configurations (Fully Customizable)
// =============================================================================

export interface VenueThresholds {
  // Overall venue thresholds
  overallDensity: DensityThresholds;
  overallRisk: RiskThresholds;

  // Temperature & weather
  temperatureWarning: number; // Celsius
  temperatureCritical: number;
  humidityWarning: number; // percentage
  humidityCritical: number;

  // Global settings
  dataCollectionInterval: number; // minutes (default 5)
  predictionHorizons: number[]; // minutes (e.g., [10, 30, 60])
}

export interface ZoneThresholds {
  // Density thresholds (people per square meter)
  density: DensityThresholds;

  // Risk thresholds
  risk: RiskThresholds;

  // Wait time thresholds (minutes)
  waitTime: {
    normal: number;
    warning: number;
    critical: number;
  };

  // Queue length thresholds
  queueLength: {
    normal: number;
    warning: number;
    critical: number;
  };

  // Congestion score thresholds (0-1)
  congestion: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };

  // Bottleneck score thresholds (0-1)
  bottleneck: {
    normal: number;
    warning: number;
    critical: number;
  };

  // Movement speed thresholds (m/s)
  movementSpeed: {
    normal: number;
    slow: number;
    stagnant: number;
  };
}

export interface DensityThresholds {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface RiskThresholds {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

// =============================================================================
// Event-Specific Configuration
// =============================================================================

export interface EventConfiguration {
  id: string;
  eventId: string;
  organizerId: string;
  venueId: string;

  // Override venue settings for this specific event
  venueOverrides?: Partial<VenueConfiguration>;

  // Zone overrides for this event
  zoneOverrides?: Partial<ZoneConfiguration>[];

  // Event-specific thresholds
  thresholdOverrides?: Partial<VenueThresholds>;

  // Schedule configuration
  schedule: EventScheduleConfiguration;

  // Crowd behavior expectations
  crowdBehavior: CrowdBehaviorConfiguration;

  // Alert configuration
  alertConfiguration: AlertConfiguration;

  // Staff allocation
  staffAllocation: StaffAllocation[];

  createdAt: Date;
  updatedAt: Date;
}

export interface EventScheduleConfiguration {
  // Pre-event
  setupStartTime: Date;
  gatesOpenTime: Date;
  earlyEntryStart?: Date;

  // Main event
  eventStartTime: Date;
  eventEndTime: Date;

  // Breaks
  breaks: {
    name: string;
    startTime: Date;
    endTime: Date;
    affectedZones?: string[];
  }[];

  // Post-event
  exitStartTime: Date;
  venueCloseTime: Date;
  cleanupEndTime: Date;

  // Peak windows (organizer predicts)
  peakWindows: {
    name: string;
    startTime: Date;
    endTime: Date;
    expectedIncrease: number; // percentage
    affectedZones: string[];
    reason: string;
  }[];

  // Mini-events
  miniEvents: {
    name: string;
    startTime: Date;
    endTime: Date;
    location: string;
    affectedZones: string[];
    expectedAttendees: number;
  }[];
}

export interface CrowdBehaviorConfiguration {
  // Expected attendance pattern
  arrivalPattern: 'GRADUAL' | 'RUSH' | 'SCHEDULED' | 'STAGGERED';
  departurePattern: 'GRADUAL' | 'RUSH' | 'SCHEDULED' | 'STAGGERED';

  // Peak occupancy expectations
  expectedPeakOccupancy: number; // percentage of capacity
  peakOccupancyTime: Date;

  // Movement patterns
  expectedMovementSpeed: number; // m/s
  highMobilityPhases: SchedulePhase[];
  lowMobilityPhases: SchedulePhase[];

  // Zone usage patterns (organizer's expectations)
  zoneUsagePatterns: {
    zoneId: string;
    expectedUsage: 'CONSTANT' | 'PEAK_DURING_EVENT' | 'PEAK_DURING_BREAKS' | 'MINIMAL';
    peakTimes?: Date[];
  }[];
}

export interface AlertConfiguration {
  // Alert sensitivity
  densitySensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
  riskSensitivity: 'LOW' | 'MEDIUM' | 'HIGH';

  // Auto-alert rules
  autoAlertRules: {
    ruleId: string;
    ruleName: string;
    condition: string; // e.g., "densityLevel == 'CRITICAL' AND zone.priority >= 4"
    action: 'NOTIFY' | 'ESCALATE' | 'ACTIVATE_PROTOCOL';
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    recipients: string[];
    enabled: boolean;
  }[];

  // Escalation rules
  escalationRules: {
    ruleId: string;
    triggerAfterMinutes: number;
    escalateTo: string[];
    autoActivateEmergencyProtocol: boolean;
  }[];
}

export interface StaffAllocation {
  zoneId: string;
  role: 'SECURITY' | 'MEDICAL' | 'USHER' | 'VENDOR' | 'MANAGER';
  count: number;
  shiftStart: Date;
  shiftEnd: Date;
}

// =============================================================================
// Default Configurations (Starting Templates)
// =============================================================================

export interface DefaultConfigurationTemplate {
  templateId: string;
  templateName: string;
  templateType: 'VENUE' | 'EVENT';
  applicableFor: string[]; // venue types or event types
  configuration: Partial<VenueConfiguration> | Partial<EventConfiguration>;
}

// =============================================================================
// API Request/Response Types
// =============================================================================

export interface CreateVenueConfigRequest {
  organizerId: string;
  venueName: string;
  venueType: VenueConfiguration['venueType'];
  totalCapacity: number;
  location: VenueConfiguration['location'];
  zones: Omit<ZoneConfiguration, 'zoneId'>[];
  gates: Omit<GateConfiguration, 'gateId'>[];
  thresholds?: Partial<VenueThresholds>;
}

export interface UpdateVenueConfigRequest {
  venueName?: string;
  zones?: Partial<ZoneConfiguration>[];
  gates?: Partial<GateConfiguration>[];
  thresholds?: Partial<VenueThresholds>;
}

export interface CreateEventConfigRequest {
  eventId: string;
  organizerId: string;
  venueId: string;
  schedule: EventScheduleConfiguration;
  crowdBehavior: CrowdBehaviorConfiguration;
  alertConfiguration: AlertConfiguration;
  staffAllocation?: StaffAllocation[];
  zoneOverrides?: Partial<ZoneConfiguration>[];
  thresholdOverrides?: Partial<VenueThresholds>;
}

export interface UpdateEventConfigRequest {
  schedule?: Partial<EventScheduleConfiguration>;
  crowdBehavior?: Partial<CrowdBehaviorConfiguration>;
  alertConfiguration?: Partial<AlertConfiguration>;
  staffAllocation?: StaffAllocation[];
  zoneOverrides?: Partial<ZoneConfiguration>[];
  thresholdOverrides?: Partial<VenueThresholds>;
}

export interface GetConfigResponse<T> {
  success: boolean;
  data: T;
  isDefault: boolean; // true if using default values
  message?: string;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
