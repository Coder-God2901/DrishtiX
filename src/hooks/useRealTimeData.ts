/**
 * Real-time Data Hooks
 * Custom React hooks for Socket.IO subscriptions
 */

import { useState, useEffect } from 'react';
import { socketClient } from '@/lib/socket-client';

/**
 * Hook for real-time predictions
 */
export function useRealTimePredictions(eventId: string) {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [latestPrediction, setLatestPrediction] = useState<any | null>(null);

  useEffect(() => {
    if (!eventId) return;

    // Subscribe to prediction updates
    const unsubscribe = socketClient.on('prediction:new', (prediction: any) => {
      if (prediction.eventId === eventId) {
        setLatestPrediction(prediction);
        setPredictions((prev) => [prediction, ...prev].slice(0, 100)); // Keep last 100
      }
    });

    // Join event-specific room
    socketClient.subscribeToEvent(eventId);

    return () => {
      unsubscribe();
      socketClient.unsubscribeFromEvent(eventId);
    };
  }, [eventId]);

  return { predictions, latestPrediction };
}

/**
 * Hook for real-time incidents
 */
export function useRealTimeIncidents(eventId: string) {
  const [incidents, setIncidents] = useState<any[]>([]);

  useEffect(() => {
    if (!eventId) return;

    const unsubscribeCreated = socketClient.on('incident:created', (incident: any) => {
      if (incident.eventId === eventId) {
        setIncidents((prev) => [incident, ...prev]);
      }
    });

    const unsubscribeUpdated = socketClient.on('incident:updated', (incident: any) => {
      if (incident.eventId === eventId) {
        setIncidents((prev) =>
          prev.map((i) => (i.id === incident.id ? incident : i))
        );
      }
    });

    const unsubscribeResolved = socketClient.on('incident:resolved', (incident: any) => {
      if (incident.eventId === eventId) {
        setIncidents((prev) =>
          prev.map((i) => (i.id === incident.id ? incident : i))
        );
      }
    });

    const unsubscribeDeleted = socketClient.on('incident:deleted', ({ id }: { id: string }) => {
      setIncidents((prev) => prev.filter((i) => i.id !== id));
    });

    socketClient.subscribeToEvent(eventId);

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeResolved();
      unsubscribeDeleted();
      socketClient.unsubscribeFromEvent(eventId);
    };
  }, [eventId]);

  return { incidents, setIncidents };
}

/**
 * Hook for real-time alerts
 */
export function useRealTimeAlerts(eventId: string, maxAlerts: number = 50) {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!eventId) return;

    const unsubscribeNew = socketClient.on('alert:new', (alert: any) => {
      if (alert.eventId === eventId) {
        setAlerts((prev) => [alert, ...prev].slice(0, maxAlerts));
      }
    });

    const unsubscribeDismissed = socketClient.on('alert:dismissed', (alert: any) => {
      if (alert.eventId === eventId) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alert.id ? alert : a))
        );
      }
    });

    socketClient.subscribeToEvent(eventId);

    return () => {
      unsubscribeNew();
      unsubscribeDismissed();
      socketClient.unsubscribeFromEvent(eventId);
    };
  }, [eventId, maxAlerts]);

  return { alerts, setAlerts };
}

/**
 * Hook for real-time responder tracking
 */
export function useRealTimeResponders() {
  const [responders, setResponders] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribeUpdate = socketClient.on('responder:location-update', (data: any) => {
      setResponders((prev) =>
        prev.map((r) => (r.id === data.responderId ? { ...r, location: data.location, lastUpdate: data.timestamp } : r))
      );
    });

    const unsubscribeStatus = socketClient.on('responder:status-change', (data: any) => {
      setResponders((prev) =>
        prev.map((r) => (r.id === data.responderId ? { ...r, status: data.status } : r))
      );
    });

    return () => {
      unsubscribeUpdate();
      unsubscribeStatus();
    };
  }, []);

  return { responders, setResponders };
}

/**
 * Hook for real-time SOS requests
 */
export function useRealTimeSOSRequests(eventId: string) {
  const [sosRequests, setSosRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = socketClient.on('sos-created', (data: any) => {
      if (data.eventId === eventId) {
        setSosRequests((prev) => [data, ...prev]);
      }
    });

    socketClient.subscribeToEvent(eventId);

    return () => {
      unsubscribe();
      socketClient.unsubscribeFromEvent(eventId);
    };
  }, [eventId]);

  return { sosRequests, setSosRequests };
}

/**
 * Hook for real-time attendee reports
 */
export function useRealTimeReports(eventId: string) {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    if (!eventId) return;

    const unsubscribeNew = socketClient.on('report:new', (report: any) => {
      if (report.eventId === eventId) {
        setReports((prev) => [report, ...prev]);
      }
    });

    const unsubscribeValidated = socketClient.on('report:validated', (report: any) => {
      if (report.eventId === eventId) {
        setReports((prev) =>
          prev.map((r) => (r.id === report.id ? report : r))
        );
      }
    });

    socketClient.subscribeToEvent(eventId);

    return () => {
      unsubscribeNew();
      unsubscribeValidated();
      socketClient.unsubscribeFromEvent(eventId);
    };
  }, [eventId]);

  return { reports, setReports };
}

/**
 * Hook for real-time crowd density updates
 */
export function useRealTimeCrowdDensity(eventId: string) {
  const [crowdDensity, setCrowdDensity] = useState<any[]>([]);
  const [latestDensity, setLatestDensity] = useState<any | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = socketClient.on('crowd-density:update', (data: any) => {
      if (data.eventId === eventId) {
        setLatestDensity(data);
        setCrowdDensity((prev) => [data, ...prev].slice(0, 100));
      }
    });

    socketClient.subscribeToEvent(eventId);

    return () => {
      unsubscribe();
      socketClient.unsubscribeFromEvent(eventId);
    };
  }, [eventId]);

  return { crowdDensity, latestDensity };
}

/**
 * Generic hook for any real-time event
 */
export function useRealTimeEvent<T = any>(eventName: string, callback?: (data: T) => void) {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    const unsubscribe = socketClient.on<T>(eventName, (eventData) => {
      setData(eventData);
      callback?.(eventData);
    });

    return () => {
      unsubscribe();
    };
  }, [eventName, callback]);

  return data;
}
