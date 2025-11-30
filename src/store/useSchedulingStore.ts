import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ShiftStatus = 'draft' | 'published' | 'in-progress' | 'completed' | 'cancelled';

export interface Shift {
  id: string;
  title: string;
  description?: string;
  eventId?: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  role: string;
  location: string;
  assignedTo?: string[];
  maxCapacity: number;
  requirements?: string[];
  status: ShiftStatus;
  color?: string;
  tags: string[];
  breaks?: {
    startTime: Date;
    duration: number; // minutes
  }[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  description?: string;
  role: string;
  duration: number; // minutes
  breaks?: {
    afterMinutes: number;
    duration: number;
  }[];
  requirements?: string[];
  color?: string;
}

export interface Rotation {
  id: string;
  name: string;
  description?: string;
  pattern: 'weekly' | 'biweekly' | 'monthly' | 'custom';
  shifts: string[]; // shift template IDs
  assignedTeams: string[];
  startDate: Date;
  endDate?: Date;
  active: boolean;
}

export interface Availability {
  id: string;
  userId: string;
  userName: string;
  date: Date;
  timeSlots: {
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    available: boolean;
    reason?: string;
  }[];
}

export interface ShiftSwapRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  shiftId: string;
  shiftTitle: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedAt: Date;
  respondedAt?: Date;
  respondedBy?: string;
  notes?: string;
}

export interface ScheduleConflict {
  id: string;
  type: 'double_booking' | 'overtime' | 'unavailable' | 'max_hours' | 'min_rest';
  severity: 'warning' | 'error';
  userId: string;
  userName: string;
  shiftIds: string[];
  message: string;
  createdAt: Date;
  resolved: boolean;
}

interface SchedulingState {
  shifts: Shift[];
  templates: ShiftTemplate[];
  rotations: Rotation[];
  availabilities: Availability[];
  swapRequests: ShiftSwapRequest[];
  conflicts: ScheduleConflict[];
  selectedShiftId: string | null;

  // Actions
  createShift: (shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateShift: (id: string, updates: Partial<Shift>) => void;
  deleteShift: (id: string) => void;
  duplicateShift: (id: string) => string;

  assignToShift: (shiftId: string, userIds: string[]) => void;
  unassignFromShift: (shiftId: string, userId: string) => void;

  publishShift: (id: string) => void;
  cancelShift: (id: string) => void;

  addTemplate: (template: ShiftTemplate) => string;
  updateTemplate: (id: string, updates: Partial<ShiftTemplate>) => void;
  deleteTemplate: (id: string) => void;
  createShiftFromTemplate: (templateId: string, startTime: Date, location: string) => string;

  addRotation: (rotation: Rotation) => string;
  updateRotation: (id: string, updates: Partial<Rotation>) => void;
  deleteRotation: (id: string) => void;

  setAvailability: (availability: Omit<Availability, 'id'>) => string;
  updateAvailability: (id: string, updates: Partial<Availability>) => void;

  requestSwap: (request: Omit<ShiftSwapRequest, 'id' | 'requestedAt' | 'status'>) => string;
  approveSwap: (requestId: string, approverId: string) => void;
  rejectSwap: (requestId: string, approverId: string, reason: string) => void;
  cancelSwap: (requestId: string) => void;

  detectConflicts: (userId?: string) => ScheduleConflict[];
  resolveConflict: (conflictId: string) => void;

  getShiftsByDate: (date: Date) => Shift[];
  getShiftsByUser: (userId: string) => Shift[];
  getUserHours: (userId: string, startDate: Date, endDate: Date) => number;

  setSelectedShift: (id: string | null) => void;
}

export const useSchedulingStore = create<SchedulingState>()(
  persist(
    (set, get) => ({
      shifts: [],
      templates: [],
      rotations: [],
      availabilities: [],
      swapRequests: [],
      conflicts: [],
      selectedShiftId: null,

      createShift: (shift) => {
        const id = `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newShift: Shift = {
          ...shift,
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          shifts: [...state.shifts, newShift],
        }));

        // Detect conflicts
        get().detectConflicts();

        return id;
      },

      updateShift: (id, updates) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s
          ),
        }));

        get().detectConflicts();
      },

      deleteShift: (id) => set((state) => ({
        shifts: state.shifts.filter((s) => s.id !== id),
        selectedShiftId: state.selectedShiftId === id ? null : state.selectedShiftId,
      })),

      duplicateShift: (id) => {
        const shift = get().shifts.find((s) => s.id === id);
        if (!shift) return '';

        const newId = `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newShift: Shift = {
          ...shift,
          id: newId,
          title: `${shift.title} (Copy)`,
          status: 'draft',
          assignedTo: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          shifts: [...state.shifts, newShift],
        }));

        return newId;
      },

      assignToShift: (shiftId, userIds) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === shiftId
              ? { ...s, assignedTo: [...(s.assignedTo || []), ...userIds] }
              : s
          ),
        }));

        get().detectConflicts();
      },

      unassignFromShift: (shiftId, userId) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === shiftId
              ? { ...s, assignedTo: s.assignedTo?.filter((u) => u !== userId) }
              : s
          ),
        }));
      },

      publishShift: (id) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === id ? { ...s, status: 'published' as ShiftStatus } : s
          ),
        }));
      },

      cancelShift: (id) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === id ? { ...s, status: 'cancelled' as ShiftStatus } : s
          ),
        }));
      },

      addTemplate: (template) => {
        const id = `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newTemplate: ShiftTemplate = {
          ...template,
          id,
        };

        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));

        return id;
      },

      updateTemplate: (id, updates) => set((state) => ({
        templates: state.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      })),

      deleteTemplate: (id) => set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
      })),

      createShiftFromTemplate: (templateId, startTime, location) => {
        const template = get().templates.find((t) => t.id === templateId);
        if (!template) return '';

        const endTime = new Date(startTime.getTime() + template.duration * 60000);

        return get().createShift({
          title: template.name,
          description: template.description,
          startTime,
          endTime,
          duration: template.duration,
          role: template.role,
          location,
          maxCapacity: 1,
          requirements: template.requirements,
          status: 'draft',
          color: template.color,
          tags: [],
          breaks: template.breaks?.map((b) => ({
            startTime: new Date(startTime.getTime() + b.afterMinutes * 60000),
            duration: b.duration,
          })),
          createdBy: 'system',
        });
      },

      addRotation: (rotation) => {
        const id = `rot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newRotation: Rotation = {
          ...rotation,
          id,
        };

        set((state) => ({
          rotations: [...state.rotations, newRotation],
        }));

        return id;
      },

      updateRotation: (id, updates) => set((state) => ({
        rotations: state.rotations.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      })),

      deleteRotation: (id) => set((state) => ({
        rotations: state.rotations.filter((r) => r.id !== id),
      })),

      setAvailability: (availability) => {
        const id = `avail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newAvailability: Availability = {
          ...availability,
          id,
        };

        set((state) => ({
          availabilities: [...state.availabilities, newAvailability],
        }));

        return id;
      },

      updateAvailability: (id, updates) => set((state) => ({
        availabilities: state.availabilities.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      })),

      requestSwap: (request) => {
        const id = `swap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newRequest: ShiftSwapRequest = {
          ...request,
          id,
          requestedAt: new Date(),
          status: 'pending',
        };

        set((state) => ({
          swapRequests: [...state.swapRequests, newRequest],
        }));

        return id;
      },

      approveSwap: (requestId, approverId) => {
        const request = get().swapRequests.find((r) => r.id === requestId);
        if (!request) return;

        set((state) => ({
          swapRequests: state.swapRequests.map((r) =>
            r.id === requestId
              ? {
                ...r,
                status: 'approved',
                respondedAt: new Date(),
                respondedBy: approverId,
              }
              : r
          ),
          shifts: state.shifts.map((s) => {
            if (s.id === request.shiftId && s.assignedTo) {
              return {
                ...s,
                assignedTo: s.assignedTo.map((userId) =>
                  userId === request.fromUserId ? request.toUserId : userId
                ),
              };
            }
            return s;
          }),
        }));
      },

      rejectSwap: (requestId, approverId, reason) => {
        set((state) => ({
          swapRequests: state.swapRequests.map((r) =>
            r.id === requestId
              ? {
                ...r,
                status: 'rejected',
                respondedAt: new Date(),
                respondedBy: approverId,
                notes: reason,
              }
              : r
          ),
        }));
      },

      cancelSwap: (requestId) => {
        set((state) => ({
          swapRequests: state.swapRequests.map((r) =>
            r.id === requestId ? { ...r, status: 'cancelled' } : r
          ),
        }));
      },

      detectConflicts: (userId) => {
        const { shifts, availabilities } = get();
        const conflicts: ScheduleConflict[] = [];
        const usersToCheck = userId ? [userId] : Array.from(new Set(shifts.flatMap(s => s.assignedTo || [])));

        usersToCheck.forEach((uid) => {
          const userShifts = shifts.filter(
            (s) => s.assignedTo?.includes(uid) && s.status !== 'cancelled'
          );

          // Check for double booking
          for (let i = 0; i < userShifts.length; i++) {
            for (let j = i + 1; j < userShifts.length; j++) {
              const shift1 = userShifts[i];
              const shift2 = userShifts[j];

              if (
                (shift1.startTime <= shift2.startTime && shift1.endTime > shift2.startTime) ||
                (shift2.startTime <= shift1.startTime && shift2.endTime > shift1.startTime)
              ) {
                conflicts.push({
                  id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  type: 'double_booking',
                  severity: 'error',
                  userId: uid,
                  userName: 'User',
                  shiftIds: [shift1.id, shift2.id],
                  message: `User is assigned to overlapping shifts: ${shift1.title} and ${shift2.title}`,
                  createdAt: new Date(),
                  resolved: false,
                });
              }
            }
          }

          // Check availability
          const userAvailability = availabilities.filter((a) => a.userId === uid);
          userShifts.forEach((shift) => {
            const shiftDate = shift.startTime.toDateString();
            const availability = userAvailability.find(
              (a) => a.date.toDateString() === shiftDate
            );

            if (availability) {
              const shiftStart = `${shift.startTime.getHours()}:${shift.startTime.getMinutes()}`;
              const unavailable = availability.timeSlots.some(
                (slot) => !slot.available && shiftStart >= slot.startTime && shiftStart < slot.endTime
              );

              if (unavailable) {
                conflicts.push({
                  id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  type: 'unavailable',
                  severity: 'warning',
                  userId: uid,
                  userName: 'User',
                  shiftIds: [shift.id],
                  message: `User is unavailable for shift: ${shift.title}`,
                  createdAt: new Date(),
                  resolved: false,
                });
              }
            }
          });
        });

        set({ conflicts });
        return conflicts;
      },

      resolveConflict: (conflictId) => {
        set((state) => ({
          conflicts: state.conflicts.map((c) =>
            c.id === conflictId ? { ...c, resolved: true } : c
          ),
        }));
      },

      getShiftsByDate: (date) => {
        const dateStr = date.toDateString();
        return get().shifts.filter(
          (s) => s.startTime.toDateString() === dateStr
        );
      },

      getShiftsByUser: (userId) => {
        return get().shifts.filter((s) => s.assignedTo?.includes(userId));
      },

      getUserHours: (userId, startDate, endDate) => {
        const shifts = get().shifts.filter(
          (s) =>
            s.assignedTo?.includes(userId) &&
            s.startTime >= startDate &&
            s.endTime <= endDate &&
            s.status !== 'cancelled'
        );

        return shifts.reduce((total, shift) => total + shift.duration, 0) / 60;
      },

      setSelectedShift: (id) => set({ selectedShiftId: id }),
    }),
    {
      name: 'scheduling-storage',
      partialize: (state) => ({
        shifts: state.shifts,
        templates: state.templates,
        rotations: state.rotations,
      }),
    }
  )
);
