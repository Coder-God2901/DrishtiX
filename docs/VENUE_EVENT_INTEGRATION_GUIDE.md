# Venue Boundary Mapping & Dynamic Event Creator - Integration Guide

## Overview

This document provides a comprehensive guide to the **Venue Boundary Mapping** and **Dynamic Event Creator** features, which are fully integrated with real-time backend services, Google Cloud Platform (GCP), and WebSocket communication.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Feature 1: Dynamic Event Creator](#feature-1-dynamic-event-creator)
3. [Feature 2: Venue Boundary Mapping](#feature-2-venue-boundary-mapping)
4. [Real-Time Integration](#real-time-integration)
5. [API Endpoints](#api-endpoints)
6. [Setup & Configuration](#setup--configuration)
7. [Testing Guide](#testing-guide)

---

## Architecture Overview

### Technology Stack

| Layer          | Technology                                     | Purpose                            |
| -------------- | ---------------------------------------------- | ---------------------------------- |
| **Frontend**   | React + TypeScript                             | UI Components                      |
| **Maps**       | Google Maps JavaScript API + React Google Maps | Interactive mapping                |
| **Geospatial** | Turf.js                                        | Geometry validation & calculations |
| **Backend**    | Express + TypeScript                           | API & Business Logic               |
| **Real-Time**  | Socket.IO                                      | Live updates                       |
| **Database**   | PostgreSQL + Prisma                            | Data persistence                   |
| **Validation** | Zod (optional)                                 | Schema validation                  |

### Data Flow

```
Frontend Component
    ↓
Google Maps Drawing Manager
    ↓
GeoJSON Conversion
    ↓
API Client (Axios)
    ↓
Express Route Handler
    ↓
Service Layer (Turf.js Validation)
    ↓
Prisma ORM
    ↓
PostgreSQL Database
    ↓
Socket.IO Emission
    ↓
All Connected Clients (Real-Time Update)
```

---

## Feature 1: Dynamic Event Creator

### Purpose

Allows event organizers to create events using pre-defined templates that dynamically render form fields based on event type (Concert, Marathon, Festival, Rally, Conference, Workshop).

### Key Components

#### 1. Backend Service: `event-template.service.ts`

**Location:** `server/services/event-template.service.ts`

**Responsibilities:**

- Manages event type templates
- Validates dynamic form fields
- Creates events with template-based configuration
- Emits real-time event creation notifications

**Key Methods:**

```typescript
// Get all available templates
getAllTemplates(): EventTypeTemplate[]

// Get specific template by ID
getTemplate(templateId: string): EventTypeTemplate | undefined

// Validate dynamic fields against template schema
validateDynamicFields(templateId: string, dynamicFields: Record<string, any>):
  { valid: boolean; errors: string[] }

// Create event from template with validation
createEventFromTemplate(templateId, basicInfo, dynamicFields):
  Promise<{ success: boolean; event?: any; errors?: string[] }>
```

#### 2. Frontend Component: `dynamic-event-creator-enhanced.tsx`

**Location:** `src/components/features/dynamic-event-creator-enhanced.tsx`

**Features:**

- Template selection grid with icons
- Dynamic form rendering based on selected template
- Client-side validation with error display
- Real-time validation feedback
- Support for multiple field types:
  - Text, Number, Textarea
  - Boolean (checkboxes)
  - Date, DateTime
  - Select (dropdown)
  - List (tags with add/remove)

**Usage:**

```tsx
import { DynamicEventCreatorEnhanced } from '@/components/features/dynamic-event-creator-enhanced';

// In your route/page
<DynamicEventCreatorEnhanced />;
```

#### 3. Event Templates

Six pre-configured templates:

1. **Concert** - `mlMode: CONCERT`, High risk, VIP areas, multiple stages
2. **Marathon** - `mlMode: SPORTS`, Route mapping, aid stations, checkpoints
3. **Festival** - Multi-day, camping, multiple stages
4. **Rally** - Enhanced security, speakers, security levels
5. **Conference** - Professional events, tracks, sponsors
6. **Workshop** - Educational sessions, facilitators

#### 4. Database Schema

```prisma
model Event {
  id              String   @id @default(uuid())
  name            String
  description     String?
  venue           String
  location        Json
  startTime       DateTime
  endTime         DateTime
  expectedAttendees Int
  organizerId     String
  status          EventStatus

  eventConfigs    EventConfig[]
  venueLayouts    VenueLayout[]
  // ... other relations
}

model EventConfig {
  id            String   @id @default(uuid())
  eventId       String   @unique
  event         Event    @relation(fields: [eventId], references: [id])
  dynamicFields Json     // Stores template-specific fields
}
```

---

## Feature 2: Venue Boundary Mapping

### Purpose

Enables organizers to digitally define the physical layout of events by drawing venue boundaries, creating zones, and setting up geofencing alerts.

### Key Components

#### 1. Backend Service: `venue-mapping.service.ts`

**Location:** `server/services/venue-mapping.service.ts`

**Responsibilities:**

- Polygon validation using Turf.js
- Geofencing logic (point-in-polygon checks)
- Zone overlap detection
- Navigation path generation
- Real-time geofence alert emission

**Key Methods:**

```typescript
// Validate polygon geometry
validatePolygon(coordinates: Position[][]): { valid: boolean; errors: string[] }

// Calculate area in square meters
calculateArea(coordinates: Position[][]): number

// Check if point is inside polygon
isPointInPolygon(point: [number, number], polygon: Position[][]): boolean

// Check geofence violations and unauthorized access
checkGeofence(eventId, location, userId?, userRole?): Promise<GeofenceCheckResult>

// Find optimal path avoiding crowds
findOptimalPath(eventId, from, to, avoidCrowdedZones): Promise<PathResult>

// Save venue layout with full validation
saveVenueLayout(eventId, boundary, zones, gates, routes):
  Promise<{ success: boolean; errors?: string[] }>
```

#### 2. Frontend Component: `venue-mapping-enhanced.tsx`

**Location:** `src/components/features/venue-mapping-enhanced.tsx`

**Features:**

- Google Maps integration with Drawing Manager
- Boundary polygon creation with validation
- Multi-zone creation with metadata
  - Zone types: Stage, Gate, Food, Medical, VIP, Parking, Restroom, Restricted
  - Capacity settings (100-50,000)
  - Risk levels (Low, Medium, High, Critical)
  - VIP toggle
- Real-time validation feedback
- Zone list with delete capability
- Save to backend with error handling

**Props:**

```typescript
interface VenueMappingEnhancedProps {
  eventId: string;
  initialCenter?: { lat: number; lng: number };
  onSave?: (layout: any) => void;
}
```

**Usage:**

```tsx
import { VenueMappingEnhanced } from '@/components/features/venue-mapping-enhanced';

<VenueMappingEnhanced
  eventId="evt_123"
  initialCenter={{ lat: 18.5204, lng: 73.8567 }}
  onSave={(layout) => console.log('Saved:', layout)}
/>;
```

#### 3. Geofencing Logic

**L1 Check: Venue Boundary**

```typescript
// Is user inside venue?
const insideVenue = isPointInPolygon([lng, lat], boundary.coordinates);
if (!insideVenue) {
  // Trigger "Outside Venue" alert
}
```

**L2 Check: Zone Access**

```typescript
// Which zones is user in?
for (const zone of zones) {
  const isInZone = isPointInPolygon([lng, lat], zone.shape.coordinates);
  if (isInZone) {
    // Check for VIP/restricted access
    if (zone.properties.isVIP && userRole !== 'VIP') {
      // Trigger unauthorized access alert
    }
  }
}
```

#### 4. Database Schema

```prisma
model VenueLayout {
  id          String   @id @default(uuid())
  eventId     String   @unique
  event       Event    @relation(fields: [eventId], references: [id])

  boundary    Json     // GeoJSON Polygon
  zones       Json[]   // Array of Zone objects
  gates       Json[]   // Gate/entrance points
  routes      Json[]   // Evacuation/marathon routes
  navGraph    Json?    // Navigation graph for pathfinding
  metadata    Json?    // Area, zone count, etc.
}
```

**Zone Structure (JSON):**

```json
{
  "id": "zone_main_stage",
  "name": "Main Stage",
  "type": "stage",
  "capacity": 20000,
  "shape": {
    "type": "Polygon",
    "coordinates": [[[73.857, 18.520], ...]]
  },
  "properties": {
    "riskLevel": "high",
    "isVIP": false,
    "allowedRoles": ["all"]
  }
}
```

---

## Real-Time Integration

### Socket.IO Events

#### Event Creation

```typescript
// Server emits
io.to(`organizer:${organizerId}`).emit('event:created', event);

// Client listens
socketService.onEventCreated((event) => {
  console.log('New event created:', event);
});
```

#### Venue Updates

```typescript
// Server emits
io.to(`event:${eventId}`).emit('venue:updated', {
  eventId,
  boundary,
  zones,
  timestamp: new Date(),
});

// Client listens
socketService.onVenueUpdated((data) => {
  console.log('Venue layout updated:', data);
});
```

#### Geofence Alerts

```typescript
// Server emits on violation
io.to(`event:${eventId}`).emit('geofence:alert', {
  userId,
  location,
  alerts: [
    {
      type: 'unauthorized_zone',
      severity: 'high',
      message: 'Unauthorized access to VIP area',
      zoneId: 'zone_vip',
      zoneName: 'VIP Lounge',
    },
  ],
});

// Client listens
socketService.onGeofenceAlert((data) => {
  // Show alert to security personnel
  showAlert(data);
});
```

#### Event Config Updates

```typescript
// Server emits
io.to(`event:${eventId}`).emit('event:config:updated', {
  eventId,
  dynamicFields,
});

// Client listens
socketService.onEventConfigUpdated((data) => {
  updateEventDetails(data);
});
```

---

## API Endpoints

### Event Template Endpoints

#### GET `/api/events/templates`

Get all available event type templates.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "concert",
      "displayName": "Concert / Music Festival",
      "description": "Live music events with high crowd density",
      "icon": "Music",
      "fields": [...]
    }
  ]
}
```

#### GET `/api/events/templates/:templateId`

Get specific template by ID.

### Event Management Endpoints

#### POST `/api/events`

Create new event (template-based or legacy).

**Request Body:**

```json
{
  "organizerId": "user_123",
  "name": "Sunburn 2026",
  "description": "EDM Music Festival",
  "venue": "XYZ Grounds, Pune",
  "location": { "lat": 18.5204, "lng": 73.8567 },
  "startTime": "2026-02-05T16:00:00Z",
  "endTime": "2026-02-05T23:59:00Z",
  "expectedAttendees": 15000,
  "eventTypeId": "concert",
  "dynamicFields": {
    "artist": "Martin Garrix",
    "hasAlcohol": true,
    "stages": 3,
    "ticketTypes": ["VIP", "General", "Standing"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "evt_abc123",
    "name": "Sunburn 2026",
    ...
  }
}
```

#### PUT `/api/events/:id/config`

Update event dynamic configuration fields.

**Request Body:**

```json
{
  "dynamicFields": {
    "stages": 4,
    "hasVIP": true
  }
}
```

### Venue Mapping Endpoints

#### GET `/api/events/:id/venue-layout`

Get venue layout for an event.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "layout_xyz",
    "eventId": "evt_abc123",
    "boundary": {
      "type": "Polygon",
      "coordinates": [...]
    },
    "zones": [...],
    "gates": [...],
    "routes": [],
    "navGraph": {...},
    "metadata": {
      "totalArea": 50000,
      "zoneCount": 5
    }
  }
}
```

#### POST `/api/events/:id/venue-layout`

Save venue layout with validation.

**Request Body:**

```json
{
  "boundary": {
    "type": "Polygon",
    "coordinates": [
      [[73.8568, 18.5203], [73.8575, 18.5203], ...]
    ]
  },
  "zones": [
    {
      "id": "zone_main_stage",
      "name": "Main Stage",
      "type": "stage",
      "capacity": 20000,
      "shape": {...},
      "properties": {
        "riskLevel": "high",
        "isVIP": false
      }
    }
  ],
  "gates": [],
  "routes": []
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Venue layout saved successfully"
}
```

**Response (Validation Errors):**

```json
{
  "success": false,
  "errors": ["Polygon has 2 self-intersection(s)", "Zone 1 (Main Stage): Zone center is outside venue boundary"]
}
```

#### POST `/api/events/:id/geofence-check`

Check if a location triggers geofence alerts.

**Request Body:**

```json
{
  "location": { "lat": 18.5207, "lng": 73.8571 },
  "userId": "user_456",
  "userRole": "ATTENDEE"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "isInside": true,
    "insideZones": ["zone_food_court"],
    "outsideVenue": false,
    "nearestZone": {
      "zoneId": "zone_main_stage",
      "zoneName": "Main Stage",
      "distance": 45.3
    },
    "alerts": []
  }
}
```

#### POST `/api/events/:id/navigate`

Find optimal path with crowd avoidance.

**Request Body:**

```json
{
  "from": { "lat": 18.5204, "lng": 73.8568 },
  "to": { "lat": 18.521, "lng": 73.8574 },
  "avoidCrowds": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "path": [
      [73.8568, 18.5204],
      [73.8574, 18.521]
    ],
    "distance": 85.6,
    "estimatedTime": 62
  }
}
```

---

## Setup & Configuration

### Prerequisites

1. **Node.js** >= 18.x
2. **PostgreSQL** >= 14.x (with PostGIS extension)
3. **Google Maps API Key** with the following APIs enabled:
   - Maps JavaScript API
   - Drawing Library
   - Geometry Library
   - Places API (optional)

### Environment Variables

#### Root `.env`

```env
# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# WebSocket
VITE_WS_URL=http://localhost:3000

# API
VITE_API_URL=http://localhost:3000/api
```

#### Server `.env`

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/eventsphere

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Server
PORT=3000
```

### Installation Steps

1. **Install dependencies:**

```bash
pnpm install
```

2. **Install additional packages (if not already installed):**

```bash
pnpm add @turf/turf @react-google-maps/api
```

3. **Set up database:**

```bash
cd server
npx prisma migrate dev
npx prisma generate
```

4. **Start the backend server:**

```bash
cd server
pnpm dev
```

5. **Start the frontend:**

```bash
pnpm dev
```

### Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API (optional, for address lookup)
4. Create credentials (API Key)
5. Add API key restrictions:
   - HTTP referrers for frontend
   - IP addresses for backend
6. Add the API key to your `.env` files

---

## Testing Guide

### 1. Test Event Creation

**Steps:**

1. Navigate to `/organizer/events/create`
2. Select "Concert" template
3. Fill in basic information:
   - Event Name: "Test Concert"
   - Venue: "Test Venue"
   - Start/End times
   - Expected attendees: 5000
4. Fill in template fields:
   - Artist: "Test Artist"
   - Stages: 2
   - Alcohol: Yes
   - Ticket Types: VIP, General
5. Click "Create Event"
6. Verify:
   - Success toast appears
   - Redirected to venue mapping
   - Event appears in database
   - Socket.IO event emitted

**Validation Test:**

- Try submitting without required fields → Should show errors
- Try invalid attendee count → Should show validation error
- Try end time before start time → Should show error

### 2. Test Venue Boundary Mapping

**Steps:**

1. Open venue mapping for created event
2. Click "Draw Venue Boundary"
3. Click on map to create polygon (minimum 4 points)
4. Close the polygon by clicking near first point
5. Verify:
   - Polygon appears with red outline
   - Validation message shows "Venue layout is valid"

**Self-Intersection Test:**

- Draw a figure-8 shape (crossing lines)
- Verify error: "Polygon has self-intersection(s)"

### 3. Test Zone Creation

**Steps:**

1. After boundary is valid, click "Add Zone"
2. Fill zone details:
   - Name: "Main Stage"
   - Type: Stage
   - Capacity: 10000
   - Risk Level: High
3. Draw zone polygon inside boundary
4. Verify:
   - Zone appears in zones list
   - Color-coded based on type
   - Can delete zone

**Outside Boundary Test:**

- Draw zone polygon outside venue boundary
- Verify error: "Zone center is outside venue boundary"

### 4. Test Geofencing

**API Test:**

```bash
curl -X POST http://localhost:3000/api/events/evt_123/geofence-check \
  -H "Content-Type: application/json" \
  -d '{
    "location": { "lat": 18.5207, "lng": 73.8571 },
    "userId": "user_456",
    "userRole": "ATTENDEE"
  }'
```

**Expected Response:**

- `isInside: true` if location is within boundary
- `insideZones` array contains zone IDs
- `alerts` array contains violations (if any)

### 5. Test Real-Time Updates

**Setup:**

1. Open browser console in two tabs
2. Both tabs connect to Socket.IO

**Test Event Creation:**

```javascript
// Tab 1: Listen for events
socket.on('event:created', (event) => {
  console.log('Event created:', event);
});

// Tab 2: Create event via UI
// → Tab 1 should receive event in real-time
```

**Test Venue Updates:**

```javascript
// Tab 1: Listen for venue updates
socket.on('venue:updated', (data) => {
  console.log('Venue updated:', data);
});

// Tab 2: Save venue layout
// → Tab 1 should receive update in real-time
```

### 6. Test Navigation API

```bash
curl -X POST http://localhost:3000/api/events/evt_123/navigate \
  -H "Content-Type: application/json" \
  -d '{
    "from": { "lat": 18.5204, "lng": 73.8568 },
    "to": { "lat": 18.5210, "lng": 73.8574 },
    "avoidCrowds": true
  }'
```

**Verify:**

- Returns path array
- Distance in meters
- Estimated time in seconds

---

## Troubleshooting

### Google Maps Not Loading

**Issue:** Map shows gray screen

**Solutions:**

1. Check API key is correct in `.env`
2. Verify Maps JavaScript API is enabled
3. Check browser console for errors
4. Ensure billing is enabled on Google Cloud

### Polygon Validation Errors

**Issue:** Valid polygon shows self-intersection error

**Solutions:**

1. Ensure polygon is properly closed (first point = last point)
2. Check for duplicate consecutive points
3. Verify coordinates are [lng, lat] not [lat, lng]

### Socket.IO Not Connecting

**Issue:** Real-time updates not working

**Solutions:**

1. Verify backend server is running
2. Check CORS settings in `server/index.ts`
3. Ensure correct WebSocket URL in `.env`
4. Check browser network tab for failed connections

### Database Errors

**Issue:** Prisma errors on save

**Solutions:**

1. Run `npx prisma generate`
2. Check database connection string
3. Verify migrations are up to date: `npx prisma migrate dev`

---

## Performance Considerations

### Frontend Optimizations

1. **Polygon Rendering**
   - Limit vertices to avoid lag (recommend < 500 points)
   - Use polygon simplification for complex shapes

2. **Zone Management**
   - Lazy load zones not in viewport
   - Debounce drawing operations

3. **Real-Time Updates**
   - Throttle socket emissions (max 10/second)
   - Batch updates when possible

### Backend Optimizations

1. **Geofencing**
   - Cache venue layouts in Redis (future)
   - Use spatial indexes in PostgreSQL
   - Batch geofence checks for multiple users

2. **Validation**
   - Validate on client before sending to server
   - Use async validation for non-blocking UX

---

## Future Enhancements

1. **Advanced Pathfinding**
   - A\* algorithm implementation
   - Real-time crowd density integration
   - Multi-stop routing

2. **3D Venue Visualization**
   - Three.js integration
   - Building height data
   - Drone perspective views

3. **ML-Powered Zone Suggestions**
   - Auto-suggest zone placement based on past events
   - Capacity predictions based on zone size

4. **Mobile App Integration**
   - React Native components
   - Offline map caching
   - GPS tracking with geofencing

---

## Support & Resources

- **Turf.js Documentation:** https://turfjs.org/docs/
- **Google Maps API:** https://developers.google.com/maps
- **Prisma Documentation:** https://www.prisma.io/docs
- **Socket.IO Documentation:** https://socket.io/docs/

---

**Last Updated:** November 29, 2025  
**Version:** 1.0.0  
**Maintained By:** DrishtiX Platform Team
