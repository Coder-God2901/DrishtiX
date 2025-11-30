/**
 * useGCPRealtime Hook
 * Connects UI components to GCP Pub/Sub real-time data streams
 */

import { useEffect, useState, useCallback } from 'react';
import { gcpServiceManager } from '@/lib/gcp-service-manager';
import { socketService } from '@/services/socket.service';

export interface RealtimePrediction {
  eventId: string;
  zoneId?: string; // Zone identifier for spatial predictions
  timestamp: Date;
  predictedCount: number;
  predictedDensity: number;
  densityLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  gridPredictions: any[];
  hotspots: any[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface RealtimeVideoFrame {
  cameraId: string;
  cameraName: string;
  timestamp: Date;
  peopleCount: number;
  densityLevel: 'low' | 'medium' | 'high' | 'critical';
  anomalies: string[];
  confidence: number;
  heatmapUrl?: string;
  frameUrl?: string;
  thumbnailUrl?: string;
}

export interface RealtimeSocialSignal {
  timestamp: Date;
  source: 'twitter' | 'facebook' | 'instagram';
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  score: number;
  text: string;
  author?: string;
  location?: string;
}

export interface RealtimeAnomaly {
  timestamp: Date;
  type: 'crowd_surge' | 'bottleneck' | 'unusual_movement' | 'stationary_crowd' | 'panic_indicators';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: { lat: number; lon: number };
  description: string;
  confidence: number;
}

export interface RealtimeAlert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'danger' | 'critical';
  title: string;
  message: string;
  location?: { lat: number; lon: number };
  timestamp: Date;
}

export interface RealtimeIncident {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'contained' | 'resolved';
  location: { lat: number; lon: number };
  description: string;
  timestamp: Date;
}

export interface RealtimeResponderUpdate {
  responderId: string;
  name: string;
  role: string;
  status: 'available' | 'dispatched' | 'on_scene' | 'returning';
  location: { lat: number; lon: number };
  assignedIncidentId?: string;
  timestamp: Date;
}

export interface UseGCPRealtimeOptions {
  eventId?: string;
  enablePredictions?: boolean;
  enableVideoAnalytics?: boolean;
  enableSocialSignals?: boolean;
  enableAnomalies?: boolean;
  enableAlerts?: boolean;
  enableIncidents?: boolean;
  enableResponderUpdates?: boolean;
}

export interface UseGCPRealtimeReturn {
  predictions: RealtimePrediction[];
  videoFrames: RealtimeVideoFrame[];
  socialSignals: RealtimeSocialSignal[];
  anomalies: RealtimeAnomaly[];
  alerts: RealtimeAlert[];
  incidents: RealtimeIncident[];
  responderUpdates: RealtimeResponderUpdate[];
  isConnected: boolean;
  gcpServicesHealth: Map<string, any>;
  subscribe: (eventId: string) => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function useGCPRealtime(options: UseGCPRealtimeOptions = {}): UseGCPRealtimeReturn {
  const {
    eventId,
    enablePredictions = true,
    enableVideoAnalytics = true,
    enableSocialSignals = true,
    enableAnomalies = true,
    enableAlerts = true,
    enableIncidents = true,
    enableResponderUpdates = true,
  } = options;

  const [predictions, setPredictions] = useState<RealtimePrediction[]>([]);
  const [videoFrames, setVideoFrames] = useState<RealtimeVideoFrame[]>([]);
  const [socialSignals, setSocialSignals] = useState<RealtimeSocialSignal[]>([]);
  const [anomalies, setAnomalies] = useState<RealtimeAnomaly[]>([]);
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([]);
  const [incidents, setIncidents] = useState<RealtimeIncident[]>([]);
  const [responderUpdates, setResponderUpdates] = useState<RealtimeResponderUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [gcpServicesHealth, setGcpServicesHealth] = useState(new Map());

  // Subscribe to event
  const subscribe = useCallback(async (targetEventId: string) => {
    try {
      console.log(`🔌 Subscribing to GCP real-time updates for event: ${targetEventId}`);

      // Subscribe to Pub/Sub topics via GCP Service Manager
      await gcpServiceManager.subscribeToRealtimeUpdates(targetEventId);

      // Get initial service health
      setGcpServicesHealth(gcpServiceManager.getHealthStatus());

      setIsConnected(true);
      console.log('✅ Successfully subscribed to GCP real-time updates');
    } catch (error) {
      console.error('❌ Failed to subscribe to GCP real-time updates:', error);
      setIsConnected(false);
    }
  }, []);

  // Unsubscribe from event
  const unsubscribe = useCallback(async () => {
    try {
      console.log('🔌 Unsubscribing from GCP real-time updates');
      await gcpServiceManager.unsubscribeFromAll();
      setIsConnected(false);
      console.log('✅ Successfully unsubscribed from GCP real-time updates');
    } catch (error) {
      console.error('❌ Failed to unsubscribe from GCP real-time updates:', error);
    }
  }, []);

  // Listen for Pub/Sub events
  useEffect(() => {
    if (!eventId) return;

    // Predictions from Pub/Sub
    if (enablePredictions) {
      const handlePrediction = (data: any) => {
        const prediction: RealtimePrediction = {
          eventId: data.eventId,
          timestamp: new Date(data.timestamp),
          predictedCount: data.predictedCount,
          predictedDensity: data.predictedDensity,
          densityLevel: data.densityLevel,
          confidence: data.confidence,
          gridPredictions: data.gridPredictions || [],
          hotspots: data.hotspots || [],
          riskLevel: data.riskLevel,
        };
        setPredictions((prev) => [prediction, ...prev].slice(0, 50)); // Keep last 50
      };

      window.addEventListener('gcp-pubsub-predictions', handlePrediction as any);
      socketService.onMessageReceived(handlePrediction);
    }

    // Video analytics from Pub/Sub
    if (enableVideoAnalytics) {
      const handleVideoFrame = (data: any) => {
        if (!data.cameraId) return;
        const frame: RealtimeVideoFrame = {
          cameraId: data.cameraId,
          cameraName: data.cameraName || `Camera ${data.cameraId}`,
          timestamp: new Date(data.timestamp),
          peopleCount: data.peopleCount,
          densityLevel: data.densityLevel,
          anomalies: data.anomalies || [],
          confidence: data.confidence,
          heatmapUrl: data.heatmapUrl,
          frameUrl: data.frameUrl,
        };
        setVideoFrames((prev) => {
          const filtered = prev.filter(f => f.cameraId !== data.cameraId);
          return [frame, ...filtered].slice(0, 20); // Keep last 20
        });
      };

      window.addEventListener('gcp-pubsub-video-analytics', handleVideoFrame as any);
      socketService.onMessageReceived(handleVideoFrame);
    }

    // Social signals from Pub/Sub
    if (enableSocialSignals) {
      const handleSocialSignal = (data: any) => {
        if (!data.source || !data.sentiment) return;
        const signal: RealtimeSocialSignal = {
          timestamp: new Date(data.timestamp),
          source: data.source,
          sentiment: data.sentiment,
          score: data.score,
          text: data.text,
          author: data.author,
          location: data.location,
        };
        setSocialSignals((prev) => [signal, ...prev].slice(0, 100)); // Keep last 100
      };

      window.addEventListener('gcp-pubsub-social-signals', handleSocialSignal as any);
      socketService.onMessageReceived(handleSocialSignal);
    }

    // Anomalies from Pub/Sub
    if (enableAnomalies) {
      const handleAnomaly = (data: any) => {
        if (!data.type) return;
        const anomaly: RealtimeAnomaly = {
          timestamp: new Date(data.timestamp),
          type: data.type,
          severity: data.severity,
          location: data.location,
          description: data.description,
          confidence: data.confidence,
        };
        setAnomalies((prev) => [anomaly, ...prev].slice(0, 50)); // Keep last 50
      };

      window.addEventListener('gcp-pubsub-anomalies', handleAnomaly as any);
      socketService.onMessageReceived(handleAnomaly);
    }

    // Alerts from Pub/Sub
    if (enableAlerts) {
      const handleAlert = (data: any) => {
        if (!data.type) return;
        const alert: RealtimeAlert = {
          id: data.id || `alert-${Date.now()}`,
          type: data.type,
          severity: data.severity,
          title: data.title,
          message: data.message,
          location: data.location,
          timestamp: new Date(data.timestamp || Date.now()),
        };
        setAlerts((prev) => [alert, ...prev].slice(0, 30)); // Keep last 30
      };

      window.addEventListener('gcp-pubsub-alerts', handleAlert as any);
      socketService.onMessageReceived(handleAlert);
    }

    // Incidents from Pub/Sub
    if (enableIncidents) {
      const handleIncident = (data: any) => {
        if (!data.id) return;
        const incident: RealtimeIncident = {
          id: data.id,
          type: data.type,
          severity: data.severity,
          status: data.status,
          location: data.location,
          description: data.description,
          timestamp: new Date(data.timestamp || Date.now()),
        };
        setIncidents((prev) => {
          const filtered = prev.filter(i => i.id !== data.id);
          return [incident, ...filtered].slice(0, 20); // Keep last 20
        });
      };

      window.addEventListener('gcp-pubsub-incidents', handleIncident as any);
      socketService.onMessageReceived(handleIncident);
    }

    // Responder updates from Pub/Sub
    if (enableResponderUpdates) {
      const handleResponderUpdate = (data: any) => {
        if (!data.responderId) return;
        const update: RealtimeResponderUpdate = {
          responderId: data.responderId,
          name: data.name,
          role: data.role,
          status: data.status,
          location: data.location,
          assignedIncidentId: data.assignedIncidentId,
          timestamp: new Date(data.timestamp || Date.now()),
        };
        setResponderUpdates((prev) => {
          const filtered = prev.filter(r => r.responderId !== data.responderId);
          return [update, ...filtered].slice(0, 50); // Keep last 50
        });
      };

      window.addEventListener('gcp-pubsub-responder-updates', handleResponderUpdate as any);
      socketService.onMessageReceived(handleResponderUpdate);
    }

    // Cleanup
    return () => {
      window.removeEventListener('gcp-pubsub-predictions', () => { });
      window.removeEventListener('gcp-pubsub-video-analytics', () => { });
      window.removeEventListener('gcp-pubsub-social-signals', () => { });
      window.removeEventListener('gcp-pubsub-anomalies', () => { });
      window.removeEventListener('gcp-pubsub-alerts', () => { });
      window.removeEventListener('gcp-pubsub-incidents', () => { });
      window.removeEventListener('gcp-pubsub-responder-updates', () => { });
    };
  }, [eventId, enablePredictions, enableVideoAnalytics, enableSocialSignals, enableAnomalies, enableAlerts, enableIncidents, enableResponderUpdates]);

  // Auto-subscribe when eventId is provided
  useEffect(() => {
    if (eventId) {
      subscribe(eventId);
      return () => {
        unsubscribe();
      };
    }
  }, [eventId, subscribe, unsubscribe]);

  // Update GCP service health periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setGcpServicesHealth(gcpServiceManager.getHealthStatus());
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    predictions,
    videoFrames,
    socialSignals,
    anomalies,
    alerts,
    incidents,
    responderUpdates,
    isConnected,
    gcpServicesHealth,
    subscribe,
    unsubscribe,
  };
}
