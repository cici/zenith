import React, { useState, useEffect, useRef } from "react";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTimer, TimerMode } from "@/contexts/TimerContext";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Coffee, 
  Clock, 
  Settings,
  BarChart4,
  PieChart,
  Bug,
  Zap,
  Palette,
  CircleOff,
  CircleDashed,
  Eye,
  Bell,
  Volume2,
  VolumeX,
  MessageSquare,
  Circle,
} from "lucide-react";
import ResizableWidget from "@/components/ResizableWidget";
import { TaskSelector } from '@/components/TaskSelector';
import { Separator } from "@/components/ui/separator";
import { formatDuration } from '@/utils/timeUtils';
import { TaskStatisticsView } from '@/components/TaskStatisticsView';
import { pomodoroWidgetConfigSchema } from "./pomodoroConfigSchema";
import { WidgetConfigPanel } from "@/components/WidgetConfigPanel";

interface PomodoroWidgetProps {
  id: string;
  title?: string;
  color?: string;
}

// Helper function to determine progress percentage
const calculateProgress = (remaining: number, total: number): number => {
  return 100 - (remaining / total) * 100;
};

// Helper function to get color based on timer mode and settings
const getModeColor = (mode: TimerMode, settings: any): string => {
  switch (mode) {
    case 'work':
      return `text-[${settings.workColor}]`;
    case 'shortBreak':
      return `text-[${settings.shortBreakColor}]`;
    case 'longBreak':
      return `text-[${settings.longBreakColor}]`;
    default:
      return 'text-gray-500';
  }
};

// Helper function to get the background color for progress based on settings
const getModeBackgroundColor = (mode: TimerMode, settings: any): string => {
  switch (mode) {
    case 'work':
      return settings.workColor;
    case 'shortBreak':
      return settings.shortBreakColor;
    case 'longBreak':
      return settings.longBreakColor;
    default:
      return '#6b7280'; // gray-500
  }
};

// Helper function to get mode display text
const getModeDisplayText = (mode: TimerMode): string => {
  switch (mode) {
    case 'work':
      return 'Focus';
    case 'shortBreak':
      return 'Short Break';
    case 'longBreak':
      return 'Long Break';
    default:
      return 'Unknown';
  }
};

// Helper to format time in HH:MM:SS format
const formatTimeDisplay = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Theme presets
const themePresets = {
  default: {
    workColor: '#ef4444', // red-500
    shortBreakColor: '#22c55e', // green-500
    longBreakColor: '#3b82f6', // blue-500
    fontFamily: 'system-ui, sans-serif',
    progressCircleWidth: 12,
  },
  modern: {
    workColor: '#f97316', // orange-500
    shortBreakColor: '#06b6d4', // cyan-500
    longBreakColor: '#8b5cf6', // violet-500
    fontFamily: '"Inter", sans-serif',
    progressCircleWidth: 8,
  },
  minimal: {
    workColor: '#71717a', // zinc-500
    shortBreakColor: '#94a3b8', // slate-400
    longBreakColor: '#475569', // slate-600
    fontFamily: '"DM Sans", sans-serif',
    progressCircleWidth: 4,
  },
  classic: {
    workColor: '#b91c1c', // red-700
    shortBreakColor: '#15803d', // green-700
    longBreakColor: '#1d4ed8', // blue-700
    fontFamily: '"Georgia", serif',
    progressCircleWidth: 16,
  },
  dark: {
    workColor: '#f43f5e', // rose-500
    shortBreakColor: '#10b981', // emerald-500
    longBreakColor: '#6366f1', // indigo-500
    fontFamily: '"Roboto Mono", monospace',
    progressCircleWidth: 10,
  },
};

// Available font options
const fontOptions = [
  { value: 'system-ui, sans-serif', label: 'System Default' },
  { value: '"Inter", sans-serif', label: 'Inter' },
  { value: '"Roboto", sans-serif', label: 'Roboto' },
  { value: '"Open Sans", sans-serif', label: 'Open Sans' },
  { value: '"DM Sans", sans-serif', label: 'DM Sans' },
  { value: '"Roboto Mono", monospace', label: 'Roboto Mono' },
  { value: '"Georgia", serif', label: 'Georgia' },
];

// Task Metrics Card Component
const TaskMetricsCard = ({ 
  taskTimeMap, 
  totalWorkTime 
}: { 
  taskTimeMap: {[taskId: string]: number}, 
  totalWorkTime: number
}) => {
  const { state } = useTimer();
  
  if (!taskTimeMap || Object.keys(taskTimeMap).length === 0) {
    return (
      <div className="bg-muted p-4 rounded-lg">
        <h3 className="text-sm font-medium mb-2">Task Distribution</h3>
        <div className="text-center py-4 text-muted-foreground text-sm">
          No tasks associated with timer sessions today.
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-muted p-4 rounded-lg">
      <h3 className="text-sm font-medium mb-2">Time Per Task</h3>
      <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
        {Object.entries(taskTimeMap).map(([taskId, timeSpent]) => {
          // Find task title if available
          const taskTitle = state.associatedTask?.id === taskId 
            ? state.associatedTask.title 
            : `Task ${taskId.slice(0, 6)}...`;
            
          const percentage = Math.round((timeSpent / totalWorkTime) * 100);
          
          return (
            <div key={taskId} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate max-w-[200px]">{taskTitle}</span>
                <span>{formatDuration(timeSpent)} ({percentage}%)</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PomodoroWidget = ({ id, title = "Pomodoro Timer", color = "bg-[#2A2349]" }: PomodoroWidgetProps) => {
  const {
    state,
    settings,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipTimer,
    updateSettings,
    formatTimeRemaining,
    adjustDuration,
    getStatus,
    getProgressPercent,
    getElapsedTime,
    getSessionData,
    // Developer utilities
    toggleDebugMode,
    toggleTestingMode,
    setSpeedFactor,
    eventEmitter,
  } = useTimer();

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem("pomodoroWidgetConfig") : null;
    if (saved) return JSON.parse(saved);
    const defaults: Record<string, any> = {};
    pomodoroWidgetConfigSchema.fields.forEach(f => (defaults[f.name] = f.default));
    return defaults;
  });
  useEffect(() => {
    localStorage.setItem("pomodoroWidgetConfig", JSON.stringify(config));
  }, [config]);
  const handleConfigChange = (name: string, value: any) => {
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const [statsOpen, setStatsOpen] = useState(false);
  const [newSettings, setNewSettings] = useState({ ...settings });
  const [eventLog, setEventLog] = useState<{event: string, time: string, data?: any}[]>([]);
  
  // Get session data
  const sessionData = getSessionData();
  
  // Refs for audio preview
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  
  // State for active tab in settings
  const [activeTab, setActiveTab] = useState('durations');

  // Track if appearance tab has been visited for optimization
  const [hasVisitedAppearance, setHasVisitedAppearance] = useState(false);
  const [hasVisitedNotifications, setHasVisitedNotifications] = useState(false);

  // Setup event listeners
  useEffect(() => {
    const logEvent = (event: string) => (data?: any) => {
      if (settings.debugMode) {
        const time = new Date().toISOString().slice(11, 19); // HH:MM:SS
        setEventLog(prev => [...prev.slice(-9), { event, time, data }]); // Keep last 10 events
      }
    };

    // Register event listeners
    eventEmitter.on('start', logEvent('start'));
    eventEmitter.on('pause', logEvent('pause'));
    eventEmitter.on('resume', logEvent('resume'));
    eventEmitter.on('reset', logEvent('reset'));
    eventEmitter.on('skip', logEvent('skip'));
    eventEmitter.on('complete', logEvent('complete'));
    eventEmitter.on('modeChange', logEvent('modeChange'));

    // Cleanup
    return () => {
      eventEmitter.off('start', logEvent('start'));
      eventEmitter.off('pause', logEvent('pause'));
      eventEmitter.off('resume', logEvent('resume'));
      eventEmitter.off('reset', logEvent('reset'));
      eventEmitter.off('skip', logEvent('skip'));
      eventEmitter.off('complete', logEvent('complete'));
      eventEmitter.off('modeChange', logEvent('modeChange'));
    };
  }, [eventEmitter, settings.debugMode]);

  // Handle settings updates
  const handleSettingsChange = (key: keyof typeof newSettings, value: any) => {
    setNewSettings(prev => ({ ...prev, [key]: value }));
  };

  // Apply theme preset
  const applyThemePreset = (theme: 'default' | 'modern' | 'minimal' | 'classic' | 'dark') => {
    const preset = themePresets[theme];
    setNewSettings(prev => ({
      ...prev,
      theme,
      workColor: preset.workColor,
      shortBreakColor: preset.shortBreakColor,
      longBreakColor: preset.longBreakColor,
      fontFamily: preset.fontFamily,
      progressCircleWidth: preset.progressCircleWidth,
    }));
  };

  // Save settings
  const saveSettings = () => {
    updateSettings(newSettings);
    setIsConfigOpen(false);
  };

  // Calculate timer progress using our enhanced progress method
  const progress = getProgressPercent();
  
  // Handle time adjustment
  const handleTimeAdjustment = (adjustment: -60 | -30 | 30 | 60) => {
    adjustDuration(adjustment);
  };

  // Get current timer status
  const timerStatus = getStatus();

  // Clear event log
  const clearEventLog = () => {
    setEventLog([]);
  };

  // Generate styles based on current settings
  const getCircleSize = () => {
    switch (settings.progressCircleSize) {
      case 'small': return 'w-40 h-40';
      case 'large': return 'w-64 h-64';
      case 'medium':
      default: return 'w-52 h-52';
    }
  };

  // Get font style
  const getFontStyle = () => {
    return { fontFamily: settings.fontFamily };
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications");
      return;
    }
    
    if (Notification.permission === "granted") {
      return;
    }
    
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // Enable desktop notifications if permission was just granted
        handleSettingsChange('desktopNotificationsEnabled', true);
      }
    }
  };
  
  // Test notification sound
  const playTestSound = (soundName: string) => {
    if (soundName === 'none') return;
    
    try {
      // Create or reuse audio element
      if (!audioPreviewRef.current) {
        audioPreviewRef.current = new Audio();
      }
      
      // Set source and volume
      audioPreviewRef.current.src = `/sounds/${soundName}.mp3`;
      audioPreviewRef.current.volume = newSettings.notificationVolume / 100;
      
      // Play the sound
      audioPreviewRef.current.play().catch(error => {
        console.error('Error playing test sound:', error);
      });
    } catch (error) {
      console.error('Error with test sound:', error);
    }
  };

  return (
    <Card className="h-full overflow-hidden" style={{ ...getFontStyle(), backgroundColor: config.themeColor || color }}>
      <CardContent className="flex flex-col items-center p-4 h-full">
        {/* Unified Header Bar */}
        <div className="flex items-center justify-between w-full px-2 py-2 border-b mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-transparent bg-clip-text" />
            <span className="font-poppins font-semibold text-lg">Pomodoro</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-white shadow">
              {getModeDisplayText(state.mode)}
            </span>
            {state.isRunning ? (
              <Button variant="ghost" size="icon" aria-label="Pause" onClick={pauseTimer}>
                <Pause className="h-5 w-5" />
              </Button>
            ) : state.isPaused ? (
              <Button variant="ghost" size="icon" aria-label="Resume" onClick={resumeTimer}>
                <Play className="h-5 w-5" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" aria-label="Start" onClick={startTimer}>
                <Play className="h-5 w-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" aria-label="Reset" onClick={resetTimer}>
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Skip" onClick={skipTimer}>
              <SkipForward className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Settings" onClick={() => setIsConfigOpen(true)}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {/* Mode indicator and timer display */}
        <div className="text-center mb-5 w-full">
          {settings.showProgressCircle && (
            <div className={`relative mx-auto my-3 flex items-center justify-center ${getCircleSize()}`}>
              {/* SVG Circle for Progress with Zenith gradient */}
              <svg className="absolute" width="100%" height="100%" viewBox="0 0 208 208">
                <defs>
                  <linearGradient id="zenith-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#a21caf" /> {/* purple-500 */}
                    <stop offset="50%" stopColor="#3b82f6" /> {/* blue-500 */}
                    <stop offset="100%" stopColor="#22d3ee" /> {/* cyan-400 */}
                  </linearGradient>
                </defs>
                <circle
                  className="text-gray-200 dark:text-gray-700"
                  strokeWidth={settings.progressCircleWidth}
                  stroke="currentColor"
                  fill="transparent"
                  r="94"
                  cx="104"
                  cy="104"
                />
                <circle
                  strokeWidth={settings.progressCircleWidth}
                  strokeDasharray="590"
                  strokeDashoffset={590 - (590 * progress) / 100}
                  strokeLinecap="round"
                  stroke="url(#zenith-gradient)"
                  fill="transparent"
                  r="94"
                  cx="104"
                  cy="104"
                />
              </svg>
              {/* Timer text */}
              <div className="absolute flex flex-col items-center">
                <span className="text-5xl font-bold">
                  {formatTimeRemaining()}
                </span>
                <div className="flex mt-4 space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full" 
                    onClick={() => handleTimeAdjustment(-60)}
                  >
                    <span className="text-xs">-1m</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full" 
                    onClick={() => handleTimeAdjustment(-30)}
                  >
                    <span className="text-xs">-30s</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full" 
                    onClick={() => handleTimeAdjustment(30)}
                  >
                    <span className="text-xs">+30s</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full" 
                    onClick={() => handleTimeAdjustment(60)}
                  >
                    <span className="text-xs">+1m</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {!settings.showProgressCircle && (
            <div className="my-8 flex flex-col items-center">
              <span className="text-6xl font-bold my-4">
                {formatTimeRemaining()}
              </span>
              <div className="w-full h-2 rounded-full overflow-hidden mb-4 bg-gray-200 dark:bg-gray-700">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex mt-4 gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-full" 
                  onClick={() => handleTimeAdjustment(-60)}
                >
                  <span className="text-xs">-1m</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-full" 
                  onClick={() => handleTimeAdjustment(-30)}
                >
                  <span className="text-xs">-30s</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-full" 
                  onClick={() => handleTimeAdjustment(30)}
                >
                  <span className="text-xs">+30s</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-full" 
                  onClick={() => handleTimeAdjustment(60)}
                >
                  <span className="text-xs">+1m</span>
                </Button>
              </div>
            </div>
          )}
          
          {/* Completed Pomodoros - conditionally rendered based on settings */}
          {settings.showCompletedCount && (
            <div className="mt-2 mb-0 text-xs text-muted-foreground text-center w-full">
              <span>Completed: {state.completedPomodoros} pomodoros</span>
              {sessionData && (
                <div className="text-[10px] mt-1">
                  Today: {sessionData.completedPomodoros} completed
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Task selector */}
        <div className="mt-2 mb-0 px-2 w-full">
          <TaskSelector />
        </div>
      </CardContent>
      
      {/* Settings Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pomodoro Widget Settings</DialogTitle>
          </DialogHeader>
          <WidgetConfigPanel
            schema={pomodoroWidgetConfigSchema}
            values={config}
            onChange={handleConfigChange}
          />
          <div className="flex justify-end mt-4">
            <Button onClick={() => setIsConfigOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Statistics Dialog */}
      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Timer Statistics</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <TaskStatisticsView />
          </div>
          
          <DialogFooter>
            <Button onClick={() => setStatsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PomodoroWidget; 