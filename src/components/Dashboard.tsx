import React, { useState, useCallback, useEffect } from 'react';
import { Responsive, WidthProvider, Layouts, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import WidgetContainer from '@/components/WidgetContainer';
import { saveLayout, getLayout } from '@/services/dashboardLayoutService';
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
import TodoWidget from '@/components/widgets/TodoWidget'; // Import TodoWidget

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
    { i: 'a', x: 0, y: 0, w: 4, h: 2, static: false, minW: 2, minH: 1, maxW: 6, maxH: 4 },
    { i: 'b', x: 4, y: 0, w: 4, h: 2, minW: 2, minH: 1, maxW: 8, maxH: 4 },
    { i: 'c', x: 8, y: 0, w: 4, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 4 },
    { i: 'd', x: 0, y: 2, w: 12, h: 2, minW: 3, minH: 1, maxW: 12, maxH: 4 },
  ],
  md: [
    { i: 'a', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 1, maxW: 5, maxH: 4 },
    { i: 'b', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 1, maxW: 5, maxH: 4 },
    { i: 'c', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 1, maxW: 5, maxH: 4 },
    { i: 'd', x: 0, y: 2, w: 9, h: 2, minW: 3, minH: 1, maxW: 9, maxH: 4 },
  ],
  sm: [
    { i: 'a', x: 0, y: 0, w: 6, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 4 },
    { i: 'b', x: 0, y: 2, w: 6, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 4 },
    { i: 'c', x: 0, y: 4, w: 6, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 4 },
    { i: 'd', x: 0, y: 6, w: 6, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 4 },
  ],
  xs: [
    { i: 'a', x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 1, maxW: 4, maxH: 4 },
    { i: 'b', x: 0, y: 2, w: 4, h: 2, minW: 2, minH: 1, maxW: 4, maxH: 4 },
    { i: 'c', x: 0, y: 4, w: 4, h: 2, minW: 2, minH: 1, maxW: 4, maxH: 4 },
    { i: 'd', x: 0, y: 6, w: 4, h: 2, minW: 2, minH: 1, maxW: 4, maxH: 4 },
  ],
  xxs: [
    { i: 'a', x: 0, y: 0, w: 2, h: 2, minW: 1, minH: 1, maxW: 2, maxH: 3 },
    { i: 'b', x: 0, y: 2, w: 2, h: 2, minW: 1, minH: 1, maxW: 2, maxH: 3 },
    { i: 'c', x: 0, y: 4, w: 2, h: 2, minW: 1, minH: 1, maxW: 2, maxH: 3 },
    { i: 'd', x: 0, y: 6, w: 2, h: 2, minW: 1, minH: 1, maxW: 2, maxH: 3 },
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

const Dashboard: React.FC = () => {
  const [layouts, setLayouts] = useState<GridLayouts>(initialLayouts); // Use renamed type
  const [history, setHistory] = useState<GridLayouts[]>([initialLayouts]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Add saving state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // State for settings panel
  const { toast } = useToast(); // Initialize toast

  // --- Placeholder Settings State & Handlers ---
  // TODO: Replace these with actual state management and logic
  const [user, setUser] = useState({ id: 'user123', displayName: 'Demo User', email: 'demo@example.com', timezone: 'America/New_York' }); // Example user
  const [currentWidgets, setCurrentWidgets] = useState([
    { id: 'a', name: 'Widget A', visible: true },
    { id: 'b', name: 'Widget B (Loading)', visible: true },
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

  // Create a state to track which widget is in each position
  const [widgetPositions, setWidgetPositions] = useState<{[key: string]: string}>({
    'a': 'todo',
    'b': 'loading',
    'c': 'error',
    'd': 'empty'
  });
  
  // Define the available widget types
  const widgetDefinitions: {[key: string]: WidgetDefinition} = {
    'todo': { 
      id: 'todo', 
      title: 'To-Do List', 
      component: <TodoWidget id="a" />,
      isLoading: false, 
      error: undefined 
    },
    'loading': { 
      id: 'loading', 
      title: 'Widget B (Loading)', 
      component: <div>Content for Widget B</div>,
      isLoading: true, 
      error: undefined 
    },
    'error': { 
      id: 'error', 
      title: 'Widget C (Error)', 
      component: <div>Content for Widget C</div>,
      isLoading: false, 
      error: 'Failed to load data.' 
    },
    'empty': { 
      id: 'empty', 
      title: 'Widget D', 
      component: <div>Content for Widget D</div>,
      isLoading: false, 
      error: undefined 
    },
  };

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
      setLayouts(layoutToUse);
      setHistory([layoutToUse]);
      setHistoryIndex(0);
      setIsLoaded(true);
      console.log("Dashboard layout loaded.");
    };
    loadInitialLayout();
  }, []);

  // Debounced save function (saves the current state)
  const debouncedSaveLayout = useCallback(
    debounce(async (layoutToSave: GridLayouts) => {
      if (!isLoaded) return; // Don't save before initial load is complete
      setIsSaving(true); // Set saving state to true
      console.log('Debounced save triggered with layouts:', layoutToSave);
      try {
        const success = await saveLayout(layoutToSave);
        if (success) {
            console.log("Layout successfully saved to DB.");
            saveLayoutToLocalStorage(layoutToSave); // Update local storage on successful save
            toast({ title: "Layout Saved", description: "Dashboard layout saved successfully." });
        } else {
            console.warn("Failed to save layout to DB, saving to local storage only.");
            saveLayoutToLocalStorage(layoutToSave);
            toast({
                title: "Offline Save",
                description: "Could not save layout online. Saved locally.",
                variant: "destructive",
            });
        }
      } catch (error) {
            console.error("Error during saveLayout call:", error);
            console.warn("Saving layout to local storage due to error.");
            saveLayoutToLocalStorage(layoutToSave);
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
    if (JSON.stringify(allLayouts) !== JSON.stringify(history[historyIndex])) {
        console.log('Layout changed externally, updating history...');
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(allLayouts);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setLayouts(allLayouts);
        debouncedSaveLayout(allLayouts);
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
      setLayouts(history[newIndex]);
      debouncedSaveLayout(history[newIndex]);
    }
  }, [history, historyIndex, debouncedSaveLayout]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      console.log('Redoing layout change...');
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setLayouts(history[newIndex]);
      debouncedSaveLayout(history[newIndex]);
    }
  }, [history, historyIndex, debouncedSaveLayout]);

  // Function to reset layout
  const handleResetLayout = useCallback(() => {
    if (window.confirm('Are you sure you want to reset the layout to default? This cannot be undone easily.')) {
        console.log('Resetting layout to default...');
        setLayouts(initialLayouts);
        setHistory([initialLayouts]); // Reset history
        setHistoryIndex(0);
        debouncedSaveLayout(initialLayouts); // Save the reset state
        toast({ title: "Layout Reset", description: "Dashboard layout reset to default." });
    }
  }, [debouncedSaveLayout, toast]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Create the list of widgets to render based on current positions
  const widgetsToRender = Object.keys(widgetPositions).map(position => {
    const widgetType = widgetPositions[position];
    const widget = widgetDefinitions[widgetType];
    
    return {
      id: position,
      title: widget.title,
      component: widget.component,
      isLoading: widget.isLoading,
      error: widget.error
    };
  });

  return (
    <div className="flex flex-col min-h-screen p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
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
          isDraggable={true}
          isResizable={true}
        >
          {widgetsToRender.map((widget) => (
            <div key={widget.id} className="overflow-hidden">
              <WidgetContainer
                title={widget.title}
                isLoading={widget.isLoading}
                error={widget.error}
              >
                {widget.component}
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
    </div>
  );
};

export default Dashboard; 