import { create } from 'zustand';
import { Dashboard, Widget } from '@/types/database';
import {
  getDashboards,
  getDashboardById,
  createDashboard as createDashboardAPI,
  updateDashboard as updateDashboardAPI,
  deleteDashboard as deleteDashboardAPI,
  getWidgets,
  getWidgetById,
  createWidget,
  updateWidget,
  deleteWidget,
} from '@/services/database';

interface DashboardState {
  dashboards: Dashboard[];
  activeDashboardId: string | null;
  loading: boolean;
  error: string | null;
  // Actions
  loadDashboards: () => Promise<void>;
  setActiveDashboard: (id: string) => void;
  createDashboard: (data: Partial<Dashboard>) => Promise<void>;
  updateDashboard: (id: string, updates: Partial<Dashboard>) => Promise<void>;
  deleteDashboard: (id: string) => Promise<void>;
  duplicateDashboard: (id: string) => Promise<void>;
  // Widget actions
  addWidgetToDashboard: (dashboardId: string, widget: Partial<Widget>) => Promise<void>;
  removeWidgetFromDashboard: (dashboardId: string, widgetId: string) => Promise<void>;
  updateWidgetInDashboard: (dashboardId: string, widgetId: string, updates: Partial<Widget>) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  dashboards: [],
  activeDashboardId: null,
  loading: false,
  error: null,

  loadDashboards: async () => {
    set({ loading: true, error: null });
    try {
      const dashboards = await getDashboards();
      set({ dashboards, loading: false });
    } catch (e: any) {
      set({ error: e.message || 'Failed to load dashboards', loading: false });
    }
  },

  setActiveDashboard: (id) => set({ activeDashboardId: id }),

  createDashboard: async (data) => {
    set({ loading: true, error: null });
    try {
      const newDashboard = await createDashboardAPI(data);
      set({ dashboards: [...get().dashboards, newDashboard], loading: false });
    } catch (e: any) {
      set({ error: e.message || 'Failed to create dashboard', loading: false });
    }
  },

  updateDashboard: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const updated = await updateDashboardAPI(id, updates);
      set({
        dashboards: get().dashboards.map(d => d.id === id ? updated : d),
        loading: false,
      });
    } catch (e: any) {
      set({ error: e.message || 'Failed to update dashboard', loading: false });
    }
  },

  deleteDashboard: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDashboardAPI(id);
      set({ dashboards: get().dashboards.filter(d => d.id !== id), loading: false });
    } catch (e: any) {
      set({ error: e.message || 'Failed to delete dashboard', loading: false });
    }
  },

  duplicateDashboard: async (id) => {
    set({ loading: true, error: null });
    try {
      const dashboard = get().dashboards.find(d => d.id === id);
      if (!dashboard) throw new Error('Dashboard not found');
      const newDashboard = {
        ...dashboard,
        id: Date.now().toString(),
        name: dashboard.name + ' (Copy)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set({ dashboards: [...get().dashboards, newDashboard], loading: false });
    } catch (e: any) {
      set({ error: e.message || 'Failed to duplicate dashboard', loading: false });
    }
  },

  // Widget actions
  addWidgetToDashboard: async (dashboardId, widget) => {
    set({ loading: true, error: null });
    try {
      const newWidget = await createWidget({ ...widget, dashboard_id: dashboardId });
      set({
        dashboards: get().dashboards.map(d =>
          d.id === dashboardId ? { ...d, widgets: [...(d.widgets || []), newWidget] } : d
        ),
        loading: false,
      });
    } catch (e: any) {
      set({ error: e.message || 'Failed to add widget', loading: false });
    }
  },

  removeWidgetFromDashboard: async (dashboardId, widgetId) => {
    set({ loading: true, error: null });
    try {
      await deleteWidget(widgetId);
      set({
        dashboards: get().dashboards.map(d =>
          d.id === dashboardId ? { ...d, widgets: (d.widgets || []).filter(w => w.id !== widgetId) } : d
        ),
        loading: false,
      });
    } catch (e: any) {
      set({ error: e.message || 'Failed to remove widget', loading: false });
    }
  },

  updateWidgetInDashboard: async (dashboardId, widgetId, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedWidget = await updateWidget(widgetId, updates);
      set({
        dashboards: get().dashboards.map(d =>
          d.id === dashboardId
            ? {
                ...d,
                widgets: (d.widgets || []).map(w => w.id === widgetId ? updatedWidget : w),
              }
            : d
        ),
        loading: false,
      });
    } catch (e: any) {
      set({ error: e.message || 'Failed to update widget', loading: false });
    }
  },
}));

// Usage: const { dashboards, createDashboard, ... } = useDashboardStore(); 