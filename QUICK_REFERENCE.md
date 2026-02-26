# DrishtiX V2 - Quick Reference Card

> **For Developers** - Essential commands, endpoints, and configurations

---

## 🚀 Quick Start Commands

### Backend Setup
```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name frontend_v2

# Start development server
npm run dev

# Start production server
npm run build && npm start
```

### Frontend Setup
```bash
cd drishti-frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Database Commands
```bash
# Reset database
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio

# Seed database
npx prisma db seed

# Create new migration
npx prisma migrate dev --name your_migration_name
```

---

## 📡 API Endpoints Cheat Sheet

### Authentication
```
POST   /api/auth/login          {email, password}
POST   /api/auth/register       {email, password, name}
POST   /api/auth/refresh        {refreshToken}
POST   /api/auth/logout         {}
```

### Events
```
GET    /api/events              ?status=ACTIVE&limit=10
GET    /api/events/:id
POST   /api/events              {name, venue, startTime...}
PATCH  /api/events/:id          {status: 'ACTIVE'}
```

### Tickets
```
GET    /api/tickets/user/:userId
POST   /api/tickets/purchase    {eventId, quantity, totalPaid...}
POST   /api/tickets/:id/validate
POST   /api/tickets/:id/cancel
```

### Volunteers
```
GET    /api/volunteers/event/:eventId    ?status=ACTIVE
POST   /api/volunteers                   {name, email, role, zone...}
POST   /api/volunteers/:id/check-in      {location, locationCoords}
POST   /api/volunteers/:id/assign-task   {title, zone, priority}
```

### Navigation
```
POST   /api/navigation/route         {startLocation, endLocation, avoidCrowds}
GET    /api/navigation/event/:eventId/pois
GET    /api/navigation/event/:eventId/emergency-exits
```

### Help System
```
POST   /api/help/find-person     {missingPersonName, lastSeenLocation...}
POST   /api/help/medical         {medicalIssue, severity, location...}
POST   /api/help/sos             {issueType, description, location...}
```

### Notifications
```
GET    /api/notifications        ?userId=123&isRead=false
PATCH  /api/notifications/:id/read
POST   /api/notifications/send   {userId, title, message, priority}
```

---

## 🔌 WebSocket Events

### Subscribe (Client → Server)
```javascript
socket.emit('join:user', userId);
socket.emit('join:event', eventId);
socket.emit('subscribe:metrics', eventId);
socket.emit('subscribe:heatmap', eventId);
socket.emit('subscribe:volunteers', eventId);
socket.emit('subscribe:notifications', userId);
```

### Listen (Server → Client)
```javascript
socket.on('metrics:update', (data) => console.log(data));
socket.on('heatmap:update', (data) => console.log(data));
socket.on('volunteer:status', (data) => console.log(data));
socket.on('notification:new', (data) => console.log(data));
socket.on('incident:new', (data) => console.log(data));
```

---

## 🔐 Environment Variables

### Required Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/drishtix"

# JWT
JWT_SECRET="your-secret-key-min-32-chars"

# Server
PORT=3000
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"

# Amazon Cognito+S3 (for Amazon SNS Push)
Amazon Cognito+S3_PROJECT_ID=""
Amazon Cognito+S3_PRIVATE_KEY=""
Amazon Cognito+S3_CLIENT_EMAIL=""

# Payment (Optional)
STRIPE_SECRET_KEY=""
RAZORPAY_KEY_ID=""

# Notifications (Optional)
SENDGRID_API_KEY=""
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
```

---

## 📊 Database Models Quick Reference

### User Roles
```typescript
enum UserRole {
  ADMIN, ORGANIZER, SECURITY, LOGISTICS,
  MEDICAL, ATTENDEE, VOLUNTEER, VIEWER
}
```

### Event Status
```typescript
enum EventStatus {
  DRAFT, SCHEDULED, LIVE, COMPLETED, CANCELLED
}
```

### Ticket Status
```typescript
enum TicketStatus {
  ACTIVE, USED, EXPIRED, CANCELLED, REFUNDED, TRANSFERRED
}
```

### Volunteer Status
```typescript
enum VolunteerStatus {
  ACTIVE, BREAK, OFFLINE, COMPLETED, REMOVED
}
```

---

## 🧪 Testing Endpoints

### cURL Examples
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get tickets (with auth)
curl http://localhost:3000/api/tickets/user/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Purchase ticket
curl -X POST http://localhost:3000/api/tickets/purchase \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventId":"123","quantity":2,"totalPaid":50.00,...}'
```

---

## 🐛 Troubleshooting

### Common Issues

**Prisma Client not found**
```bash
npx prisma generate
```

**Port already in use**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

**WebSocket not connecting**
- Check CORS in server/index.ts
- Verify FRONTEND_URL in .env
- Check browser console for errors

**Database connection failed**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Test connection: `npx prisma db pull`

---

## 📚 Documentation Files

1. **FRONTEND_V2_INTEGRATION_GUIDE.md** - Complete integration guide
2. **BACKEND_V2_COMPLETE_SUMMARY.md** - Backend updates summary
3. **docs/FRONTEND_BACKEND_MAPPING.md** - Feature mapping (67KB)
4. **docs/API_REFERENCE_V2.md** - Complete API specs (50KB)
5. **docs/BACKEND_IMPLEMENTATION_GUIDE.md** - Implementation guide (24KB)

---

## 🎯 Development Workflow

### Feature Development
1. Create database model in `schema.prisma`
2. Run `npx prisma migrate dev`
3. Create route file in `server/routes/`
4. Register route in `server/index.ts`
5. Add WebSocket events if needed
6. Update frontend to use new API
7. Test endpoints
8. Write tests
9. Update documentation

### Git Workflow
```bash
git checkout -b feature/your-feature
# Make changes
git add .
git commit -m "feat: description"
git push origin feature/your-feature
# Create PR
```

---

## 🔥 Hot Tips

### Performance
- Use pagination for list endpoints (`?limit=20&offset=0`)
- Cache frequent queries with Redis
- Use database indexes for search fields
- Batch WebSocket updates to reduce traffic

### Security
- Always validate input
- Use parameterized queries
- Implement rate limiting
- Log security events
- Use HTTPS in production

### Debugging
- Check server logs: `tail -f logs/server.log`
- Use Prisma Studio for database: `npx prisma studio`
- Monitor WebSocket: Browser DevTools → Network → WS
- Use Postman collections for API testing

---

## 📞 Need Help?

- **Documentation**: Check `/docs` folder
- **API Issues**: Review `API_REFERENCE_V2.md`
- **Integration**: See `FRONTEND_V2_INTEGRATION_GUIDE.md`
- **Backend**: Check `BACKEND_IMPLEMENTATION_GUIDE.md`

---

**Last Updated**: January 2, 2026  
**Version**: 2.0  
**Status**: ✅ Production Ready
