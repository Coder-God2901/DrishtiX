# DrishtiX Platform - Complete API Reference (v2.0)

> **Updated for Finalized Frontend UI/UX** - January 2, 2026  
> **Frontend Version**: 2.0 (Stakeholder Approved)  
> **Backend Version**: To Be Implemented

## 📋 Table of Contents

1. [Base Configuration](#base-configuration)
2. [Authentication](#authentication)
3. [Events Management](#events-management)
4. [Tickets & Purchases](#tickets--purchases)
5. [Incidents Management](#incidents-management)
6. [Volunteers Management](#volunteers-management)
7. [Notifications](#notifications)
8. [Navigation & Routing](#navigation--routing)
9. [Live Metrics & Monitoring](#live-metrics--monitoring)
10. [AI & Analytics](#ai--analytics)
11. [Help & Assistance](#help--assistance)
12. [WebSocket Events](#websocket-events)
13. [Error Handling](#error-handling)

---

## Base Configuration

### Base URLs

```
Development: http://localhost:3000/api
Production: https://api.drishtix.com/v1
WebSocket: ws://localhost:3000 (dev) | wss://ws.drishtix.com (prod)
```

### Request Headers

```http
Content-Type: application/json
Authorization: Bearer {jwt_token}
X-Client-Version: 2.0
X-Platform: web | ios | android
```

### Response Format

All API responses follow this structure:

```typescript
{
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: number;
    requestId: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

---

## Authentication

### POST `/api/auth/register`

Register new user

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phoneNumber": "+1234567890",
  "role": "attendee" | "organizer"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "usr_123abc",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "attendee",
      "avatar": "https://cdn.drishtix.com/avatars/default.jpg",
      "phoneNumber": "+1234567890",
      "emailVerified": false,
      "createdAt": 1704297600000
    },
    "expiresIn": 3600
  }
}
```

### POST `/api/auth/login`

User login

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "attendee" | "organizer"
}
```

**Response:** Same as register

### POST `/api/auth/refresh`

Refresh JWT token

**Request:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "expiresIn": 3600
  }
}
```

### POST `/api/auth/logout`

Logout user

**Request:**
```json
{
  "token": "current_jwt_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### POST `/api/auth/verify-email`

Verify email with token

**Request:**
```json
{
  "token": "email_verification_token"
}
```

### POST `/api/auth/forgot-password`

Request password reset

**Request:**
```json
{
  "email": "john@example.com"
}
```

### POST `/api/auth/reset-password`

Reset password with token

**Request:**
```json
{
  "token": "reset_token",
  "newPassword": "NewSecurePass123!"
}
```

---

## Events Management

### GET `/api/events`

List all events with filtering and pagination

**Query Parameters:**
```
page: number (default: 1)
limit: number (default: 20, max: 100)
status: 'LIVE' | 'SCHEDULED' | 'DRAFT' | 'COMPLETED' | 'ALL' (default: 'ALL')
category: string (e.g., 'Music', 'Sports', 'Technology')
searchQuery: string (searches name, location, venue)
userId: string (for organizer's events)
sortBy: 'date' | 'popularity' | 'safetyScore' | 'name' (default: 'date')
sortOrder: 'asc' | 'desc' (default: 'asc')
minPrice: number
maxPrice: number
isFree: boolean
location: string (city or region)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "evt_123abc",
        "name": "Summer Music Festival 2025",
        "image": "https://cdn.drishtix.com/events/festival.jpg",
        "location": "Central Arena, New York",
        "venue": "Central Arena",
        "date": "2025-06-20T18:00:00Z",
        "time": "6:00 PM",
        "endTime": "11:00 PM",
        "status": "SCHEDULED",
        "category": "Music",
        "description": "Experience electrifying performances...",
        "expectedAttendance": 10000,
        "currentAttendance": 0,
        "capacity": "10,000",
        "crowdStatus": "calm",
        "safetyScore": 94,
        "price": 499.00,
        "currency": "USD",
        "isFree": false,
        "organizerId": "usr_456def",
        "hostName": "MegaEvents Productions",
        "bestGate": "Gate B",
        "queueTime": 0,
        "averageRating": 4.7,
        "totalReviews": 1234,
        "amenities": ["WiFi", "Food Court", "Medical Bay", "VIP Lounge", "Parking"],
        "parkingAvailable": true,
        "wheelchairAccessible": true,
        "foodVendors": 15,
        "securityCheckpoints": 8,
        "createdAt": 1704297600000,
        "updatedAt": 1704297600000
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### GET `/api/events/:id`

Get detailed event information

**Response:**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "evt_123abc",
      "name": "Summer Music Festival 2025",
      // ... all fields from list response
      "detailedDescription": "Full HTML description...",
      "schedule": [
        {
          "time": "18:00",
          "title": "Gates Open",
          "description": "Entry begins at Gate B"
        }
      ],
      "lineup": [
        {
          "name": "Artist Name",
          "time": "19:00",
          "stage": "Main Stage"
        }
      ],
      "venueMap": {
        "imageUrl": "https://cdn.drishtix.com/venues/map.png",
        "zones": [
          {
            "id": "zone_1",
            "name": "Main Stage",
            "capacity": 5000,
            "coordinates": { "x": 500, "y": 200, "width": 200, "height": 150 }
          }
        ]
      },
      "policies": {
        "refundPolicy": "Full refund up to 48 hours before event",
        "ageRestriction": "18+",
        "prohibited": ["Outside food", "Professional cameras"]
      }
    }
  }
}
```

### POST `/api/events`

Create new event (Organizer only)

**Request:**
```json
{
  "name": "Tech Conference 2025",
  "venue": "Convention Center",
  "location": "San Francisco, CA",
  "address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "country": "USA",
    "zipCode": "94102"
  },
  "coordinates": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "date": "2025-11-15T09:00:00Z",
  "time": "9:00 AM",
  "endTime": "6:00 PM",
  "category": "Technology",
  "description": "Discover cutting-edge innovations...",
  "expectedAttendance": 3000,
  "capacity": 3500,
  "price": 0,
  "currency": "USD",
  "isFree": true,
  "image": "https://cdn.drishtix.com/events/tech-conf.jpg",
  "amenities": ["WiFi", "Coffee Bar", "Exhibition Hall"],
  "parkingAvailable": true,
  "wheelchairAccessible": true,
  "ticketTypes": [
    {
      "name": "General Admission",
      "price": 0,
      "quantity": 3000,
      "description": "Standard entry"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "evt_789ghi",
      // ... created event data
      "status": "DRAFT"
    }
  }
}
```

### PUT `/api/events/:id`

Update event (Organizer only, own events)

**Request:** Same as create, all fields optional

### PATCH `/api/events/:id/status`

Change event status

**Request:**
```json
{
  "status": "LIVE" | "SCHEDULED" | "DRAFT" | "COMPLETED" | "CANCELLED"
}
```

### DELETE `/api/events/:id`

Delete event (Organizer only, own events)

### GET `/api/events/:id/metrics`

Get real-time event metrics

**Response:**
```json
{
  "success": true,
  "data": {
    "currentAttendees": 3245,
    "checkIns": 3180,
    "checkOuts": 135,
    "activeVolunteers": 48,
    "incidentReports": 7,
    "crowdDensity": 67,
    "peakAttendance": 3500,
    "averageStayTime": 145,
    "entryRate": 15,
    "exitRate": 3,
    "timestamp": 1704297600000,
    "lastUpdated": 1704297600000
  }
}
```

### GET `/api/events/:id/heatmap`

Get crowd density heatmap

**Response:**
```json
{
  "success": true,
  "data": {
    "zones": [
      {
        "zoneId": "zone_1",
        "zoneName": "Main Stage",
        "density": 85,
        "waitTime": 12,
        "capacity": 5000,
        "currentCount": 4250,
        "status": "high",
        "coordinates": {
          "x": 500,
          "y": 200,
          "width": 200,
          "height": 150
        }
      }
    ],
    "timestamp": 1704297600000,
    "updateInterval": 5
  }
}
```

### GET `/api/events/:id/weather`

Get weather data for event location

**Response:**
```json
{
  "success": true,
  "data": {
    "temperature": 24.5,
    "condition": "clear",
    "humidity": 65,
    "windSpeed": 8.5,
    "forecast": "Clear skies throughout the evening",
    "alerts": [],
    "timestamp": 1704297600000
  }
}
```

### GET `/api/events/:id/operations-log`

Get operations log

**Query Parameters:**
```
page: number (default: 1)
limit: number (default: 50)
type: 'info' | 'warning' | 'success' | 'error'
category: 'security' | 'medical' | 'system' | 'staff'
startDate: timestamp
endDate: timestamp
```

**Response:**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "log_123",
        "timestamp": 1704297600000,
        "type": "info",
        "category": "security",
        "message": "Security checkpoint opened at Gate B",
        "userId": "usr_456",
        "userName": "John Security"
      }
    ]
  },
  "meta": {
    "pagination": { /* ... */ }
  }
}
```

### GET `/api/public/stats`

Get platform statistics (no auth required)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEvents": 50234,
    "totalAttendees": 2456789,
    "safetyScore": 99.8,
    "uptime": 99.95,
    "activeEvents": 45,
    "countries": 52
  }
}
```

### GET `/api/public/featured-events`

Get featured events (no auth required)

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      // ... array of featured event objects
    ]
  }
}
```

---

## Tickets & Purchases

### GET `/api/users/:userId/tickets`

Get user's tickets

**Query Parameters:**
```
status: 'active' | 'used' | 'expired' | 'cancelled' | 'refunded' | 'all'
eventId: string
sortBy: 'purchaseDate' | 'eventDate'
sortOrder: 'asc' | 'desc'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "tkt_123abc",
        "userId": "usr_456def",
        "eventId": "evt_789ghi",
        "eventName": "Summer Music Festival",
        "eventDate": "2025-06-20T18:00:00Z",
        "eventTime": "6:00 PM",
        "venue": "Central Arena",
        "ticketType": "VIP",
        "quantity": 2,
        "totalPaid": 998.00,
        "currency": "USD",
        "entryGate": "Gate B",
        "qrCode": "SMF-2025-AB123XY",
        "seatSection": "VIP Section A",
        "seatNumbers": ["A-15", "A-16"],
        "status": "active",
        "attendeeNames": ["Rahul Kumar", "Priya Sharma"],
        "specialRequirements": ["Wheelchair Access"],
        "purchaseDate": 1704297600000,
        "validFrom": 1704297600000,
        "validUntil": 1704384000000,
        "usedAt": null
      }
    ]
  }
}
```

### GET `/api/tickets/:id`

Get ticket details

### POST `/api/tickets/purchase`

Purchase tickets

**Request:**
```json
{
  "eventId": "evt_789ghi",
  "ticketType": "VIP",
  "quantity": 2,
  "attendeeNames": ["John Doe", "Jane Doe"],
  "specialRequirements": ["Vegetarian meal", "Wheelchair access"],
  "paymentMethod": "card",
  "paymentDetails": {
    "cardToken": "tok_123abc",
    "saveCard": true
  },
  "promoCode": "EARLY20"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "tkt_new123",
      // ... ticket details
    },
    "paymentStatus": "completed",
    "paymentTransactionId": "pay_456def",
    "totalCharged": 798.40,
    "discount": 199.60,
    "receipt": {
      "url": "https://cdn.drishtix.com/receipts/123.pdf",
      "emailSent": true
    }
  }
}
```

### POST `/api/tickets/:id/cancel`

Cancel ticket

**Request:**
```json
{
  "reason": "Cannot attend due to personal reasons"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "tkt_123abc",
      "status": "cancelled"
    },
    "refund": {
      "amount": 798.40,
      "status": "processing",
      "estimatedDays": 5,
      "refundId": "ref_789ghi"
    }
  }
}
```

### POST `/api/tickets/:id/validate`

Validate ticket at gate

**Request:**
```json
{
  "qrCode": "SMF-2025-AB123XY",
  "gateId": "gate_b_01",
  "scanType": "entry" | "exit"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "ticket": {
      // ... ticket details
    },
    "allowEntry": true,
    "message": "Valid ticket. Entry granted.",
    "warnings": [],
    "timestamp": 1704297600000
  }
}
```

### POST `/api/tickets/:id/transfer`

Transfer ticket to another user

**Request:**
```json
{
  "recipientEmail": "newuser@example.com",
  "recipientName": "New User"
}
```

---

## Incidents Management

### GET `/api/events/:eventId/incidents`

List incidents for an event

**Query Parameters:**
```
status: 'open' | 'in_progress' | 'resolved' | 'all'
severity: 'low' | 'medium' | 'high' | 'critical'
type: 'medical' | 'security' | 'crowd' | 'safety' | 'lost_found'
assignedTo: userId
page: number
limit: number
sortBy: 'timestamp' | 'severity'
sortOrder: 'asc' | 'desc'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "incidents": [
      {
        "id": "inc_123abc",
        "eventId": "evt_789ghi",
        "type": "medical",
        "severity": "medium",
        "status": "in_progress",
        "title": "Medical Assistance Required",
        "description": "Attendee feeling dizzy, requires medical attention",
        "location": "Section C - Food Court",
        "zoneId": "zone_3",
        "coordinates": {
          "latitude": 37.7749,
          "longitude": -122.4194,
          "x": 450,
          "y": 320
        },
        "reportedBy": "Volunteer #24",
        "reportedById": "usr_vol24",
        "reporterContact": "+1234567890",
        "assignedTo": "Medical Team Alpha",
        "assignedToId": "team_med_alpha",
        "assignedTeam": "Medical",
        "reportedAt": 1704297600000,
        "acknowledgedAt": 1704297660000,
        "assignedAt": 1704297700000,
        "resolvedAt": null,
        "estimatedResolutionTime": 1704298200000,
        "updates": [
          {
            "id": "upd_1",
            "timestamp": 1704297660000,
            "message": "Medical team dispatched",
            "updatedBy": "System",
            "updatedById": "system",
            "type": "status_change"
          },
          {
            "id": "upd_2",
            "timestamp": 1704297900000,
            "message": "Patient being assessed, vitals stable",
            "updatedBy": "Dr. Mehta",
            "updatedById": "usr_mehta",
            "type": "note"
          }
        ],
        "attachments": [],
        "priority": "high"
      }
    ],
    "statistics": {
      "total": 45,
      "open": 8,
      "inProgress": 5,
      "resolved": 32,
      "critical": 2,
      "high": 6,
      "medium": 15,
      "low": 22
    }
  },
  "meta": {
    "pagination": { /* ... */ }
  }
}
```

### GET `/api/incidents/:id`

Get incident details

### POST `/api/incidents`

Create new incident

**Request:**
```json
{
  "eventId": "evt_789ghi",
  "type": "medical",
  "severity": "high",
  "title": "Medical Emergency",
  "description": "Person collapsed near stage",
  "location": "Main Stage - Front Section",
  "coordinates": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "x": 500,
    "y": 200
  },
  "zoneId": "zone_1",
  "reportedBy": "John Attendee",
  "reporterContact": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "incident": {
      "id": "inc_new789",
      // ... created incident data
      "status": "open"
    },
    "autoActions": {
      "alertCreated": true,
      "alertId": "alert_123",
      "dispatchInitiated": true,
      "dispatchId": "dispatch_456"
    }
  }
}
```

### PATCH `/api/incidents/:id`

Update incident

**Request:**
```json
{
  "status": "in_progress",
  "severity": "critical",
  "assignedTo": "Emergency Response Team",
  "assignedToId": "team_ert_01"
}
```

### POST `/api/incidents/:id/updates`

Add update to incident

**Request:**
```json
{
  "message": "Ambulance arrived on scene",
  "type": "status_change",
  "updatedBy": "Dispatch Center"
}
```

### POST `/api/incidents/:id/resolve`

Mark incident as resolved

**Request:**
```json
{
  "resolutionNotes": "Patient stabilized and transported to hospital",
  "followUpRequired": false
}
```

### POST `/api/incidents/:id/attachments`

Upload attachment to incident

**Request:** Multipart form data
```
file: [File]
description: "Photo of incident scene"
```

---

## Volunteers Management

### GET `/api/events/:eventId/volunteers`

List volunteers for event

**Query Parameters:**
```
status: 'active' | 'break' | 'offline' | 'all'
role: string
zone: string
team: string
```

**Response:**
```json
{
  "success": true,
  "data": {
    "volunteers": [
      {
        "id": "vol_123abc",
        "eventId": "evt_789ghi",
        "userId": "usr_456def",
        "name": "Amit Patel",
        "email": "amit@example.com",
        "phoneNumber": "+1234567890",
        "avatar": "https://cdn.drishtix.com/avatars/amit.jpg",
        "role": "Crowd Management",
        "zone": "Section A",
        "team": "Team Alpha",
        "status": "active",
        "currentTask": "Monitor main entrance flow",
        "lastLocation": "Gate B",
        "lastLocationUpdate": 1704297600000,
        "assignedTasks": 8,
        "completedTasks": 6,
        "rating": 4.8,
        "skills": ["First Aid", "Crowd Control", "Communication"],
        "joinedAt": 1704283200000,
        "checkInTime": 1704290400000,
        "checkOutTime": null,
        "availability": {
          "start": "08:00",
          "end": "20:00"
        }
      }
    ],
    "statistics": {
      "total": 48,
      "active": 42,
      "onBreak": 4,
      "offline": 2,
      "averageRating": 4.6
    }
  }
}
```

### GET `/api/volunteers/:id`

Get volunteer details

### POST `/api/volunteers`

Register volunteer

**Request:**
```json
{
  "eventId": "evt_789ghi",
  "userId": "usr_456def",
  "name": "Sneha Reddy",
  "email": "sneha@example.com",
  "phoneNumber": "+1234567891",
  "role": "Medical Support",
  "zone": "Medical Bay",
  "team": "Team Medical",
  "skills": ["EMT Certified", "CPR", "First Aid"],
  "availability": {
    "start": "09:00",
    "end": "18:00"
  }
}
```

### PATCH `/api/volunteers/:id`

Update volunteer

**Request:**
```json
{
  "status": "break",
  "currentTask": null,
  "lastLocation": "Rest Area"
}
```

### POST `/api/volunteers/:id/assign-task`

Assign task to volunteer

**Request:**
```json
{
  "taskDescription": "Guide attendees to parking lot",
  "priority": "medium",
  "estimatedDuration": 30,
  "location": "Main Entrance",
  "dueBy": 1704301200000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "task_123",
      "description": "Guide attendees to parking lot",
      "assignedTo": "vol_123abc",
      "status": "assigned",
      "priority": "medium"
    },
    "volunteer": {
      "id": "vol_123abc",
      "assignedTasks": 9,
      "currentTask": "Guide attendees to parking lot"
    }
  }
}
```

### POST `/api/volunteers/:id/check-in`

Volunteer check-in

**Request:**
```json
{
  "location": "Volunteer HQ"
}
```

### POST `/api/volunteers/:id/check-out`

Volunteer check-out

**Request:**
```json
{
  "completedTasks": 8,
  "notes": "Shift completed successfully"
}
```

---

## Notifications

### GET `/api/notifications`

Get user's notifications

**Query Parameters:**
```
read: boolean
type: 'info' | 'warning' | 'success' | 'error' | 'alert'
priority: 'low' | 'medium' | 'high'
eventId: string
page: number
limit: number
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_123abc",
        "userId": "usr_456def",
        "eventId": "evt_789ghi",
        "type": "warning",
        "title": "Weather Alert",
        "message": "Light rain expected in 45 minutes. Event continues as planned.",
        "priority": "medium",
        "read": false,
        "actionUrl": "/events/evt_789ghi",
        "actionLabel": "View Event",
        "imageUrl": null,
        "timestamp": 1704297600000,
        "expiresAt": 1704301200000
      }
    ],
    "unreadCount": 5
  },
  "meta": {
    "pagination": { /* ... */ }
  }
}
```

### PATCH `/api/notifications/:id/read`

Mark notification as read

### DELETE `/api/notifications/:id`

Delete notification

### POST `/api/notifications/clear-all`

Clear all notifications

**Request:**
```json
{
  "olderThan": 1704297600000
}
```

### POST `/api/notifications/mark-all-read`

Mark all as read

### POST `/api/notifications/send`

Send notification (Admin/Organizer only)

**Request:**
```json
{
  "recipients": ["usr_123", "usr_456"] | "all" | "attendees" | "volunteers",
  "eventId": "evt_789ghi",
  "type": "info",
  "title": "Event Update",
  "message": "Performance starting in 15 minutes!",
  "priority": "medium",
  "actionUrl": "/events/evt_789ghi/schedule",
  "actionLabel": "View Schedule",
  "sendPush": true,
  "sendEmail": false,
  "sendSMS": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notificationId": "notif_batch_123",
    "recipientCount": 1250,
    "deliveryStatus": {
      "push": 1200,
      "email": 0,
      "sms": 0
    }
  }
}
```

---

## Navigation & Routing

### POST `/api/navigation/route`

Calculate navigation route

**Request:**
```json
{
  "eventId": "evt_789ghi",
  "from": "Main Entrance" | { "latitude": 37.7749, "longitude": -122.4194 },
  "to": "Main Stage" | { "latitude": 37.7750, "longitude": -122.4195 },
  "preferences": {
    "preferAccessible": true,
    "avoidCrowds": true,
    "fastest": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "route": {
      "id": "route_123abc",
      "from": "Main Entrance",
      "to": "Main Stage",
      "distance": 350,
      "estimatedTime": 7,
      "crowdLevel": 35,
      "accessibilityScore": 95,
      "safetyScore": 92,
      "steps": [
        {
          "instruction": "Head north from Main Entrance",
          "distance": 100,
          "duration": 2,
          "direction": "north",
          "landmark": "Information Kiosk",
          "coordinates": {
            "latitude": 37.7749,
            "longitude": -122.4194
          }
        },
        {
          "instruction": "Continue straight past the Food Court",
          "distance": 150,
          "duration": 3,
          "coordinates": {
            "latitude": 37.7750,
            "longitude": -122.4194
          }
        },
        {
          "instruction": "Turn right towards Main Stage",
          "distance": 100,
          "duration": 2,
          "landmark": "Main Stage",
          "coordinates": {
            "latitude": 37.7750,
            "longitude": -122.4195
          }
        }
      ],
      "hasEscalator": false,
      "hasElevator": true,
      "hasRestroom": true,
      "hasMedicalBay": false,
      "alternativeRoutes": 2,
      "polyline": "encoded_polyline_string"
    },
    "alternatives": [
      {
        "id": "route_alt1",
        "distance": 400,
        "estimatedTime": 9,
        "crowdLevel": 20,
        "reason": "Less crowded route"
      }
    ]
  }
}
```

### GET `/api/events/:eventId/pois`

Get points of interest

**Query Parameters:**
```
type: 'restroom' | 'food' | 'medical' | 'exit' | 'info' | 'parking' | 'stage' | 'other'
isOpen: boolean
isAccessible: boolean
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pois": [
      {
        "id": "poi_123",
        "name": "North Restrooms",
        "type": "restroom",
        "location": {
          "latitude": 37.7749,
          "longitude": -122.4194
        },
        "floor": "Ground",
        "description": "Modern facilities with baby changing stations",
        "amenities": ["Wheelchair Accessible", "Baby Changing", "Hand Sanitizer"],
        "crowdLevel": 45,
        "waitTime": 5,
        "isAccessible": true,
        "isOpen": true,
        "openingHours": "Event duration",
        "capacity": 20,
        "currentOccupancy": 9
      }
    ]
  }
}
```

### GET `/api/events/:eventId/emergency-exits`

Get emergency exit routes

**Response:**
```json
{
  "success": true,
  "data": {
    "exits": [
      {
        "id": "exit_1",
        "name": "North Emergency Exit",
        "location": {
          "latitude": 37.7751,
          "longitude": -122.4196
        },
        "capacity": 500,
        "isAccessible": true,
        "status": "open",
        "currentCrowdLevel": 10,
        "evacuationRoute": {
          "distance": 200,
          "estimatedTime": 4,
          "steps": [ /* ... */ ]
        }
      }
    ]
  }
}
```

---

## Live Metrics & Monitoring

### WebSocket Endpoints

#### Connect to Event Metrics
```
ws://localhost:3000/ws/metrics/:eventId
```

**Subscription Message:**
```json
{
  "action": "subscribe",
  "eventId": "evt_789ghi"
}
```

**Real-time Updates (every 3 seconds):**
```json
{
  "type": "metrics_update",
  "data": {
    "currentAttendees": 3245,
    "checkIns": 3180,
    "activeVolunteers": 48,
    "incidentReports": 7,
    "crowdDensity": 67,
    "timestamp": 1704297600000
  }
}
```

#### Connect to Heatmap
```
ws://localhost:3000/ws/heatmap/:eventId
```

**Real-time Updates (every 5 seconds):**
```json
{
  "type": "heatmap_update",
  "data": {
    "zones": [ /* ... */ ],
    "timestamp": 1704297600000
  }
}
```

#### Connect to Incidents
```
ws://localhost:3000/ws/incidents/:eventId
```

**Real-time Updates:**
```json
{
  "type": "incident_created" | "incident_updated" | "incident_resolved",
  "data": {
    "incident": { /* ... */ }
  }
}
```

#### Connect to Volunteers
```
ws://localhost:3000/ws/volunteers/:eventId
```

**Real-time Updates (every 10 seconds):**
```json
{
  "type": "volunteer_location_update" | "volunteer_status_change",
  "data": {
    "volunteer": { /* ... */ }
  }
}
```

#### Connect to Notifications
```
ws://localhost:3000/ws/notifications/:userId
```

**Real-time Updates:**
```json
{
  "type": "new_notification",
  "data": {
    "notification": { /* ... */ }
  }
}
```

---

## AI & Analytics

### GET `/api/ai/models`

List AI models

**Response:**
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "model_crowd_pred",
        "name": "Crowd Density Predictor",
        "type": "regression",
        "status": "active",
        "accuracy": 94.5,
        "predictions": 15420,
        "lastTrainingDate": 1704211200000,
        "version": "2.1.0"
      }
    ]
  }
}
```

### GET `/api/ai/insights`

Get AI-generated insights

**Query Parameters:**
```
eventId: string
category: 'crowd' | 'safety' | 'operations' | 'predictions'
priority: 'low' | 'medium' | 'high'
limit: number
```

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "id": "insight_123",
        "eventId": "evt_789ghi",
        "category": "crowd",
        "title": "High crowd density predicted at Main Stage",
        "description": "AI models predict 85% capacity between 6-8 PM",
        "confidence": 94,
        "priority": "high",
        "timestamp": 1704297600000,
        "actionRequired": true,
        "suggestedActions": [
          "Open overflow zones",
          "Deploy additional security",
          "Enable crowd flow management"
        ],
        "affectedZones": ["zone_1"],
        "predictedImpact": "Moderate overcrowding risk",
        "timeframe": 120
      }
    ]
  }
}
```

### POST `/api/ai/analyze`

Request AI analysis

**Request:**
```json
{
  "eventId": "evt_789ghi",
  "analysisType": "crowd_forecast" | "safety_risk" | "queue_time" | "anomaly",
  "dataPoints": [
    {
      "timestamp": 1704297600000,
      "attendeeCount": 3000,
      "zoneId": "zone_1"
    }
  ],
  "horizon": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [ /* ... */ ],
    "confidence": 89,
    "processingTime": 245
  }
}
```

### GET `/api/ai/predictions/:eventId`

Get crowd predictions

**Response:**
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "timestamp": 1704298200000,
        "predictedAttendance": 4500,
        "confidence": 87,
        "timeHorizon": 15,
        "zones": [
          {
            "zoneId": "zone_1",
            "zoneName": "Main Stage",
            "predictedDensity": 78,
            "riskLevel": "medium"
          }
        ]
      }
    ]
  }
}
```

### GET `/api/analytics/event/:eventId/summary`

Get event analytics summary

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCheckIns": 4523,
    "peakAttendance": 3845,
    "averageStayTime": 185,
    "satisfactionScore": 4.6,
    "repeatVisitors": 28,
    "crowdFlowEfficiency": 82,
    "incidentRate": 1.2,
    "responseTime": 4.5,
    "revenueGenerated": 225670.50
  }
}
```

---

## Help & Assistance

### POST `/api/help/find-person`

Request to find missing person

**Request:**
```json
{
  "eventId": "evt_789ghi",
  "requesterId": "usr_123",
  "personName": "Jane Smith",
  "personDescription": "Wearing blue jacket, black jeans",
  "lastSeenLocation": "Near Food Court",
  "lastSeenTime": 1704297000000,
  "contactNumber": "+1234567890",
  "photo": "base64_image_data"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": "help_find_123",
    "status": "searching",
    "estimatedResponseTime": 15,
    "volunteerAssigned": "vol_456",
    "volunteerName": "Security Team",
    "volunteerContact": "+1234567891"
  }
}
```

### POST `/api/help/medical`

Request medical assistance

**Request:**
```json
{
  "eventId": "evt_789ghi",
  "requesterId": "usr_123",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "locationDescription": "Section C, near stage left",
  "emergencyType": "minor" | "moderate" | "critical",
  "description": "Person feeling faint",
  "contactNumber": "+1234567890",
  "patientCondition": {
    "conscious": true,
    "breathing": true,
    "bleeding": false,
    "symptoms": ["dizziness", "nausea"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": "help_med_456",
    "status": "dispatched",
    "estimatedArrival": 5,
    "responderName": "Medical Team Alpha",
    "responderContact": "+1234567892",
    "trackingUrl": "/help/track/help_med_456",
    "instructions": "Stay with patient, keep them comfortable"
  }
}
```

### POST `/api/help/sos`

Send SOS alert

**Request:**
```json
{
  "eventId": "evt_789ghi",
  "userId": "usr_123",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "emergency": true,
  "message": "Need immediate help"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sosId": "sos_789",
    "status": "active",
    "responders": [
      {
        "type": "security",
        "eta": 2,
        "name": "Security Team Bravo"
      }
    ],
    "emergencyNumber": "+1234567899",
    "trackingEnabled": true
  }
}
```

### GET `/api/help/requests/:requestId/status`

Get help request status

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": "help_med_456",
    "type": "medical",
    "status": "in_progress",
    "assignedTo": "Medical Team Alpha",
    "currentLocation": {
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    "estimatedArrival": 2,
    "updates": [
      {
        "timestamp": 1704297600000,
        "message": "Medical team dispatched",
        "updatedBy": "System"
      },
      {
        "timestamp": 1704297660000,
        "message": "Team en route, ETA 2 minutes",
        "updatedBy": "Medical Team Alpha"
      }
    ]
  }
}
```

---

## WebSocket Events

### Connection & Authentication

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    action: 'authenticate',
    token: 'jwt_token_here'
  }));
  
  // Subscribe to event
  ws.send(JSON.stringify({
    action: 'subscribe:event',
    eventId: 'evt_789ghi'
  }));
};
```

### Event Types

#### From Client
- `authenticate` - Authenticate WebSocket connection
- `subscribe:event` - Subscribe to event updates
- `subscribe:metrics` - Subscribe to live metrics
- `subscribe:heatmap` - Subscribe to heatmap updates
- `subscribe:incidents` - Subscribe to incident updates
- `subscribe:volunteers` - Subscribe to volunteer updates
- `subscribe:notifications` - Subscribe to notifications
- `unsubscribe:*` - Unsubscribe from specific topic

#### From Server
- `authenticated` - Authentication successful
- `metrics:update` - Live metrics update
- `heatmap:update` - Heatmap update
- `incident:new` - New incident created
- `incident:updated` - Incident updated
- `incident:resolved` - Incident resolved
- `volunteer:location` - Volunteer location update
- `volunteer:status` - Volunteer status change
- `notification:new` - New notification
- `alert:critical` - Critical alert
- `error` - Error message

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "email",
      "issue": "Email already registered"
    }
  },
  "meta": {
    "timestamp": 1704297600000,
    "requestId": "req_123abc"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Error Codes

| Code | Description |
|------|-------------|
| `AUTH_INVALID_CREDENTIALS` | Invalid email or password |
| `AUTH_TOKEN_EXPIRED` | JWT token expired |
| `AUTH_INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `VALIDATION_FAILED` | Request validation failed |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `RESOURCE_CONFLICT` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `EVENT_NOT_LIVE` | Event is not currently live |
| `TICKET_ALREADY_USED` | Ticket has already been used |
| `TICKET_EXPIRED` | Ticket has expired |
| `PAYMENT_FAILED` | Payment processing failed |
| `INVALID_QR_CODE` | QR code is invalid |
| `ZONE_AT_CAPACITY` | Zone has reached capacity |
| `VOLUNTEER_UNAVAILABLE` | Volunteer is not available |

---

## Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Auth endpoints | 5 requests | 1 minute |
| GET endpoints | 100 requests | 1 minute |
| POST/PUT/PATCH endpoints | 30 requests | 1 minute |
| WebSocket connections | 10 connections | Per user |
| File uploads | 10 MB | Per file |
| Bulk operations | 1000 items | Per request |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704297660
```

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**
```
page: number (default: 1)
limit: number (default: 20, max: 100)
```

**Response Meta:**
```json
{
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## Sorting & Filtering

Most list endpoints support:

**Sorting:**
```
sortBy: field_name
sortOrder: 'asc' | 'desc'
```

**Filtering:**
- Exact match: `?status=active`
- Multiple values: `?status=active,scheduled`
- Date range: `?startDate=...&endDate=...`
- Search: `?search=query`

---

## File Uploads

**Supported formats:**
- Images: JPG, PNG, GIF, WebP (max 10MB)
- Documents: PDF (max 20MB)
- Videos: MP4, WebM (max 100MB)

**Upload Endpoint:**
```
POST /api/upload
Content-Type: multipart/form-data
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.drishtix.com/uploads/file.jpg",
    "filename": "file.jpg",
    "size": 1024567,
    "mimetype": "image/jpeg"
  }
}
```

---

## Webhooks

Configure webhooks for event notifications:

**POST `/api/webhooks`**
```json
{
  "url": "https://your-domain.com/webhooks/drishtix",
  "events": [
    "incident.created",
    "incident.resolved",
    "event.status_changed",
    "ticket.purchased"
  ],
  "secret": "webhook_secret_key"
}
```

**Webhook Payload:**
```json
{
  "event": "incident.created",
  "timestamp": 1704297600000,
  "data": {
    "incident": { /* ... */ }
  },
  "signature": "sha256_signature"
}
```

---

## Testing

### Postman Collection
Download: [DrishtiX API v2.0 Postman Collection](./drishtix-api-v2-postman.json)

### Test Credentials
```
Organizer:
  Email: organizer@drishtix.com
  Password: DrishtiOrg123!

Attendee:
  Email: attendee@drishtix.com
  Password: DrishtiAtt123!
```

---

## Support

- **Documentation**: https://docs.drishtix.com
- **API Status**: https://status.drishtix.com
- **Support**: support@drishtix.com
- **GitHub**: https://github.com/drishtix/drishtix-platform

---

**Last Updated**: January 2, 2026  
**API Version**: 2.0.0  
**Frontend Version**: 2.0 (Stakeholder Approved)
