import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'reported' | 'assigned' | 'in-progress' | 'resolved' | 'closed' | 'escalated';
export type IncidentType = 'medical' | 'security' | 'fire' | 'weather' | 'technical' | 'crowd' | 'other';

export interface Incident {
  id: string;
  title: string;
  description: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    zone?: string;
  };
  reportedBy: string;
  reportedAt: Date;
  assignedTo?: string[];
  assignedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  closedBy?: string;
  closedAt?: Date;
  sla: {
    responseTime: number; // minutes
    resolutionTime: number; // minutes
    responseDeadline: Date;
    resolutionDeadline: Date;
    responseBreached: boolean;
    resolutionBreached: boolean;
  };
  timeline: IncidentTimelineEntry[];
  attachments: IncidentAttachment[];
  escalation?: {
    escalated: boolean;
    escalatedAt?: Date;
    escalatedBy?: string;
    escalatedTo?: string;
    reason?: string;
  };
  tags: string[];
  relatedIncidents?: string[];
  impact: {
    affectedArea?: string;
    estimatedPeople?: number;
    disruption: 'minor' | 'moderate' | 'major' | 'severe';
  };
}

export interface IncidentTimelineEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  details: string;
  type: 'status_change' | 'assignment' | 'comment' | 'escalation' | 'resolution';
}

export interface IncidentAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface IncidentTemplate {
  id: string;
  name: string;
  description: string;
  type: IncidentType;
  defaultSeverity: IncidentSeverity;
  defaultAssignees: string[];
  workflow: WorkflowStep[];
  sla: {
    responseTime: number;
    resolutionTime: number;
  };
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  assignedRole: string;
  requiredActions: string[];
  autoProgress: boolean;
  notifyOnEntry: boolean;
}

interface IncidentManagementState {
  incidents: Incident[];
  templates: IncidentTemplate[];
  selectedIncidentId: string | null;

  // Actions
  createIncident: (incident: Omit<Incident, 'id' | 'reportedAt' | 'timeline' | 'sla'>) => string;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  deleteIncident: (id: string) => void;

  assignIncident: (id: string, userIds: string[], assignedBy: string) => void;
  updateStatus: (id: string, status: IncidentStatus, userId: string, comment?: string) => void;
  escalateIncident: (id: string, escalatedTo: string, reason: string, userId: string) => void;
  resolveIncident: (id: string, userId: string, resolution: string) => void;
  closeIncident: (id: string, userId: string) => void;

  addComment: (id: string, userId: string, userName: string, comment: string) => void;
  addAttachment: (id: string, attachment: IncidentAttachment) => void;
  addTimelineEntry: (id: string, entry: Omit<IncidentTimelineEntry, 'id'>) => void;

  addTemplate: (template: IncidentTemplate) => void;
  updateTemplate: (id: string, updates: Partial<IncidentTemplate>) => void;
  deleteTemplate: (id: string) => void;

  setSelectedIncident: (id: string | null) => void;

  getIncidentsBySeverity: (severity: IncidentSeverity) => Incident[];
  getIncidentsByStatus: (status: IncidentStatus) => Incident[];
  getBreachedSLA: () => Incident[];
}

function calculateSLA(responseTime: number, resolutionTime: number, reportedAt: Date) {
  const now = new Date();
  const responseDeadline = new Date(reportedAt.getTime() + responseTime * 60000);
  const resolutionDeadline = new Date(reportedAt.getTime() + resolutionTime * 60000);

  return {
    responseTime,
    resolutionTime,
    responseDeadline,
    resolutionDeadline,
    responseBreached: now > responseDeadline,
    resolutionBreached: now > resolutionDeadline,
  };
}

export const useIncidentManagementStore = create<IncidentManagementState>()(
  persist(
    (set, get) => ({
      incidents: [],
      templates: [
        {
          id: 'tpl-medical',
          name: 'Medical Emergency',
          description: 'Medical incident template',
          type: 'medical',
          defaultSeverity: 'high',
          defaultAssignees: [],
          workflow: [],
          sla: { responseTime: 5, resolutionTime: 30 },
        },
        {
          id: 'tpl-security',
          name: 'Security Incident',
          description: 'Security incident template',
          type: 'security',
          defaultSeverity: 'high',
          defaultAssignees: [],
          workflow: [],
          sla: { responseTime: 10, resolutionTime: 60 },
        },
      ],
      selectedIncidentId: null,

      createIncident: (incident) => {
        const id = `inc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const reportedAt = new Date();

        const newIncident: Incident = {
          ...incident,
          id,
          reportedAt,
          timeline: [
            {
              id: `timeline-${Date.now()}`,
              timestamp: reportedAt,
              userId: incident.reportedBy,
              userName: 'System',
              action: 'Incident Reported',
              details: `Incident created: ${incident.title}`,
              type: 'status_change',
            },
          ],
          sla: calculateSLA(
            incident.type === 'medical' ? 5 : incident.type === 'security' ? 10 : 15,
            incident.type === 'medical' ? 30 : incident.type === 'security' ? 60 : 120,
            reportedAt
          ),
        };

        set((state) => ({
          incidents: [newIncident, ...state.incidents],
        }));

        return id;
      },

      updateIncident: (id, updates) => set((state) => ({
        incidents: state.incidents.map((i) =>
          i.id === id ? { ...i, ...updates } : i
        ),
      })),

      deleteIncident: (id) => set((state) => ({
        incidents: state.incidents.filter((i) => i.id !== id),
        selectedIncidentId: state.selectedIncidentId === id ? null : state.selectedIncidentId,
      })),

      assignIncident: (id, userIds, assignedBy) => {
        const incident = get().incidents.find((i) => i.id === id);
        if (!incident) return;

        set((state) => ({
          incidents: state.incidents.map((i) =>
            i.id === id
              ? {
                ...i,
                assignedTo: userIds,
                assignedAt: new Date(),
                status: 'assigned',
                timeline: [
                  ...i.timeline,
                  {
                    id: `timeline-${Date.now()}`,
                    timestamp: new Date(),
                    userId: assignedBy,
                    userName: 'System',
                    action: 'Incident Assigned',
                    details: `Assigned to: ${userIds.join(', ')}`,
                    type: 'assignment',
                  },
                ],
              }
              : i
          ),
        }));
      },

      updateStatus: (id, status, userId, comment) => {
        set((state) => ({
          incidents: state.incidents.map((i) =>
            i.id === id
              ? {
                ...i,
                status,
                timeline: [
                  ...i.timeline,
                  {
                    id: `timeline-${Date.now()}`,
                    timestamp: new Date(),
                    userId,
                    userName: 'User',
                    action: `Status changed to ${status}`,
                    details: comment || `Incident status updated to ${status}`,
                    type: 'status_change',
                  },
                ],
              }
              : i
          ),
        }));
      },

      escalateIncident: (id, escalatedTo, reason, userId) => {
        set((state) => ({
          incidents: state.incidents.map((i) =>
            i.id === id
              ? {
                ...i,
                status: 'escalated',
                escalation: {
                  escalated: true,
                  escalatedAt: new Date(),
                  escalatedBy: userId,
                  escalatedTo,
                  reason,
                },
                timeline: [
                  ...i.timeline,
                  {
                    id: `timeline-${Date.now()}`,
                    timestamp: new Date(),
                    userId,
                    userName: 'User',
                    action: 'Incident Escalated',
                    details: `Escalated to ${escalatedTo}: ${reason}`,
                    type: 'escalation',
                  },
                ],
              }
              : i
          ),
        }));
      },

      resolveIncident: (id, userId, resolution) => {
        set((state) => ({
          incidents: state.incidents.map((i) =>
            i.id === id
              ? {
                ...i,
                status: 'resolved',
                resolvedBy: userId,
                resolvedAt: new Date(),
                timeline: [
                  ...i.timeline,
                  {
                    id: `timeline-${Date.now()}`,
                    timestamp: new Date(),
                    userId,
                    userName: 'User',
                    action: 'Incident Resolved',
                    details: resolution,
                    type: 'resolution',
                  },
                ],
              }
              : i
          ),
        }));
      },

      closeIncident: (id, userId) => {
        set((state) => ({
          incidents: state.incidents.map((i) =>
            i.id === id
              ? {
                ...i,
                status: 'closed',
                closedBy: userId,
                closedAt: new Date(),
                timeline: [
                  ...i.timeline,
                  {
                    id: `timeline-${Date.now()}`,
                    timestamp: new Date(),
                    userId,
                    userName: 'User',
                    action: 'Incident Closed',
                    details: 'Incident has been closed',
                    type: 'status_change',
                  },
                ],
              }
              : i
          ),
        }));
      },

      addComment: (id, userId, userName, comment) => {
        get().addTimelineEntry(id, {
          timestamp: new Date(),
          userId,
          userName,
          action: 'Comment Added',
          details: comment,
          type: 'comment',
        });
      },

      addAttachment: (id, attachment) => {
        set((state) => ({
          incidents: state.incidents.map((i) =>
            i.id === id
              ? { ...i, attachments: [...i.attachments, attachment] }
              : i
          ),
        }));
      },

      addTimelineEntry: (id, entry) => {
        set((state) => ({
          incidents: state.incidents.map((i) =>
            i.id === id
              ? {
                ...i,
                timeline: [
                  ...i.timeline,
                  { ...entry, id: `timeline-${Date.now()}` },
                ],
              }
              : i
          ),
        }));
      },

      addTemplate: (template) => set((state) => ({
        templates: [...state.templates, template],
      })),

      updateTemplate: (id, updates) => set((state) => ({
        templates: state.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      })),

      deleteTemplate: (id) => set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
      })),

      setSelectedIncident: (id) => set({ selectedIncidentId: id }),

      getIncidentsBySeverity: (severity) => {
        return get().incidents.filter((i) => i.severity === severity);
      },

      getIncidentsByStatus: (status) => {
        return get().incidents.filter((i) => i.status === status);
      },

      getBreachedSLA: () => {
        return get().incidents.filter(
          (i) => i.sla.responseBreached || i.sla.resolutionBreached
        );
      },
    }),
    {
      name: 'incident-management-storage',
      partialize: (state) => ({
        incidents: state.incidents,
        templates: state.templates,
      }),
    }
  )
);
