/**
 * Real-time Hooks
 * Custom React hooks for real-time data subscriptions
 */

import { useEffect, useState, useCallback } from 'react';
import {
  eventService,
  incidentService,
  alertService,
  predictionService,
  dispatchService,
  Event,
  EventMetrics,
  CrowdHeatmap,
  Incident,
  Alert,
  CrowdPrediction,
  RiskAnalysis
} from '../services';

/**
 * Hook for event data with real-time updates
 */
export function useEvent(eventId: string | undefined) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await eventService.getEvent(eventId);
        if (response.success && response.data) {
          setEvent(response.data);
        }
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();

    // Subscribe to real-time updates
    const unsubscribe = eventService.subscribeToEvent(eventId, (updatedEvent) => {
      setEvent(updatedEvent);
    });

    return () => {
      unsubscribe();
    };
  }, [eventId]);

  return { event, loading, error };
}

/**
 * Hook for event metrics with real-time updates
 */
export function useEventMetrics(eventId: string | undefined) {
  const [metrics, setMetrics] = useState<EventMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await eventService.getEventMetrics(eventId);
        if (response.success && response.data) {
          setMetrics(response.data);
        }
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Subscribe to real-time metrics updates
    const unsubscribe = eventService.subscribeToMetrics(eventId, (updatedMetrics) => {
      setMetrics(updatedMetrics);
    });

    return () => {
      unsubscribe();
    };
  }, [eventId]);

  const refresh = useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await eventService.getEventMetrics(eventId);
      if (response.success && response.data) {
        setMetrics(response.data);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [eventId]);

  return { metrics, loading, error, refresh };
}

/**
 * Hook for crowd heatmap with real-time updates
 */
export function useHeatmap(eventId: string | undefined) {
  const [heatmap, setHeatmap] = useState<CrowdHeatmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchHeatmap = async () => {
      try {
        setLoading(true);
        const response = await eventService.getEventHeatmap(eventId);
        if (response.success && response.data) {
          setHeatmap(response.data);
        }
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch heatmap');
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmap();

    // Subscribe to real-time heatmap updates
    const unsubscribe = eventService.subscribeToHeatmap(eventId, (updatedHeatmap) => {
      setHeatmap(updatedHeatmap);
    });

    return () => {
      unsubscribe();
    };
  }, [eventId]);

  return { heatmap, loading, error };
}

/**
 * Hook for incidents with real-time updates
 */
export function useIncidents(eventId: string | undefined) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchIncidents = async () => {
      try {
        setLoading(true);
        const response = await incidentService.getEventIncidents(eventId);
        if (response.success && response.data) {
          setIncidents(response.data);
        }
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch incidents');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();

    // Subscribe to real-time incident updates
    const unsubscribe = incidentService.subscribeToIncidents(eventId, (incident) => {
      setIncidents((prev) => {
        const existing = prev.find((i) => i.id === incident.id);
        if (existing) {
          return prev.map((i) => (i.id === incident.id ? incident : i));
        }
        return [incident, ...prev];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [eventId]);

  const refresh = useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await incidentService.getEventIncidents(eventId);
      if (response.success && response.data) {
        setIncidents(response.data);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [eventId]);

  return { incidents, loading, error, refresh };
}

/**
 * Hook for alerts with real-time updates
 */
export function useAlerts(eventId: string | undefined) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await alertService.getEventAlerts(eventId);
        if (response.success && response.data) {
          setAlerts(response.data);
        }
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch alerts');
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();

    // Subscribe to real-time alert updates
    const unsubscribe = alertService.subscribeToAlerts(eventId, (alert) => {
      setAlerts((prev) => {
        const existing = prev.find((a) => a.id === alert.id);
        if (existing) {
          return prev.map((a) => (a.id === alert.id ? alert : a));
        }
        return [alert, ...prev];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [eventId]);

  return { alerts, loading, error };
}

/**
 * Hook for crowd predictions with real-time updates
 */
export function usePredictions(eventId: string | undefined) {
  const [predictions, setPredictions] = useState<CrowdPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchPredictions = async () => {
      try {
        setLoading(true);
        const response = await predictionService.getPredictions(eventId);
        if (response.success && response.data) {
          setPredictions(response.data);
        }
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch predictions');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();

    // Subscribe to real-time prediction updates
    const unsubscribe = predictionService.subscribeToPredictions(eventId, (prediction) => {
      setPredictions((prev) => [prediction, ...prev]);
    });

    return () => {
      unsubscribe();
    };
  }, [eventId]);

  return { predictions, loading, error };
}

/**
 * Hook for risk analysis with real-time updates
 */
export function useRiskAnalysis(eventId: string | undefined) {
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchRiskAnalysis = async () => {
      try {
        setLoading(true);
        const response = await predictionService.getRiskAnalysis(eventId);
        if (response.success && response.data) {
          setRiskAnalysis(response.data);
        }
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch risk analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchRiskAnalysis();

    // Subscribe to real-time risk updates
    const unsubscribe = predictionService.subscribeToRiskUpdates(eventId, (risk) => {
      setRiskAnalysis(risk);
    });

    return () => {
      unsubscribe();
    };
  }, [eventId]);

  return { riskAnalysis, loading, error };
}

/**
 * Hook for dispatch teams with real-time updates
 */
export function useDispatch(eventId: string | undefined) {
  const [teams, setTeams] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [teamsResponse, volunteersResponse] = await Promise.all([
          dispatchService.getTeams(eventId),
          dispatchService.getVolunteers(eventId),
        ]);

        if (teamsResponse.success && teamsResponse.data) {
          setTeams(teamsResponse.data);
        }
        if (volunteersResponse.success && volunteersResponse.data) {
          setVolunteers(volunteersResponse.data);
        }
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dispatch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to real-time dispatch updates
    const unsubscribe = dispatchService.subscribeToDispatch(eventId, (data) => {
      if (data.type === 'team') {
        setTeams((prev) => {
          const existing = prev.find((t) => t.id === data.team.id);
          if (existing) {
            return prev.map((t) => (t.id === data.team.id ? data.team : t));
          }
          return [data.team, ...prev];
        });
      } else if (data.type === 'volunteer') {
        setVolunteers((prev) => {
          const existing = prev.find((v) => v.id === data.volunteer.id);
          if (existing) {
            return prev.map((v) => (v.id === data.volunteer.id ? data.volunteer : v));
          }
          return [data.volunteer, ...prev];
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [eventId]);

  return { teams, volunteers, loading, error };
}
