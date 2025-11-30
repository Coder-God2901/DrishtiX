import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId: string;
  resourceType: 'event' | 'user' | 'team' | 'alert' | 'document' | 'settings' | 'system';
  details: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'success' | 'failure';
  errorMessage?: string;
  sessionId?: string;
  correlationId?: string;
}

export interface ComplianceReport {
  id: string;
  name: string;
  description?: string;
  type: 'gdpr' | 'hipaa' | 'sox' | 'custom';
  generatedAt: Date;
  generatedBy: string;
  period: {
    start: Date;
    end: Date;
  };
  filters: AuditLogFilter;
  totalEntries: number;
  summary: {
    userActivities: Record<string, number>;
    actionTypes: Record<string, number>;
    resourceTypes: Record<string, number>;
    successRate: number;
    criticalEvents: number;
  };
  url?: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: string;
  resourceType?: string;
  severity?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
}

export interface RetentionPolicy {
  id: string;
  name: string;
  description?: string;
  resourceType: string;
  retentionDays: number;
  autoDelete: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AuditLogState {
  logs: AuditLogEntry[];
  reports: ComplianceReport[];
  retentionPolicies: RetentionPolicy[];
  filter: AuditLogFilter;

  // Actions
  addLog: (log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  addLogs: (logs: Omit<AuditLogEntry, 'id' | 'timestamp'>[]) => void;

  getLogs: (filter: AuditLogFilter, limit?: number) => AuditLogEntry[];
  exportLogs: (filter: AuditLogFilter) => AuditLogEntry[];

  generateReport: (
    type: ComplianceReport['type'],
    period: { start: Date; end: Date },
    filters: AuditLogFilter
  ) => ComplianceReport;

  addRetentionPolicy: (policy: RetentionPolicy) => void;
  updateRetentionPolicy: (id: string, updates: Partial<RetentionPolicy>) => void;
  deleteRetentionPolicy: (id: string) => void;
  applyRetentionPolicies: () => void;

  setFilter: (filter: AuditLogFilter) => void;
  clearLogs: (beforeDate?: Date) => void;

  // Compliance helpers
  trackUserAction: (
    userId: string,
    userName: string,
    userRole: string,
    action: string,
    resource: string,
    resourceId: string,
    details: string,
    metadata?: Partial<AuditLogEntry>
  ) => void;
}

export const useAuditLogStore = create<AuditLogState>()(
  persist(
    (set, get) => ({
      logs: [],
      reports: [],
      retentionPolicies: [
        {
          id: '1',
          name: 'Event Logs',
          description: 'Retain event-related logs for 1 year',
          resourceType: 'event',
          retentionDays: 365,
          autoDelete: true,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'User Logs',
          description: 'Retain user activity logs for 90 days',
          resourceType: 'user',
          retentionDays: 90,
          autoDelete: true,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          name: 'Security Logs',
          description: 'Retain critical security logs for 7 years',
          resourceType: 'system',
          retentionDays: 2555,
          autoDelete: false,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      filter: {},

      addLog: (log) => set((state) => ({
        logs: [
          {
            ...log,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
          },
          ...state.logs,
        ].slice(0, 10000), // Keep max 10,000 logs in memory
      })),

      addLogs: (logs) => set((state) => ({
        logs: [
          ...logs.map((log) => ({
            ...log,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
          })),
          ...state.logs,
        ].slice(0, 10000),
      })),

      getLogs: (filter, limit = 100) => {
        const { logs } = get();

        let filtered = logs.filter((log) => {
          if (filter.userId && log.userId !== filter.userId) return false;
          if (filter.action && log.action !== filter.action) return false;
          if (filter.resourceType && log.resourceType !== filter.resourceType) return false;
          if (filter.severity && log.severity !== filter.severity) return false;
          if (filter.status && log.status !== filter.status) return false;
          if (filter.dateFrom && log.timestamp < filter.dateFrom) return false;
          if (filter.dateTo && log.timestamp > filter.dateTo) return false;

          if (filter.searchQuery) {
            const query = filter.searchQuery.toLowerCase();
            const searchText = `${log.action} ${log.resource} ${log.details} ${log.userName}`.toLowerCase();
            if (!searchText.includes(query)) return false;
          }

          return true;
        });

        return filtered.slice(0, limit);
      },

      exportLogs: (filter) => {
        return get().getLogs(filter, 100000); // No limit for export
      },

      generateReport: (type, period, filters) => {
        const logs = get().getLogs({
          ...filters,
          dateFrom: period.start,
          dateTo: period.end,
        }, 100000);

        const userActivities: Record<string, number> = {};
        const actionTypes: Record<string, number> = {};
        const resourceTypes: Record<string, number> = {};
        let successCount = 0;
        let criticalCount = 0;

        logs.forEach((log) => {
          userActivities[log.userName] = (userActivities[log.userName] || 0) + 1;
          actionTypes[log.action] = (actionTypes[log.action] || 0) + 1;
          resourceTypes[log.resourceType] = (resourceTypes[log.resourceType] || 0) + 1;

          if (log.status === 'success') successCount++;
          if (log.severity === 'critical') criticalCount++;
        });

        const report: ComplianceReport = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: `${type.toUpperCase()} Compliance Report`,
          type,
          generatedAt: new Date(),
          generatedBy: 'system', // Should be actual user
          period,
          filters,
          totalEntries: logs.length,
          summary: {
            userActivities,
            actionTypes,
            resourceTypes,
            successRate: logs.length > 0 ? (successCount / logs.length) * 100 : 0,
            criticalEvents: criticalCount,
          },
        };

        set((state) => ({
          reports: [...state.reports, report],
        }));

        return report;
      },

      addRetentionPolicy: (policy) => set((state) => ({
        retentionPolicies: [...state.retentionPolicies, policy],
      })),

      updateRetentionPolicy: (id, updates) => set((state) => ({
        retentionPolicies: state.retentionPolicies.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
        ),
      })),

      deleteRetentionPolicy: (id) => set((state) => ({
        retentionPolicies: state.retentionPolicies.filter((p) => p.id !== id),
      })),

      applyRetentionPolicies: () => {
        const { logs, retentionPolicies } = get();
        const now = new Date();

        const filteredLogs = logs.filter((log) => {
          const policy = retentionPolicies.find(
            (p) => p.active && p.autoDelete && p.resourceType === log.resourceType
          );

          if (!policy) return true;

          const retentionDate = new Date(now);
          retentionDate.setDate(retentionDate.getDate() - policy.retentionDays);

          return log.timestamp >= retentionDate;
        });

        set({ logs: filteredLogs });
      },

      setFilter: (filter) => set({ filter }),

      clearLogs: (beforeDate) => set((state) => ({
        logs: beforeDate
          ? state.logs.filter((log) => log.timestamp >= beforeDate)
          : [],
      })),

      trackUserAction: (
        userId,
        userName,
        userRole,
        action,
        resource,
        resourceId,
        details,
        metadata = {}
      ) => {
        get().addLog({
          userId,
          userName,
          userRole,
          action,
          resource,
          resourceId,
          resourceType: (metadata.resourceType as any) || 'system',
          details,
          severity: metadata.severity || 'info',
          status: metadata.status || 'success',
          changes: metadata.changes,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          location: metadata.location,
          errorMessage: metadata.errorMessage,
          sessionId: metadata.sessionId,
          correlationId: metadata.correlationId,
        });
      },
    }),
    {
      name: 'audit-log-storage',
      partialize: (state) => ({
        logs: state.logs.slice(0, 1000), // Persist only last 1000 logs
        reports: state.reports,
        retentionPolicies: state.retentionPolicies,
      }),
    }
  )
);
