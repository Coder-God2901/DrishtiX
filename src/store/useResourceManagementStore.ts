import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ResourceType = 'equipment' | 'vehicle' | 'facility' | 'inventory';
export type ResourceStatus = 'available' | 'in-use' | 'maintenance' | 'reserved' | 'unavailable';

export interface Resource {
  id: string;
  name: string;
  description?: string;
  type: ResourceType;
  category: string;
  status: ResourceStatus;
  location: {
    latitude?: number;
    longitude?: number;
    address?: string;
    zone?: string;
  };
  quantity?: number;
  unit?: string;
  serialNumber?: string;
  barcode?: string;
  qrCode?: string;
  specifications?: Record<string, any>;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
  owner: string;
  assignedTo?: string;
  assignedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceBooking {
  id: string;
  resourceId: string;
  resourceName: string;
  userId: string;
  userName: string;
  startTime: Date;
  endTime: Date;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
}

export interface MaintenanceSchedule {
  id: string;
  resourceId: string;
  resourceName: string;
  type: 'routine' | 'repair' | 'inspection' | 'calibration';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'once';
  nextDue: Date;
  lastCompleted?: Date;
  assignedTo?: string;
  notes?: string;
  active: boolean;
}

export interface MaintenanceLog {
  id: string;
  resourceId: string;
  scheduleId?: string;
  type: string;
  performedBy: string;
  performedAt: Date;
  duration: number; // minutes
  cost?: number;
  notes: string;
  parts?: {
    name: string;
    quantity: number;
    cost?: number;
  }[];
  status: 'completed' | 'incomplete' | 'deferred';
}

export interface UsageLog {
  id: string;
  resourceId: string;
  userId: string;
  userName: string;
  checkOutTime: Date;
  checkInTime?: Date;
  duration?: number; // minutes
  purpose: string;
  condition: 'good' | 'fair' | 'poor' | 'damaged';
  notes?: string;
}

export interface ResourceAlert {
  id: string;
  resourceId: string;
  resourceName: string;
  type: 'low_stock' | 'maintenance_due' | 'overdue' | 'missing' | 'damaged';
  severity: 'low' | 'medium' | 'high';
  message: string;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

interface ResourceManagementState {
  resources: Resource[];
  bookings: ResourceBooking[];
  maintenanceSchedules: MaintenanceSchedule[];
  maintenanceLogs: MaintenanceLog[];
  usageLogs: UsageLog[];
  alerts: ResourceAlert[];

  // Actions
  addResource: (resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  deleteResource: (id: string) => void;

  checkOutResource: (resourceId: string, userId: string, userName: string, purpose: string) => string;
  checkInResource: (logId: string, condition: UsageLog['condition'], notes?: string) => void;

  createBooking: (booking: Omit<ResourceBooking, 'id' | 'createdAt'>) => string;
  updateBooking: (id: string, updates: Partial<ResourceBooking>) => void;
  approveBooking: (id: string, approverId: string) => void;
  rejectBooking: (id: string, approverId: string, reason: string) => void;
  cancelBooking: (id: string) => void;

  addMaintenanceSchedule: (schedule: Omit<MaintenanceSchedule, 'id'>) => string;
  updateMaintenanceSchedule: (id: string, updates: Partial<MaintenanceSchedule>) => void;
  deleteMaintenanceSchedule: (id: string) => void;

  logMaintenance: (log: Omit<MaintenanceLog, 'id'>) => string;

  addAlert: (alert: Omit<ResourceAlert, 'id' | 'createdAt' | 'acknowledged'>) => void;
  acknowledgeAlert: (id: string, userId: string) => void;

  getAvailableResources: (type?: ResourceType) => Resource[];
  getResourcesByCategory: (category: string) => Resource[];
  getMaintenanceDue: () => MaintenanceSchedule[];
}

export const useResourceManagementStore = create<ResourceManagementState>()(
  persist(
    (set, get) => ({
      resources: [],
      bookings: [],
      maintenanceSchedules: [],
      maintenanceLogs: [],
      usageLogs: [],
      alerts: [],

      addResource: (resource) => {
        const id = `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newResource: Resource = {
          ...resource,
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          resources: [...state.resources, newResource],
        }));

        return id;
      },

      updateResource: (id, updates) => set((state) => ({
        resources: state.resources.map((r) =>
          r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
        ),
      })),

      deleteResource: (id) => set((state) => ({
        resources: state.resources.filter((r) => r.id !== id),
      })),

      checkOutResource: (resourceId, userId, userName, purpose) => {
        const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();

        const log: UsageLog = {
          id: logId,
          resourceId,
          userId,
          userName,
          checkOutTime: now,
          purpose,
          condition: 'good',
        };

        set((state) => ({
          resources: state.resources.map((r) =>
            r.id === resourceId
              ? { ...r, status: 'in-use', assignedTo: userId, assignedAt: now }
              : r
          ),
          usageLogs: [...state.usageLogs, log],
        }));

        return logId;
      },

      checkInResource: (logId, condition, notes) => {
        const now = new Date();

        set((state) => {
          const log = state.usageLogs.find((l) => l.id === logId);
          if (!log) return state;

          const duration = Math.floor((now.getTime() - log.checkOutTime.getTime()) / 60000);

          return {
            resources: state.resources.map((r) =>
              r.id === log.resourceId
                ? { ...r, status: 'available', assignedTo: undefined, assignedAt: undefined }
                : r
            ),
            usageLogs: state.usageLogs.map((l) =>
              l.id === logId
                ? { ...l, checkInTime: now, duration, condition, notes }
                : l
            ),
          };
        });
      },

      createBooking: (booking) => {
        const id = `book-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newBooking: ResourceBooking = {
          ...booking,
          id,
          createdAt: new Date(),
        };

        set((state) => ({
          bookings: [...state.bookings, newBooking],
        }));

        return id;
      },

      updateBooking: (id, updates) => set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      })),

      approveBooking: (id, approverId) => {
        const booking = get().bookings.find((b) => b.id === id);
        if (!booking) return;

        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id
              ? {
                ...b,
                status: 'approved',
                approvedBy: approverId,
                approvedAt: new Date(),
              }
              : b
          ),
          resources: state.resources.map((r) =>
            r.id === booking.resourceId
              ? { ...r, status: 'reserved' }
              : r
          ),
        }));
      },

      rejectBooking: (id, approverId, reason) => {
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id
              ? {
                ...b,
                status: 'rejected',
                approvedBy: approverId,
                approvedAt: new Date(),
                notes: reason,
              }
              : b
          ),
        }));
      },

      cancelBooking: (id) => {
        const booking = get().bookings.find((b) => b.id === id);
        if (!booking) return;

        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, status: 'cancelled' } : b
          ),
          resources: state.resources.map((r) =>
            r.id === booking.resourceId && r.status === 'reserved'
              ? { ...r, status: 'available' }
              : r
          ),
        }));
      },

      addMaintenanceSchedule: (schedule) => {
        const id = `maint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newSchedule: MaintenanceSchedule = {
          ...schedule,
          id,
        };

        set((state) => ({
          maintenanceSchedules: [...state.maintenanceSchedules, newSchedule],
        }));

        return id;
      },

      updateMaintenanceSchedule: (id, updates) => set((state) => ({
        maintenanceSchedules: state.maintenanceSchedules.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      })),

      deleteMaintenanceSchedule: (id) => set((state) => ({
        maintenanceSchedules: state.maintenanceSchedules.filter((s) => s.id !== id),
      })),

      logMaintenance: (log) => {
        const id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newLog: MaintenanceLog = {
          ...log,
          id,
        };

        set((state) => ({
          maintenanceLogs: [...state.maintenanceLogs, newLog],
          maintenanceSchedules: state.maintenanceSchedules.map((s) =>
            s.id === log.scheduleId
              ? { ...s, lastCompleted: log.performedAt }
              : s
          ),
        }));

        return id;
      },

      addAlert: (alert) => {
        const newAlert: ResourceAlert = {
          ...alert,
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          acknowledged: false,
        };

        set((state) => ({
          alerts: [...state.alerts, newAlert],
        }));
      },

      acknowledgeAlert: (id, userId) => set((state) => ({
        alerts: state.alerts.map((a) =>
          a.id === id
            ? {
              ...a,
              acknowledged: true,
              acknowledgedBy: userId,
              acknowledgedAt: new Date(),
            }
            : a
        ),
      })),

      getAvailableResources: (type) => {
        const resources = get().resources.filter((r) => r.status === 'available');
        return type ? resources.filter((r) => r.type === type) : resources;
      },

      getResourcesByCategory: (category) => {
        return get().resources.filter((r) => r.category === category);
      },

      getMaintenanceDue: () => {
        const now = new Date();
        return get().maintenanceSchedules.filter(
          (s) => s.active && s.nextDue <= now
        );
      },
    }),
    {
      name: 'resource-management-storage',
      partialize: (state) => ({
        resources: state.resources,
        maintenanceSchedules: state.maintenanceSchedules,
      }),
    }
  )
);
