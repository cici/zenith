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

  const [settingsOpen, setSettingsOpen] = useState(false);
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
    setSettingsOpen(false);
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
    <Card className="h-full overflow-hidden" style={getFontStyle()}>
      <CardHeader className={color}>
        <div className="flex justify-between items-center">
          <div />
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setStatsOpen(true)}
              className="h-8 w-8"
            >
              <BarChart4 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="h-8 w-8"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center justify-center p-4 h-full">
        {/* Mode indicator and timer display */}
        <div className="text-center mb-5 w-full">
          <span className={`text-sm font-medium`} style={{ color: getModeBackgroundColor(state.mode, settings) }}>
            {getModeDisplayText(state.mode)}
          </span>
          
          {/* Timer progress circle - conditionally rendered based on settings */}
          {settings.showProgressCircle && (
            <div className={`relative mx-auto my-3 flex items-center justify-center ${getCircleSize()}`}>
              {/* SVG Circle for Progress */}
              <svg className="absolute" width="100%" height="100%" viewBox="0 0 208 208">
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
                  stroke={getModeBackgroundColor(state.mode, settings)}
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
          
          {/* Alternative timer display for when progress circle is hidden */}
          {!settings.showProgressCircle && (
            <div className="my-8 flex flex-col items-center">
              <span className="text-6xl font-bold my-4">
                {formatTimeRemaining()}
              </span>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden mb-6">
                <div 
                  className="h-2 rounded-full" 
                  style={{ 
                    width: `${progress}%`, 
                    backgroundColor: getModeBackgroundColor(state.mode, settings) 
                  }}
                />
              </div>
              <div className="flex mt-2 space-x-2">
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
            <div className="mt-2 text-sm text-muted-foreground">
              <span>Completed: {state.completedPomodoros} pomodoros</span>
              {sessionData && (
                <div className="text-xs mt-1">
                  Today: {sessionData.completedPomodoros} completed
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Control buttons */}
        <div className="flex items-center justify-center space-x-3 mt-auto mb-2">
          {state.isRunning ? (
            <Button variant="outline" size="icon" onClick={pauseTimer}>
              <Pause className="h-5 w-5" />
            </Button>
          ) : state.isPaused ? (
            <Button variant="outline" size="icon" onClick={resumeTimer}>
              <Play className="h-5 w-5" />
            </Button>
          ) : (
            <Button variant="outline" size="icon" onClick={startTimer}>
              <Play className="h-5 w-5" />
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={resetTimer}>
            <RotateCcw className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={skipTimer}>
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Task selector */}
        <div className="mt-2 mb-4 px-2">
          <TaskSelector />
        </div>
      </CardContent>
      
      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Timer Settings</DialogTitle>
          </DialogHeader>
          
          <Tabs 
            defaultValue="durations" 
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value);
              if (value === 'appearance') {
                setHasVisitedAppearance(true);
              }
              if (value === 'notifications') {
                setHasVisitedNotifications(true);
                // Request notification permission when user visits tab
                if (newSettings.desktopNotificationsEnabled) {
                  requestNotificationPermission();
                }
              }
            }}
          >
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="durations">Time</TabsTrigger>
              <TabsTrigger value="behaviors">Behavior</TabsTrigger>
              <TabsTrigger value="appearance">
                <div className="flex items-center">
                  <Palette className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Look</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <div className="flex items-center">
                  <Bell className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Alerts</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="developer">
                <div className="flex items-center">
                  <Bug className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Dev</span>
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="durations" className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Focus Duration: {newSettings.workDuration} min</Label>
                </div>
                <Slider 
                  min={1} 
                  max={60} 
                  step={1} 
                  value={[newSettings.workDuration]} 
                  onValueChange={(value) => handleSettingsChange('workDuration', value[0])} 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Short Break Duration: {newSettings.shortBreakDuration} min</Label>
                </div>
                <Slider 
                  min={1} 
                  max={30} 
                  step={1} 
                  value={[newSettings.shortBreakDuration]} 
                  onValueChange={(value) => handleSettingsChange('shortBreakDuration', value[0])} 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Long Break Duration: {newSettings.longBreakDuration} min</Label>
                </div>
                <Slider 
                  min={1} 
                  max={60} 
                  step={1} 
                  value={[newSettings.longBreakDuration]} 
                  onValueChange={(value) => handleSettingsChange('longBreakDuration', value[0])} 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Long Break After: {newSettings.longBreakInterval} pomodoros</Label>
                </div>
                <Slider 
                  min={1} 
                  max={8} 
                  step={1} 
                  value={[newSettings.longBreakInterval]} 
                  onValueChange={(value) => handleSettingsChange('longBreakInterval', value[0])} 
                />
              </div>
            </TabsContent>
            
            <TabsContent value="behaviors" className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-start-breaks">Auto-start breaks</Label>
                <Switch 
                  id="auto-start-breaks" 
                  checked={newSettings.autoStartBreaks}
                  onCheckedChange={(checked) => handleSettingsChange('autoStartBreaks', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-start-pomodoros">Auto-start pomodoros</Label>
                <Switch 
                  id="auto-start-pomodoros" 
                  checked={newSettings.autoStartPomodoros}
                  onCheckedChange={(checked) => handleSettingsChange('autoStartPomodoros', checked)}
                />
              </div>

              <Separator className="my-4" />
              
              <h3 className="text-sm font-medium mb-2">Task Association</h3>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-associate-last-task">Auto-associate last task</Label>
                <Switch 
                  id="auto-associate-last-task" 
                  checked={newSettings.autoAssociateLastTask}
                  onCheckedChange={(checked) => handleSettingsChange('autoAssociateLastTask', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="track-time-per-task">Track time per task</Label>
                <Switch 
                  id="track-time-per-task" 
                  checked={newSettings.trackTimePerTask}
                  onCheckedChange={(checked) => handleSettingsChange('trackTimePerTask', checked)}
                />
              </div>
              
              <div className="text-xs text-muted-foreground mt-1">
                <p>Track how much time you spend on each task to improve your productivity estimates.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="appearance" className="space-y-4 py-4">
              {hasVisitedAppearance && (
                <>
                  {/* Theme Selection */}
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select
                      value={newSettings.theme}
                      onValueChange={(value: 'default' | 'modern' | 'minimal' | 'classic' | 'dark') => 
                        applyThemePreset(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="classic">Classic</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Color Customization */}
                  <div className="grid grid-cols-3 gap-4 my-4">
                    <div>
                      <Label className="block mb-2 text-xs">Work Color</Label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: newSettings.workColor }}
                        />
                        <Input
                          type="color"
                          value={newSettings.workColor}
                          onChange={(e) => handleSettingsChange('workColor', e.target.value)}
                          className="w-full h-8"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="block mb-2 text-xs">Short Break</Label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: newSettings.shortBreakColor }}
                        />
                        <Input
                          type="color"
                          value={newSettings.shortBreakColor}
                          onChange={(e) => handleSettingsChange('shortBreakColor', e.target.value)}
                          className="w-full h-8"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="block mb-2 text-xs">Long Break</Label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: newSettings.longBreakColor }}
                        />
                        <Input
                          type="color"
                          value={newSettings.longBreakColor}
                          onChange={(e) => handleSettingsChange('longBreakColor', e.target.value)}
                          className="w-full h-8"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Font Selection */}
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Select
                      value={newSettings.fontFamily}
                      onValueChange={(value) => handleSettingsChange('fontFamily', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a font" />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map(font => (
                          <SelectItem 
                            key={font.value} 
                            value={font.value}
                            style={{ fontFamily: font.value }}
                          >
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Progress Circle Options */}
                  <div className="space-y-3 border-t pt-3 mt-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-progress-circle" className="flex items-center">
                        <CircleDashed className="w-4 h-4 mr-2" />
                        Show Progress Circle
                      </Label>
                      <Switch 
                        id="show-progress-circle" 
                        checked={newSettings.showProgressCircle}
                        onCheckedChange={(checked) => handleSettingsChange('showProgressCircle', checked)}
                      />
                    </div>
                    
                    {newSettings.showProgressCircle && (
                      <>
                        <div className="space-y-2">
                          <Label>Circle Size</Label>
                          <Select
                            value={newSettings.progressCircleSize}
                            onValueChange={(value: 'small' | 'medium' | 'large') => 
                              handleSettingsChange('progressCircleSize', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">Small</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="large">Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Circle Width: {newSettings.progressCircleWidth}px</Label>
                          </div>
                          <Slider 
                            min={2} 
                            max={20} 
                            step={1} 
                            value={[newSettings.progressCircleWidth]} 
                            onValueChange={(value) => handleSettingsChange('progressCircleWidth', value[0])} 
                          />
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Display Options */}
                  <div className="flex items-center justify-between border-t pt-3 mt-4">
                    <Label htmlFor="show-completed-count" className="flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      Show Completed Count
                    </Label>
                    <Switch 
                      id="show-completed-count" 
                      checked={newSettings.showCompletedCount}
                      onCheckedChange={(checked) => handleSettingsChange('showCompletedCount', checked)}
                    />
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-4 py-4">
              {hasVisitedNotifications && (
                <>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="desktop-notifications" className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Desktop Notifications
                    </Label>
                    <Switch 
                      id="desktop-notifications" 
                      checked={newSettings.desktopNotificationsEnabled}
                      onCheckedChange={(checked) => {
                        handleSettingsChange('desktopNotificationsEnabled', checked);
                        if (checked) {
                          requestNotificationPermission();
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sound-notifications" className="flex items-center">
                      <Volume2 className="w-4 h-4 mr-2" />
                      Sound Notifications
                    </Label>
                    <Switch 
                      id="sound-notifications" 
                      checked={newSettings.soundNotificationsEnabled}
                      onCheckedChange={(checked) => handleSettingsChange('soundNotificationsEnabled', checked)}
                    />
                  </div>
                  
                  {newSettings.soundNotificationsEnabled && (
                    <>
                      <div className="space-y-2 mt-4 pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <Label>Volume: {newSettings.notificationVolume}%</Label>
                        </div>
                        <div className="flex items-center px-1">
                          <VolumeX className="h-4 w-4 mr-2 text-muted-foreground" />
                          <Slider 
                            min={0} 
                            max={100} 
                            step={5} 
                            value={[newSettings.notificationVolume]} 
                            onValueChange={(value) => handleSettingsChange('notificationVolume', value[0])} 
                            className="flex-1 mx-2"
                          />
                          <Volume2 className="h-4 w-4 ml-2 text-muted-foreground" />
                        </div>
                      </div>
                      
                      <div className="space-y-4 mt-4 pt-3 border-t">
                        <Label>Work Complete Sound</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {['bell', 'digital', 'calm', 'alert', 'gong', 'none'].map(sound => (
                            <div 
                              key={sound}
                              className={`flex flex-col items-center justify-center p-2 border rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${newSettings.workCompleteSound === sound ? 'border-primary bg-primary/10' : 'border-border'}`}
                              onClick={() => {
                                handleSettingsChange('workCompleteSound', sound);
                                if (sound !== 'none') playTestSound(sound);
                              }}
                            >
                              {sound === 'bell' && <Bell className="h-6 w-6 mb-1" />}
                              {sound === 'digital' && <Clock className="h-6 w-6 mb-1" />}
                              {sound === 'calm' && <Coffee className="h-6 w-6 mb-1" />}
                              {sound === 'alert' && <Zap className="h-6 w-6 mb-1" />}
                              {sound === 'gong' && <Volume2 className="h-6 w-6 mb-1" />}
                              {sound === 'none' && <VolumeX className="h-6 w-6 mb-1" />}
                              <span className="text-xs capitalize">{sound}</span>
                            </div>
                          ))}
                        </div>
                        
                        <Label className="mt-4">Break Complete Sound</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {['bell', 'digital', 'calm', 'alert', 'gong', 'none'].map(sound => (
                            <div 
                              key={sound}
                              className={`flex flex-col items-center justify-center p-2 border rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${newSettings.breakCompleteSound === sound ? 'border-primary bg-primary/10' : 'border-border'}`}
                              onClick={() => {
                                handleSettingsChange('breakCompleteSound', sound);
                                if (sound !== 'none') playTestSound(sound);
                              }}
                            >
                              {sound === 'bell' && <Bell className="h-6 w-6 mb-1" />}
                              {sound === 'digital' && <Clock className="h-6 w-6 mb-1" />}
                              {sound === 'calm' && <Coffee className="h-6 w-6 mb-1" />}
                              {sound === 'alert' && <Zap className="h-6 w-6 mb-1" />}
                              {sound === 'gong' && <Volume2 className="h-6 w-6 mb-1" />}
                              {sound === 'none' && <VolumeX className="h-6 w-6 mb-1" />}
                              <span className="text-xs capitalize">{sound}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="text-xs text-muted-foreground mt-4">
                          <p>Click on a sound to preview it.</p>
                          <p>Note: Some browsers may block notifications and sounds until you interact with the page.</p>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="developer" className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="debug-mode" className="flex items-center">
                  <Bug className="w-4 h-4 mr-2" />
                  Debug Mode
                </Label>
                <Switch 
                  id="debug-mode" 
                  checked={newSettings.debugMode}
                  onCheckedChange={(checked) => handleSettingsChange('debugMode', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="testing-mode" className="flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Testing Mode
                </Label>
                <Switch 
                  id="testing-mode" 
                  checked={newSettings.testingMode}
                  onCheckedChange={(checked) => handleSettingsChange('testingMode', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Speed Factor: {newSettings.speedFactor}x</Label>
                </div>
                <Slider 
                  min={1} 
                  max={20} 
                  step={1} 
                  value={[newSettings.speedFactor]} 
                  onValueChange={(value) => handleSettingsChange('speedFactor', value[0])} 
                  disabled={!newSettings.testingMode}
                />
                <p className="text-xs text-muted-foreground">
                  Accelerates timer in testing mode (e.g., 5x = 5 seconds per second)
                </p>
              </div>
              
              {settings.debugMode && (
                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Event Log</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearEventLog}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-md h-32 overflow-y-auto text-xs font-mono">
                    {eventLog.length === 0 ? (
                      <div className="text-muted-foreground text-center py-2">
                        No events logged yet
                      </div>
                    ) : (
                      eventLog.map((entry, i) => (
                        <div key={i} className="mb-1">
                          <span className="text-muted-foreground">{entry.time}</span>{' '}
                          <span className="font-semibold">{entry.event}</span>
                          {entry.data && (
                            <span className="text-green-600 dark:text-green-400">
                              {' '}{JSON.stringify(entry.data)}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check browser console for detailed logs
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveSettings}>
              Save Changes
            </Button>
          </DialogFooter>
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