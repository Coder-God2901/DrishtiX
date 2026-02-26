# EventSphere Workflow Implementation Plan

## Overview

This document provides a comprehensive plan to implement the Organizer and Attendee workflows documented in `ORGANIZER_FLOWCHART.md` and `ATTENDEE_FLOWCHART.md`. It ensures proper role-based access control (RBAC) and step-by-step user journeys.

---

## Current Status Analysis

### ✅ **COMPLETED COMPONENTS**

#### Backend Infrastructure

- [x] User model with `UserRole` enum (ADMIN, ORGANIZER, SECURITY, MEDICAL, LOGISTICS, ATTENDEE, VOLUNTEER, VIEWER)
- [x] Authentication middleware with `authenticate()` and `requireRoles()` functions
- [x] JWT-based auth with MFA support
- [x] 15 backend route files with role-based protection
- [x] Prisma schema with 20+ models (Event, Incident, Alert, Responder, AttendeeReport, etc.)

#### Frontend Infrastructure

- [x] Protected routing with `ProtectedRoute` component
- [x] Auth provider with role checking (`hasRole()`, `hasPermission()`)
- [x] Login page with MFA support
- [x] 38 frontend service files matching backend APIs
- [x] Dashboard layouts (AppLayout, AuthLayout)

---

## ❌ **MISSING COMPONENTS** (Implementation Required)

### 1. **Role Selection & User Onboarding**

#### Problem

- Flowcharts show: `Landing Page → Get Started → Select User Type (Organizer/Attendee)`
- Current implementation: Direct login/register without role selection UI
- Register form has dropdown but only shows: Admin, Coordinator, Security, Medical
- **Missing:** ATTENDEE role option, ORGANIZER explicit labeling

#### Solution

```typescript
// src/pages/auth/Register.tsx - Update role selector
<SelectContent>
  <SelectItem value="ADMIN">Admin</SelectItem>
  <SelectItem value="ORGANIZER">Event Organizer</SelectItem>
  <SelectItem value="ATTENDEE">Attendee/Participant</SelectItem>
  <SelectItem value="SECURITY">Security Personnel</SelectItem>
  <SelectItem value="MEDICAL">Medical Staff</SelectItem>
  <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
</SelectContent>
```

**Files to Create:**

- `src/pages/Landing.tsx` - Public landing page with "Get Started" button
- `src/pages/auth/RoleSelection.tsx` - Role selection before auth

---

### 2. **Attendee Workflow Pages** (Complete Missing Stack)

#### 2.1 Event Joining Methods

**Missing Pages:**

- `src/pages/attendee/JoinEvent.tsx` - Hub for 3 joining methods
- `src/pages/attendee/QRScanner.tsx` - Camera QR scanner
- `src/pages/attendee/EnterCode.tsx` - 6-digit code entry
- `src/pages/attendee/BrowseEvents.tsx` - Event list with filters

**Required Features:**

```typescript
// BrowseEvents filters
- Nearby Events (GPS-based, 50km radius)
- Featured Events
- By Category (Sports, Concerts, Festivals, Corporate, Rallies)
- By Date (Today, This Week, This Month, Custom)
- Search (Name, Venue, Organizer, Location)
```

#### 2.2 Attendee Event Dashboard

**Missing Page:**

- `src/pages/attendee/EventDashboard.tsx` - Main attendee interface

**Required 5 Core Features:**

1. **Live Venue Map**
   - Current location pin (blue dot)
   - Crowd heatmap overlay
   - 10+ POI types (Gates, Stages, Restrooms, Food, First Aid, etc.)
   - Offline map caching

2. **Event Schedule**
   - Timeline view with stage filtering
   - Artist/performer details
   - Set reminders (push notifications)
   - Live updates on schedule changes

3. **Navigation System**
   - Turn-by-turn directions
   - Crowd-aware routing (avoid red zones)
   - ETA calculation
   - Voice guidance (optional)
   - Real-time recalculation (every 30s)

4. **Alerts & Notifications**
   - 4 severity levels (Critical, High, Medium, Low)
   - Push notifications + In-app alerts
   - Route change suggestions
   - Safety instructions

5. **SOS Emergency Button**
   - Long-press 3 seconds to activate
   - 6 issue types (Medical, Safety Threat, Lost Person, Fire, Crowd Crush, Other)
   - Auto-location sharing
   - Responder tracking with ETA
   - Live communication channel

#### 2.3 Post-Event Flow

**Missing Pages:**

- `src/pages/attendee/Feedback.tsx` - Feedback submission form

**Required Features:**

```typescript
// Feedback categories
1. Overall Experience (1-5 stars)
2. Safety & Security (Yes/No/Somewhat)
3. Navigation & App (Map accuracy, route helpfulness)
4. Venue Facilities (Cleanliness, quality)
5. Event Management (Organization, schedule adherence)
6. Recommendations (Would attend again? Would recommend?)
```

---

### 3. **Organizer Workflow Enhancements**

#### 3.1 Event Creation Wizard (7 Steps)

**Current Status:** EventCreator.tsx exists but doesn't implement full wizard flow

**Required 7-Step Wizard:**

```typescript
// src/pages/organizer/EventWizard.tsx
Step 1: Event Basics
  - Name, Date/Time, Type, Description, Expected Attendees

Step 2: Venue Mapping
  - Upload venue blueprint/satellite image
  - Draw zone boundaries
  - Mark entry/exit points
  - Define restricted areas

Step 3: Zone Capacity Setup
  - Per-zone capacity limits
  - Gate throughput rates
  - Maximum occupancy alerts

Step 4: Event Schedule
  - Performance schedule
  - Stage timings
  - Break periods
  - Security briefing times

Step 5: Data Sources
  - CCTV integration (RTSP/HTTP)
  - Drone video streams
  - Mobile app GPS tracking
  - WiFi/Bluetooth sensors

Step 6: Select ML Mode
  - Sports Event (Player tracking, surge detection)
  - Concert (Mosh pit, stage rush prevention)
  - Rally/Protest (Panic detection, bottleneck alerts)
  - Generic (Standard crowd analytics)

Step 7: Review & Publish
  - Review all settings
  - Verify configurations
  - Generate Event Code & QR
```

#### 3.2 Live Monitoring Dashboard

**Current Status:** Dashboard.tsx exists but doesn't show all 6 features

**Required 6 Monitoring Features:**

```typescript
// src/pages/organizer/LiveMonitoring.tsx
1. Live Heatmap
   - Real-time density visualization
   - Color-coded zones (Green → Yellow → Orange → Red)
   - People count overlays
   - 5-second refresh rate

2. Crowd Forecast Panel
   - 5, 10, 15, 30-minute predictions
   - Risk level indicators
   - Hotspot warnings
   - Trend graphs

3. Alert Management
   - Alert priority queue
   - One-click acknowledgment
   - Team dispatch interface
   - Alert history log

4. Route Management
   - Current route status
   - Congestion visualization
   - Quick route modification tools
   - User navigation updates

5. Staff Tracking
   - Security team GPS locations
   - Medical team availability
   - Response team status
   - ETA calculations

6. Communication Hub
   - Zone-specific broadcasting
   - Emergency announcements
   - Push notification center
   - SMS alert triggers
```

#### 3.3 Alert Response Workflow

**Missing Pages:**

- `src/pages/organizer/AlertResponse.tsx` - Alert triage and response

**Required Workflow:**

```typescript
// Alert severity handling
Critical → Dispatch Security/Medical Team
High → Apply Route Change
Medium → Broadcast Warning
Low → Continue Monitoring

// Route Change Propagation
1. Mark Route as Blocked
2. Calculate Alternative Routes
3. Push Notifications to Affected Users
4. Update Navigation Maps
5. Monitor Crowd Redistribution
```

#### 3.4 Pre-Event Simulation

**Current Status:** DigitalTwin.tsx exists

**Enhancement Needed:**

```typescript
// src/pages/organizer/PreEventSimulation.tsx
- Run Digital Twin Simulation
- View Simulation Results (Predicted Hotspots, Bottleneck Warnings, Capacity Issues)
- Make Adjustments (Gate Timings, Staff Placement, Route Changes, Capacity Limits)
- Iterate until satisfied
- Mark Event as Ready
```

---

## Implementation Roadmap

### **Phase 1: Core Infrastructure** (Week 1)

#### 1.1 Update Prisma Schema

```prisma
// Ensure UserRole enum includes all roles
enum UserRole {
  ADMIN
  ORGANIZER
  SECURITY
  MEDICAL
  LOGISTICS
  ATTENDEE
  VOLUNTEER
  VIEWER
}

// Add EventRegistration model for attendee check-ins
model EventRegistration {
  id              String   @id @default(uuid())
  eventId         String
  attendeeId      String

  registeredAt    DateTime @default(now())
  checkedInAt     DateTime?
  checkedOutAt    DateTime?

  ticketVerified  Boolean @default(false)
  feedbackSubmitted Boolean @default(false)

  @@unique([eventId, attendeeId])
  @@index([eventId])
  @@index([attendeeId])
}
```

Run:

```bash
npx prisma migrate dev --name add_event_registration
npx prisma generate
```

#### 1.2 Update Backend Routes with RBAC

**Review all routes to ensure proper role enforcement:**

```typescript
// server/routes/attendee.routes.ts (CREATE THIS)
import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

const router = Router();

// Attendee-only routes
router.post('/events/:eventId/join', authenticate, requireRoles(['ATTENDEE']), joinEvent);
router.post('/events/:eventId/checkin', authenticate, requireRoles(['ATTENDEE']), checkIn);
router.post('/sos', authenticate, requireRoles(['ATTENDEE']), triggerSOS);
router.post('/feedback', authenticate, requireRoles(['ATTENDEE']), submitFeedback);

export default router;
```

**Update existing routes:**

```typescript
// Organizer-only routes (CREATE, EDIT, DELETE events)
requireRoles(['ADMIN', 'ORGANIZER']);

// Attendee read-only access (VIEW events, JOIN events)
requireRoles(['ATTENDEE', 'ORGANIZER', 'ADMIN']);

// Security/Medical/Staff routes
requireRoles(['ADMIN', 'SECURITY', 'MEDICAL']);
```

#### 1.3 Frontend Route Configuration

```typescript
// src/routes/index.tsx - Add attendee routes
{
  path: '/attendee',
  element: (
    <ProtectedRoute requireRoles={['ATTENDEE']}>
      <AttendeeLayout />
    </ProtectedRoute>
  ),
  children: [
    { path: 'events', element: <BrowseEvents /> },
    { path: 'events/:eventId', element: <EventDashboard /> },
    { path: 'join', element: <JoinEvent /> },
    { path: 'qr-scanner', element: <QRScanner /> },
    { path: 'feedback', element: <Feedback /> },
  ],
},
{
  path: '/organizer',
  element: (
    <ProtectedRoute requireRoles={['ADMIN', 'ORGANIZER']}>
      <OrganizerLayout />
    </ProtectedRoute>
  ),
  children: [
    { path: 'events/create', element: <EventWizard /> },
    { path: 'events/:eventId/live', element: <LiveMonitoring /> },
    { path: 'events/:eventId/alerts', element: <AlertResponse /> },
    { path: 'simulation', element: <PreEventSimulation /> },
  ],
}
```

---

### **Phase 2: Attendee Workflow** (Week 2-3)

#### 2.1 Create Attendee Pages (Priority Order)

1. **Landing & Role Selection**
   - File: `src/pages/Landing.tsx`
   - File: `src/pages/auth/RoleSelection.tsx`
   - Update: `src/pages/auth/Register.tsx` (add ATTENDEE role)

2. **Event Joining**
   - File: `src/pages/attendee/JoinEvent.tsx`
   - File: `src/pages/attendee/QRScanner.tsx` (use `react-qr-scanner`)
   - File: `src/pages/attendee/EnterCode.tsx`
   - File: `src/pages/attendee/BrowseEvents.tsx`

3. **Attendee Dashboard**
   - File: `src/pages/attendee/EventDashboard.tsx`
   - Components:
     - `src/components/attendee/LiveVenueMap.tsx`
     - `src/components/attendee/EventSchedule.tsx`
     - `src/components/attendee/Navigation.tsx`
     - `src/components/attendee/AlertsPanel.tsx`
     - `src/components/attendee/SOSButton.tsx`

4. **Post-Event**
   - File: `src/pages/attendee/Feedback.tsx`

#### 2.2 Backend API Endpoints for Attendees

```typescript
// server/routes/attendee.routes.ts (CREATE)
POST   /api/attendee/events/:eventId/join         // Join event (QR/Code/Browse)
POST   /api/attendee/events/:eventId/checkin      // Check-in
GET    /api/attendee/events/:eventId/venue-map    // Get venue map
GET    /api/attendee/events/:eventId/schedule     // Get event schedule
POST   /api/attendee/events/:eventId/navigate     // Get navigation route
GET    /api/attendee/events/:eventId/alerts       // Get alerts for attendee
POST   /api/attendee/sos                          // Trigger SOS
PUT    /api/attendee/sos/:sosId/status            // Update SOS status
POST   /api/attendee/events/:eventId/feedback     // Submit feedback
POST   /api/attendee/events/:eventId/checkout     // Auto checkout
```

---

### **Phase 3: Organizer Workflow** (Week 4-5)

#### 3.1 Event Creation Wizard

**File Structure:**

```
src/pages/organizer/
  EventWizard.tsx                 // Main wizard container
  wizard-steps/
    Step1EventBasics.tsx
    Step2VenueMapping.tsx
    Step3ZoneCapacity.tsx
    Step4EventSchedule.tsx
    Step5DataSources.tsx
    Step6SelectMLMode.tsx
    Step7ReviewPublish.tsx
```

**Wizard State Management:**

```typescript
// Use React Context or Zustand for wizard state
interface WizardState {
  step: number;
  eventData: {
    basics: EventBasics;
    venue: VenueMapping;
    zones: ZoneCapacity[];
    schedule: EventSchedule[];
    dataSources: DataSource[];
    mlMode: MLMode;
  };
  validation: {
    step1Valid: boolean;
    step2Valid: boolean;
    // ... all steps
  };
}
```

#### 3.2 Live Monitoring Dashboard

**File: `src/pages/organizer/LiveMonitoring.tsx`**

**Layout:**

```
+------------------------------------------+
| Event Name | Status: LIVE | Attendees: 8,452 |
+------------------------------------------+
| Live Heatmap (40%)    | Crowd Forecast (30%) |
|                       |                       |
+------------------------------------------+
| Alert Queue (30%)                            |
+------------------------------------------+
| Route Status | Staff Tracking | Messaging   |
+------------------------------------------+
```

**Components:**

```
src/components/organizer/live-monitoring/
  LiveHeatmapPanel.tsx
  CrowdForecastPanel.tsx
  AlertQueuePanel.tsx
  RouteManagementPanel.tsx
  StaffTrackingPanel.tsx
  CommunicationHub.tsx
```

#### 3.3 Alert Response System

**File: `src/pages/organizer/AlertResponse.tsx`**

**Workflow Implementation:**

```typescript
interface AlertResponseFlow {
  alert: Alert;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

  // Actions based on severity
  dispatchTeam?: {
    responders: Responder[];
    eta: number;
    status: 'DISPATCHED' | 'RESPONDING' | 'ON_SCENE';
  };

  routeChange?: {
    blockedRoutes: string[];
    alternativeRoutes: Route[];
    affectedUsers: number;
  };

  broadcast?: {
    message: string;
    zones: string[];
    recipientCount: number;
  };
}
```

---

### **Phase 4: Advanced Features** (Week 6-7)

#### 4.1 Real-time Features

**WebSocket Integration:**

```typescript
// server/services/websocket.service.ts
- Live heatmap updates (5-second intervals)
- Alert notifications (instant)
- Crowd forecast updates (30-second intervals)
- Staff location tracking (real-time)
- SOS alerts (instant)
```

#### 4.2 Offline Support

**Service Worker Configuration:**

```typescript
// public/service-worker.ts
- Cache venue maps for offline access
- Queue SOS triggers when offline
- Sync when connection restored
- Cache event schedule
```

#### 4.3 Push Notifications

```typescript
// server/services/notification.service.ts
- Amazon SNS Push (Amazon SNS Push) integration
- Web Push API for browsers
- Zone-specific targeting
- Priority-based delivery
```

---

## Testing Checklist

### Organizer Workflow Testing

- [ ] **Landing → Role Selection → Organizer Login/Signup**
- [ ] **Create Event: Complete 7-step wizard**
- [ ] **Publish Event: Generate QR code & 6-digit code**
- [ ] **Run Pre-Event Simulation**
- [ ] **Adjust Settings Based on Simulation**
- [ ] **Mark Event as Ready**
- [ ] **Live Monitoring: View all 6 panels**
- [ ] **Receive Alert: Acknowledge and respond**
- [ ] **Dispatch Team: Track ETA and status**
- [ ] **Apply Route Change: Push to attendees**
- [ ] **Broadcast Message: Send to specific zones**
- [ ] **Post-Event: Auto-generate report**

### Attendee Workflow Testing

- [ ] **Landing → Role Selection → Attendee Login/Signup**
- [ ] **Join Event via QR Code**
- [ ] **Join Event via 6-Digit Code**
- [ ] **Browse Events: Apply filters**
- [ ] **Register for Event**
- [ ] **Check-in: Verify ticket (if required)**
- [ ] **Grant Permissions: Location + Notifications**
- [ ] **View Live Venue Map: See heatmap + POIs**
- [ ] **View Event Schedule: Set reminders**
- [ ] **Navigate to Destination: Turn-by-turn directions**
- [ ] **Receive Alert: View details and accept route change**
- [ ] **Trigger SOS: Select issue type, auto-share location**
- [ ] **Track Responder: See ETA and status**
- [ ] **Resolve SOS: Mark as resolved**
- [ ] **Auto Checkout: When event ends**
- [ ] **Submit Feedback: Complete all 6 categories**

### RBAC Testing

- [ ] **ORGANIZER cannot access ADMIN system settings**
- [ ] **ATTENDEE cannot create/edit events**
- [ ] **ATTENDEE cannot dispatch teams**
- [ ] **ATTENDEE cannot broadcast messages**
- [ ] **ORGANIZER can only access own events (not other organizers')**
- [ ] **SECURITY can view events but not modify**
- [ ] **All routes enforce proper role requirements**

---

## Technical Dependencies

### New NPM Packages Required

```json
{
  "dependencies": {
    "react-qr-scanner": "^1.0.0", // QR code scanning
    "qrcode": "^1.5.3", // QR code generation
    "socket.io-client": "^4.6.0", // Real-time WebSocket
    "Amazon Cognito+S3": "^10.7.0", // Push notifications (Amazon SNS Push)
    "leaflet": "^1.9.4", // Interactive maps
    "react-leaflet": "^4.2.1", // React wrapper for Leaflet
    "date-fns": "^3.0.0", // Date formatting
    "react-big-calendar": "^1.8.5", // Event schedule calendar
    "workbox-webpack-plugin": "^7.0.0" // Service worker (offline support)
  }
}
```

### Backend Packages

```json
{
  "dependencies": {
    "socket.io": "^4.6.0", // WebSocket server
    "Amazon Cognito+S3-admin": "^12.0.0", // Amazon SNS Push push notifications
    "qrcode": "^1.5.3", // QR generation
    "nanoid": "^5.0.0" // Event code generation
  }
}
```

---

## Database Migrations Required

```prisma
// Add to schema.prisma

model EventRegistration {
  id              String   @id @default(uuid())
  eventId         String
  attendeeId      String

  registeredAt    DateTime @default(now())
  checkedInAt     DateTime?
  checkedOutAt    DateTime?

  ticketVerified  Boolean @default(false)
  feedbackSubmitted Boolean @default(false)

  @@unique([eventId, attendeeId])
}

model EventFeedback {
  id              String   @id @default(uuid())
  eventId         String
  attendeeId      String

  overallRating   Int       // 1-5 stars
  safetyRating    Int       // 1-5 stars
  navigationRating Int      // 1-5 stars
  facilitiesRating Int      // 1-5 stars
  managementRating Int      // 1-5 stars

  wouldAttendAgain Boolean
  wouldRecommend  Boolean

  comments        String?
  suggestions     String?

  createdAt       DateTime @default(now())

  @@unique([eventId, attendeeId])
}

model SOSRequest {
  id              String   @id @default(uuid())
  eventId         String
  attendeeId      String

  issueType       SOSIssueType
  description     String
  location        Json

  status          SOSStatus @default(PENDING)
  priority        Int @default(1)

  assignedResponders String[]
  dispatchedAt    DateTime?
  acknowledgedAt  DateTime?
  resolvedAt      DateTime?

  eta             Int?

  createdAt       DateTime @default(now())

  @@index([eventId, status])
  @@index([attendeeId])
}

enum SOSIssueType {
  MEDICAL_EMERGENCY
  SAFETY_THREAT
  LOST_PERSON
  FIRE_HAZARD
  CROWD_CRUSH
  OTHER_EMERGENCY
}

enum SOSStatus {
  PENDING
  ACKNOWLEDGED
  DISPATCHED
  RESPONDING
  RESOLVED
  DISMISSED
}
```

---

## Performance Considerations

### Real-time Updates Optimization

```typescript
// Throttle heatmap updates: 5 seconds
// Throttle crowd forecast: 30 seconds
// Instant: Alerts, SOS
// Batching: Staff location updates (every 10 seconds)
```

### Scalability

```typescript
// Use Redis for WebSocket Amazon SQS + SNS
// Implement rate limiting on API endpoints
// Paginate event lists (50 per page)
// Lazy load map tiles
// Compress venue maps for faster download
```

---

## Security Checklist

- [ ] All routes protected with `authenticate` middleware
- [ ] Role-based access enforced with `requireRoles`
- [ ] Event access restricted to registered attendees
- [ ] Organizers can only modify their own events
- [ ] SOS requests anonymized in database (no PII exposure)
- [ ] Location data encrypted in transit and at rest
- [ ] API rate limiting enabled (100 req/min per user)
- [ ] Input validation on all forms
- [ ] XSS protection in user-generated content
- [ ] CSRF tokens on state-changing operations

---

## Documentation Updates

After implementation, update:

1. **README.md** - Add workflow diagrams
2. **API_DOCUMENTATION.md** - Document all new endpoints
3. **USER_GUIDE.md** - Step-by-step user instructions
4. **DEPLOYMENT_GUIDE.md** - Environment variables and setup

---

## Success Metrics

### Organizer Workflow

- ✅ Event creation completion rate > 90%
- ✅ Average wizard completion time < 15 minutes
- ✅ Alert response time < 2 minutes
- ✅ Pre-event simulation adoption > 80%

### Attendee Workflow

- ✅ Event joining success rate > 95%
- ✅ SOS response time < 5 minutes
- ✅ Feedback submission rate > 60%
- ✅ Navigation accuracy > 90%

---

## Next Steps

1. **Review and approve this plan**
2. **Assign tasks to development team**
3. **Set up project tracking (Jira/Linear/GitHub Projects)**
4. **Begin Phase 1: Core Infrastructure**
5. **Weekly demos to stakeholders**
6. **User testing after Phase 2 & 3**
7. **Production deployment after Phase 4**

---

**Timeline:** 7 weeks for full implementation
**Team Size:** 3-4 developers recommended
**Priority:** High - Core platform functionality
