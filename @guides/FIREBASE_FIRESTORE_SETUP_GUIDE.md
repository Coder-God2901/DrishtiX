# Firebase Firestore Real-Time Database Setup Guide

## Overview

This guide covers the complete setup and integration of Firebase Firestore for real-time data synchronization in DrishtiX, including crowd density updates, team positions, alerts, and schedule changes.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firestore Database Setup](#firestore-database-setup)
3. [Data Model Design](#data-model-design)
4. [Security Rules](#security-rules)
5. [Backend Integration](#backend-integration)
6. [Frontend Real-Time Listeners](#frontend-real-time-listeners)
7. [Use Cases Implementation](#use-cases-implementation)
8. [Performance Optimization](#performance-optimization)
9. [Testing & Verification](#testing--verification)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Firebase project created and configured
- Firebase Admin SDK initialized
- Firebase Client SDK installed in frontend

---

## Firestore Database Setup

### 1. Create Firestore Database

```bash
# Navigate to Firebase Console
https://console.firebase.google.com/

# Select your project
# Go to Firestore Database
# Click "Create database"

# Choose mode:
# - Production mode (with security rules)
# - Test mode (open access - for development only)

# Select location: us-central1 (or nearest region)
```

### 2. Database Configuration

**Cloud Firestore Location:**

- `us-central1` (recommended for US)
- `europe-west1` (recommended for Europe)
- `asia-southeast1` (recommended for Asia)

**Database ID:** `(default)`

---

## Data Model Design

### Collections Structure

```
Firestore Database
│
├── 📁 crowdDensity/
│   └── {eventId}/
│       ├── timestamp: Timestamp
│       ├── gridData: Array<GridCell>
│       ├── totalCount: number
│       ├── averageDensity: number
│       └── zones: Array<ZoneData>
│
├── 📁 incidents/
│   └── {incidentId}/
│       ├── eventId: string
│       ├── type: string (FIRE, PANIC, MEDICAL, etc.)
│       ├── severity: string (CRITICAL, HIGH, MEDIUM, LOW)
│       ├── status: string (ACTIVE, RESPONDING, RESOLVED)
│       ├── location: GeoPoint
│       ├── timestamp: Timestamp
│       ├── assignedResponders: Array<string>
│       └── description: string
│
├── 📁 responders/
│   └── {responderId}/
│       ├── name: string
│       ├── type: string (SECURITY, MEDICAL, FIRE)
│       ├── status: string (AVAILABLE, DISPATCHED, ON_SCENE)
│       ├── location: GeoPoint
│       ├── lastUpdate: Timestamp
│       └── currentIncidentId: string | null
│
├── 📁 alerts/
│   └── {alertId}/
│       ├── eventId: string
│       ├── type: string
│       ├── priority: string (CRITICAL, HIGH, MEDIUM, LOW)
│       ├── status: string (ACTIVE, ACKNOWLEDGED, RESOLVED)
│       ├── title: string
│       ├── summary: string
│       ├── zone: string
│       ├── createdAt: Timestamp
│       └── acknowledgedAt: Timestamp | null
│
├── 📁 team_locations/
│   └── {userId}/
│       ├── location: GeoPoint
│       ├── timestamp: Timestamp
│       ├── status: string
│       └── batteryLevel: number
│
├── 📁 team_members/
│   └── {userId}/
│       ├── name: string
│       ├── role: string
│       ├── status: string (ONLINE, OFFLINE, BUSY)
│       ├── lastSeen: Timestamp
│       └── assignedZone: string
│
├── 📁 predictions/
│   └── {predictionId}/
│       ├── eventId: string
│       ├── timestamp: Timestamp
│       ├── forecastTime: Timestamp
│       ├── predictions: Array<GridPrediction>
│       ├── hotspots: Array<Hotspot>
│       └── riskLevel: string
│
├── 📁 venues/
│   └── {eventId}/
│       ├── boundary: GeoJSON
│       ├── zones: Array<Zone>
│       ├── gates: Array<Gate>
│       ├── routes: Array<Route>
│       └── lastUpdate: Timestamp
│
├── 📁 attendee_reports/
│   └── {reportId}/
│       ├── eventId: string
│       ├── reporterId: string
│       ├── type: string
│       ├── description: string
│       ├── location: GeoPoint
│       ├── images: Array<string>
│       ├── status: string
│       ├── createdAt: Timestamp
│       └── validatedAt: Timestamp | null
│
└── 📁 user_fcm_tokens/
    └── {userId}/
        ├── token: string
        ├── platform: string (android, ios, web)
        └── updatedAt: Timestamp
```

---

## Security Rules

### Production Security Rules

File: `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function hasRole(role) {
      return isAuthenticated() &&
             request.auth.token.role == role;
    }

    function hasAnyRole(roles) {
      return isAuthenticated() &&
             request.auth.token.role in roles;
    }

    function isOwner(userId) {
      return isAuthenticated() &&
             request.auth.uid == userId;
    }

    // Crowd Density - Read: All authenticated, Write: System only
    match /crowdDensity/{eventId} {
      allow read: if isAuthenticated();
      allow write: if hasAnyRole(['ADMIN', 'ORGANIZER']);
    }

    // Incidents - Read: Staff, Write: Security/Medical/Admin
    match /incidents/{incidentId} {
      allow read: if hasAnyRole(['ADMIN', 'ORGANIZER', 'SECURITY', 'MEDICAL', 'LOGISTICS']);
      allow create: if hasAnyRole(['ADMIN', 'SECURITY', 'MEDICAL']);
      allow update: if hasAnyRole(['ADMIN', 'SECURITY', 'MEDICAL']);
      allow delete: if hasRole('ADMIN');
    }

    // Responders - Read: Staff, Write: Responders can update own status
    match /responders/{responderId} {
      allow read: if hasAnyRole(['ADMIN', 'ORGANIZER', 'SECURITY', 'MEDICAL', 'LOGISTICS']);
      allow write: if hasAnyRole(['ADMIN', 'SECURITY', 'MEDICAL']) || isOwner(responderId);
    }

    // Alerts - Read: All authenticated, Write: Staff only
    match /alerts/{alertId} {
      allow read: if isAuthenticated();
      allow create: if hasAnyRole(['ADMIN', 'ORGANIZER', 'SECURITY']);
      allow update: if hasAnyRole(['ADMIN', 'ORGANIZER', 'SECURITY', 'MEDICAL', 'LOGISTICS']);
      allow delete: if hasRole('ADMIN');
    }

    // Team Locations - Read: Staff, Write: Own location only
    match /team_locations/{userId} {
      allow read: if hasAnyRole(['ADMIN', 'ORGANIZER', 'SECURITY', 'LOGISTICS']);
      allow write: if isOwner(userId) || hasRole('ADMIN');
    }

    // Team Members - Read: Staff, Write: Admin/Organizer
    match /team_members/{userId} {
      allow read: if hasAnyRole(['ADMIN', 'ORGANIZER', 'SECURITY', 'LOGISTICS']);
      allow write: if hasAnyRole(['ADMIN', 'ORGANIZER']);
    }

    // Predictions - Read: All authenticated, Write: System only
    match /predictions/{predictionId} {
      allow read: if isAuthenticated();
      allow write: if hasAnyRole(['ADMIN', 'ORGANIZER']);
    }

    // Venues - Read: All authenticated, Write: Admin/Organizer
    match /venues/{eventId} {
      allow read: if isAuthenticated();
      allow write: if hasAnyRole(['ADMIN', 'ORGANIZER']);
    }

    // Attendee Reports - Read: Staff, Write: Attendees can create
    match /attendee_reports/{reportId} {
      allow read: if hasAnyRole(['ADMIN', 'ORGANIZER', 'SECURITY', 'MEDICAL']);
      allow create: if isAuthenticated();
      allow update: if hasAnyRole(['ADMIN', 'ORGANIZER', 'SECURITY']) ||
                       isOwner(resource.data.reporterId);
      allow delete: if hasRole('ADMIN');
    }

    // FCM Tokens - Users can read/write own token
    match /user_fcm_tokens/{userId} {
      allow read, write: if isOwner(userId) || hasRole('ADMIN');
    }
  }
}
```

### Deploy Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

---

## Backend Integration

### 1. Initialize Firestore Admin

File: `server/services/firebase-admin.service.ts`

```typescript
import * as admin from 'firebase-admin';

// Initialize (if not already done)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export const db = admin.firestore();

// Configure settings
db.settings({
  timestampsInSnapshots: true,
  ignoreUndefinedProperties: true,
});
```

### 2. Write Data to Firestore

```typescript
/**
 * Update crowd density in real-time
 */
async function updateCrowdDensity(eventId: string, gridData: any[]) {
  try {
    await db
      .collection('crowdDensity')
      .doc(eventId)
      .set(
        {
          eventId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          gridData,
          totalCount: gridData.reduce((sum, cell) => sum + cell.count, 0),
          averageDensity: gridData.reduce((sum, cell) => sum + cell.density, 0) / gridData.length,
        },
        { merge: true }
      );

    console.log(`✅ Updated crowd density for event ${eventId}`);
  } catch (error) {
    console.error('Error updating crowd density:', error);
    throw error;
  }
}

/**
 * Create incident
 */
async function createIncident(incident: any) {
  const docRef = db.collection('incidents').doc();

  await docRef.set({
    ...incident,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    status: 'ACTIVE',
  });

  return docRef.id;
}

/**
 * Update responder location
 */
async function updateResponderLocation(responderId: string, location: { lat: number; lon: number }, status: string) {
  await db
    .collection('responders')
    .doc(responderId)
    .set(
      {
        location: new admin.firestore.GeoPoint(location.lat, location.lon),
        status,
        lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

/**
 * Broadcast alert
 */
async function broadcastAlert(eventId: string, alert: any) {
  await db.collection('alerts').add({
    eventId,
    ...alert,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
```

### 3. Query Data

```typescript
/**
 * Get active incidents
 */
async function getActiveIncidents(eventId: string) {
  const snapshot = await db
    .collection('incidents')
    .where('eventId', '==', eventId)
    .where('status', 'in', ['ACTIVE', 'RESPONDING'])
    .orderBy('timestamp', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get available responders
 */
async function getAvailableResponders(type?: string) {
  let query = db.collection('responders').where('status', '==', 'AVAILABLE');

  if (type) {
    query = query.where('type', '==', type);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
```

---

## Frontend Real-Time Listeners

### 1. Initialize Firebase Client

File: `src/services/firebase.service.ts`

```typescript
import { getFirestore, collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';

const db = getFirestore(app);
```

### 2. Subscribe to Real-Time Updates

```typescript
/**
 * Subscribe to crowd density updates
 */
function subscribeToCrowdDensity(eventId: string, callback: (data: any) => void) {
  const unsubscribe = onSnapshot(
    doc(db, 'crowdDensity', eventId),
    (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      }
    },
    (error) => {
      console.error('Error subscribing to crowd density:', error);
    }
  );

  return unsubscribe;
}

/**
 * Subscribe to incidents
 */
function subscribeToIncidents(callback: (incidents: any[]) => void) {
  const q = query(
    collection(db, 'incidents'),
    where('status', 'in', ['ACTIVE', 'RESPONDING']),
    orderBy('timestamp', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const incidents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(incidents);
  });

  return unsubscribe;
}

/**
 * Subscribe to team locations
 */
function subscribeToTeamLocations(callback: (locations: any[]) => void) {
  const q = query(collection(db, 'team_locations'), orderBy('timestamp', 'desc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const locations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    }));
    callback(locations);
  });

  return unsubscribe;
}

/**
 * Subscribe to alerts
 */
function subscribeToAlerts(eventId: string, callback: (alerts: any[]) => void) {
  const q = query(
    collection(db, 'alerts'),
    where('eventId', '==', eventId),
    where('status', '==', 'ACTIVE'),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(alerts);
  });

  return unsubscribe;
}
```

### 3. React Component Integration

```typescript
// Example: OperationsDashboard.tsx
import { useEffect, useState } from 'react';
import { firebaseService } from '@/services/firebase.service';

export function OperationsDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [teamLocations, setTeamLocations] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const eventId = 'evt_101';

  useEffect(() => {
    // Subscribe to real-time incidents
    const unsubIncidents = firebaseService.subscribeToIncidents(setIncidents);

    // Subscribe to team locations
    const unsubLocations = firebaseService.subscribeToTeamLocations(setTeamLocations);

    // Subscribe to alerts
    const unsubAlerts = firebaseService.subscribeToAlerts(eventId, setAlerts);

    // Cleanup subscriptions on unmount
    return () => {
      unsubIncidents();
      unsubLocations();
      unsubAlerts();
    };
  }, [eventId]);

  return (
    <div>
      <h1>Live Operations Dashboard</h1>

      <div className="incidents">
        <h2>Active Incidents ({incidents.length})</h2>
        {incidents.map(incident => (
          <IncidentCard key={incident.id} incident={incident} />
        ))}
      </div>

      <div className="team-map">
        <h2>Team Locations ({teamLocations.length})</h2>
        <Map markers={teamLocations} />
      </div>

      <div className="alerts">
        <h2>Active Alerts ({alerts.length})</h2>
        {alerts.map(alert => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
}
```

---

## Use Cases Implementation

### 1. Real-Time Crowd Grid Updates

**Backend (ETL Worker):**

```typescript
// Process crowd data and update Firestore
async function processCrowdData(eventId: string, gridData: any[]) {
  // Update Firestore
  await db
    .collection('crowdDensity')
    .doc(eventId)
    .set(
      {
        gridData,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        totalCount: gridData.reduce((sum, cell) => sum + cell.count, 0),
      },
      { merge: true }
    );

  // Check for high-density zones
  const criticalZones = gridData.filter((cell) => cell.density > 0.9);

  if (criticalZones.length > 0) {
    // Create alert
    await db.collection('alerts').add({
      eventId,
      type: 'CROWD_DENSITY',
      priority: 'HIGH',
      status: 'ACTIVE',
      title: 'High Density Detected',
      summary: `${criticalZones.length} zones at critical density`,
      zones: criticalZones.map((z) => z.zone),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}
```

**Frontend:**

```typescript
// Subscribe to crowd density updates
useEffect(() => {
  const unsubscribe = firebaseService.subscribeToCrowdDensity(eventId, (data) => {
    setGridData(data.gridData);
    setTotalCount(data.totalCount);
  });

  return () => unsubscribe();
}, [eventId]);
```

### 2. Team Position Tracking

**Mobile App (Team Member):**

```typescript
// Update location every 5 seconds
const watchId = navigator.geolocation.watchPosition(
  async (position) => {
    await updateDoc(doc(db, 'team_locations', userId), {
      location: new GeoPoint(position.coords.latitude, position.coords.longitude),
      timestamp: serverTimestamp(),
      accuracy: position.coords.accuracy,
    });
  },
  (error) => console.error('Location error:', error),
  { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
);
```

**Dashboard (Organizer):**

```typescript
// Real-time team map
useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, 'team_locations'), (snapshot) => {
    const locations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Update map markers
    updateMapMarkers(locations);
  });

  return () => unsubscribe();
}, []);
```

### 3. Live Alert Broadcasting

**Backend:**

```typescript
// Create and broadcast alert
async function broadcastEmergencyAlert(alert: any) {
  // Save to Firestore (triggers real-time update)
  const alertRef = await db.collection('alerts').add({
    ...alert,
    status: 'ACTIVE',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Send FCM notification
  await sendFCMAlert(alert);

  return alertRef.id;
}
```

**Frontend:**

```typescript
// Show alert toast on new alert
useEffect(() => {
  const unsubscribe = onSnapshot(
    query(collection(db, 'alerts'), where('status', '==', 'ACTIVE'), orderBy('createdAt', 'desc'), limit(1)),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const alert = change.doc.data();

          // Show notification
          toast.error(alert.title, {
            description: alert.summary,
            action: {
              label: 'View',
              onClick: () => navigate(`/alerts/${change.doc.id}`),
            },
          });

          // Play alert sound
          if (alert.priority === 'CRITICAL') {
            playAlertSound();
          }
        }
      });
    }
  );

  return () => unsubscribe();
}, []);
```

### 4. Schedule Changes

**Backend:**

```typescript
// Update event schedule
async function updateEventSchedule(eventId: string, schedule: any) {
  await db.collection('venues').doc(eventId).update({
    schedule,
    lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Notify attendees
  await broadcastAlert({
    eventId,
    type: 'SCHEDULE_CHANGE',
    priority: 'MEDIUM',
    title: 'Schedule Updated',
    summary: 'Event schedule has been updated. Check the latest times.',
  });
}
```

**Frontend:**

```typescript
// Subscribe to schedule changes
useEffect(() => {
  const unsubscribe = onSnapshot(doc(db, 'venues', eventId), (doc) => {
    if (doc.exists()) {
      const venue = doc.data();
      setSchedule(venue.schedule);

      // Show update notification
      toast.info('Schedule updated', {
        description: 'New event timings are available.',
      });
    }
  });

  return () => unsubscribe();
}, [eventId]);
```

---

## Performance Optimization

### 1. Index Configuration

```bash
# Create composite indexes for common queries

# Incidents by event and status
firebase firestore:indexes:create \
  --collection-group incidents \
  --field eventId \
  --field status \
  --field timestamp:desc

# Alerts by event and priority
firebase firestore:indexes:create \
  --collection-group alerts \
  --field eventId \
  --field priority \
  --field createdAt:desc
```

### 2. Limit Query Results

```typescript
// Use limit() to reduce bandwidth
const q = query(
  collection(db, 'incidents'),
  where('status', '==', 'ACTIVE'),
  orderBy('timestamp', 'desc'),
  limit(20) // Only get latest 20 incidents
);
```

### 3. Use Pagination

```typescript
// Paginate large result sets
const firstPage = query(collection(db, 'attendee_reports'), orderBy('createdAt', 'desc'), limit(25));

// Get next page
const lastVisible = snapshot.docs[snapshot.docs.length - 1];
const nextPage = query(
  collection(db, 'attendee_reports'),
  orderBy('createdAt', 'desc'),
  startAfter(lastVisible),
  limit(25)
);
```

### 4. Offline Persistence

```typescript
// Enable offline persistence (web)
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open
    console.warn('Persistence disabled: multiple tabs');
  } else if (err.code === 'unimplemented') {
    // Browser doesn't support
    console.warn('Persistence not available');
  }
});
```

---

## Testing & Verification

### 1. Test Real-Time Updates

```typescript
// Write test data
await db.collection('incidents').add({
  eventId: 'test_event',
  type: 'MEDICAL',
  severity: 'HIGH',
  status: 'ACTIVE',
  timestamp: admin.firestore.FieldValue.serverTimestamp(),
});

// Verify listener receives update
const unsubscribe = onSnapshot(collection(db, 'incidents'), (snapshot) => {
  console.log('Received update:', snapshot.size, 'documents');
});
```

### 2. Monitor Firestore Usage

```bash
# Firebase Console > Firestore Database > Usage

# Check:
# - Read operations
# - Write operations
# - Delete operations
# - Storage usage
```

### 3. Test Security Rules

```bash
# Firebase Console > Firestore Database > Rules > Simulator

# Test read/write with different user roles
```

---

## Troubleshooting

### Common Issues

#### 1. "Missing or insufficient permissions"

```typescript
// Check security rules
// Verify user has correct role claims
const user = await admin.auth().getUser(uid);
console.log(user.customClaims);
```

#### 2. "Listener not receiving updates"

```typescript
// Ensure query is valid
// Check network connectivity
// Verify Firestore is initialized
```

#### 3. "Too many listeners"

```typescript
// Clean up listeners on component unmount
useEffect(() => {
  const unsubscribe = onSnapshot(/* ... */);
  return () => unsubscribe();
}, []);
```

#### 4. "Exceeded quota"

```typescript
// Reduce query frequency
// Use pagination
// Cache data locally
```

---

## Best Practices

1. **Data Structure**
   - Keep documents small (<1MB)
   - Use subcollections for nested data
   - Denormalize for read performance

2. **Security**
   - Always use security rules
   - Validate data on server side
   - Use custom claims for roles

3. **Performance**
   - Create indexes for common queries
   - Use limits on queries
   - Enable offline persistence

4. **Real-Time Updates**
   - Clean up listeners on unmount
   - Use error callbacks
   - Handle connection state changes

---

## Summary

✅ **Firestore database configured**  
✅ **Real-time listeners implemented**  
✅ **Security rules deployed**  
✅ **Crowd density tracking active**  
✅ **Team positions synchronized**  
✅ **Alert broadcasting functional**  
✅ **Schedule changes propagating**

Your Firestore real-time database is production-ready!
