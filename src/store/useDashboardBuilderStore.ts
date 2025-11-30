import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WidgetType =
  | 'kpi-card'
  | 'chart'
  | 'table'
  | 'map'
  | 'timeline'
  | 'alert-list'
  | 'team-status'
  | 'weather'
  | 'calendar'
  | 'video-feed'
  | 'custom';

export type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'area'
  | 'scatter'
  | 'radar'
  | 'heatmap'
  | 'sankey'
  | 'network';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  config: WidgetConfig;
  dataSource?: string;
  refreshInterval?: number; // seconds
  lastUpdated?: Date;
}

export interface WidgetConfig {
  // KPI Card
  metric?: string;
  value?: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
  color?: string;

  // Chart
  chartType?: ChartType;
  dataKey?: string;
  xAxis?: string;
  yAxis?: string;
  series?: string[];

  // Table
  columns?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  pageSize?: number;

  // Map
  center?: [number, number];
  zoom?: number;
  layers?: string[];

  // Timeline
  events?: any[];

  // Alert List
  severity?: string[];
  limit?: number;

  // Custom
  customConfig?: Record<string, any>;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  layout: 'grid' | 'free';
  gridSize: {
    columns: number;
    rows: number;
  };
  theme?: 'light' | 'dark' | 'auto';
  shared: boolean;
  sharedWith?: string[];
  owner: string;
  createdAt: Date;
  updatedAt: Date;
  isDefault?: boolean;
}

export interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  type: WidgetType;
  thumbnail?: string;
  defaultConfig: WidgetConfig;
  defaultSize: {
    width: number;
    height: number;
  };
  category: 'analytics' | 'operations' | 'monitoring' | 'reporting';
}

interface DashboardBuilderState {
  dashboards: Dashboard[];
  activeDashboardId: string | null;
  widgetTemplates: WidgetTemplate[];
  editMode: boolean;
  selectedWidgetId: string | null;

  // Actions
  createDashboard: (dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateDashboard: (id: string, updates: Partial<Dashboard>) => void;
  deleteDashboard: (id: string) => void;
  duplicateDashboard: (id: string) => string;

  setActiveDashboard: (id: string | null) => void;
  setDefaultDashboard: (id: string) => void;

  addWidget: (dashboardId: string, widget: Omit<Widget, 'id'>) => string;
  updateWidget: (dashboardId: string, widgetId: string, updates: Partial<Widget>) => void;
  deleteWidget: (dashboardId: string, widgetId: string) => void;
  moveWidget: (dashboardId: string, widgetId: string, position: { x: number; y: number }) => void;
  resizeWidget: (dashboardId: string, widgetId: string, size: { width: number; height: number }) => void;

  setEditMode: (enabled: boolean) => void;
  setSelectedWidget: (widgetId: string | null) => void;

  shareDashboard: (dashboardId: string, userIds: string[]) => void;
  unshareDashboard: (dashboardId: string) => void;

  addWidgetTemplate: (template: WidgetTemplate) => void;
  getWidgetTemplates: (category?: string) => WidgetTemplate[];
}

const defaultWidgetTemplates: WidgetTemplate[] = [
  {
    id: 'tpl-total-events',
    name: 'Total Events',
    description: 'Display total number of events',
    type: 'kpi-card',
    category: 'analytics',
    defaultConfig: {
      metric: 'Total Events',
      icon: 'Calendar',
      color: '#3b82f6',
    },
    defaultSize: { width: 2, height: 1 },
  },
  {
    id: 'tpl-active-alerts',
    name: 'Active Alerts',
    description: 'Show count of active alerts',
    type: 'kpi-card',
    category: 'operations',
    defaultConfig: {
      metric: 'Active Alerts',
      icon: 'AlertTriangle',
      color: '#ef4444',
    },
    defaultSize: { width: 2, height: 1 },
  },
  {
    id: 'tpl-team-members',
    name: 'Team Members',
    description: 'Display active team members',
    type: 'kpi-card',
    category: 'operations',
    defaultConfig: {
      metric: 'Team Members',
      icon: 'Users',
      color: '#10b981',
    },
    defaultSize: { width: 2, height: 1 },
  },
  {
    id: 'tpl-attendance-trend',
    name: 'Attendance Trend',
    description: 'Line chart showing attendance over time',
    type: 'chart',
    category: 'analytics',
    defaultConfig: {
      chartType: 'line',
      xAxis: 'date',
      yAxis: 'attendance',
    },
    defaultSize: { width: 4, height: 2 },
  },
  {
    id: 'tpl-incident-breakdown',
    name: 'Incident Breakdown',
    description: 'Pie chart of incidents by type',
    type: 'chart',
    category: 'analytics',
    defaultConfig: {
      chartType: 'pie',
      dataKey: 'type',
    },
    defaultSize: { width: 3, height: 2 },
  },
  {
    id: 'tpl-venue-map',
    name: 'Venue Map',
    description: 'Interactive venue map with teams',
    type: 'map',
    category: 'monitoring',
    defaultConfig: {
      zoom: 15,
      layers: ['teams', 'incidents'],
    },
    defaultSize: { width: 4, height: 3 },
  },
  {
    id: 'tpl-recent-alerts',
    name: 'Recent Alerts',
    description: 'List of recent alerts',
    type: 'alert-list',
    category: 'operations',
    defaultConfig: {
      limit: 10,
    },
    defaultSize: { width: 3, height: 2 },
  },
  {
    id: 'tpl-team-status',
    name: 'Team Status',
    description: 'Current status of all teams',
    type: 'team-status',
    category: 'operations',
    defaultConfig: {},
    defaultSize: { width: 3, height: 2 },
  },
];

export const useDashboardBuilderStore = create<DashboardBuilderState>()(
  persist(
    (set, get) => ({
      dashboards: [],
      activeDashboardId: null,
      widgetTemplates: defaultWidgetTemplates,
      editMode: false,
      selectedWidgetId: null,

      createDashboard: (dashboard) => {
        const id = `dash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newDashboard: Dashboard = {
          ...dashboard,
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          dashboards: [...state.dashboards, newDashboard],
          activeDashboardId: id,
        }));

        return id;
      },

      updateDashboard: (id, updates) => set((state) => ({
        dashboards: state.dashboards.map((d) =>
          d.id === id ? { ...d, ...updates, updatedAt: new Date() } : d
        ),
      })),

      deleteDashboard: (id) => set((state) => ({
        dashboards: state.dashboards.filter((d) => d.id !== id),
        activeDashboardId: state.activeDashboardId === id ? null : state.activeDashboardId,
      })),

      duplicateDashboard: (id) => {
        const dashboard = get().dashboards.find((d) => d.id === id);
        if (!dashboard) return '';

        const newId = `dash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newDashboard: Dashboard = {
          ...dashboard,
          id: newId,
          name: `${dashboard.name} (Copy)`,
          createdAt: new Date(),
          updatedAt: new Date(),
          widgets: dashboard.widgets.map((w) => ({
            ...w,
            id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          })),
        };

        set((state) => ({
          dashboards: [...state.dashboards, newDashboard],
        }));

        return newId;
      },

      setActiveDashboard: (id) => set({ activeDashboardId: id }),

      setDefaultDashboard: (id) => set((state) => ({
        dashboards: state.dashboards.map((d) => ({
          ...d,
          isDefault: d.id === id,
        })),
      })),

      addWidget: (dashboardId, widget) => {
        const widgetId = `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newWidget: Widget = {
          ...widget,
          id: widgetId,
        };

        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.id === dashboardId
              ? { ...d, widgets: [...d.widgets, newWidget], updatedAt: new Date() }
              : d
          ),
        }));

        return widgetId;
      },

      updateWidget: (dashboardId, widgetId, updates) => set((state) => ({
        dashboards: state.dashboards.map((d) =>
          d.id === dashboardId
            ? {
              ...d,
              widgets: d.widgets.map((w) =>
                w.id === widgetId ? { ...w, ...updates } : w
              ),
              updatedAt: new Date(),
            }
            : d
        ),
      })),

      deleteWidget: (dashboardId, widgetId) => set((state) => ({
        dashboards: state.dashboards.map((d) =>
          d.id === dashboardId
            ? {
              ...d,
              widgets: d.widgets.filter((w) => w.id !== widgetId),
              updatedAt: new Date(),
            }
            : d
        ),
        selectedWidgetId: state.selectedWidgetId === widgetId ? null : state.selectedWidgetId,
      })),

      moveWidget: (dashboardId, widgetId, position) => set((state) => ({
        dashboards: state.dashboards.map((d) =>
          d.id === dashboardId
            ? {
              ...d,
              widgets: d.widgets.map((w) =>
                w.id === widgetId ? { ...w, position } : w
              ),
              updatedAt: new Date(),
            }
            : d
        ),
      })),

      resizeWidget: (dashboardId, widgetId, size) => set((state) => ({
        dashboards: state.dashboards.map((d) =>
          d.id === dashboardId
            ? {
              ...d,
              widgets: d.widgets.map((w) =>
                w.id === widgetId ? { ...w, size } : w
              ),
              updatedAt: new Date(),
            }
            : d
        ),
      })),

      setEditMode: (enabled) => set({ editMode: enabled }),

      setSelectedWidget: (widgetId) => set({ selectedWidgetId: widgetId }),

      shareDashboard: (dashboardId, userIds) => set((state) => ({
        dashboards: state.dashboards.map((d) =>
          d.id === dashboardId
            ? { ...d, shared: true, sharedWith: userIds }
            : d
        ),
      })),

      unshareDashboard: (dashboardId) => set((state) => ({
        dashboards: state.dashboards.map((d) =>
          d.id === dashboardId
            ? { ...d, shared: false, sharedWith: undefined }
            : d
        ),
      })),

      addWidgetTemplate: (template) => set((state) => ({
        widgetTemplates: [...state.widgetTemplates, template],
      })),

      getWidgetTemplates: (category) => {
        const { widgetTemplates } = get();
        if (!category) return widgetTemplates;
        return widgetTemplates.filter((t) => t.category === category);
      },
    }),
    {
      name: 'dashboard-builder-storage',
      partialize: (state) => ({
        dashboards: state.dashboards,
        widgetTemplates: state.widgetTemplates,
      }),
    }
  )
);
