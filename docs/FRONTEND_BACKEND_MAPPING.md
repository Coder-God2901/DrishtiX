# DrishtiX Frontend-Backend Feature Mapping

> **Last Updated**: January 2, 2026  
> **Version**: 2.0 (Based on Final UI/UX Design)

## Table of Contents

1. [Overview](#overview)
2. [User Roles & Authentication](#user-roles--authentication)
3. [Core Feature Mapping](#core-feature-mapping)
4. [API Requirements by Module](#api-requirements-by-module)
5. [Real-Time Data Requirements](#real-time-data-requirements)
6. [Data Models](#data-models)
7. [Integration Points](#integration-points)

---

## Overview

This document maps the **finalized DrishtiX frontend UI** (approved by stakeholders) to the backend API requirements. The frontend is built with **React 18.3**, **TypeScript**, and **Radix UI** components, using mock data currently. This guide will help backend developers implement the necessary APIs and services.

### Frontend Tech Stack
- **Framework**: React 18.3 + TypeScript + Vite
- **UI Library**: Radix UI (Accordion, Dialog, Dropdown, Select, etc.)
- **State Management**: React Context + Hooks
- **Maps**: Leaflet + React-Leaflet
- **Charts**: Recharts
- **Styling**: Tailwind CSS (via utility classes)

### Frontend Architecture
```
drishti-frontend/
├── src/
│   ├── components/           # 70+ UI components
│   │   ├── LandingPage.tsx          # Public landing page
│   │   ├── Login.tsx                # Authentication
│   │   ├── OrganizerHome.tsx        # Event organizer dashboard
│   │   ├── AttendeeDashboard.tsx    # Attendee view
│   │   ├── EventCommandCenter.tsx   # Main event management hub
│   │   ├── EventDashboard.tsx       # Real-time event overview
│   │   ├── DrishtiXAIPlatform.tsx   # AI insights & analytics
│   │   └── [60+ other components]
│   ├── services/
│   │   ├── mockBackend.ts           # Mock API (to be replaced)
│   │   ├── incidentContext.tsx      # Incident state management
│   │   └── incidentManagementService.ts
│   └── App.tsx                      # Main app orchestration
```

---

## User Roles & Authentication

### User Types

#### 1. **Attendee**
- Browse and discover events
- Purchase/manage tickets
- Real-time navigation & safety alerts
- Access accessibility features
- Medical assistance requests
- Find people/help within venue

#### 2. **Organizer**
- Create, manage, and monitor events
- Configure venue mapping & zones
- Manage teams and volunteers
- Real-time operations dashboard
- Incident management & dispatch
- Analytics and reporting

### Authentication Flow

```
Landing Page → Login → Role Selection → Dashboard
     ↓
1. User selects role (Attendee/Organizer)
2. Enters credentials
3. Backend validates & returns JWT
4. Frontend stores token & user data
5. Redirects to role-specific dashboard
```

**Backend API Requirements:**

```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
  role: 'attendee' | 'organizer';
}

interface LoginResponse {
  success: boolean;
  token: string;  // JWT
  user: {
    id: string;
    name: string;
    email: string;
    role: 'attendee' | 'organizer';
    avatar?: string;
    phoneNumber?: string;
  };
  expiresIn: number;  // seconds
}

// POST /api/auth/register
interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: 'attendee' | 'organizer';
}

// POST /api/auth/refresh
interface RefreshRequest {
  refreshToken: string;
}

// POST /api/auth/logout
interface LogoutRequest {
  token: string;
}
```

---

## Core Feature Mapping

### 1. Landing Page (`LandingPage.tsx`)

**Features:**
- Event discovery preview
- Platform features showcase
- Statistics display (50K+ events, 2M+ attendees, 99.8% safety score)
- Call-to-action for sign up

**Backend Requirements:**
```typescript
// GET /api/public/stats
interface PlatformStats {
  totalEvents: number;
  totalAttendees: number;
  safetyScore: number;  // 0-100
  uptime: number;       // percentage
}

// GET /api/public/featured-events
interface FeaturedEvent {
  id: string;
  name: string;
  image: string;
  location: string;
  date: string;
  category: string;
  attendeeCount: number;
}
```

### 2. Event Discovery & Management (`OrganizerHome.tsx`, `AttendeeEventHub.tsx`)

**Organizer View Features:**
- List all events (with filters: Live, Scheduled, Draft, Completed)
- Search events by name/location
- Create new event
- View event cards with status, metrics, and quick actions

**Attendee View Features:**
- Browse upcoming events
- Filter by category, location, price
- View event details (crowd status, safety score, amenities)
- Purchase tickets
- Save favorites

**Backend Requirements:**

```typescript
// GET /api/events
interface EventListRequest {
  page?: number;
  limit?: number;
  status?: 'LIVE' | 'SCHEDULED' | 'DRAFT' | 'COMPLETED' | 'ALL';
  category?: string;
  searchQuery?: string;
  userId?: string;  // For organizer's events
  sortBy?: 'date' | 'popularity' | 'safetyScore';
  sortOrder?: 'asc' | 'desc';
}

interface Event {
  id: string;
  name: string;
  image: string;
  location: string;
  venue: string;
  date: string;          // ISO 8601
  time: string;
  endTime: string;
  status: 'LIVE' | 'SCHEDULED' | 'DRAFT' | 'COMPLETED';
  category: string;
  description: string;
  
  // Metrics
  expectedAttendance: number;
  currentAttendance?: number;
  capacity: string;
  crowdStatus: 'calm' | 'moderate' | 'busy' | 'very_busy';
  safetyScore: number;  // 0-100
  
  // Pricing
  price: number;
  isFree: boolean;
  
  // Organizer info
  organizerId: string;
  hostName: string;
  
  // Attendee info
  bestGate: string;
  queueTime: number;  // minutes
  averageRating: number;
  totalReviews: number;
  
  // Amenities
  amenities: string[];
  parkingAvailable: boolean;
  wheelchairAccessible: boolean;
  foodVendors: number;
  securityCheckpoints: number;
}

// POST /api/events
interface CreateEventRequest {
  name: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  endTime: string;
  category: string;
  description: string;
  expectedAttendance: number;
  price?: number;
  isFree: boolean;
  image?: string;  // URL or base64
  amenities?: string[];
  parkingAvailable?: boolean;
  wheelchairAccessible?: boolean;
}

// PUT /api/events/:id
// PATCH /api/events/:id/status (change to LIVE/DRAFT/etc.)
// DELETE /api/events/:id
```

### 3. Event Command Center (`EventCommandCenter.tsx`, `EventDashboard.tsx`)

**Features:**
- Real-time event overview dashboard
- Live metrics (attendees, check-ins, volunteers, incidents)
- Crowd density heatmap
- Incident management
- Quick actions (gate control, alerts, dispatch)
- Weather & environmental monitoring
- Operations log

**Key Views:**
1. **Dashboard** - Overview with KPIs and map
2. **Event Overview** - Detailed event information
3. **Event Details** - Configuration and settings
4. **Venue Mapping** - Interactive venue map editor
5. **Teams Setup** - Assign roles and zones
6. **Schedule** - Event timeline & activities
7. **Volunteer Management** - Track and assign volunteers
8. **Analytics Setup** - Configure tracking
9. **Live Monitoring** - Real-time crowd view
10. **Digital Twin** - 3D venue simulation
11. **Gate Control** - Entry/exit management
12. **Alerts & Incidents** - Alert management center
13. **Dispatch Center** - Emergency response
14. **AI Command** - AI-powered operations
15. **Policies** - Automation rules
16. **Intelligence** - Crowd analytics
17. **Post Event** - Analytics and reports

**Backend Requirements:**

```typescript
// GET /api/events/:id/metrics
interface LiveMetrics {
  currentAttendees: number;
  checkIns: number;
  activeVolunteers: number;
  incidentReports: number;
  crowdDensity: number;  // 0-100
  timestamp: number;
  
  // Extended metrics
  peakAttendance?: number;
  averageStayTime?: number;  // minutes
  entryRate?: number;  // people/minute
  exitRate?: number;   // people/minute
}

// GET /api/events/:id/heatmap
interface CrowdHeatmap {
  zones: Array<{
    zoneId: string;
    zoneName: string;
    density: number;  // 0-100
    waitTime: number; // minutes
    coordinates: {
      x: number;
      y: number;
      width?: number;
      height?: number;
    };
    capacity: number;
    currentCount: number;
    status: 'normal' | 'moderate' | 'high' | 'critical';
  }>;
  timestamp: number;
  updateInterval: number;  // seconds
}

// GET /api/events/:id/weather
interface WeatherData {
  temperature: number;  // Celsius
  condition: 'clear' | 'cloudy' | 'rain' | 'storm';
  humidity: number;     // percentage
  windSpeed: number;    // km/h
  forecast: string;
  alerts?: string[];
}

// GET /api/events/:id/operations-log
interface OperationsLog {
  entries: Array<{
    id: string;
    timestamp: number;
    type: 'info' | 'warning' | 'success' | 'error';
    category: string;  // 'security', 'medical', 'system', 'staff'
    message: string;
    userId?: string;
    userName?: string;
  }>;
  page: number;
  totalPages: number;
}
```

### 4. Incident Management (`AlertsIncidentCenter.tsx`, `IncidentDrawer.tsx`)

**Features:**
- Create, view, and manage incidents
- Real-time incident feed
- Severity-based prioritization (low, medium, high, critical)
- Incident types (medical, security, crowd, safety, lost & found)
- Status tracking (open, in progress, resolved)
- Assign incidents to teams
- Add updates and notes
- Filter and search incidents
- Incident analytics

**Backend Requirements:**

```typescript
// GET /api/events/:eventId/incidents
interface IncidentListRequest {
  eventId: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'all';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  type?: 'medical' | 'security' | 'crowd' | 'safety' | 'lost_found';
  page?: number;
  limit?: number;
  sortBy?: 'timestamp' | 'severity';
  sortOrder?: 'asc' | 'desc';
}

interface Incident {
  id: string;
  eventId: string;
  type: 'medical' | 'security' | 'crowd' | 'safety' | 'lost_found';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  
  // Location
  location: string;
  zoneId?: string;
  coordinates: {
    latitude?: number;
    longitude?: number;
    x?: number;  // For venue map coordinates
    y?: number;
  };
  
  // Details
  title: string;
  description: string;
  reportedBy: string;
  reportedById?: string;
  reporterContact?: string;
  
  // Assignment
  assignedTo?: string;
  assignedToId?: string;
  assignedTeam?: string;
  
  // Timestamps
  reportedAt: number;
  acknowledgedAt?: number;
  assignedAt?: number;
  resolvedAt?: number;
  
  // Updates
  updates: Array<{
    id: string;
    timestamp: number;
    message: string;
    updatedBy: string;
    updatedById?: string;
    type: 'status_change' | 'assignment' | 'note' | 'resolution';
  }>;
  
  // Attachments
  attachments?: Array<{
    id: string;
    url: string;
    type: 'image' | 'video' | 'document';
    uploadedAt: number;
  }>;
}

// POST /api/incidents
interface CreateIncidentRequest {
  eventId: string;
  type: 'medical' | 'security' | 'crowd' | 'safety' | 'lost_found';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
    x?: number;
    y?: number;
  };
  zoneId?: string;
  reportedBy: string;
  reporterContact?: string;
}

// PATCH /api/incidents/:id
interface UpdateIncidentRequest {
  status?: 'open' | 'in_progress' | 'resolved';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  assignedToId?: string;
  assignedTeam?: string;
}

// POST /api/incidents/:id/updates
interface AddIncidentUpdateRequest {
  message: string;
  type: 'status_change' | 'assignment' | 'note' | 'resolution';
  updatedBy: string;
}

// WebSocket: /ws/incidents/:eventId
// Real-time incident updates
```

### 5. Volunteer Management (`VolunteerManagement.tsx`)

**Features:**
- View all volunteers
- Track volunteer status (active, on break, offline)
- Assign tasks and zones
- Monitor task completion
- View volunteer location
- Contact volunteers
- Performance ratings

**Backend Requirements:**

```typescript
// GET /api/events/:eventId/volunteers
interface Volunteer {
  id: string;
  eventId: string;
  
  // Personal info
  name: string;
  email?: string;
  phoneNumber: string;
  avatar?: string;
  
  // Assignment
  role: string;
  zone: string;
  team?: string;
  
  // Status
  status: 'active' | 'break' | 'offline';
  currentTask?: string;
  lastLocation: string;
  lastLocationUpdate?: number;
  
  // Performance
  assignedTasks: number;
  completedTasks: number;
  rating: number;  // 0-5
  skills: string[];
  
  // Timestamps
  joinedAt: number;
  checkInTime?: number;
  checkOutTime?: number;
}

// POST /api/volunteers
interface CreateVolunteerRequest {
  eventId: string;
  name: string;
  email?: string;
  phoneNumber: string;
  role: string;
  zone: string;
  skills?: string[];
}

// PATCH /api/volunteers/:id
interface UpdateVolunteerRequest {
  status?: 'active' | 'break' | 'offline';
  zone?: string;
  currentTask?: string;
  lastLocation?: string;
}

// POST /api/volunteers/:id/assign-task
interface AssignTaskRequest {
  taskDescription: string;
  priority: 'low' | 'medium' | 'high';
  estimatedDuration?: number;  // minutes
}

// WebSocket: /ws/volunteers/:eventId
// Real-time volunteer location and status updates
```

### 6. Ticketing System (`MyTickets.tsx`, `TicketPurchase.tsx`)

**Features:**
- Browse user's tickets
- View ticket details (QR code, seat info, entry gate)
- Purchase new tickets
- Cancel/refund tickets
- Ticket status (active, used, expired, cancelled)
- Entry gate recommendations

**Backend Requirements:**

```typescript
// GET /api/users/:userId/tickets
interface Ticket {
  id: string;
  userId: string;
  eventId: string;
  
  // Event info
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  
  // Ticket details
  quantity: number;
  ticketType: string;  // 'general', 'vip', 'early_bird', etc.
  totalPaid: number;
  currency: string;
  
  // Entry
  entryGate: string;
  qrCode: string;
  seatSection?: string;
  seatNumbers?: string[];
  
  // Status
  status: 'active' | 'used' | 'expired' | 'cancelled' | 'refunded';
  
  // Attendees
  attendeeNames?: string[];
  specialRequirements?: string[];
  
  // Timestamps
  purchaseDate: number;
  validFrom?: number;
  validUntil?: number;
  usedAt?: number;
}

// POST /api/tickets/purchase
interface PurchaseTicketRequest {
  eventId: string;
  ticketType: string;
  quantity: number;
  attendeeNames?: string[];
  specialRequirements?: string[];
  paymentMethod: string;
  paymentDetails: any;  // Payment gateway specific
}

interface PurchaseTicketResponse {
  success: boolean;
  ticket: Ticket;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentTransactionId?: string;
}

// POST /api/tickets/:id/cancel
interface CancelTicketRequest {
  reason?: string;
}

// POST /api/tickets/:id/validate
interface ValidateTicketRequest {
  qrCode: string;
  gateId: string;
}

interface ValidateTicketResponse {
  valid: boolean;
  ticket?: Ticket;
  message: string;
  allowEntry: boolean;
}
```

### 7. Attendee Navigation (`NavigationRouting.tsx`, `SmartSafetyMapSystem.tsx`)

**Features:**
- Real-time indoor/outdoor navigation
- Crowd-aware routing (avoid congested areas)
- Accessible routes (wheelchair, elevator access)
- Safety-first routing
- Points of interest (restrooms, food, exits)
- Emergency exit routes
- Live crowd density overlay

**Backend Requirements:**

```typescript
// POST /api/navigation/route
interface NavigationRouteRequest {
  eventId: string;
  from: string | { latitude: number; longitude: number };
  to: string | { latitude: number; longitude: number };
  preferences?: {
    preferAccessible?: boolean;
    avoidCrowds?: boolean;
    fastest?: boolean;
  };
}

interface NavigationRoute {
  id: string;
  from: string;
  to: string;
  
  // Metrics
  distance: number;  // meters
  estimatedTime: number;  // minutes
  crowdLevel: number;  // 0-100
  accessibilityScore: number;  // 0-100
  safetyScore: number;  // 0-100
  
  // Route details
  steps: Array<{
    instruction: string;
    distance: number;
    duration: number;
    direction?: string;
    landmark?: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  }>;
  
  // Features
  hasEscalator: boolean;
  hasElevator: boolean;
  hasRestroom: boolean;
  hasMedicalBay: boolean;
  
  // Alternatives
  alternativeRoutes: number;
  
  // Map data
  polyline: string;  // Encoded polyline for map rendering
}

// GET /api/events/:eventId/pois
interface PointOfInterest {
  id: string;
  name: string;
  type: 'restroom' | 'food' | 'medical' | 'exit' | 'info' | 'parking' | 'stage' | 'other';
  location: {
    latitude: number;
    longitude: number;
  };
  floor?: string;
  description?: string;
  amenities?: string[];
  crowdLevel?: number;
  waitTime?: number;
  isAccessible: boolean;
  isOpen: boolean;
  openingHours?: string;
}

// GET /api/events/:eventId/emergency-exits
interface EmergencyExit {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  capacity: number;
  isAccessible: boolean;
  status: 'open' | 'closed' | 'congested';
  nearestFrom: (fromLocation: { latitude: number; longitude: number }) => number;  // distance in meters
}
```

### 8. AI Platform (`DrishtiXAIPlatform.tsx`)

**Features:**
- AI model management
- Predictive insights
- Crowd forecasting
- Safety risk classification
- Queue time predictions
- Anomaly detection
- Real-time model performance metrics

**Backend Requirements:**

```typescript
// GET /api/ai/models
interface AIModel {
  id: string;
  name: string;
  type: 'regression' | 'classification' | 'time_series' | 'unsupervised';
  status: 'active' | 'training' | 'inactive';
  accuracy: number;  // 0-100
  predictions: number;  // Total predictions made
  lastTrainingDate?: number;
  version: string;
}

// GET /api/ai/insights
interface AIInsight {
  id: string;
  eventId: string;
  category: 'crowd' | 'safety' | 'operations' | 'predictions';
  title: string;
  description: string;
  confidence: number;  // 0-100
  priority: 'low' | 'medium' | 'high';
  timestamp: number;
  
  // Actionable
  actionRequired: boolean;
  suggestedActions?: string[];
  
  // Context
  affectedZones?: string[];
  predictedImpact?: string;
  timeframe?: number;  // minutes until predicted event
}

// POST /api/ai/analyze
interface AnalyzeRequest {
  eventId: string;
  dataPoints: any[];  // Event-specific data
  analysisType: 'crowd_forecast' | 'safety_risk' | 'queue_time' | 'anomaly';
}

interface AnalyzeResponse {
  insights: AIInsight[];
  confidence: number;
  processingTime: number;  // milliseconds
}

// GET /api/ai/predictions/:eventId
interface CrowdPrediction {
  timestamp: number;
  predictedAttendance: number;
  confidence: number;
  zones: Array<{
    zoneId: string;
    zoneName: string;
    predictedDensity: number;  // 0-100
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }>;
  timeHorizon: number;  // minutes ahead
}
```

### 9. Notifications & Alerts (`RealTimeNotifications.tsx`)

**Features:**
- Real-time push notifications
- Alert types (info, warning, success, error, alert)
- Priority levels
- Mark as read/unread
- Clear all notifications
- Action buttons for quick response

**Backend Requirements:**

```typescript
// GET /api/notifications
interface Notification {
  id: string;
  userId: string;
  eventId?: string;
  
  // Content
  type: 'info' | 'warning' | 'success' | 'error' | 'alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  
  // Status
  read: boolean;
  
  // Actions
  actionUrl?: string;
  actionLabel?: string;
  
  // Timestamp
  timestamp: number;
  expiresAt?: number;
}

// PATCH /api/notifications/:id/read
// DELETE /api/notifications/:id
// POST /api/notifications/clear-all

// WebSocket: /ws/notifications/:userId
// Real-time notification delivery

// POST /api/notifications/send (Admin/Organizer only)
interface SendNotificationRequest {
  recipients: string[] | 'all' | 'attendees' | 'volunteers';
  eventId?: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionLabel?: string;
}
```

### 10. Find & Help System (`FindAndHelpSystem.tsx`, `MedicalAssistanceSystem.tsx`)

**Features:**
- Find missing persons within venue
- Request medical assistance
- Share location
- SOS alerts
- Contact emergency services
- Volunteer assistance requests

**Backend Requirements:**

```typescript
// POST /api/help/find-person
interface FindPersonRequest {
  eventId: string;
  requesterId: string;
  personName: string;
  personDescription?: string;
  lastSeenLocation?: string;
  lastSeenTime?: number;
  contactNumber?: string;
  photo?: string;  // base64 or URL
}

interface FindPersonResponse {
  requestId: string;
  status: 'searching' | 'found' | 'not_found';
  estimatedResponseTime: number;  // minutes
  volunteerAssigned?: string;
}

// POST /api/help/medical
interface MedicalAssistanceRequest {
  eventId: string;
  requesterId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  locationDescription: string;
  emergencyType: 'minor' | 'moderate' | 'critical';
  description: string;
  contactNumber: string;
}

interface MedicalAssistanceResponse {
  requestId: string;
  status: 'dispatched' | 'en_route' | 'arrived';
  estimatedArrival: number;  // minutes
  responderName?: string;
  responderContact?: string;
}

// POST /api/help/sos
interface SOSRequest {
  eventId: string;
  userId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  emergency: boolean;
  message?: string;
}

// GET /api/help/requests/:requestId/status
interface HelpRequestStatus {
  requestId: string;
  type: 'find_person' | 'medical' | 'sos' | 'volunteer';
  status: 'open' | 'in_progress' | 'resolved' | 'cancelled';
  assignedTo?: string;
  updates: Array<{
    timestamp: number;
    message: string;
    updatedBy: string;
  }>;
}
```

---

## Real-Time Data Requirements

### WebSocket Connections

The frontend expects real-time updates for the following data:

1. **Live Metrics** (`/ws/metrics/:eventId`)
   - Current attendees count
   - Check-ins
   - Active volunteers
   - Incident reports
   - Crowd density
   - Update frequency: Every 3 seconds

2. **Crowd Heatmap** (`/ws/heatmap/:eventId`)
   - Zone-wise crowd density
   - Wait times
   - Update frequency: Every 5 seconds

3. **Incidents** (`/ws/incidents/:eventId`)
   - New incidents
   - Incident updates
   - Status changes
   - Immediate push

4. **Volunteers** (`/ws/volunteers/:eventId`)
   - Location updates
   - Status changes
   - Task assignments
   - Update frequency: Every 10 seconds

5. **Notifications** (`/ws/notifications/:userId`)
   - Push notifications
   - Immediate delivery

6. **Ticket Scans** (`/ws/tickets/:eventId`)
   - Entry/exit events
   - Gate activity
   - Immediate push

### Server-Sent Events (SSE) Alternative

If WebSockets are not feasible:

```typescript
// SSE endpoints
GET /api/stream/metrics/:eventId
GET /api/stream/heatmap/:eventId
GET /api/stream/incidents/:eventId
GET /api/stream/volunteers/:eventId
GET /api/stream/notifications/:userId
```

---

## Data Models

### Database Schema Recommendations

#### Events Table
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  organizer_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  venue VARCHAR(255),
  location JSONB,  -- {address, city, country, coordinates}
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR(50),  -- DRAFT, SCHEDULED, LIVE, COMPLETED
  category VARCHAR(100),
  description TEXT,
  expected_attendance INT,
  capacity INT,
  image_url TEXT,
  price DECIMAL(10,2),
  is_free BOOLEAN DEFAULT false,
  safety_score INT DEFAULT 0,
  crowd_status VARCHAR(50),
  amenities JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_date ON events(start_time);
```

#### Tickets Table
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  ticket_type VARCHAR(100),
  quantity INT,
  total_paid DECIMAL(10,2),
  qr_code VARCHAR(255) UNIQUE,
  entry_gate VARCHAR(100),
  seat_section VARCHAR(50),
  seat_numbers JSONB,
  status VARCHAR(50),  -- active, used, expired, cancelled, refunded
  purchase_date TIMESTAMP DEFAULT NOW(),
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE UNIQUE INDEX idx_tickets_qr ON tickets(qr_code);
```

#### Incidents Table
```sql
CREATE TABLE incidents (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  type VARCHAR(50),  -- medical, security, crowd, safety, lost_found
  severity VARCHAR(50),  -- low, medium, high, critical
  status VARCHAR(50),  -- open, in_progress, resolved
  title VARCHAR(255),
  description TEXT,
  location VARCHAR(255),
  coordinates JSONB,
  zone_id VARCHAR(100),
  reported_by VARCHAR(255),
  reported_by_id UUID,
  assigned_to VARCHAR(255),
  assigned_to_id UUID,
  assigned_team VARCHAR(100),
  reported_at TIMESTAMP DEFAULT NOW(),
  acknowledged_at TIMESTAMP,
  assigned_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_incidents_event ON incidents(event_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_type ON incidents(type);
```

#### Incident Updates Table
```sql
CREATE TABLE incident_updates (
  id UUID PRIMARY KEY,
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type VARCHAR(50),  -- status_change, assignment, note, resolution
  updated_by VARCHAR(255),
  updated_by_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_incident_updates_incident ON incident_updates(incident_id);
```

#### Volunteers Table
```sql
CREATE TABLE volunteers (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone_number VARCHAR(50),
  role VARCHAR(100),
  zone VARCHAR(100),
  team VARCHAR(100),
  status VARCHAR(50),  -- active, break, offline
  current_task TEXT,
  last_location VARCHAR(255),
  last_location_update TIMESTAMP,
  assigned_tasks INT DEFAULT 0,
  completed_tasks INT DEFAULT 0,
  rating DECIMAL(3,2),
  skills JSONB,
  joined_at TIMESTAMP DEFAULT NOW(),
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_volunteers_event ON volunteers(event_id);
CREATE INDEX idx_volunteers_status ON volunteers(status);
CREATE INDEX idx_volunteers_user ON volunteers(user_id);
```

#### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  type VARCHAR(50),  -- info, warning, success, error, alert
  title VARCHAR(255),
  message TEXT,
  priority VARCHAR(50),  -- low, medium, high
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  action_label VARCHAR(100),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

#### Live Metrics Table (Time-series data)
```sql
CREATE TABLE live_metrics (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  current_attendees INT,
  check_ins INT,
  active_volunteers INT,
  incident_reports INT,
  crowd_density INT,
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_live_metrics_event ON live_metrics(event_id);
CREATE INDEX idx_live_metrics_time ON live_metrics(recorded_at DESC);
```

#### Crowd Heatmap Table (Time-series data)
```sql
CREATE TABLE crowd_heatmap (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  zone_id VARCHAR(100),
  zone_name VARCHAR(255),
  density INT,  -- 0-100
  wait_time INT,  -- minutes
  capacity INT,
  current_count INT,
  status VARCHAR(50),  -- normal, moderate, high, critical
  coordinates JSONB,
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_crowd_heatmap_event ON crowd_heatmap(event_id);
CREATE INDEX idx_crowd_heatmap_zone ON crowd_heatmap(zone_id);
CREATE INDEX idx_crowd_heatmap_time ON crowd_heatmap(recorded_at DESC);
```

---

## Integration Points

### Third-Party Services

1. **Payment Gateway** (for ticket purchases)
   - Stripe, Razorpay, PayPal integration
   - Endpoints: `/api/payments/init`, `/api/payments/confirm`, `/api/payments/refund`

2. **SMS/Email Service** (for notifications)
   - Twilio, SendGrid integration
   - Send OTPs, alerts, confirmations

3. **Maps & Geolocation**
   - Amazon Location Service (already referenced in code)
   - Mapbox (alternative)
   - Indoor positioning system integration

4. **Push Notifications**
   - Amazon SNS Push (Amazon SNS Push)
   - Apple Push Notification Service (APNS)
   - OneSignal integration

5. **AI/ML Services**
   - TensorFlow Serving for crowd prediction models
   - OpenAI GPT for chatbot assistance
   - Computer Vision API for crowd analysis

6. **Weather API**
   - OpenWeatherMap or similar
   - Real-time weather updates for outdoor events

### Frontend Service Integration

```typescript
// Replace mock backend with real API calls
// Example: services/api.ts

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Events API
export const eventsApi = {
  getAll: (params) => apiClient.get('/events', { params }),
  getById: (id) => apiClient.get(`/events/${id}`),
  create: (data) => apiClient.post('/events', data),
  update: (id, data) => apiClient.put(`/events/${id}`, data),
  delete: (id) => apiClient.delete(`/events/${id}`),
  getMetrics: (id) => apiClient.get(`/events/${id}/metrics`),
  getHeatmap: (id) => apiClient.get(`/events/${id}/heatmap`),
};

// Incidents API
export const incidentsApi = {
  getAll: (eventId, params) => apiClient.get(`/events/${eventId}/incidents`, { params }),
  getById: (id) => apiClient.get(`/incidents/${id}`),
  create: (data) => apiClient.post('/incidents', data),
  update: (id, data) => apiClient.patch(`/incidents/${id}`, data),
  addUpdate: (id, data) => apiClient.post(`/incidents/${id}/updates`, data),
  resolve: (id) => apiClient.patch(`/incidents/${id}`, { status: 'resolved' }),
};

// WebSocket connection
export const createWebSocketConnection = (endpoint, handlers) => {
  const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:3000';
  const ws = new WebSocket(`${WS_BASE_URL}${endpoint}`);
  
  ws.onopen = handlers.onOpen || (() => console.log('WebSocket connected'));
  ws.onmessage = handlers.onMessage || ((event) => console.log('Message:', event.data));
  ws.onerror = handlers.onError || ((error) => console.error('WebSocket error:', error));
  ws.onclose = handlers.onClose || (() => console.log('WebSocket closed'));
  
  return ws;
};
```

---

## Implementation Checklist

### Phase 1: Core Backend Setup
- [ ] Set up Node.js/Express or similar backend framework
- [ ] Configure PostgreSQL or similar database
- [ ] Implement JWT authentication
- [ ] Create database migrations for core tables
- [ ] Set up WebSocket server
- [ ] Implement CORS and security headers

### Phase 2: Core APIs
- [ ] Auth APIs (login, register, refresh, logout)
- [ ] Events CRUD APIs
- [ ] Tickets APIs
- [ ] Users APIs
- [ ] Basic real-time metrics endpoint

### Phase 3: Advanced Features
- [ ] Incidents management APIs
- [ ] Volunteers management APIs
- [ ] Notifications system (WebSocket + Push)
- [ ] Navigation & routing APIs
- [ ] Live heatmap generation
- [ ] Weather integration

### Phase 4: AI & Analytics
- [ ] AI insights APIs
- [ ] Crowd prediction models
- [ ] Analytics dashboard data
- [ ] Post-event reports
- [ ] ML model integration

### Phase 5: Optimization & Production
- [ ] API rate limiting
- [ ] Caching layer (Redis)
- [ ] Database query optimization
- [ ] Load testing
- [ ] Monitoring & logging (Sentry, DataDog)
- [ ] CI/CD pipeline
- [ ] Documentation (Swagger/OpenAPI)

---

## Next Steps for Backend Team

1. **Review this document** and frontend code (`drishti-frontend/src/`)
2. **Set up development environment** with database and backend framework
3. **Implement Phase 1** (authentication and core setup)
4. **Create API documentation** using Swagger/OpenAPI
5. **Replace mock data** in frontend with real API calls
6. **Implement WebSocket** connections for real-time features
7. **Deploy staging environment** for testing
8. **Conduct integration testing** with frontend team
9. **Optimize and scale** for production

---

## Contact & Support

For questions or clarifications on frontend requirements:
- Review component code in `drishti-frontend/src/components/`
- Check mock backend for data structure: `drishti-frontend/src/services/mockBackend.ts`
- Refer to this document for API specifications

**Last Updated**: January 2, 2026  
**Document Version**: 2.0
