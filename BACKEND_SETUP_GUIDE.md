# Quick Setup Guide for New Backend Features

**Last Updated:** January 3, 2026

## Prerequisites Checklist

- [x] Node.js 18+ installed
- [x] PostgreSQL with PostGIS extension
- [x] GCP Project configured
- [x] Service account key available
- [ ] Google Cloud Storage bucket created
- [ ] Environment variables set

---

## Step 1: Install Missing Dependencies

```powershell
# Navigate to server directory
cd c:\Users\KIIT\Desktop\open-source\DrishtiX\server

# Install multer for file uploads
npm install multer @types/multer

# Install Google Cloud Storage
npm install @google-cloud/storage

# Install uuid for unique IDs (if not already installed)
npm install uuid @types/uuid
```

---

## Step 2: Update Environment Variables

Add these to your `.env` file:

```env
# Google Cloud Storage
GCS_BUCKET_NAME=drishtix-uploads
GCP_PROJECT_ID=your-project-id
GCP_SERVICE_ACCOUNT_KEY=./path/to/service-account-key.json

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/drishtix?schema=public

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Server Port
PORT=3000
```

---

## Step 3: Create GCS Bucket

```powershell
# Using gcloud CLI
gcloud storage buckets create gs://drishtix-uploads `
  --project=your-project-id `
  --location=us-central1 `
  --uniform-bucket-level-access

# Set CORS configuration for web access
echo '[
  {
    "origin": ["http://localhost:5173", "https://yourdomain.com"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]' | Out-File -Encoding utf8 cors.json

gcloud storage buckets update gs://drishtix-uploads --cors-file=cors.json
```

---

## Step 4: Run Database Migration

```powershell
# Navigate to project root
cd c:\Users\KIIT\Desktop\open-source\DrishtiX

# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_automation_gates_models

# This will create:
# - AutomationPolicy model
# - AutomationExecution model
# - GateControl model
# - GateEntry model
# - All related enums
```

---

## Step 5: Verify Database Schema

```powershell
# Open Prisma Studio to verify
npx prisma studio

# Check that these models exist:
# ✓ AutomationPolicy
# ✓ AutomationExecution
# ✓ GateControl
# ✓ GateEntry
```

---

## Step 6: Test New Routes

### Test Automation Routes

```powershell
# Create automation policy
curl -X POST http://localhost:3000/api/automation/policies `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_JWT_TOKEN" `
  -d '{
    "eventId": "event-uuid",
    "name": "High Density Alert",
    "description": "Alert when crowd density exceeds 80%",
    "triggerType": "CROWD_DENSITY",
    "triggerConditions": { "threshold": 0.8 },
    "actions": [
      { "type": "SEND_ALERT", "priority": "HIGH" }
    ],
    "priority": "HIGH",
    "isActive": true
  }'

# Get automation policies
curl http://localhost:3000/api/automation/policies/EVENT_ID `
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Gate Control Routes

```powershell
# Create gate
curl -X POST http://localhost:3000/api/gates `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_JWT_TOKEN" `
  -d '{
    "eventId": "event-uuid",
    "name": "Main Entrance",
    "type": "ENTRY",
    "location": { "lat": 40.7128, "lng": -74.0060 },
    "zone": "North",
    "capacity": 1000,
    "accessLevel": "PUBLIC"
  }'

# Get gates for event
curl http://localhost:3000/api/gates/EVENT_ID `
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Control gate (open/close)
curl -X POST http://localhost:3000/api/gates/GATE_ID/control `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_JWT_TOKEN" `
  -d '{
    "action": "open",
    "reason": "Event starting"
  }'
```

### Test Storage Routes

```powershell
# Upload file (requires form-data)
curl -X POST http://localhost:3000/api/storage/upload `
  -H "Authorization: Bearer YOUR_JWT_TOKEN" `
  -F "file=@path/to/image.jpg" `
  -F "category=event-images" `
  -F "eventId=event-uuid"

# Get file URL
curl http://localhost:3000/api/storage/event-images/FILE_ID `
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Operations Routes

```powershell
# Create operations log
curl -X POST http://localhost:3000/api/operations/log `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_JWT_TOKEN" `
  -d '{
    "eventId": "event-uuid",
    "action": "Gate Opened",
    "description": "Main entrance gate was opened",
    "entityType": "gate",
    "entityId": "gate-uuid"
  }'

# Get operations log
curl http://localhost:3000/api/operations/EVENT_ID `
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Post-Analysis Routes

```powershell
# Get post-event analysis
curl http://localhost:3000/api/post-analysis/EVENT_ID `
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Generate report
curl -X POST http://localhost:3000/api/post-analysis/EVENT_ID/generate `
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Step 7: Update Frontend API Config (If Needed)

The frontend API config already has endpoints defined. Just verify:

```typescript
// drishti-frontend/src/config/api.config.ts

// These should exist:
automation: {
  policies: (eventId: string) => `/events/${eventId}/automation-policies`,
  createPolicy: '/automation/policies',
  // ...
},

gates: {
  list: (eventId: string) => `/events/${eventId}/gates`,
  details: (gateId: string) => `/gates/${gateId}`,
  // ...
}
```

---

## Step 8: Start the Server

```powershell
# From server directory
cd c:\Users\KIIT\Desktop\open-source\DrishtiX\server

# Development mode
npm run dev

# Or production mode
npm run build
npm start
```

You should see:

```
✅ Client connected
✅ Database connected
✅ Server running on port 3000
```

---

## Verification Checklist

### Database

- [ ] All new models created
- [ ] Migrations applied successfully
- [ ] No errors in Prisma Studio

### Routes

- [ ] Automation routes responding
- [ ] Gate control routes responding
- [ ] Storage routes responding
- [ ] Operations routes responding
- [ ] Post-analysis routes responding

### GCS Storage

- [ ] Bucket created
- [ ] CORS configured
- [ ] Service account has permissions
- [ ] File uploads working

### Frontend Integration

- [ ] API endpoints match
- [ ] Authentication working
- [ ] Real-time updates working
- [ ] No CORS errors

---

## Common Issues & Solutions

### Issue 1: Prisma Migration Fails

**Error:** `Migration failed to apply cleanly`

**Solution:**

```powershell
# Reset database (CAUTION: This deletes all data)
npx prisma migrate reset

# Or apply migration manually
npx prisma migrate resolve --applied "migration_name"
```

### Issue 2: GCS Upload Fails

**Error:** `Failed to upload to GCS`

**Solution:**

1. Check service account permissions
2. Verify bucket exists
3. Check GOOGLE_APPLICATION_CREDENTIALS environment variable
4. Ensure storage.admin role on service account

```powershell
# Grant permissions
gcloud projects add-iam-policy-binding PROJECT_ID `
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" `
  --role="roles/storage.admin"
```

### Issue 3: Route Not Found

**Error:** `404 Route not found`

**Solution:**

1. Check server/index.ts has route imported and registered
2. Verify route file exports default router
3. Check route path matches API call
4. Restart server after adding routes

### Issue 4: Authentication Fails

**Error:** `401 Unauthorized`

**Solution:**

1. Check JWT token is valid
2. Verify middleware is applied
3. Check user has correct role
4. Verify token in Authorization header: `Bearer <token>`

---

## Performance Testing

### Load Test Automation Routes

```powershell
# Install artillery (if not installed)
npm install -g artillery

# Create test config
echo '
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
      - get:
          url: "/api/automation/policies/event-123"
          headers:
            Authorization: "Bearer TOKEN"
' | Out-File -Encoding utf8 load-test.yml

# Run test
artillery run load-test.yml
```

---

## Monitoring & Logging

### Enable Request Logging

Already configured in server/index.ts:

```typescript
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

### Monitor Database Queries

```typescript
// In server/index.ts
export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'], // Already enabled
});
```

### Check Health

```powershell
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-01-03T...",
  "uptime": 3600,
  "database": "connected"
}
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] All environment variables set
- [ ] GCS bucket created and configured
- [ ] Database migrations applied
- [ ] SSL/TLS certificates configured
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] Request validation enabled
- [ ] Error tracking setup (Sentry)
- [ ] Monitoring setup (Datadog/New Relic)
- [ ] Backup strategy configured
- [ ] Load balancer configured
- [ ] Health checks configured
- [ ] Logging centralized
- [ ] Security headers configured
- [ ] API documentation updated

---

## Support & Documentation

### Additional Resources

1. **System Architecture Audit:** `SYSTEM_ARCHITECTURE_AUDIT.md`
2. **Backend Completion Summary:** `BACKEND_COMPLETION_SUMMARY.md`
3. **Prisma Schema:** `prisma/schema.prisma`
4. **API Routes:** `server/routes/*.routes.ts`

### Need Help?

Check the audit document for:

- Complete API endpoint list
- Database schema details
- Architecture decisions
- Performance considerations

---

**Setup Time:** ~30 minutes  
**Difficulty:** Intermediate  
**Status:** Ready for Production (after testing)
