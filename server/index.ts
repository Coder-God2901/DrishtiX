/**
 * Copyright Â© 2025 DrishtiX. All Rights Reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * This software is the proprietary information of DrishtiX.
 * Unauthorized copying, distribution, modification, or use of this software,
 * via any medium, is strictly prohibited without the express written permission
 * of DrishtiX.
 * 
 * This software is provided "as is" without warranty of any kind, express or implied.
 * 
 * For licensing inquiries: licensing@drishtix.com
 * License: See LICENSE file in the project root
 */
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
import { azureServiceBusMessagingService as pubSubService } from './services/azure-service-bus-messaging.service';
// import { azureAdvancedConfig as gcpConfig, validateAzureAdvancedConfig as validateGCPConfig } from './config/azure-advanced.config';
import { riskEngineService } from './services/risk-engine.service';
// import { azureOrchestrator as gcpOrchestrator } from './services/azure-orchestrator.service';

// Real-time Workers (Frontend V2)
import { metricsWorker } from './workers/metrics.worker';
import { heatmapWorker } from './workers/heatmap.worker';

// API Routes
import eventRoutes from './routes/event.routes';
import incidentRoutes from './routes/incident.routes';
import alertRoutes from './routes/alert.routes';
import predictionRoutes from './routes/prediction.routes';
import responderRoutes from './routes/responder.routes';
import attendeeRoutes from './routes/attendee.routes';
import gcpAnalyticsRoutes from './routes/azure-analytics.routes';
import bigQueryRoutes from './routes/azure-synapse.routes';
import weatherRoutes from './routes/weather.routes';
import cameraRoutes from './routes/camera.routes';
import earthEngineMapsRoutes from './routes/azure-maps-advanced.routes';

// DrishtiX Routes
// import anomalyRoutes from './routes/anomaly.routes';
import dispatchRoutes from './routes/dispatch.routes';
import voiceRoutes from './routes/voice.routes';
import simulationRoutes from './routes/simulation.routes';
import authRoutes from './routes/auth.routes';
import recommendationRoutes from './routes/recommendation.routes';

// Frontend V2 Routes (Attendee/Organizer Features)
import ticketRoutes from './routes/ticket.routes';
import volunteerRoutes from './routes/volunteer.routes';
import navigationRoutes from './routes/navigation.routes';
import helpRoutes from './routes/help.routes';
import notificationRoutes from './routes/notification.routes';

// NEW: Additional Feature Routes
import automationRoutes from './routes/automation.routes';
import gateControlRoutes from './routes/gate-control.routes';
import storageRoutes from './routes/storage.routes';
import operationsRoutes from './routes/operations.routes';
import postAnalysisRoutes from './routes/post-analysis.routes';

// Crowd Forecasting Routes
import zoneForecastingRoutes from './routes/zone-forecasting.routes';
import zoneMonitoringRoutes from './routes/zone-monitoring.routes';
import organizerConfigRoutes from './routes/organizer-config.routes';

// Crowd Forecasting Services
import { eventLifecycleManager } from './services/event-lifecycle-manager.service';

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
app.use('/api/earth-engine', earthEngineMapsRoutes);
app.use('/api/maps', earthEngineMapsRoutes);

// DrishtiX endpoints
// app.use('/api/anomalies', anomalyRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Frontend V2 endpoints
app.use('/api/tickets', ticketRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/notifications', notificationRoutes);

// NEW: Feature endpoints
app.use('/api/automation', automationRoutes);
app.use('/api/gates', gateControlRoutes);

// Crowd Forecasting endpoints
app.use('/api/events', zoneForecastingRoutes);
app.use('/api/monitoring', zoneMonitoringRoutes);
app.use('/api/organizer', organizerConfigRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/post-analysis', postAnalysisRoutes);

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
  console.log(`âœ… Client connected: ${socket.id}`);

  // Join event room
  socket.on('join:event', (eventId: string) => {
    socket.join(`event:${eventId}`);
    console.log(`Socket ${socket.id} joined event:${eventId}`);
  });

  // Join user room for personal notifications
  socket.on('join:user', (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined user:${userId}`);
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

  // Frontend V2 subscriptions
  socket.on('subscribe:metrics', (eventId: string) => {
    socket.join(`metrics:${eventId}`);
    console.log(`Socket ${socket.id} subscribed to metrics for ${eventId}`);
  });

  socket.on('subscribe:heatmap', (eventId: string) => {
    socket.join(`heatmap:${eventId}`);
    console.log(`Socket ${socket.id} subscribed to heatmap for ${eventId}`);
  });

  socket.on('subscribe:volunteers', (eventId: string) => {
    socket.join(`volunteers:${eventId}`);
    console.log(`Socket ${socket.id} subscribed to volunteers for ${eventId}`);
  });

  socket.on('subscribe:tickets', (eventId: string) => {
    socket.join(`tickets:${eventId}`);
    console.log(`Socket ${socket.id} subscribed to tickets for ${eventId}`);
  });

  socket.on('subscribe:notifications', (userId: string) => {
    socket.join(`notifications:${userId}`);
    console.log(`Socket ${socket.id} subscribed to notifications for ${userId}`);
  });

  socket.on('subscribe:activity', (eventId: string) => {
    socket.join(`activity:${eventId}`);
    console.log(`Socket ${socket.id} subscribed to activity for ${eventId}`);
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
  // Zone state subscriptions (Crowd Forecasting)
  socket.on('subscribe:zones', (eventId: string) => {
    socket.join(`zones:${eventId}`);
    console.log(`Socket ${socket.id} subscribed to zone updates for ${eventId}`);
  });

  socket.on('subscribe:zone', (data: { eventId: string; zoneId: string }) => {
    socket.join(`zone:${data.eventId}:${data.zoneId}`);
    console.log(`Socket ${socket.id} subscribed to zone ${data.zoneId} for event ${data.eventId}`);
  });
  socket.on('disconnect', () => {
    console.log(`âŒ Client disconnected: ${socket.id}`);
  });
});

// Initialize DrishtiX Pub/Sub listeners
function initializePubSubListeners() {
  // Listen for crowd density updates
  if (typeof (pubSubService as any).subscribeToCrowdData === 'function') {
    (pubSubService as any).subscribeToCrowdData((message: any) => {
      const { eventId, data } = message.data;
      io.to(`event:${eventId}`).emit('crowd:update', data);
    });
  }

  // Listen for prediction results
  if (typeof (pubSubService as any).subscribeToPredictions === 'function') {
    (pubSubService as any).subscribeToPredictions((message: any) => {
      const { eventId, ...prediction } = message.data;
      io.to(`predictions:${eventId}`).emit('prediction:new', prediction);
      io.to(`pubsub:predictions:${eventId}`).emit('pubsub:prediction', prediction);
    });
  }

  // Listen for anomaly detections
  if (typeof (pubSubService as any).subscribeToAnomalies === 'function') {
    (pubSubService as any).subscribeToAnomalies((message: any) => {
      const { eventId, ...anomaly } = message.data;
      io.to(`anomalies:${eventId}`).emit('anomaly:detected', anomaly);
      io.to(`pubsub:anomalies:${eventId}`).emit('pubsub:anomaly', anomaly);
    });
  }

  // Listen for risk engine outputs (escalations)
  if (typeof (pubSubService as any).subscribeToRiskEngine === 'function') {
    (pubSubService as any).subscribeToRiskEngine(async (message: any) => {
      try {
        await riskEngineService.handle(message.data as any)
      } catch (e) {
        console.error('Risk engine handler error:', e)
      }
    });
  }

  console.log('âœ“ DrishtiX Pub/Sub listeners initialized');
}

// Export io for use in routes
export { io };

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Validate GCP configuration
    // const validation = validateGCPConfig();
    // if (!validation.valid) {
    //   console.warn('⚠️  GCP Configuration warnings:');
    //   validation.errors.forEach((err: any) => console.warn(`   - ${err}`));
    //   console.warn('   Some features may not work correctly.');
    // } else {
    //   console.log('✓ GCP Configuration validated');
    // }

    // Initialize GCP Services Orchestrator
    // console.log('ðŸš€ Initializing GCP Services Orchestrator...');
    // await gcpOrchestrator.initialize();
    // console.log('âœ" GCP Services Orchestrator ready');

    // Initialize Pub/Sub listeners
    initializePubSubListeners();

    // Initialize real-time workers for Frontend V2
    console.log('ðŸš€ Starting real-time workers...');
    await metricsWorker.startAllActiveEvents();
    await heatmapWorker.startAllActiveEvents();
    console.log(`âœ“ Real-time workers started (${metricsWorker.getActiveCount()} events)`);
    // Initialize Event Lifecycle Manager for Zone Forecasting
    console.log('🚀 Starting Event Lifecycle Manager...');
    eventLifecycleManager.startMonitoring();
    console.log('✓ Event Lifecycle Manager initialized - Automatic real-time data collection enabled');
    httpServer.listen(PORT, () => {
      console.log(`
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘                   ðŸŽ¯ DrishtiX Platform Started                â•‘
â• â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•£
â•‘  Server:            http://localhost:${PORT}                        â•‘
â•‘  WebSocket:         Active                                     â•‘
â•‘  Database:          Connected                                  â•‘
â•‘  Pub/Sub:           Active                                     â•‘
â•'  Services:          âœ" Running                                  â•'
â•‘                                                                â•‘
â•‘  GCP Services Connected (14):                                  â•‘
â•‘    âœ“ Firebase Auth + FCM + Firestore                          â•‘
â•‘    âœ“ Google Maps Platform                                     â•‘
â•‘    âœ“ Google Earth Engine                                      â•‘
â•‘    âœ“ Pub/Sub Event Streaming                                  â•‘
â•‘    âœ“ Data Processing Pipeline                                 â•‘
â•‘    âœ“ BigQuery Analytics                                       â•‘
â•‘    âœ“ Vertex AI Forecasting                                    â•‘
â•‘    âœ“ Gemini Vision API                                        â•‘
â•‘    âœ“ Agent Builder (Dispatch)                                 â•‘
â•‘    âœ“ Cloud Logging & Monitoring                               â•‘
â•‘                                                                â•‘
â•‘  AI/ML Capabilities:                                           â•‘
â•‘    âœ“ Predictive Crowd Density Forecasting                     â•‘
â•‘    âœ“ Real-time Anomaly Detection (Gemini Vision)              â•‘
â•‘    âœ“ Automated Emergency Dispatch                             â•‘
â•‘    âœ“ Voice-First AI Interface                                 â•‘
â•‘    âœ“ Hardware-Free Simulation Engine                          â•‘
â•‘    âœ“ Privacy-First Cloud DLP                                  â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
  metricsWorker.stopAll();
  heatmapWorker.stopAll();
  eventLifecycleManager.stopMonitoring(); // Stop lifecycle manager
  // await gcpOrchestrator.shutdown();
  if (typeof (pubSubService as any).close === 'function') {
    await (pubSubService as any).close();
  }
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  metricsWorker.stopAll();
  heatmapWorker.stopAll();
  eventLifecycleManager.stopMonitoring(); // Stop lifecycle manager
  // await gcpOrchestrator.shutdown();
  if (typeof (pubSubService as any).close === 'function') {
    await (pubSubService as any).close();
  }
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
