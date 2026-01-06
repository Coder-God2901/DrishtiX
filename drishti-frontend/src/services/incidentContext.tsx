/**
 * Incident Management Context & Hooks
 *
 * Provides React context and hooks for consuming incident data
 * across the application. This enables real-time incident updates
 * in organizer dashboards when attendees submit help requests.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  incidentService,
  Incident,
  IncidentSeverity,
  IncidentStatus,
} from "./incidentManagementService";

interface IncidentContextValue {
  incidents: Incident[];
  statistics: ReturnType<typeof incidentService.getStatistics>;
  isLoading: boolean;
}

const IncidentContext = createContext<IncidentContextValue | undefined>(
  undefined
);

interface IncidentProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps the app to provide incident data
 */
export function IncidentProvider({ children }: IncidentProviderProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to incident updates
    const unsubscribe = incidentService.subscribe((updatedIncidents) => {
      setIncidents(updatedIncidents);
      setIsLoading(false);
    });

    // Listen for real-time incident creation events
    const handleIncidentCreated = ((event: CustomEvent) => {
      console.log("🔔 New incident created:", event.detail);
    }) as EventListener;

    incidentService.addEventListener("incident-created", handleIncidentCreated);

    // Cleanup
    return () => {
      unsubscribe();
      incidentService.removeEventListener(
        "incident-created",
        handleIncidentCreated
      );
    };
  }, []);

  const statistics = incidentService.getStatistics();

  return (
    <IncidentContext.Provider value={{ incidents, statistics, isLoading }}>
      {children}
    </IncidentContext.Provider>
  );
}

/**
 * Hook to access all incidents
 */
export function useIncidents() {
  const context = useContext(IncidentContext);
  if (!context) {
    throw new Error("useIncidents must be used within IncidentProvider");
  }
  return context;
}

/**
 * Hook to access filtered incidents
 */
export function useFilteredIncidents(filters?: {
  severity?: IncidentSeverity[];
  status?: IncidentStatus[];
}) {
  const { incidents, isLoading } = useIncidents();

  const [filteredIncidents, setFilteredIncidents] =
    useState<Incident[]>(incidents);

  useEffect(() => {
    if (!filters) {
      setFilteredIncidents(incidents);
      return;
    }

    let filtered = incidents;

    if (filters.severity) {
      filtered = filtered.filter((i) => filters.severity!.includes(i.severity));
    }

    if (filters.status) {
      filtered = filtered.filter((i) => filters.status!.includes(i.status));
    }

    setFilteredIncidents(filtered);
  }, [incidents, filters]);

  return { incidents: filteredIncidents, isLoading };
}

/**
 * Hook to access incident statistics
 */
export function useIncidentStatistics() {
  const { statistics } = useIncidents();
  return statistics;
}

/**
 * Hook for real-time incident notifications
 */
export function useIncidentNotifications(
  callback: (incident: Incident) => void
) {
  useEffect(() => {
    const handleIncidentCreated = ((event: CustomEvent<Incident>) => {
      callback(event.detail);
    }) as EventListener;

    incidentService.addEventListener("incident-created", handleIncidentCreated);

    return () => {
      incidentService.removeEventListener(
        "incident-created",
        handleIncidentCreated
      );
    };
  }, [callback]);
}
