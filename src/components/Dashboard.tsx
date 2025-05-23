import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Responsive, WidthProvider, Layouts, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import WidgetContainer from '@/components/WidgetContainer';
import { saveLayout, getLayout, getLayoutWithMeta } from '@/services/dashboardLayoutService';
import {
  isValidLayoutsObject,
  Layouts as GridLayouts, // Rename imported Layouts to avoid conflict
  saveLayoutToLocalStorage,
  loadLayoutFromLocalStorage,
} from '@/utils/dashboardUtils';
import { Button } from '@/components/ui/button';
import { Undo, Redo, Loader2, RotateCcw, Settings } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast"; // Import useToast
import { DashboardSettingsPanel } from '@/components/DashboardSettingsPanel'; // Import the panel
import { widgets as widgetRegistry } from '@/data/widgets';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { DashboardTemplate } from '@/services/TemplateService';
import { getWidgets, createWidget, deleteWidget } from '@/services/database';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import {
  getSyncQueue,
  processSyncQueue,
  SyncQueueItem,
  clearSyncQueue
} from '@/utils/syncQueue';
import type { Widget } from '@/types/database';

// --- Simple Debounce Utility ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}
// --- End Debounce Utility ---

const ResponsiveGridLayout = WidthProvider(Responsive);

// Default layout if nothing else is found
const initialLayouts: GridLayouts = {
  lg: [
    { i: 'TodoWidget', x: 0, y: 0, w: 4, h: 2, static: false, minW: 2, minH: 1, maxW: 6, maxH: 12 },
    { i: 'PomodoroWidget', x: 4, y: 0, w: 4, h: 2, minW: 2, minH: 1, maxW: 8, maxH: 12 },
    { i: 'WeatherWidget', x: 8, y: 0, w: 4, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 12 },
    { i: 'ExerciseWidget', x: 0, y: 2, w: 12, h: 2, static: false, minW: 3, minH: 1, maxW: 12, maxH: 20 },
    { i: 'PracticeGoalsWidget', x: 0, y: 4, w: 12, h: 2, minW: 3, minH: 1, maxW: 12, maxH: 12 },
  ],
  md: [
    { i: 'TodoWidget', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 1, maxW: 5, maxH: 12 },
    { i: 'PomodoroWidget', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 1, maxW: 5, maxH: 12 },
    { i: 'WeatherWidget', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 1, maxW: 5, maxH: 12 },
    { i: 'ExerciseWidget', x: 0, y: 2, w: 9, h: 2, minW: 3, minH: 1, maxW: 9, maxH: 20 },
    { i: 'PracticeGoalsWidget', x: 0, y: 4, w: 9, h: 2, minW: 3, minH: 1, maxW: 9, maxH: 12 },
  ],
  sm: [
    { i: 'TodoWidget', x: 0, y: 0, w: 6, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 12 },
    { i: 'PomodoroWidget', x: 0, y: 2, w: 6, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 12 },
    { i: 'WeatherWidget', x: 0, y: 4, w: 6, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 12 },
    { i: 'ExerciseWidget', x: 0, y: 6, w: 6, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 20 },
    { i: 'PracticeGoalsWidget', x: 0, y: 8, w: 6, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 12 },
  ],
  xs: [
    { i: 'TodoWidget', x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 1, maxW: 4, maxH: 12 },
    { i: 'PomodoroWidget', x: 0, y: 2, w: 4, h: 2, minW: 2, minH: 1, maxW: 4, maxH: 12 },
    { i: 'WeatherWidget', x: 0, y: 4, w: 4, h: 2, minW: 2, minH: 1, maxW: 4, maxH: 12 },
    { i: 'ExerciseWidget', x: 0, y: 6, w: 4, h: 2, minW: 2, minH: 1, maxW: 4, maxH: 20 },
    { i: 'PracticeGoalsWidget', x: 0, y: 8, w: 4, h: 2, minW: 2, minH: 1, maxW: 4, maxH: 12 },
  ],
  xxs: [
    { i: 'TodoWidget', x: 0, y: 0, w: 2, h: 2, minW: 1, minH: 1, maxW: 2, maxH: 12 },
    { i: 'PomodoroWidget', x: 0, y: 2, w: 2, h: 2, minW: 1, minH: 1, maxW: 2, maxH: 12 },
    { i: 'WeatherWidget', x: 0, y: 4, w: 2, h: 2, minW: 1, minH: 1, maxW: 2, maxH: 12 },
    { i: 'ExerciseWidget', x: 0, y: 6, w: 2, h: 2, minW: 1, minH: 1, maxW: 2, maxH: 20 },
    { i: 'PracticeGoalsWidget', x: 0, y: 8, w: 2, h: 2, minW: 1, minH: 1, maxW: 2, maxH: 12 },
  ],
};

// Define breakpoints and corresponding column counts
const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const cols = { lg: 12, md: 9, sm: 6, xs: 4, xxs: 2 };

const SAVE_DELAY = 1500; // ms delay before saving layout

// Define an interface for widget definitions
interface WidgetDefinition {
  id: string;
  title: string;
  component: React.ReactNode;
  isLoading?: boolean;
  error?: string | undefined;
}

interface DashboardProps {
  dashboardId: string;
  onAddWidgetClick?: () => void;
  widgets: Widget[]; // Only use widgets from Zustand
  period?: string; // e.g., 'week', 'month', etc.
  view?: string;   // e.g., 'summary', 'detailed', etc.
  filter?: string; // e.g., 'overdue', 'completed', etc.
  template?: DashboardTemplate;
}

// Helper to ensure safe widget sizes
const safeWidgetSize = (w = 4, h = 4, minW = 2, minH = 2, maxW = 12, maxH = 8) => ({
  w: Math.max(w, minW),
  h: Math.max(h, minH),
  minW,
  minH,
  maxW: Math.max(maxW, minW),
  maxH: Math.max(maxH, minH),
});

// Utility to normalize a single layout item
function normalizeLayoutItem(item) {
  const minW = item.minW ?? 2;
  const maxW = Math.max(item.maxW ?? 12, minW);
  const w = Math.max(minW, Math.min(item.w ?? 4, maxW));

  const minH = item.minH ?? 2;
  const maxH = Math.max(item.maxH ?? 8, minH);
  const h = Math.max(minH, Math.min(item.h ?? 4, maxH));

  return {
    ...item,
    minW,
    maxW,
    w,
    minH,
    maxH,
    h,
  };
}

// Utility to normalize all layouts
function normalizeLayouts(layouts) {
  const result = {};
  for (const key in layouts) {
    result[key] = layouts[key].map(normalizeLayoutItem);
  }
  return result;
}

// Utility to check for invalid layout items (for debugging)
function logInvalidLayouts(layouts) {
  Object.entries(layouts).forEach(([breakpoint, items]) => {
    if (Array.isArray(items)) {
      items.forEach(item => {
        if (item.minW > item.w || item.minW > item.maxW || item.minH > item.h || item.minH > item.maxH) {
          console.warn(`Invalid layout item in breakpoint ${breakpoint}:`, item);
        }
      });
    }
  });
}

// Helper to generate a layout for a given breakpoint
function generateLayout(widgetPositions, colCount) {
  return Object.values(widgetPositions).map((widgetId, idx) =>
    normalizeLayoutItem({
      i: widgetId, // Use widget id as the layout id
      x: (idx % colCount) * 2,
      y: Math.floor(idx / colCount) * 2,
      w: Math.min(4, colCount),
      h: 4,
      minW: 2,
      minH: 2,
      maxW: colCount,
      maxH: widgetId === 'ExerciseWidget' ? 20 : 12, // Example: allow ExerciseWidget to be taller
    })
  );
}

// Helper to generate layouts for all breakpoints
function generateAllLayouts(widgetPositions) {
  return {
    lg: generateLayout(widgetPositions, cols.lg),
    md: generateLayout(widgetPositions, cols.md),
    sm: generateLayout(widgetPositions, cols.sm),
    xs: generateLayout(widgetPositions, cols.xs),
    xxs: generateLayout(widgetPositions, cols.xxs),
  };
}

const Dashboard: React.FC<DashboardProps> = ({
  dashboardId,
  onAddWidgetClick = () => {},
  widgets = [],
  period,
  view,
  filter,
  template
}) => {
  // --- Template-based customization enforcement ---
  const customization = template?.customization || {};
  const allowedWidgetTypes = customization.allowedWidgetTypes || null;
  const allowWidgetAdd = customization.allowWidgetAdd !== false; // default true
  const allowWidgetRemove = customization.allowWidgetRemove !== false; // default true
  const allowWidgetMove = customization.allowWidgetMove !== false; // default true
  const allowWidgetResize = customization.allowWidgetResize !== false; // default true
  const allowLayoutChange = customization.allowLayoutChange !== false; // default true

  const filteredWidgets = useMemo(
    () => allowedWidgetTypes
      ? widgets.filter(w => allowedWidgetTypes.includes(w.type))
      : widgets,
    [widgets, allowedWidgetTypes]
  );

  // For rendering, use filteredWidgets array
  const widgetsToRender = filteredWidgets.map(w => {
    const meta = widgetRegistry.find(meta => meta.id === w.type);
    return {
      id: w.id,
      title: meta?.name || '',
      component: meta?.render({ id: w.id, dashboard_id: dashboardId }) || <div>No widget found</div>,
    };
  });

  // Layout generation now only uses filteredWidgets
  const initialLayouts = React.useMemo(() => {
    if (template?.layout) {
      const breakpoints = template.layout.breakpoints;
      const items = template.layout.items;
      const layouts: any = {};
      for (const [bp, cols] of Object.entries(breakpoints)) {
        layouts[bp] = items.map(item => ({ ...item }));
      }
      return layouts;
    }
    return generateAllLayouts(filteredWidgets);
  }, [template, filteredWidgets]);

  const [layouts, setLayouts] = useState<GridLayouts>(initialLayouts); // Use renamed type
  const [history, setHistory] = useState<GridLayouts[]>([initialLayouts]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Add saving state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // State for settings panel
  const { toast } = useToast(); // Initialize toast
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);

  // --- Placeholder Settings State & Handlers ---
  // TODO: Replace these with actual state management and logic
  const [user, setUser] = useState({ id: 'user123', displayName: 'Demo User', email: 'demo@example.com', timezone: 'America/New_York' }); // Example user
  const [currentWidgets, setCurrentWidgets] = useState([
    { id: 'TodoWidget', name: 'To-Do List', visible: true },
    { id: 'PomodoroWidget', name: 'Pomodoro Timer', visible: true },
    { id: 'c', name: 'Widget C (Error)', visible: true },
    { id: 'd', name: 'Widget D', visible: false },
  ]);
  const [layoutPreset, setLayoutPreset] = useState('default');
  const [theme, setTheme] = useState('system');
  const [gridSettings, setGridSettings] = useState({ cols: 12, rowHeight: 80 });

  const handleWidgetVisibilityChange = (widgetId: string, isVisible: boolean, isPreview?: boolean) => {
    console.log(`Widget ${widgetId} visibility changed to ${isVisible}. Preview: ${isPreview}`);
    // TODO: Implement actual logic (update temporary or permanent state)
    setCurrentWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, visible: isVisible } : w));
  };
  const handleLayoutPresetChange = (preset: string, isPreview?: boolean) => {
    console.log(`Layout preset changed to ${preset}. Preview: ${isPreview}`);
    // TODO: Implement actual logic (update temporary or permanent state)
    if (!isPreview) setLayoutPreset(preset);
    // If isPreview, maybe update a temporary state or directly apply to grid layout temporarily
  };
  const handleThemeChange = (newTheme: string, isPreview?: boolean) => {
    console.log(`Theme changed to ${newTheme}. Preview: ${isPreview}`);
    // TODO: Implement actual logic (update temporary or permanent state)
    if (!isPreview) setTheme(newTheme);
    // If isPreview, maybe update a temporary state or apply theme class temporarily
  };
  const handleGridSettingsChange = (settings: { cols: number; rowHeight: number }, isPreview?: boolean) => {
    console.log(`Grid settings changed:`, settings, `Preview: ${isPreview}`);
    // TODO: Implement actual logic (update temporary or permanent state)
    if (!isPreview) setGridSettings(settings);
    // If isPreview, maybe update temporary state or apply grid settings temporarily
  };
  // --- End Placeholder Settings State & Handlers ---

  // Fetch widgets for this dashboard
  const [dashboardWidgets, setDashboardWidgets] = useState<Widget[]>([]);
  useEffect(() => {
    if (!dashboardId) return;
    getWidgets(dashboardId).then(setDashboardWidgets).catch(console.error);
  }, [dashboardId]);

  // Load initial layout from DB or Local Storage on mount
  useEffect(() => {
    const loadInitialLayout = async () => {
      let finalLayout: GridLayouts | null = null;
      try {
        console.log("Attempting to load initial layout from DB...");
        const dbLayout = await getLayout(); // Assuming default layout for now
        if (dbLayout && isValidLayoutsObject(dbLayout)) {
          console.log("Loaded layout from DB.");
          finalLayout = dbLayout;
          saveLayoutToLocalStorage(dbLayout); // Update local storage with DB data
        } else {
          console.log("No valid layout in DB, checking local storage...");
          const localLayout = loadLayoutFromLocalStorage();
          if (localLayout) {
            console.log("Using layout from local storage.");
            finalLayout = localLayout;
          } else {
             console.log("No valid layout in local storage, using initial default.");
          }
        }
      } catch (error) {
        console.error("Error loading layout from DB, checking local storage:", error);
        const localLayout = loadLayoutFromLocalStorage();
        if (localLayout) {
           console.log("Using layout from local storage after DB error.");
           finalLayout = localLayout;
        } else {
            console.log("No valid layout in local storage after DB error, using initial default.");
        }
      }

      // Set the final determined layout
      const layoutToUse = finalLayout || initialLayouts;
      const normalized = normalizeLayouts(layoutToUse);
      setLayouts(normalized);
      setHistory([normalized]);
      setHistoryIndex(0);
      setIsLoaded(true);
      console.log("Dashboard layout loaded.");
    };
    loadInitialLayout();
  }, []);

  // Reconnection sync logic
  useEffect(() => {
    let didCancel = false;
    if (isOnline) {
      const queue = getSyncQueue();
      if (queue.length > 0) {
        setIsSyncing(true);
        processSyncQueue(async (item: SyncQueueItem) => {
          if (item.type === 'update') {
            try {
              // Fetch remote updatedAt for conflict resolution
              const { updatedAt: remoteUpdatedAt } = await getLayoutWithMeta(item.dashboardId);
              const localUpdatedAt = item.updatedAt || new Date(item.timestamp).toISOString();
              if (remoteUpdatedAt && new Date(remoteUpdatedAt) > new Date(localUpdatedAt)) {
                if (!didCancel) toast({ title: 'Sync Skipped', description: 'Remote version is newer, skipping local change.', variant: 'default' });
                return true; // Remove from queue, do not overwrite remote
              }
              // Last write wins: local is newer or equal, proceed to save
              const success = await saveLayout(item.payload, item.dashboardId);
              if (success) {
                if (!didCancel) toast({ title: 'Dashboard Synced', description: 'Offline changes have been synced to the cloud.' });
                return true;
              } else {
                if (!didCancel) toast({ title: 'Sync Failed', description: 'Could not sync dashboard changes.', variant: 'destructive' });
                return false;
              }
            } catch (e) {
              if (!didCancel) toast({ title: 'Sync Error', description: 'Error syncing dashboard changes.', variant: 'destructive' });
              return false;
            }
          } else {
            // For now, just log other types
            console.log('SyncQueue: Skipping unsupported type', item.type);
            return true;
          }
        }).finally(() => {
          if (!didCancel) setIsSyncing(false);
        });
      }
    }
    return () => { didCancel = true; };
  }, [isOnline, toast]);

  // Debounced save function (saves the current state)
  const debouncedSaveLayout = useCallback(
    debounce(async (layoutToSave: GridLayouts) => {
      if (!isLoaded) return; // Don't save before initial load is complete
      setIsSaving(true); // Set saving state to true
      console.log('Debounced save triggered with layouts:', layoutToSave);
      try {
        const normalized = normalizeLayouts(layoutToSave);
        const success = await saveLayout(normalized);
        if (success) {
            console.log("Layout successfully saved to DB.");
            saveLayoutToLocalStorage(normalized); // Update local storage on successful save
            toast({ title: "Layout Saved", description: "Dashboard layout saved successfully." });
        } else {
            console.warn("Failed to save layout to DB, saving to local storage only.");
            saveLayoutToLocalStorage(normalized);
            toast({
                title: "Offline Save",
                description: "Could not save layout online. Saved locally.",
                variant: "destructive",
            });
        }
      } catch (error) {
            console.error("Error during saveLayout call:", error);
            console.warn("Saving layout to local storage due to error.");
            saveLayoutToLocalStorage(normalizeLayouts(layoutToSave));
             toast({
                title: "Save Error",
                description: "An error occurred while saving. Saved locally.",
                variant: "destructive",
            });
      } finally {
        setIsSaving(false); // Reset saving state regardless of outcome
      }
    }, SAVE_DELAY),
    [isLoaded, toast] // Add toast dependency
  );

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: GridLayouts) => {
    const normalized = normalizeLayouts(allLayouts);
    if (JSON.stringify(normalized) !== JSON.stringify(history[historyIndex])) {
        console.log('Layout changed externally, updating history...');
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(normalized);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setLayouts(normalized);
        debouncedSaveLayout(normalized);
    } else {
        console.log('Layout change originated from undo/redo, skipping history update.');
    }

    // Here you would also handle widget type changes from drag and drop
    // This would require additional logic to track which widget was dropped where
  };

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      console.log('Undoing layout change...');
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setLayouts(normalizeLayouts(history[newIndex]));
      debouncedSaveLayout(normalizeLayouts(history[newIndex]));
    }
  }, [history, historyIndex, debouncedSaveLayout]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      console.log('Redoing layout change...');
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setLayouts(normalizeLayouts(history[newIndex]));
      debouncedSaveLayout(normalizeLayouts(history[newIndex]));
    }
  }, [history, historyIndex, debouncedSaveLayout]);

  // Function to reset layout
  const handleResetLayout = useCallback(() => {
    if (window.confirm('Are you sure you want to reset the layout to default? This cannot be undone easily.')) {
        console.log('Resetting layout to default...');
        const normalized = normalizeLayouts(initialLayouts);
        setLayouts(normalized);
        setHistory([normalized]); // Reset history
        setHistoryIndex(0);
        debouncedSaveLayout(normalized); // Save the reset state
        toast({ title: "Layout Reset", description: "Dashboard layout reset to default." });
    }
  }, [debouncedSaveLayout, toast]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleRemoveWidget = (position: string) => {
    setPendingRemove(position);
  };

  const confirmRemoveWidget = () => {
    if (pendingRemove) {
      setLayouts(prevLayouts => {
        const newLayouts = { ...prevLayouts };
        Object.keys(newLayouts).forEach(breakpoint => {
          newLayouts[breakpoint] = newLayouts[breakpoint].filter(item => item.i !== pendingRemove);
        });
        return newLayouts;
      });
      setPendingRemove(null);
    }
  };

  const cancelRemoveWidget = () => setPendingRemove(null);

  // When widgetPositions changes (add/remove), regenerate all layouts
  useEffect(() => {
    if (isLoaded) {
      const newLayouts = normalizeLayouts(generateAllLayouts(filteredWidgets));
      if (JSON.stringify(newLayouts) !== JSON.stringify(layouts)) {
        setLayouts(newLayouts);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredWidgets, isLoaded]);

  // Debug log for layouts
  console.log('Current layouts:', layouts);

  // Example add widget handler (replace/add as needed)
  const handleAddWidgetToDashboard = async (type: string, config?: Record<string, any>) => {
    try {
      const newWidget = await createWidget({
        user_id: user.id,
        dashboard_id: dashboardId,
        type,
        config,
        position: dashboardWidgets.length + 1,
      });
      setDashboardWidgets(prev => [...prev, newWidget]);
      toast({ title: 'Widget added', description: `${type} widget added to dashboard.` });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to add widget', variant: 'destructive' });
    }
  };

  // Example remove widget handler
  const handleRemoveWidgetFromDashboard = async (widgetId: string) => {
    try {
      await deleteWidget(widgetId);
      setDashboardWidgets(prev => prev.filter(w => w.id !== widgetId));
      toast({ title: 'Widget removed', description: 'Widget removed from dashboard.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to remove widget', variant: 'destructive' });
    }
  };

  return (
    <div className="flex-1 w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2 items-center"> {/* Use items-center */}
          {/* Saving Indicator */}
          {isSaving && (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
          {/* Undo/Redo/Reset Buttons */}
          <Button variant="outline" size="icon" onClick={undo} disabled={!canUndo || isSaving} aria-label="Undo layout change">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={redo} disabled={!canRedo || isSaving} aria-label="Redo layout change">
            <Redo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleResetLayout} disabled={isSaving} aria-label="Reset layout to default">
             <RotateCcw className="h-4 w-4" />
          </Button>
          {/* Settings Button */}
          <Button 
             variant="outline" 
             size="icon" 
             onClick={() => setIsSettingsOpen(true)} 
             disabled={isSaving} // Optionally disable while saving
             aria-label="Open dashboard settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {isLoaded ? (
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={breakpoints}
          cols={cols}
          rowHeight={150}
          margin={[10, 10]}
          containerPadding={[10, 10]}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".widget-drag-handle"
          isDraggable={allowWidgetMove}
          isResizable={allowWidgetResize}
        >
          {widgetsToRender.map(({ id, component }) => (
            <div key={id} data-grid={layouts.lg.find(l => l.i === id)}>
              <WidgetContainer
                onRemove={() => handleRemoveWidget(id)}
                allowRemove={allowWidgetRemove}
              >
                {component}
              </WidgetContainer>
            </div>
          ))}
        </ResponsiveGridLayout>
      ) : (
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {/* Render Settings Panel Conditionally */}
      <DashboardSettingsPanel
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        user={user} // Pass placeholder user
        widgets={currentWidgets} // Pass placeholder widgets
        onWidgetVisibilityChange={handleWidgetVisibilityChange} // Pass handler
        currentLayoutPreset={layoutPreset} // Pass placeholder preset
        onLayoutPresetChange={handleLayoutPresetChange} // Pass handler
        currentTheme={theme} // Pass placeholder theme
        onThemeChange={handleThemeChange} // Pass handler
        currentGridSettings={gridSettings} // Pass placeholder grid settings
        onGridSettingsChange={handleGridSettingsChange} // Pass handler
      />

      {/* Remove Confirmation Dialog */}
      <Dialog open={!!pendingRemove} onOpenChange={cancelRemoveWidget}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Widget</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to remove this widget from your dashboard? This action cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={cancelRemoveWidget}>Cancel</Button>
            <Button variant="destructive" onClick={confirmRemoveWidget}>Remove</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard; 