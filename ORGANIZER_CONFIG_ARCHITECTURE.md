# 🎨 Organizer Configuration System Architecture

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORGANIZER CONFIGURATION SYSTEM                │
│              From Hardcoded Defaults → Custom Real-Time Data     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  Organizers  │
│  (Frontend)  │
└──────┬───────┘
       │
       │ Configure venues, zones, thresholds
       │
       ↓
┌──────────────────────────────────────────────────────────────┐
│                     API LAYER                                 │
│  /api/organizer/venues                                       │
│  /api/organizer/events/:eventId/config                       │
│  /api/organizer/events/:eventId/zones/:zoneId/thresholds    │
└──────┬───────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────┐
│              ORGANIZER CONFIGURATION SERVICE                  │
│  • createVenueConfiguration()                                │
│  • getZoneConfiguration()                                    │
│  • getDensityLevel() - Custom thresholds                     │
│  • getRiskLevel() - Custom thresholds                        │
└──────┬───────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────┐
│                      DATABASE                                 │
│  • OrganizerProfile                                          │
│  • VenueConfig (zones, gates, thresholds)                   │
│  • OrganizerEventConfig (overrides)                          │
│  • ConfigurationTemplate                                     │
└──────┬───────────────────────────────────────────────────────┘
       │
       │ Configs consumed by:
       │
       ├──────────────────────────────────────────────┐
       │                                               │
       ↓                                               ↓
┌─────────────────────┐                   ┌─────────────────────┐
│  Real-Time Data     │                   │  Forecasting        │
│  Collection         │                   │  Service            │
│  • getZoneCapacity()│                   │  • healthScore()    │
│  • getDensityLevel()│                   │  • alerts()         │
│  • getRiskLevel()   │                   │  • recommendations()│
└──────┬──────────────┘                   └──────┬──────────────┘
       │                                          │
       │                                          │
       └──────────────────┬───────────────────────┘
                          │
                          ↓
                  ┌──────────────┐
                  │  ZoneState   │
                  │  (Database)  │
                  └──────┬───────┘
                         │
                         ↓
               ┌────────────────────┐
               │  LSTM Model        │
               │  (ML Service)      │
               └────────────────────┘
```

---

## 🔄 Configuration Flow

### 1. Venue Setup Flow

```
Organizer
   │
   │ 1. Create Venue
   ↓
POST /api/organizer/venues
{
  organizerId: "org-123"
  venueName: "Stadium"
  zones: [...]
  thresholds: {...}
}
   │
   ↓
organizerConfigService.createVenueConfiguration()
   │
   ↓
Database: VenueConfig
   │
   │ 2. Create Event
   ↓
POST /api/organizer/events/:eventId/config
{
  venueId: "venue-456"
  schedule: {...}
  zoneOverrides: [...]
}
   │
   ↓
organizerConfigService.createEventConfiguration()
   │
   ↓
Database: OrganizerEventConfig
```

### 2. Real-Time Data Flow

```
Camera Feed
   │
   ↓
Zone Real-Time Data Service
   │
   │ 1. Get zone config
   ├─→ organizerConfigService.getZoneConfiguration(eventId, zoneId)
   │      │
   │      ├─→ Database: OrganizerEventConfig
   │      ├─→ Database: VenueConfig
   │      └─→ Fallback: Default values
   │
   │ 2. Calculate capacity
   ├─→ getZoneCapacity(eventId, zoneId, type)
   │      └─→ Returns: Custom capacity OR default
   │
   │ 3. Calculate density
   ├─→ organizerConfigService.getDensityLevel(eventId, zoneId, value)
   │      │
   │      ├─→ Get custom thresholds
   │      └─→ Returns: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
   │
   │ 4. Calculate risk
   └─→ organizerConfigService.getRiskLevel(eventId, zoneId, score)
         │
         ├─→ Get custom thresholds
         └─→ Returns: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
   │
   ↓
Store ZoneState with custom levels
```

### 3. Forecasting Flow

```
LSTM Model Request
   │
   ↓
Get Zone States (last 60 minutes)
   │
   ↓
Zone Forecasting Service
   │
   │ Calculate health score
   ├─→ organizerConfigService.getZoneThresholds(eventId, zoneId)
   │      │
   │      └─→ Custom thresholds for:
   │          • Density penalties
   │          • Risk penalties
   │          • Bottleneck thresholds
   │          • Wait time thresholds
   │          • Congestion thresholds
   │
   ↓
Generate Predictions with custom thresholds
   │
   ↓
Store CrowdForecast with organizer-specific levels
```

---

## 🏗️ Data Model

### Configuration Hierarchy

```
OrganizerProfile
│
├─ VenueConfig 1
│  ├─ Zone 1 (Entry Gate)
│  │  └─ Custom Thresholds
│  ├─ Zone 2 (Seating)
│  │  └─ Custom Thresholds
│  └─ Zone 3 (Food Court)
│     └─ Custom Thresholds
│
├─ VenueConfig 2
│
└─ OrganizerEventConfig
   │
   ├─ Event 1
   │  ├─ Schedule
   │  ├─ Crowd Behavior
   │  ├─ Alert Config
   │  └─ Zone Overrides
   │     ├─ Zone 1: maxCapacity = 600 (override)
   │     └─ Zone 2: thresholds = {...} (override)
   │
   └─ Event 2
```

### Configuration Lookup Flow

```
Need: Zone Configuration for Event X, Zone Y

Step 1: Check OrganizerEventConfig
   ├─ Has zone override? → Use it
   └─ No override? → Continue

Step 2: Check VenueConfig
   ├─ Has zone config? → Use it
   └─ No config? → Continue

Step 3: Use System Default
   └─ Type-based default values
```

---

## 🎯 Key Components

### 1. Types (organizer-config.types.ts)

```typescript
OrganizerProfile
   └─ preferences
VenueConfiguration
   ├─ zones: ZoneConfiguration[]
   ├─ gates: GateConfiguration[]
   └─ thresholds: VenueThresholds
ZoneConfiguration
   ├─ capacity settings
   ├─ physical characteristics
   └─ thresholds: ZoneThresholds
EventConfiguration
   ├─ schedule
   ├─ crowdBehavior
   ├─ alertConfiguration
   └─ overrides
```

### 2. Service (organizer-config.service.ts)

```typescript
OrganizerConfigurationService
│
├─ Venue Management
│  ├─ createVenueConfiguration()
│  ├─ getVenueConfiguration()
│  ├─ updateVenueConfiguration()
│  └─ getOrganizerVenues()
│
├─ Event Management
│  ├─ createEventConfiguration()
│  ├─ getEventConfiguration()
│  └─ updateEventConfiguration()
│
├─ Zone Queries
│  ├─ getZoneConfiguration() - with overrides
│  ├─ getEventZones()
│  └─ getZoneThresholds() - with fallbacks
│
├─ Real-Time Calculations
│  ├─ getDensityLevel() - custom thresholds
│  └─ getRiskLevel() - custom thresholds
│
└─ Validation
   └─ validateVenueConfiguration()
```

### 3. API Routes (organizer-config.routes.ts)

```
Venue Endpoints
├─ POST   /api/organizer/venues
├─ GET    /api/organizer/venues/:venueId
├─ PUT    /api/organizer/venues/:venueId
└─ GET    /api/organizer/:organizerId/venues

Event Endpoints
├─ POST   /api/organizer/events/:eventId/config
├─ GET    /api/organizer/events/:eventId/config
└─ PUT    /api/organizer/events/:eventId/config

Zone Endpoints
├─ GET    /api/organizer/events/:eventId/zones
├─ GET    /api/organizer/events/:eventId/zones/:zoneId
└─ GET    /api/organizer/events/:eventId/zones/:zoneId/thresholds

Real-Time Calculations
├─ POST   /api/organizer/events/:eventId/zones/:zoneId/density-level
└─ POST   /api/organizer/events/:eventId/zones/:zoneId/risk-level

Templates
└─ GET    /api/organizer/templates/venues/:venueType
```

---

## 🔍 Before vs After Comparison

### BEFORE: Hardcoded System

```typescript
// ❌ Fixed for everyone
getZoneCapacity(type: string) {
  return {
    'GATE': 200,
    'STAND': 1000
  }[type] || 500;
}

getDensityLevel(value: number) {
  if (value >= 0.85) return 'CRITICAL';
  if (value >= 0.6) return 'HIGH';
  // Same thresholds for all organizers
}
```

### AFTER: Customizable System

```typescript
// ✅ Organizer-specific
async getZoneCapacity(eventId, zoneId, type) {
  const config = await organizerConfigService
    .getZoneConfiguration(eventId, zoneId);

  if (config) {
    return config.maxCapacity; // Custom!
  }

  return defaults[type]; // Fallback
}

async getDensityLevel(eventId, zoneId, value) {
  // Uses organizer's custom thresholds
  return await organizerConfigService
    .getDensityLevel(eventId, zoneId, value);
  // Returns level based on THEIR settings
}
```

---

## 🎨 Integration Points

### Services Using Organizer Configs

```
zone-realtime-data.service.ts
   ├─ getZoneCapacity() ────────┐
   ├─ getZoneArea() ─────────────┤
   ├─ getDensityLevel() ─────────┼─→ organizerConfigService
   └─ calculateRiskLevel() ──────┘

zone-forecasting.service.ts
   └─ calculateZoneHealthScore() ─→ organizerConfigService

zone-simulation.service.ts (future)
   └─ Use organizer configs for realistic simulation

lstm-integration.service.ts (future)
   └─ Context-aware predictions with organizer thresholds
```

---

## 📊 Data Customization Levels

```
Level 1: Organizer Profile
   └─ Organization preferences, contact info

Level 2: Venue Configuration
   ├─ Reusable venue setup
   ├─ Zone definitions
   ├─ Gate configurations
   └─ Venue-wide thresholds

Level 3: Event Configuration
   ├─ Event-specific schedule
   ├─ Crowd behavior expectations
   ├─ Alert sensitivity
   └─ Threshold overrides

Level 4: Zone Overrides
   └─ Per-zone, per-event customization

Level 5: Real-Time Adjustments
   └─ Dynamic threshold updates during event
```

---

## 🎯 Success Metrics

### What's Now Customizable?

✅ Zone Capacities (maxCapacity, normalCapacity)  
✅ Zone Areas (areaSqMeters)  
✅ Density Thresholds (low, medium, high, critical)  
✅ Risk Thresholds (low, medium, high, critical)  
✅ Wait Time Thresholds (normal, warning, critical)  
✅ Queue Length Thresholds (normal, warning, critical)  
✅ Congestion Scores (low, medium, high, critical)  
✅ Bottleneck Scores (normal, warning, critical)  
✅ Movement Speeds (normal, slow, stagnant)  
✅ Temperature Warnings (warning, critical)  
✅ Humidity Warnings (warning, critical)  
✅ Data Collection Intervals  
✅ Prediction Horizons

### What's Eliminated?

❌ Hardcoded capacities  
❌ Fixed density thresholds  
❌ Generic risk calculations  
❌ One-size-fits-all approach  
❌ Inflexible configurations

---

## 🚀 Deployment Architecture

```
┌────────────────────────────────────────────────────────┐
│                    PRODUCTION                          │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Frontend (React/Next.js)                             │
│    ↓                                                   │
│  API Gateway                                          │
│    ↓                                                   │
│  Express Server                                       │
│    ├─ /api/organizer/* routes                        │
│    ├─ /api/events/* routes                           │
│    └─ /api/monitoring/* routes                       │
│    ↓                                                   │
│  Services Layer                                       │
│    ├─ organizerConfigService                         │
│    ├─ zoneRealtimeDataService (updated)              │
│    └─ zoneForecastingService (updated)               │
│    ↓                                                   │
│  Database (PostgreSQL + PostGIS)                      │
│    ├─ OrganizerProfile                               │
│    ├─ VenueConfig                                    │
│    ├─ OrganizerEventConfig                           │
│    └─ Existing tables                                │
│    ↓                                                   │
│  Cache Layer (Redis) - Future                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

**Created:** January 13, 2026  
**Status:** ✅ Implementation Complete  
**Version:** 1.0.0
