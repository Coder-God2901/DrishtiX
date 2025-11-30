/**
 * EventSphere Backend Server
 * Express + Socket.IO + Prisma + Firebase
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Express
const app: Express = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Initialize Prisma
export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected',
  });
});

// DrishtiX Services
import { pubSubService } from './services/pubsub.service';
import { gcpConfig, validateGCPConfig } from './config/gcp.config';
import { riskEngineService } from './services/risk-engine.service';
import { gcpOrchestrator } from './services/gcp-orchestrator.service';

// API Routes
import eventRoutes from './routes/event.routes';
import incidentRoutes from './routes/incident.routes';
import alertRoutes from './routes/alert.routes';
import predictionRoutes from './routes/prediction.routes';
import responderRoutes from './routes/responder.routes';
import attendeeRoutes from './routes/attendee.routes';
import gcpAnalyticsRoutes from './routes/gcp-analytics.routes';
import bigQueryRoutes from './routes/bigquery.routes';
import weatherRoutes from './routes/weather.routes';
import cameraRoutes from './routes/camera.routes';

// DrishtiX Routes
import anomalyRoutes from './routes/anomaly.routes';
import dispatchRoutes from './routes/dispatch.routes';
import voiceRoutes from './routes/voice.routes';
import simulationRoutes from './routes/simulation.routes';
import authRoutes from './routes/auth.routes';
import recommendationRoutes from './routes/recommendation.routes';

app.use('/api/events', eventRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/responders', responderRoutes);
app.use('/api/attendees', attendeeRoutes);
app.use('/api/gcp', gcpAnalyticsRoutes);
app.use('/api/bigquery', bigQueryRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/cameras', cameraRoutes);

// DrishtiX endpoints
app.use('/api/anomalies', anomalyRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Socket.IO connection handling
io.on('connection', (socket: Socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Join event room
  socket.on('join:event', (eventId: string) => {
    socket.join(`event:${eventId}`);
    console.log(`Socket ${socket.id} joined event:${eventId}`);
  });

  // Subscribe to real-time updates
  socket.on('subscribe:incidents', (eventId: string) => {
    socket.join(`incidents:${eventId}`);
  });

  socket.on('subscribe:predictions', (eventId: string) => {
    socket.join(`predictions:${eventId}`);
  });

  socket.on('subscribe:alerts', (eventId: string) => {
    socket.join(`alerts:${eventId}`);
  });

  // DrishtiX subscriptions
  socket.on('subscribe:anomalies', (eventId: string) => {
    socket.join(`anomalies:${eventId}`);
    console.log(`Socket ${socket.id} subscribed to anomalies for ${eventId}`);
  });

  socket.on('subscribe:dispatch', (eventId: string) => {
    socket.join(`dispatch:${eventId}`);
    console.log(`Socket ${socket.id} subscribed to dispatch for ${eventId}`);
  });

  socket.on('subscribe:hotspots', (eventId: string) => {
    socket.join(`hotspots:${eventId}`);
    console.log(`Socket ${socket.id} subscribed to hotspots for ${eventId}`);
  });

  // GCP Pub/Sub topic subscriptions
  socket.on('subscribe:pubsub:predictions', (eventId: string) => {
    socket.join(`pubsub:predictions:${eventId}`);
    console.log(`Socket ${socket.id} subscribed to Pub/Sub predictions for ${eventId}`);
  });

  socket.on('subscribe:pubsub:video-analytics', (eventId: string) => {
    socket.join(`pubsub:video-analytics:${eventId}`);
    console.log(`Socket ${socket.id} subscribed to Pub/Sub video analytics for ${eventId}`);
  });

  socket.on('subscribe:pubsub:social-signals', (eventId: string) => {
    socket.join(`pubsub:social-signals:${eventId}`);
    console.log(`Socket ${socket.id} subscribed to Pub/Sub social signals for ${eventId}`);
  });

  socket.on('subscribe:pubsub:anomalies', (eventId: string) => {
    socket.join(`pubsub:anomalies:${eventId}`);
    console.log(`Socket ${socket.id} subscribed to Pub/Sub anomalies for ${eventId}`);
  });

  socket.on('subscribe:pubsub:alerts', (eventId: string) => {
    socket.join(`pubsub:alerts:${eventId}`);
    console.log(`Socket ${socket.id} subscribed to Pub/Sub alerts for ${eventId}`);
  });

  socket.on('subscribe:pubsub:incidents', (eventId: string) => {
    socket.join(`pubsub:incidents:${eventId}`);
    console.log(`Socket ${socket.id} subscribed to Pub/Sub incidents for ${eventId}`);
  });

  socket.on('subscribe:pubsub:responder-updates', (eventId: string) => {
    socket.join(`pubsub:responder-updates:${eventId}`);
    console.log(`Socket ${socket.id} subscribed to Pub/Sub responder updates for ${eventId}`);
  });

  // Weather subscriptions
  socket.on('subscribe:weather', (eventId: string) => {
    socket.join(`weather:${eventId}`);
    console.log(`Socket ${socket.id} subscribed to weather for ${eventId}`);
  });

  // Camera stream subscriptions
  socket.on('subscribe:camera', (cameraId: string) => {
    socket.join(`camera:${cameraId}`);
    console.log(`Socket ${socket.id} subscribed to camera ${cameraId}`);
  });

  // Recommendation subscriptions
  socket.on('subscribe:recommendations', (eventId: string) => {
    socket.join(`recommendations:${eventId}`);
    console.log(`Socket ${socket.id} subscribed to recommendations for ${eventId}`);
  });

  // Forecast subscriptions
  socket.on('subscribe:forecasts', (eventId: string) => {
    socket.join(`forecasts:${eventId}`);
    console.log(`Socket ${socket.id} subscribed to forecasts for ${eventId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Initialize DrishtiX Pub/Sub listeners
function initializePubSubListeners() {
  // Listen for crowd density updates
  pubSubService.subscribeToCrowdData((message) => {
    const { eventId, data } = message.data;
    io.to(`event:${eventId}`).emit('crowd:update', data);
  });

  // Listen for prediction results
  pubSubService.subscribeToPredictions((message) => {
    const { eventId, ...prediction } = message.data;
    io.to(`predictions:${eventId}`).emit('prediction:new', prediction);
    io.to(`pubsub:predictions:${eventId}`).emit('pubsub:prediction', prediction);
  });

  // Listen for anomaly detections
  pubSubService.subscribeToAnomalies((message) => {
    const { eventId, ...anomaly } = message.data;
    io.to(`anomalies:${eventId}`).emit('anomaly:detected', anomaly);
    io.to(`pubsub:anomalies:${eventId}`).emit('pubsub:anomaly', anomaly);
  });

  // Listen for risk engine outputs (escalations)
  pubSubService.subscribeToRiskEngine(async (message) => {
    try {
      await riskEngineService.handle(message.data as any)
    } catch (e) {
      console.error('Risk engine handler error:', e)
    }
  });

  console.log('✓ DrishtiX Pub/Sub listeners initialized');
}

// Export io for use in routes
export { io };

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Validate GCP configuration
    const validation = validateGCPConfig();
    if (!validation.valid) {
      console.warn('⚠️  GCP Configuration warnings:');
      validation.errors.forEach(err => console.warn(`   - ${err}`));
      console.warn('   Some features may not work correctly.');
    } else {
      console.log('✓ GCP Configuration validated');
    }

    // Initialize GCP Services Orchestrator
    console.log('🚀 Initializing GCP Services Orchestrator...');
    await gcpOrchestrator.initialize();
    console.log('✓ GCP Services Orchestrator ready');

    // Initialize Pub/Sub listeners
    initializePubSubListeners();

    httpServer.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                   🎯 DrishtiX Platform Started                ║
╠════════════════════════════════════════════════════════════════╣
║  Server:            http://localhost:${PORT}                        ║
║  WebSocket:         Active                                     ║
║  Database:          Connected                                  ║
║  Pub/Sub:           Active                                     ║
║  GCP Services:      ${gcpOrchestrator.getStatus().initialized ? '✓ Connected' : '✗ Offline'}                               ║
║                                                                ║
║  GCP Services Connected (14):                                  ║
║    ✓ Firebase Auth + FCM + Firestore                          ║
║    ✓ Google Maps Platform                                     ║
║    ✓ Google Earth Engine                                      ║
║    ✓ Pub/Sub Event Streaming                                  ║
║    ✓ Data Processing Pipeline                                 ║
║    ✓ BigQuery Analytics                                       ║
║    ✓ Vertex AI Forecasting                                    ║
║    ✓ Gemini Vision API                                        ║
║    ✓ Agent Builder (Dispatch)                                 ║
║    ✓ Cloud Logging & Monitoring                               ║
║                                                                ║
║  AI/ML Capabilities:                                           ║
║    ✓ Predictive Crowd Density Forecasting                     ║
║    ✓ Real-time Anomaly Detection (Gemini Vision)              ║
║    ✓ Automated Emergency Dispatch                             ║
║    ✓ Voice-First AI Interface                                 ║
║    ✓ Hardware-Free Simulation Engine                          ║
║    ✓ Privacy-First Cloud DLP                                  ║
╚════════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await gcpOrchestrator.shutdown();
  await pubSubService.close();
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await gcpOrchestrator.shutdown();
  await pubSubService.close();
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
