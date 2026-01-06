# DrishtiX - Integration Guide

## 🚀 Quick Start

### 1. Import the Mock Backend Service

The mock backend is already created and ready to use. It's a singleton, so you only need to import it:

```typescript
import { mockBackend } from "./services/mockBackend";
```

### 2. Replace Components in Your App

Update your main app file to use the enhanced components:

```typescript
// Before
import { AttendeeDashboard } from "./components/AttendeeDashboard";
import { MyTickets } from "./components/MyTickets";
import { EventBrowse } from "./components/EventBrowse";
import { OrganizerHome } from "./components/OrganizerHome";
import { VolunteerManagement } from "./components/VolunteerManagement";

// After - Use Enhanced Versions
import { AttendeeDashboard } from "./components/AttendeeDashboard"; // Already enhanced
import { MyTicketsEnhanced as MyTickets } from "./components/MyTicketsEnhanced";
import { EventBrowseEnhanced as EventBrowse } from "./components/EventBrowseEnhanced";
import { OrganizerHomeEnhanced as OrganizerHome } from "./components/OrganizerHomeEnhanced";
import { VolunteerManagementEnhanced as VolunteerManagement } from "./components/VolunteerManagementEnhanced";
```

## 📦 Component Props

### AttendeeDashboard (Enhanced In-Place)

```typescript
<AttendeeDashboard
  onSwitchToOrganizer={() => void}
  onLogout={() => void}
/>
```

### MyTicketsEnhanced

```typescript
<MyTicketsEnhanced
  onBack={() => void}
/>
```

### EventBrowseEnhanced

```typescript
<EventBrowseEnhanced
  onBack={() => void}
  onEventSelect={(event: Event) => void}
/>
```

### OrganizerHomeEnhanced

```typescript
<OrganizerHomeEnhanced
  onSelectEvent={(eventId: string) => void}
  onCreateEvent={() => void}
  onLogout={() => void}
/>
```

### VolunteerManagementEnhanced

```typescript
<VolunteerManagementEnhanced
  onBack={() => void}
/>
```

## 🔄 Using the Mock Backend Directly

### Subscribe to Real-time Updates

```typescript
import { useEffect, useState } from "react";
import { mockBackend, LiveMetrics } from "../services/mockBackend";

function MyComponent() {
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);

  useEffect(() => {
    // Subscribe to live metrics
    const unsubscribe = mockBackend.subscribeToMetrics((metrics) => {
      setLiveMetrics(metrics);
    });

    // Cleanup on unmount
    return () => unsubscribe();
  }, []);

  return (
    <div>
      {liveMetrics && <p>Current Attendees: {liveMetrics.currentAttendees}</p>}
    </div>
  );
}
```

### Available Subscriptions

```typescript
// Live Metrics (updates every 3s)
mockBackend.subscribeToMetrics((metrics) => { ... });

// Crowd Heatmap (updates every 5s)
mockBackend.subscribeToHeatmap((heatmap) => { ... });

// Incidents (real-time)
mockBackend.subscribeToIncidents((incident) => { ... });

// Volunteers (real-time)
mockBackend.subscribeToVolunteers((volunteer) => { ... });

// Notifications (real-time)
mockBackend.subscribeToNotifications((notification) => { ... });

// Tickets (real-time)
mockBackend.subscribeToTickets((ticket) => { ... });

// Events (real-time)
mockBackend.subscribeToEventUpdates((event) => { ... });
```

### CRUD Operations

#### Tickets

```typescript
// Get all tickets
const tickets = mockBackend.getAllTickets();

// Get single ticket
const ticket = mockBackend.getTicket("ticket-id");

// Create ticket
const newTicket = mockBackend.createTicket({
  eventId: "evt-1",
  eventName: "Concert",
  quantity: 2,
  // ... other fields
});

// Update ticket
mockBackend.updateTicket("ticket-id", {
  attendeeNames: ["John Doe", "Jane Doe"],
});

// Cancel ticket
mockBackend.cancelTicket("ticket-id");

// Refund ticket
mockBackend.refundTicket("ticket-id");

// Delete ticket
mockBackend.deleteTicket("ticket-id");
```

#### Events

```typescript
// Get all events
const events = mockBackend.getAllEvents();

// Get single event
const event = mockBackend.getEvent('event-id');

// Create event
const newEvent = mockBackend.createEvent({ ... });

// Update event
mockBackend.updateEvent('event-id', { price: 599 });

// Delete event
mockBackend.deleteEvent('event-id');
```

#### Volunteers

```typescript
// Get all volunteers
const volunteers = mockBackend.getAllVolunteers();

// Create volunteer
const newVolunteer = mockBackend.createVolunteer({
  name: "John Smith",
  role: "Security",
  zone: "Main Gate",
  // ... other fields
});

// Update volunteer
mockBackend.updateVolunteer("vol-id", {
  status: "active",
});

// Assign task
mockBackend.assignVolunteerTask("vol-id", "Monitor entrance");

// Delete volunteer
mockBackend.deleteVolunteer("vol-id");
```

#### Incidents

```typescript
// Get all incidents
const incidents = mockBackend.getAllIncidents();

// Create incident
const newIncident = mockBackend.createIncident({
  type: "medical",
  severity: "high",
  location: "Main Stage",
  // ... other fields
});

// Update incident
mockBackend.updateIncident("inc-id", {
  status: "in_progress",
});

// Add update to incident
mockBackend.addIncidentUpdate("inc-id", "Medical team arrived", "Dr. Smith");

// Resolve incident
mockBackend.resolveIncident("inc-id");
```

#### Notifications

```typescript
// Get all notifications
const notifications = mockBackend.getAllNotifications();

// Get unread only
const unread = mockBackend.getUnreadNotifications();

// Mark as read
mockBackend.markNotificationAsRead("notif-id");

// Mark all as read
mockBackend.markAllNotificationsAsRead();

// Delete notification
mockBackend.deleteNotification("notif-id");
```

## 🎨 Styling

All enhanced components use:

- Tailwind CSS classes
- Gradient backgrounds
- Smooth transitions
- Consistent color scheme
- Responsive design

Make sure Tailwind CSS is properly configured in your project.

## 🧹 Cleanup

When your app unmounts or you need to stop simulations:

```typescript
// Stop all background simulations
mockBackend.destroy();
```

This stops all setInterval timers and prevents memory leaks.

## 🎯 Integration Checklist

- [ ] Import mock backend service
- [ ] Replace component imports with enhanced versions
- [ ] Test real-time updates are working (check console logs)
- [ ] Verify CRUD operations work (create/edit/delete tickets, volunteers)
- [ ] Check all filters and sorts function correctly
- [ ] Test modals open and close properly
- [ ] Verify live indicators show up (green "Live" badges)
- [ ] Test subscription cleanup (no memory leaks)
- [ ] Check mobile responsiveness
- [ ] Verify all color-coding is correct

## 🔧 Troubleshooting

### Real-time updates not working?

1. Check browser console for errors
2. Look for "🔴" logs showing subscriptions
3. Verify useEffect cleanup functions are called
4. Check that components aren't being unmounted too early

### Data not showing?

1. Check mockBackend.getAllX() returns data
2. Verify state is being set in components
3. Check filter/search isn't hiding all items
4. Look for TypeScript errors in console

### Performance issues?

1. Check number of subscriptions (should cleanup on unmount)
2. Verify intervals are being cleared
3. Consider reducing update frequencies in mockBackend.ts
4. Check React DevTools for unnecessary re-renders

## 📱 Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

## 🎓 Learning Resources

- Mock Backend: `src/services/mockBackend.ts` - Well documented
- Component Examples: See enhanced component files
- TypeScript Types: All types exported from mockBackend.ts

## 💬 Support

Check the PLATFORM_OVERHAUL_SUMMARY.md for detailed feature documentation.

---

**Happy Coding! 🚀**
