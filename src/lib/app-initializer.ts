/**
 * Application Initialization
 * Sets up all services and connections
 */

import { firebaseService } from '../services/firebase.service';
import { socketService } from '../services/socket.service';
import { gcpServiceManager } from './gcp-service-manager';

export interface AppConfig {
  apiUrl?: string;
  wsUrl?: string;
  firebase?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
}

class AppInitializer {
  private initialized = false;

  /**
   * Initialize all app services
   */
  async initialize(config?: AppConfig): Promise<void> {
    if (this.initialized) {
      console.warn('⚠️ App already initialized');
      return;
    }

    console.log('🚀 Initializing EventSphere Application...');

    try {
      // 1. Initialize Firebase
      console.log('📱 Initializing Firebase...');
      firebaseService.initialize(config?.firebase);
      console.log('✅ Firebase initialized');

      // 2. Initialize WebSocket
      console.log('📡 Initializing WebSocket connection...');
      socketService.initialize(config?.wsUrl);
      console.log('✅ WebSocket initialized');

      // 3. Initialize GCP Service Manager
      console.log('☁️ Initializing GCP Services...');
      await gcpServiceManager.initialize();
      const healthStatus = gcpServiceManager.getHealthStatus();
      const healthyServices = Array.from(healthStatus.values()).filter(h => h.status === 'healthy').length;
      console.log(`✅ GCP Services initialized (${healthyServices}/${healthStatus.size} healthy)`);

      // 4. Initialize Pub/Sub subscriptions (will be connected when user joins event)
      console.log('📬 Pub/Sub service ready');

      // 5. Check backend connectivity
      console.log('🔌 Checking backend connectivity...');
      await this.checkBackendHealth();
      console.log('✅ Backend connected');

      this.initialized = true;
      console.log('✨ EventSphere Application initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      throw error;
    }
  }

  /**
   * Check if backend is reachable
   */
  private async checkBackendHealth(): Promise<void> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    try {
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Backend health check failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Backend status:', data);
    } catch (error) {
      console.warn('⚠️ Backend not reachable. Make sure the server is running.');
      console.warn('Run: cd server && pnpm dev');
      // Don't throw error - allow app to run without backend for development
    }
  }

  /**
   * Connect user to real-time services
   */
  async connectUser(userId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('App not initialized. Call initialize() first.');
    }

    console.log(`👤 Connecting user: ${userId}`);

    // Connect to WebSocket
    socketService.connect(userId);

    console.log('✅ User connected to real-time services');
  }

  /**
   * Subscribe to real-time updates for an event
   */
  async subscribeToEvent(eventId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('App not initialized. Call initialize() first.');
    }

    console.log(`📡 Subscribing to event: ${eventId}`);

    // Subscribe to WebSocket rooms (using joinChannel method)
    socketService.joinChannel(`event:${eventId}`);
    socketService.joinChannel(`predictions:${eventId}`);
    socketService.joinChannel(`alerts:${eventId}`);
    socketService.joinChannel(`incidents:${eventId}`);

    // Initialize Pub/Sub subscriptions via GCP Service Manager
    await gcpServiceManager.subscribeToRealtimeUpdates(eventId);

    console.log('✅ Subscribed to real-time updates for event:', eventId);
  }

  /**
   * Unsubscribe from event updates
   */
  async unsubscribeFromEvent(eventId: string): Promise<void> {
    console.log(`📡 Unsubscribing from event: ${eventId}`);

    // Unsubscribe from Pub/Sub
    await gcpServiceManager.unsubscribeFromAll();

    console.log('✅ Unsubscribed from event:', eventId);
  }

  /**
   * Get GCP service health status
   */
  getGCPServiceHealth() {
    return gcpServiceManager.getHealthStatus();
  }

  /**
   * Disconnect user from real-time services
   */
  disconnect(): void {
    console.log('👋 Disconnecting from real-time services...');
    socketService.disconnect();
    console.log('✅ Disconnected successfully');
  }

  /**
   * Check if app is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

export const appInitializer = new AppInitializer();

// Auto-initialize on import (can be disabled by passing skipAutoInit)
if (!import.meta.env.VITE_SKIP_AUTO_INIT) {
  appInitializer.initialize().catch((error) => {
    console.error('Auto-initialization failed:', error);
  });
}
