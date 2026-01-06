# API Integration Testing Guide

## 🧪 Quick API Tests

### 1. Test Backend Health

```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/health" | Select-Object -ExpandProperty Content

# Or using browser
# Visit: http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-02T...",
  "uptime": 123.456,
  "database": "connected"
}
```

### 2. Test Events API

```bash
# Get all events
curl http://localhost:3000/api/events

# Get specific event
curl http://localhost:3000/api/events/EVENT_ID
```

### 3. Test WebSocket Connection

Open browser console and run:

```javascript
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});

// Join event room
socket.emit('join:event', 'event-123');

// Listen for updates
socket.on('metrics:updated', (data) => {
  console.log('📊 Metrics:', data);
});
```

## 🔍 Frontend Testing

### Test Component Integration

1. **Navigate to a page** (e.g., Crowd Intelligence)
2. **Open DevTools Console**
3. **Check for:**
   - No 404 errors
   - Successful API calls
   - WebSocket connection established
   - Data loading correctly

### Debug Checklist

- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173
- [ ] `.env.local` configured correctly
- [ ] Socket.IO client installed
- [ ] No CORS errors in console
- [ ] API responses have correct structure

## 🐛 Common Issues & Fixes

### Issue: "Network Error" or "Failed to fetch"

**Solution:**
```bash
# Verify backend is running
curl http://localhost:3000/health

# If not, start backend
cd server
npm run dev
```

### Issue: "WebSocket connection failed"

**Solution:**
Check `.env.local`:
```env
VITE_WS_URL=ws://localhost:3000  # Not wss:// for local dev
```

### Issue: "CORS Error"

**Solution:**
Backend should have CORS enabled. Check `server/index.ts`:
```typescript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### Issue: "Mock data still showing"

**Solution:**
1. Ensure you're using V2 components
2. Check imports - should use new services
3. Clear browser cache
4. Restart dev server

## ✅ Integration Test Scenarios

### Scenario 1: Real-time Incident Creation

1. Open Dispatch Center page
2. Open backend terminal
3. Create incident via API:

```bash
curl -X POST http://localhost:3000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "event-123",
    "type": "MEDICAL",
    "severity": "HIGH",
    "location": "Main Stage",
    "description": "Medical emergency"
  }'
```

4. **Expected:** Incident appears instantly in UI

### Scenario 2: Live Metrics Update

1. Open Event Dashboard
2. Watch metrics in real-time
3. Backend should emit `metrics:updated` events
4. **Expected:** Numbers update without page refresh

### Scenario 3: Alert Notifications

1. Open any page
2. Create alert via API
3. **Expected:** Alert notification appears
4. **Expected:** Alert shows in Alerts Center

## 📊 Performance Testing

### Check Response Times

```javascript
// In browser console
const start = performance.now();
fetch('http://localhost:3000/api/events')
  .then(() => {
    const end = performance.now();
    console.log(`API call took ${end - start}ms`);
  });
```

**Target:** < 500ms for most endpoints

### Monitor WebSocket Messages

```javascript
const socket = io('http://localhost:3000');

socket.onAny((eventName, ...args) => {
  console.log(`📡 ${eventName}:`, args);
});
```

## 🔐 Security Testing

### Test Authentication (if implemented)

```javascript
// Set auth token
localStorage.setItem('auth_token', 'your-token');

// Make authenticated request
fetch('http://localhost:3000/api/protected-route', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
});
```

### Test Rate Limiting

```javascript
// Send multiple requests quickly
for (let i = 0; i < 100; i++) {
  fetch('http://localhost:3000/api/events');
}
```

**Expected:** Backend should rate limit after threshold

## 📈 Load Testing

### Simulate Multiple Users

```javascript
// Create multiple WebSocket connections
const connections = [];
for (let i = 0; i < 50; i++) {
  const socket = io('http://localhost:3000');
  socket.emit('join:event', 'event-123');
  connections.push(socket);
}

console.log(`Created ${connections.length} connections`);
```

**Monitor:** Backend memory and CPU usage

## 🎯 Acceptance Criteria

### ✅ API Integration Complete When:

- [ ] All pages load without mock data
- [ ] Real-time updates work on all pages
- [ ] WebSocket connects automatically
- [ ] Error handling shows appropriate messages
- [ ] Loading states appear while fetching
- [ ] Empty states show when no data
- [ ] All CRUD operations work
- [ ] No console errors
- [ ] Performance is acceptable (< 1s load time)
- [ ] Data persists across page navigation

## 🚀 Production Readiness

### Pre-deployment Checklist

- [ ] Environment variables set for production
- [ ] API URLs point to production backend
- [ ] WebSocket uses wss:// (secure)
- [ ] Authentication implemented
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Analytics integrated
- [ ] Performance monitoring active
- [ ] All console.logs removed
- [ ] Build optimized
- [ ] Bundle size acceptable

### Production Environment Variables

```env
VITE_API_BASE_URL=https://api.drishtix.com/api
VITE_WS_URL=wss://api.drishtix.com
VITE_APP_NAME=DrishtiX
VITE_ENABLE_MOCK_MODE=false
VITE_DEBUG_MODE=false
```

## 📞 Support

If tests fail:
1. Check backend logs
2. Check browser console
3. Check network tab
4. Review this guide
5. Check BACKEND_INTEGRATION_COMPLETE.md

---

**Happy Testing! 🎉**
