import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Event {
  endDate: string | number | Date;
  location: ReactI18NextChildren | Iterable<ReactI18NextChildren>;
  startDate: string | number | Date;
  id: string;
  name: string;
  type: string;
  venue: string;
  startDateTime: string;
  endDateTime?: string;
  expectedAttendees: number;
  status: 'draft' | 'planned' | 'active' | 'completed' | 'cancelled';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface EventState {
  events: Event[];
  selectedEventId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface EventActions {
  setEvents: (events: Event[]) => void;
  addEvent: (event: Event) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  selectEvent: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getEventById: (id: string) => Event | undefined;
  getActiveEvents: () => Event[];
}

export const useEventStore = create<EventState & EventActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        // State
        events: [],
        selectedEventId: null,
        isLoading: false,
        error: null,

        // Actions
        setEvents: (events) =>
          set((state) => {
            state.events = events;
          }),

        addEvent: (event) =>
          set((state) => {
            state.events.push(event);
          }),

        updateEvent: (id, updates) =>
          set((state) => {
            const index = state.events.findIndex((e) => e.id === id);
            if (index !== -1) {
              state.events[index] = { ...state.events[index], ...updates, updatedAt: new Date().toISOString() };
            }
          }),

        deleteEvent: (id) =>
          set((state) => {
            state.events = state.events.filter((e) => e.id !== id);
            if (state.selectedEventId === id) {
              state.selectedEventId = null;
            }
          }),

        selectEvent: (id) =>
          set((state) => {
            state.selectedEventId = id;
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        getEventById: (id) => get().events.find((e) => e.id === id),

        getActiveEvents: () => get().events.filter((e) => e.status === 'active'),
      })),
      {
        name: 'event-storage',
        partialize: (state) => ({ events: state.events, selectedEventId: state.selectedEventId }),
      }
    ),
    { name: 'EventStore' }
  )
);
