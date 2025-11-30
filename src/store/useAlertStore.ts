import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type AlertPriority = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface Alert {
  id: string;
  eventId: string;
  type: string;
  priority: AlertPriority;
  title: string;
  summary: string;
  description?: string;
  zone?: string;
  location?: { lat: number; lng: number };
  confidence: number;
  status: AlertStatus;
  suggestedActions: string[];
  assignedTo?: string[];
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

interface AlertState {
  alerts: Alert[];
  filter: {
    priority?: AlertPriority[];
    status?: AlertStatus[];
    eventId?: string;
  };
  isLoading: boolean;
}

interface AlertActions {
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  updateAlert: (id: string, updates: Partial<Alert>) => void;
  deleteAlert: (id: string) => void;
  acknowledgeAlert: (id: string, userId: string) => void;
  resolveAlert: (id: string) => void;
  dismissAlert: (id: string) => void;
  setFilter: (filter: Partial<AlertState['filter']>) => void;
  clearFilter: () => void;
  getFilteredAlerts: () => Alert[];
  getCriticalAlerts: () => Alert[];
  getActiveAlerts: () => Alert[];
}

export const useAlertStore = create<AlertState & AlertActions>()(
  devtools(
    immer((set, get) => ({
      // State
      alerts: [],
      filter: {},
      isLoading: false,

      // Actions
      setAlerts: (alerts) =>
        set((state) => {
          state.alerts = alerts;
        }),

      addAlert: (alert) =>
        set((state) => {
          state.alerts.unshift(alert); // Add to beginning for newest first
        }),

      updateAlert: (id, updates) =>
        set((state) => {
          const index = state.alerts.findIndex((a) => a.id === id);
          if (index !== -1) {
            state.alerts[index] = { ...state.alerts[index], ...updates, updatedAt: new Date().toISOString() };
          }
        }),

      deleteAlert: (id) =>
        set((state) => {
          state.alerts = state.alerts.filter((a) => a.id !== id);
        }),

      acknowledgeAlert: (id, userId) =>
        set((state) => {
          const index = state.alerts.findIndex((a) => a.id === id);
          if (index !== -1) {
            state.alerts[index].status = 'acknowledged';
            state.alerts[index].acknowledgedAt = new Date().toISOString();
            state.alerts[index].assignedTo = state.alerts[index].assignedTo || [];
            if (!state.alerts[index].assignedTo!.includes(userId)) {
              state.alerts[index].assignedTo!.push(userId);
            }
          }
        }),

      resolveAlert: (id) =>
        set((state) => {
          const index = state.alerts.findIndex((a) => a.id === id);
          if (index !== -1) {
            state.alerts[index].status = 'resolved';
            state.alerts[index].resolvedAt = new Date().toISOString();
          }
        }),

      dismissAlert: (id) =>
        set((state) => {
          const index = state.alerts.findIndex((a) => a.id === id);
          if (index !== -1) {
            state.alerts[index].status = 'dismissed';
          }
        }),

      setFilter: (filter) =>
        set((state) => {
          state.filter = { ...state.filter, ...filter };
        }),

      clearFilter: () =>
        set((state) => {
          state.filter = {};
        }),

      getFilteredAlerts: () => {
        const { alerts, filter } = get();
        return alerts.filter((alert) => {
          if (filter.priority && !filter.priority.includes(alert.priority)) return false;
          if (filter.status && !filter.status.includes(alert.status)) return false;
          if (filter.eventId && alert.eventId !== filter.eventId) return false;
          return true;
        });
      },

      getCriticalAlerts: () => get().alerts.filter((a) => a.priority === 'critical' && a.status === 'active'),

      getActiveAlerts: () => get().alerts.filter((a) => a.status === 'active'),
    })),
    { name: 'AlertStore' }
  )
);
