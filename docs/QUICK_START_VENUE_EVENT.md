# Quick Start Guide - Venue Mapping & Event Creator Testing

## Prerequisites

1. ✅ PostgreSQL running with PostGIS extension
2. ✅ Google Maps API key configured in `.env`
3. ✅ Backend dependencies installed
4. ✅ Database migrations applied

## Setup Steps

### 1. Configure Environment

Create/update `.env` file in project root:

```env
# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# WebSocket
VITE_WS_URL=http://localhost:3000

# API
VITE_API_URL=http://localhost:3000/api
```

Create/update `server/.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/eventsphere

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Server
PORT=3000
NODE_ENV=development
```

### 2. Database Setup

```powershell
# Navigate to server directory
cd server

# Generate Prisma client
npx prisma generate

# Run migrations (if not already applied)
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### 3. Start Backend Server

```powershell
# From server directory
pnpm dev

# You should see:
# ✅ Venue mapping service ready
# ✅ Event template service ready
# ✅ Socket.IO server listening on port 3000
```

### 4. Start Frontend

```powershell
# From project root
pnpm dev

# Frontend should start on http://localhost:5173
```

## Running the Integration Test

The integration test (`server/test-venue-event-integration.ts`) verifies all features end-to-end:

```powershell
# From server directory
npx tsx test-venue-event-integration.ts
```

### What the Test Covers

1. ✅ **Template Retrieval** - Gets all event type templates
2. ✅ **Template Details** - Gets specific template (Concert)
3. ✅ **Event Creation** - Creates event from template with validation
4. ✅ **Venue Layout** - Creates venue boundary and zones
5. ✅ **Polygon Validation** - Rejects self-intersecting polygons
6. ✅ **Geofencing Inside** - Detects user inside venue
7. ✅ **Geofencing Outside** - Detects boundary breach
8. ✅ **VIP Access Control** - Detects unauthorized VIP zone access
9. ✅ **Navigation** - Generates optimal path
10. ✅ **Config Update** - Updates event dynamic fields
11. ✅ **Real-Time Events** - Socket.IO event propagation

### Expected Output

```
🚀 Starting Venue Mapping & Dynamic Event Creator Integration Tests

================================================================================
✅ 1. Get all event templates (123ms)
   Found 6 templates: concert, marathon, festival, rally, conference, workshop
✅ 2. Get specific template (concert) (45ms)
   Template has 10 fields
✅ 3. Create event from template (156ms)
   Created event with ID: evt_abc123...
✅ 4. Create venue layout with validation (89ms)
   Created venue layout with 2 zones
✅ 5. Reject invalid self-intersecting polygon (67ms)
   Correctly rejected invalid polygon
✅ 6. Geofence check - inside venue (34ms)
   User inside venue, in zones: zone_main_stage
✅ 7. Geofence check - outside venue (28ms)
   User outside venue, alerts: 1
✅ 8. Geofence check - VIP unauthorized access (31ms)
   Detected unauthorized VIP access
✅ 9. Generate navigation path (42ms)
   Generated path: 2 points, 85.6m, ~62s
✅ 10. Update event configuration (38ms)
   Updated event config
✅ 11. Socket.IO real-time events (1234ms)
   Connected to Socket.IO
   Received event:created for Socket Test Event
================================================================================

📊 Test Summary:
   Total: 11
   Passed: 11 ✅
   Failed: 0 ❌
   Total Time: 1887ms

================================================================================
✅ All tests passed!
================================================================================
```

## Manual Testing via UI

### Test Event Creation

1. Navigate to `http://localhost:5173/organizer/events/create`
2. Select "Concert" template
3. Fill in all required fields:
   - Event Name: "Test Concert"
   - Artist: "Test Artist"
   - Expected Attendees: 5000
   - etc.
4. Click "Create Event"
5. Verify redirect to venue mapping

### Test Venue Mapping

1. Should auto-navigate after event creation
2. Click "Draw Venue Boundary"
3. Click 4+ points on map to create polygon
4. Close polygon by clicking near first point
5. Verify validation message shows "valid"
6. Click "Add Zone"
7. Fill zone details (Main Stage, 10000 capacity, High risk)
8. Draw zone inside boundary
9. Click "Save Venue Layout"
10. Verify success toast

### Test Geofencing (API)

Using curl or Postman:

```powershell
# Check location inside venue
curl -X POST http://localhost:3000/api/events/{eventId}/geofence-check `
  -H "Content-Type: application/json" `
  -d '{
    "location": { "lat": 18.5207, "lng": 73.8571 },
    "userId": "user_123",
    "userRole": "ATTENDEE"
  }'
```

### Test Real-Time Updates

1. Open browser DevTools → Console
2. Run:

```javascript
socket.on('event:created', (data) => console.log('Event created:', data));
socket.on('venue:updated', (data) => console.log('Venue updated:', data));
```

3. Create event or update venue in UI
4. Watch console for real-time events

## Troubleshooting

### Backend won't start

**Error:** `Cannot find module '@prisma/client'`

```powershell
cd server
npx prisma generate
```

**Error:** `Port 3000 already in use`

```powershell
# Find and kill process
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### Frontend map not loading

**Issue:** Gray screen instead of map

**Solutions:**

1. Check API key in `.env`: `VITE_GOOGLE_MAPS_API_KEY`
2. Verify Google Maps JavaScript API enabled in console
3. Check browser console for errors
4. Clear browser cache

### Polygon validation errors

**Issue:** "Polygon has self-intersection(s)"

**Solution:** Ensure polygon doesn't cross itself:

```
✅ Valid:    ❌ Invalid (figure-8):
  ┌───┐         ╱╲
  │   │        ╱  ╲
  └───┘       ╲  ╱
               ╲╱
```

### Socket.IO not connecting

**Issue:** Real-time updates not working

**Solutions:**

1. Check backend server is running
2. Verify `VITE_WS_URL` in `.env`
3. Check CORS settings in `server/index.ts`
4. Look for connection errors in browser console

## API Endpoints Reference

| Method | Endpoint                         | Description                |
| ------ | -------------------------------- | -------------------------- |
| GET    | `/api/events/templates`          | List all templates         |
| GET    | `/api/events/templates/:id`      | Get template by ID         |
| POST   | `/api/events`                    | Create event from template |
| GET    | `/api/events/:id/venue-layout`   | Get venue layout           |
| POST   | `/api/events/:id/venue-layout`   | Save venue layout          |
| POST   | `/api/events/:id/geofence-check` | Check geofence             |
| POST   | `/api/events/:id/navigate`       | Generate path              |
| PUT    | `/api/events/:id/config`         | Update config              |

## Next Steps

After successful testing:

1. ✅ **Production Deployment**
   - Set up environment variables
   - Configure PostgreSQL with PostGIS
   - Deploy to cloud platform

2. ✅ **Performance Optimization**
   - Add Redis caching for venue layouts
   - Implement spatial indexes in PostgreSQL
   - Batch geofence checks

3. ✅ **Enhanced Features**
   - 3D venue visualization
   - ML-powered zone suggestions
   - Mobile app integration

## Support

For issues or questions:

- Check `VENUE_EVENT_INTEGRATION_GUIDE.md` for detailed documentation
- Review TypeScript errors with `npx tsc --noEmit`
- Check server logs for backend errors
- Use browser DevTools for frontend debugging

---

**Last Updated:** November 29, 2025  
**Version:** 1.0.0
