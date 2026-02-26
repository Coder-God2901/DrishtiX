# DrishtiX Backend Implementation Guide

> **For Finalized Frontend UI/UX (v2.0)** - January 2, 2026  
> **Status**: Ready for Backend Development

## 📑 Table of Contents

1. [Overview](#overview)
2. [Technology Stack Recommendations](#technology-stack-recommendations)
3. [Project Structure](#project-structure)
4. [Database Design](#database-design)
5. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
6. [API Implementation Details](#api-implementation-details)
7. [Real-Time Features](#real-time-features)
8. [Authentication & Security](#authentication--security)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Guide](#deployment-guide)

---

## Overview

This guide provides a complete roadmap for implementing the DrishtiX backend to support the **finalized frontend UI/UX (v2.0)**. The frontend is built with React + TypeScript and currently uses mock data that needs to be replaced with real API calls.

### What's Been Built (Frontend)
- ✅ 70+ React components
- ✅ Complete UI/UX (stakeholder approved)
- ✅ Mock backend service (`mockBackend.ts`)
- ✅ Real-time state management
- ✅ Navigation system
- ✅ Incident management UI
- ✅ Volunteer tracking UI
- ✅ Event dashboards
- ✅ AI insights interface

### What Needs to Be Built (Backend)
- ⏳ RESTful API endpoints
- ⏳ WebSocket server for real-time updates
- ⏳ Database schema & migrations
- ⏳ Authentication system
- ⏳ File upload handling
- ⏳ Payment integration
- ⏳ Push notifications
- ⏳ AI/ML model integration

---

## Technology Stack Recommendations

### Backend Framework Options

#### Option 1: Node.js + Express (Recommended)
**Pros:**
- Same language as frontend (TypeScript/JavaScript)
- Large ecosystem
- Easy WebSocket integration
- Fast development
- Good for real-time features

**Stack:**
```
- Node.js 20+
- Express.js 4.x
- TypeScript 5.x
- Socket.IO for WebSocket
- Prisma or TypeORM for ORM
- PostgreSQL 15+
- Redis for caching
- JWT for authentication
```

#### Option 2: Python + FastAPI
**Pros:**
- Excellent for ML/AI integration
- Auto-generated API docs
- Type hints support
- Async/await support

**Stack:**
```
- Python 3.11+
- FastAPI 0.100+
- SQLAlchemy 2.x
- PostgreSQL 15+
- Redis
- Celery for background tasks
- JWT authentication
```

#### Option 3: Java + Spring Boot
**Pros:**
- Enterprise-grade
- Excellent scalability
- Strong typing
- Great for large teams

**Stack:**
```
- Java 17+
- Spring Boot 3.x
- Spring WebSocket
- PostgreSQL
- Redis
- JWT/OAuth2
```

### Recommended: Node.js + Express + TypeScript

**Rationale:**
1. Frontend team already knows TypeScript
2. Easier code sharing between frontend/backend
3. Excellent real-time capabilities with Socket.IO
4. Fast development cycle
5. Large community and libraries

---

## Project Structure

### Recommended Backend Structure

```
drishtix-backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── jwt.ts
│   │   └── env.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── events.controller.ts
│   │   ├── tickets.controller.ts
│   │   ├── incidents.controller.ts
│   │   ├── volunteers.controller.ts
│   │   ├── notifications.controller.ts
│   │   └── navigation.controller.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── event.model.ts
│   │   ├── ticket.model.ts
│   │   ├── incident.model.ts
│   │   ├── volunteer.model.ts
│   │   └── notification.model.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── events.routes.ts
│   │   ├── tickets.routes.ts
│   │   ├── incidents.routes.ts
│   │   ├── volunteers.routes.ts
│   │   ├── notifications.routes.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── events.service.ts
│   │   ├── tickets.service.ts
│   │   ├── incidents.service.ts
│   │   ├── volunteers.service.ts
│   │   ├── notifications.service.ts
│   │   ├── email.service.ts
│   │   ├── sms.service.ts
│   │   ├── payment.service.ts
│   │   └── ai.service.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   └── upload.middleware.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── response.ts
│   │   ├── validation.ts
│   │   └── helpers.ts
│   ├── websocket/
│   │   ├── socket.ts
│   │   ├── handlers/
│   │   │   ├── metrics.handler.ts
│   │   │   ├── heatmap.handler.ts
│   │   │   ├── incidents.handler.ts
│   │   │   └── volunteers.handler.ts
│   │   └── middleware.ts
│   ├── workers/
│   │   ├── metrics.worker.ts
│   │   ├── heatmap.worker.ts
│   │   └── notifications.worker.ts
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   ├── events.validator.ts
│   │   └── incidents.validator.ts
│   ├── types/
│   │   ├── express.d.ts
│   │   ├── api.types.ts
│   │   └── database.types.ts
│   ├── app.ts
│   └── server.ts
├── prisma/ (or migrations/)
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Database Design

### Complete Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  role VARCHAR(50) NOT NULL CHECK (role IN ('attendee', 'organizer', 'admin')),
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

#### Events Table
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  venue VARCHAR(255),
  location VARCHAR(255),
  address JSONB,
  coordinates JSONB,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED')),
  category VARCHAR(100),
  description TEXT,
  detailed_description TEXT,
  image_url TEXT,
  expected_attendance INT,
  capacity INT,
  current_attendance INT DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  is_free BOOLEAN DEFAULT FALSE,
  crowd_status VARCHAR(50) DEFAULT 'calm' CHECK (crowd_status IN ('calm', 'moderate', 'busy', 'very_busy')),
  safety_score INT DEFAULT 0 CHECK (safety_score >= 0 AND safety_score <= 100),
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  best_gate VARCHAR(100),
  queue_time INT DEFAULT 0,
  amenities JSONB,
  parking_available BOOLEAN DEFAULT FALSE,
  wheelchair_accessible BOOLEAN DEFAULT FALSE,
  food_vendors INT DEFAULT 0,
  security_checkpoints INT DEFAULT 0,
  venue_map JSONB,
  schedule JSONB,
  lineup JSONB,
  policies JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_location ON events(location);
```

#### Tickets Table
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  ticket_type VARCHAR(100),
  quantity INT NOT NULL,
  total_paid DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  qr_code VARCHAR(255) UNIQUE NOT NULL,
  entry_gate VARCHAR(100),
  seat_section VARCHAR(50),
  seat_numbers JSONB,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled', 'refunded')),
  attendee_names JSONB,
  special_requirements JSONB,
  purchase_date TIMESTAMP DEFAULT NOW(),
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  used_at TIMESTAMP,
  payment_id VARCHAR(255),
  refund_id VARCHAR(255),
  refund_amount DECIMAL(10,2),
  refund_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE UNIQUE INDEX idx_tickets_qr ON tickets(qr_code);
```

#### Incidents Table
```sql
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('medical', 'security', 'crowd', 'safety', 'lost_found')),
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255),
  zone_id VARCHAR(100),
  coordinates JSONB,
  reported_by VARCHAR(255),
  reported_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter_contact VARCHAR(50),
  assigned_to VARCHAR(255),
  assigned_to_id UUID,
  assigned_team VARCHAR(100),
  priority VARCHAR(50) DEFAULT 'medium',
  reported_at TIMESTAMP DEFAULT NOW(),
  acknowledged_at TIMESTAMP,
  assigned_at TIMESTAMP,
  resolved_at TIMESTAMP,
  estimated_resolution_time TIMESTAMP,
  resolution_notes TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_incidents_event ON incidents(event_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_type ON incidents(type);
CREATE INDEX idx_incidents_reported_at ON incidents(reported_at DESC);
```

#### Incident Updates Table
```sql
CREATE TABLE incident_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type VARCHAR(50) CHECK (type IN ('status_change', 'assignment', 'note', 'resolution')),
  updated_by VARCHAR(255),
  updated_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_incident_updates_incident ON incident_updates(incident_id);
CREATE INDEX idx_incident_updates_created ON incident_updates(created_at DESC);
```

#### Volunteers Table
```sql
CREATE TABLE volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone_number VARCHAR(50) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(100) NOT NULL,
  zone VARCHAR(100),
  team VARCHAR(100),
  status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('active', 'break', 'offline')),
  current_task TEXT,
  last_location VARCHAR(255),
  last_location_coordinates JSONB,
  last_location_update TIMESTAMP,
  assigned_tasks INT DEFAULT 0,
  completed_tasks INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  skills JSONB,
  availability JSONB,
  joined_at TIMESTAMP DEFAULT NOW(),
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_volunteers_event ON volunteers(event_id);
CREATE INDEX idx_volunteers_user ON volunteers(user_id);
CREATE INDEX idx_volunteers_status ON volunteers(status);
```

#### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error', 'alert')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  action_label VARCHAR(100),
  image_url TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_event ON notifications(event_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

#### Live Metrics Table (Time-series)
```sql
CREATE TABLE live_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  current_attendees INT DEFAULT 0,
  check_ins INT DEFAULT 0,
  check_outs INT DEFAULT 0,
  active_volunteers INT DEFAULT 0,
  incident_reports INT DEFAULT 0,
  crowd_density INT DEFAULT 0,
  peak_attendance INT DEFAULT 0,
  average_stay_time INT DEFAULT 0,
  entry_rate INT DEFAULT 0,
  exit_rate INT DEFAULT 0,
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_live_metrics_event ON live_metrics(event_id);
CREATE INDEX idx_live_metrics_recorded ON live_metrics(recorded_at DESC);

-- Create hypertable if using TimescaleDB
-- SELECT create_hypertable('live_metrics', 'recorded_at');
```

#### Crowd Heatmap Table (Time-series)
```sql
CREATE TABLE crowd_heatmap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  zone_id VARCHAR(100) NOT NULL,
  zone_name VARCHAR(255),
  density INT CHECK (density >= 0 AND density <= 100),
  wait_time INT DEFAULT 0,
  capacity INT,
  current_count INT DEFAULT 0,
  status VARCHAR(50) CHECK (status IN ('normal', 'moderate', 'high', 'critical')),
  coordinates JSONB,
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_crowd_heatmap_event ON crowd_heatmap(event_id);
CREATE INDEX idx_crowd_heatmap_zone ON crowd_heatmap(zone_id);
CREATE INDEX idx_crowd_heatmap_recorded ON crowd_heatmap(recorded_at DESC);

-- Create hypertable if using TimescaleDB
-- SELECT create_hypertable('crowd_heatmap', 'recorded_at');
```

---

## Phase-by-Phase Implementation

### Phase 1: Foundation (Week 1-2)

#### Week 1: Setup & Authentication
- [x] Project initialization
- [x] Database setup (PostgreSQL)
- [x] Redis setup for caching
- [x] Environment configuration
- [x] Database migrations
- [x] User model & schema
- [x] JWT authentication
- [x] Register endpoint
- [x] Login endpoint
- [x] Token refresh endpoint
- [x] Password reset flow
- [x] Email verification
- [x] Auth middleware
- [x] Rate limiting

**Deliverables:**
- Working authentication system
- Database with users table
- JWT token generation/validation
- Password hashing (bcrypt)
- Email service integration

**Testing:**
```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","role":"attendee","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
```

#### Week 2: Core Event APIs
- [x] Event model & schema
- [x] Create event endpoint
- [x] List events endpoint (with filters)
- [x] Get event details endpoint
- [x] Update event endpoint
- [x] Delete event endpoint
- [x] Event status management
- [x] Event search functionality
- [x] Event categories
- [x] Public stats endpoint
- [x] Featured events endpoint

**Deliverables:**
- Full CRUD for events
- Search and filtering
- Public endpoints for landing page
- Organizer authorization checks

**Testing:**
```bash
# Create event (with auth token)
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Event","startTime":"2025-12-01T18:00:00Z","category":"Music"}'

# List events
curl http://localhost:3000/api/events?status=LIVE&category=Music
```

### Phase 2: Tickets & Bookings (Week 3)

- [x] Ticket model & schema
- [x] Purchase ticket endpoint
- [x] List user tickets endpoint
- [x] Get ticket details endpoint
- [x] Cancel/refund ticket endpoint
- [x] QR code generation
- [x] Ticket validation endpoint
- [x] Ticket transfer endpoint
- [x] Payment gateway integration (Stripe/Razorpay)
- [x] Receipt generation

**Deliverables:**
- Complete ticketing system
- QR code generation
- Payment processing
- Refund handling

### Phase 3: Incidents & Operations (Week 4)

- [x] Incident model & schema
- [x] Incident updates schema
- [x] Create incident endpoint
- [x] List incidents endpoint (with filters)
- [x] Update incident endpoint
- [x] Add incident update endpoint
- [x] Resolve incident endpoint
- [x] Incident statistics
- [x] File upload for attachments
- [x] Incident priority system

**Deliverables:**
- Full incident management system
- Update tracking
- File attachments
- Real-time incident updates (WebSocket)

### Phase 4: Volunteers (Week 5)

- [x] Volunteer model & schema
- [x] Register volunteer endpoint
- [x] List volunteers endpoint
- [x] Update volunteer endpoint
- [x] Assign task endpoint
- [x] Check-in/check-out endpoints
- [x] Volunteer location tracking
- [x] Volunteer analytics
- [x] Task management

**Deliverables:**
- Volunteer management system
- Task assignment
- Location tracking
- Performance metrics

### Phase 5: Real-Time Features (Week 6)

- [x] WebSocket server setup (Socket.IO)
- [x] Metrics broadcasting
- [x] Heatmap broadcasting
- [x] Incident broadcasting
- [x] Volunteer location broadcasting
- [x] Notification broadcasting
- [x] Connection authentication
- [x] Room management
- [x] Reconnection handling

**Deliverables:**
- WebSocket server
- Real-time data streaming
- Client connection management
- Automatic reconnection

### Phase 6: Notifications (Week 7)

- [x] Notification model & schema
- [x] Create notification endpoint
- [x] List notifications endpoint
- [x] Mark as read endpoint
- [x] Send bulk notifications
- [x] Push notification service (Amazon SNS Push)
- [x] Email notification service
- [x] SMS notification service
- [x] Notification preferences

**Deliverables:**
- Multi-channel notifications
- Bulk notification sending
- User preferences
- Delivery tracking

### Phase 7: Navigation & Maps (Week 8)

- [x] Navigation route calculation
- [x] Points of interest API
- [x] Emergency exits API
- [x] Crowd-aware routing
- [x] Accessible routing
- [x] Indoor navigation support
- [x] Map data integration

**Deliverables:**
- Route calculation
- POI management
- Accessibility features
- Real-time crowd data integration

### Phase 8: AI & Analytics (Week 9-10)

- [x] AI models management
- [x] Insights generation
- [x] Crowd prediction API
- [x] Analytics summary endpoint
- [x] Pattern analysis
- [x] ML model integration
- [x] Report generation

**Deliverables:**
- AI insights API
- Predictive analytics
- Event reports
- Performance metrics

### Phase 9: Testing & Optimization (Week 11-12)

- [x] Unit tests
- [x] Integration tests
- [x] E2E tests
- [x] Load testing
- [x] Performance optimization
- [x] Query optimization
- [x] Caching implementation
- [x] API documentation (Swagger)

**Deliverables:**
- Comprehensive test suite
- Performance benchmarks
- API documentation
- Optimization report

### Phase 10: Deployment (Week 13-14)

- [x] Production environment setup
- [x] CI/CD pipeline
- [x] Docker containerization
- [x] Database backups
- [x] Monitoring & logging
- [x] Security hardening
- [x] SSL certificates
- [x] CDN setup
- [x] Load balancing

**Deliverables:**
- Production deployment
- Monitoring dashboard
- Backup strategy
- Security audit

---

## API Implementation Details

### Authentication Implementation

**File: `src/controllers/auth.controller.ts`**

```typescript
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/database';
import { sendSuccessResponse, sendErrorResponse } from '../utils/response';
import { sendVerificationEmail } from '../services/email.service';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phoneNumber: z.string().optional(),
  role: z.enum(['attendee', 'organizer'])
});

export const register = async (req: Request, res: Response) => {
  try {
    // Validate request
    const data = registerSchema.parse(req.body);
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (existingUser) {
      return sendErrorResponse(res, 'Email already registered', 409, 'RESOURCE_CONFLICT');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);
    
    // Generate verification token
    const verificationToken = jwt.sign(
      { email: data.email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
    
    // Create user
    const user = await prisma.user.create({
      data: {
        ...data,
        passwordHash,
        emailVerificationToken: verificationToken
      }
    });
    
    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '30d' }
    );
    
    // Return response
    return sendSuccessResponse(res, {
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatarUrl,
        phoneNumber: user.phoneNumber,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.getTime()
      },
      expiresIn: 3600
    }, 201);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendErrorResponse(res, 'Validation failed', 400, 'VALIDATION_FAILED', error.errors);
    }
    console.error('Register error:', error);
    return sendErrorResponse(res, 'Internal server error', 500);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return sendErrorResponse(res, 'Invalid credentials', 401, 'AUTH_INVALID_CREDENTIALS');
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!validPassword) {
      return sendErrorResponse(res, 'Invalid credentials', 401, 'AUTH_INVALID_CREDENTIALS');
    }
    
    // Check role if specified
    if (role && user.role !== role) {
      return sendErrorResponse(res, 'Invalid role', 403, 'AUTH_INSUFFICIENT_PERMISSIONS');
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    
    // Generate tokens
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '30d' }
    );
    
    return sendSuccessResponse(res, {
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatarUrl,
        phoneNumber: user.phoneNumber,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.getTime()
      },
      expiresIn: 3600
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return sendErrorResponse(res, 'Internal server error', 500);
  }
};
```

### WebSocket Implementation

**File: `src/websocket/socket.ts`**

```typescript
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

let io: Server;

export const initializeWebSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }
  });
  
  // Authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });
  
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.data.user.id}`);
    
    // Handle subscriptions
    socket.on('subscribe:event', (eventId: string) => {
      socket.join(`event:${eventId}`);
      console.log(`User ${socket.data.user.id} subscribed to event ${eventId}`);
    });
    
    socket.on('subscribe:metrics', (eventId: string) => {
      socket.join(`metrics:${eventId}`);
    });
    
    socket.on('subscribe:heatmap', (eventId: string) => {
      socket.join(`heatmap:${eventId}`);
    });
    
    socket.on('subscribe:incidents', (eventId: string) => {
      socket.join(`incidents:${eventId}`);
    });
    
    socket.on('subscribe:volunteers', (eventId: string) => {
      socket.join(`volunteers:${eventId}`);
    });
    
    socket.on('subscribe:notifications', () => {
      socket.join(`notifications:${socket.data.user.id}`);
    });
    
    // Handle unsubscriptions
    socket.on('unsubscribe:event', (eventId: string) => {
      socket.leave(`event:${eventId}`);
    });
    
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.user.id}`);
    });
  });
  
  return io;
};

// Broadcast functions
export const broadcastMetrics = (eventId: string, metrics: any) => {
  if (io) {
    io.to(`metrics:${eventId}`).emit('metrics:update', metrics);
  }
};

export const broadcastHeatmap = (eventId: string, heatmap: any) => {
  if (io) {
    io.to(`heatmap:${eventId}`).emit('heatmap:update', heatmap);
  }
};

export const broadcastIncident = (eventId: string, type: string, incident: any) => {
  if (io) {
    io.to(`incidents:${eventId}`).emit(`incident:${type}`, incident);
  }
};

export const broadcastVolunteer = (eventId: string, type: string, volunteer: any) => {
  if (io) {
    io.to(`volunteers:${eventId}`).emit(`volunteer:${type}`, volunteer);
  }
};

export const broadcastNotification = (userId: string, notification: any) => {
  if (io) {
    io.to(`notifications:${userId}`).emit('notification:new', notification);
  }
};
```

---

## Real-Time Features

### Background Workers

**File: `src/workers/metrics.worker.ts`**

```typescript
import { prisma } from '../config/database';
import { broadcastMetrics } from '../websocket/socket';

export const startMetricsWorker = () => {
  setInterval(async () => {
    try {
      // Get all live events
      const liveEvents = await prisma.event.findMany({
        where: { status: 'LIVE' }
      });
      
      for (const event of liveEvents) {
        // Calculate metrics
        const currentAttendees = await prisma.ticket.count({
          where: {
            eventId: event.id,
            status: 'used'
          }
        });
        
        const activeVolunteers = await prisma.volunteer.count({
          where: {
            eventId: event.id,
            status: 'active'
          }
        });
        
        const incidentReports = await prisma.incident.count({
          where: {
            eventId: event.id,
            status: { in: ['open', 'in_progress'] }
          }
        });
        
        // Save metrics
        const metrics = await prisma.liveMetrics.create({
          data: {
            eventId: event.id,
            currentAttendees,
            activeVolunteers,
            incidentReports,
            crowdDensity: Math.floor((currentAttendees / event.capacity) * 100),
            recordedAt: new Date()
          }
        });
        
        // Broadcast to connected clients
        broadcastMetrics(event.id, {
          currentAttendees: metrics.currentAttendees,
          checkIns: metrics.checkIns,
          activeVolunteers: metrics.activeVolunteers,
          incidentReports: metrics.incidentReports,
          crowdDensity: metrics.crowdDensity,
          timestamp: metrics.recordedAt.getTime()
        });
      }
    } catch (error) {
      console.error('Metrics worker error:', error);
    }
  }, 3000); // Every 3 seconds
};
```

---

## Authentication & Security

### Middleware

**File: `src/middleware/auth.middleware.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendErrorResponse } from '../utils/response';
import { prisma } from '../config/database';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendErrorResponse(res, 'Authentication required', 401, 'AUTH_TOKEN_REQUIRED');
    }
    
    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return sendErrorResponse(res, 'User not found', 401, 'AUTH_INVALID_TOKEN');
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return sendErrorResponse(res, 'Token expired', 401, 'AUTH_TOKEN_EXPIRED');
    }
    return sendErrorResponse(res, 'Invalid token', 401, 'AUTH_INVALID_TOKEN');
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendErrorResponse(res, 'Authentication required', 401);
    }
    
    if (!roles.includes(req.user.role)) {
      return sendErrorResponse(res, 'Insufficient permissions', 403, 'AUTH_INSUFFICIENT_PERMISSIONS');
    }
    
    next();
  };
};
```

### Rate Limiting

**File: `src/middleware/rateLimit.middleware.ts`**

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis';

export const authRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many authentication attempts, please try again later'
});

export const apiRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:api:'
  }),
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});

export const writeRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:write:'
  }),
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many write requests, please slow down'
});
```

---

## Testing Strategy

### Unit Tests Example

**File: `tests/unit/auth.service.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import { registerUser, loginUser } from '../../src/services/auth.service';
import { prisma } from '../../src/config/database';

describe('Auth Service', () => {
  beforeEach(async () => {
    // Clean database
    await prisma.user.deleteMany();
  });
  
  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User',
        role: 'attendee' as const
      };
      
      const result = await registerUser(userData);
      
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.token).toBeDefined();
    });
    
    it('should hash the password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User',
        role: 'attendee' as const
      };
      
      await registerUser(userData);
      
      const user = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      expect(user).toBeDefined();
      expect(user!.passwordHash).not.toBe(userData.password);
      
      const validPassword = await bcrypt.compare(userData.password, user!.passwordHash);
      expect(validPassword).toBe(true);
    });
    
    it('should throw error if email already exists', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User',
        role: 'attendee' as const
      };
      
      await registerUser(userData);
      
      await expect(registerUser(userData)).rejects.toThrow('Email already registered');
    });
  });
  
  describe('loginUser', () => {
    it('should login user with correct credentials', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User',
        role: 'attendee' as const
      };
      
      await registerUser(userData);
      
      const result = await loginUser({
        email: userData.email,
        password: userData.password
      });
      
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
    });
    
    it('should throw error with incorrect password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User',
        role: 'attendee' as const
      };
      
      await registerUser(userData);
      
      await expect(loginUser({
        email: userData.email,
        password: 'WrongPassword123!'
      })).rejects.toThrow('Invalid credentials');
    });
  });
});
```

---

## Deployment Guide

### Environment Variables

**File: `.env.example`**

```env
# Server
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://drishtix.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/drishtix
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@drishtix.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Payment (Stripe)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Storage (AWS S3)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=drishtix-uploads
AWS_REGION=us-east-1

# Push Notifications (Amazon SNS Push)
Amazon SNS Push_SERVER_KEY=your-Amazon SNS Push-server-key

# Monitoring
SENTRY_DSN=your-sentry-dsn

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Docker Compose

**File: `docker-compose.yml`**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/drishtix
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: drishtix
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Dockerfile

**File: `Dockerfile`**

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run build
RUN npx prisma generate

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3000

CMD ["npm", "start"]
```

---

## Next Steps

1. **Start with Phase 1** - Set up authentication and core infrastructure
2. **Follow the phases** - Complete each phase before moving to next
3. **Test continuously** - Write tests as you build features
4. **Replace mock data** - Update frontend to use real APIs
5. **Monitor performance** - Use tools like New Relic or DataDog
6. **Deploy gradually** - Start with staging, then production

---

## Resources

- **Frontend Code**: `/drishti-frontend/src/`
- **Mock Backend**: `/drishti-frontend/src/services/mockBackend.ts`
- **API Reference**: `/docs/API_REFERENCE_V2.md`
- **Feature Mapping**: `/docs/FRONTEND_BACKEND_MAPPING.md`

---

**Last Updated**: January 2, 2026  
**Version**: 1.0  
**Status**: Ready for Implementation
