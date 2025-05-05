import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// Types for timer state
export type TimerMode = 'work' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'running' | 'paused' | 'idle';
export type TimerEvent = 'start' | 'pause' | 'resume' | 'reset' | 'skip' | 'complete' | 'modeChange' | 'taskAssociated' | 'taskRemoved';

// Simple event emitter interface
export interface TimerEventEmitter {
  on: (event: TimerEvent, callback: (data?: any) => void) => void;
  off: (event: TimerEvent, callback: (data?: any) => void) => void;
  emit: (event: TimerEvent, data?: any) => void;
}

// Task association interface
export interface AssociatedTask {
  id: string;
  title: string;
  completed: boolean;
  timeSpent: number; // in seconds
}

export interface TimerSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  longBreakInterval: number; // after how many pomodoros
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  // Task association settings
  autoAssociateLastTask: boolean;
  trackTimePerTask: boolean;
  // Developer settings
  debugMode: boolean;
  testingMode: boolean;
  speedFactor: number; // accelerated timing factor for testing (1 = normal, 2 = 2x speed, etc.)
  // Visual customization
  theme: 'default' | 'modern' | 'minimal' | 'classic' | 'dark';
  workColor: string;
  shortBreakColor: string;
  longBreakColor: string;
  showProgressCircle: boolean;
  progressCircleSize: 'small' | 'medium' | 'large';
  progressCircleWidth: number; // in px
  fontFamily: string;
  showCompletedCount: boolean;
  // Notification settings
  desktopNotificationsEnabled: boolean;
  soundNotificationsEnabled: boolean;
  workCompleteSound: 'bell' | 'digital' | 'calm' | 'alert' | 'gong' | 'none';
  breakCompleteSound: 'bell' | 'digital' | 'calm' | 'alert' | 'gong' | 'none';
  notificationVolume: number; // 0-100
}

export interface TimerState {
  mode: TimerMode;
  timeRemaining: number; // in seconds
  isRunning: boolean;
  isPaused: boolean;
  completedPomodoros: number;
  totalTime: number; // total time of current session in seconds
  sessionStartTime: number | null; // timestamp when current session started
  currentModeDuration: number; // original duration of current mode in seconds
  associatedTask: AssociatedTask | null; // Currently associated task
}

// Enhanced session data to store more detailed information
export interface TimerSessionData {
  date: string;
  completedPomodoros: number;
  totalWorkTime: number; // in seconds
  totalBreakTime: number; // in seconds
  // Additional metrics
  startTime?: number; // timestamp when first session started
  endTime?: number; // timestamp of last activity
  interruptions?: number; // count of pauses during work sessions
  longestStreak?: number; // max consecutive pomodoros without long breaks
  focusScore?: number; // calculated score based on completions and interruptions (0-100)
  // Task-related metrics
  taskTimeMap?: {[taskId: string]: number}; // Map of task IDs to time spent (seconds)
  lastAssociatedTaskId?: string; // ID of the last associated task
}

// Historical record interface for tracking sessions across multiple days
export interface TimerHistoryRecord {
  date: string; // YYYY-MM-DD
  sessions: Array<{
    startTime: number;
    endTime: number;
    duration: number; // in seconds
    completed: boolean;
    mode: TimerMode;
    interruptions: number;
    taskId?: string; // Optional task ID if session was associated with a task
  }>;
  summary: {
    completedPomodoros: number;
    totalWorkTime: number; // in seconds
    totalBreakTime: number; // in seconds
    focusScore: number; // 0-100
    longestStreak: number; // max consecutive completed pomodoros
    taskTimeMap?: {[taskId: string]: number}; // Map of task IDs to time spent
  };
}

export interface TimerContextType {
  state: TimerState;
  settings: TimerSettings;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  skipTimer: () => void;
  updateSettings: (newSettings: Partial<TimerSettings>) => void;
  formatTimeRemaining: () => string;
  adjustDuration: (seconds: number) => void;
  getStatus: () => TimerStatus;
  getProgressPercent: () => number;
  getElapsedTime: () => number;
  getSessionData: () => TimerSessionData | null;
  // Task association methods
  associateTask: (taskId: string, taskTitle: string, completed: boolean) => void;
  disassociateTask: () => void;
  getTaskTimeSpent: (taskId: string) => number;
  getAssociatedTasksWithTime: () => Array<{id: string, title: string, timeSpent: number}>;
  // New session tracking methods
  getSessionHistory: (days: number) => TimerHistoryRecord[];
  getSessionStats: (dateRange?: {start: string, end: string}) => {
    totalSessions: number;
    totalTime: number;
    averageDailyPomodoros: number;
    mostProductiveDay: {date: string, count: number} | null;
    focusScoreAvg: number;
    weekdayDistribution: {[key: string]: number};
    timeOfDayDistribution: {morning: number, afternoon: number, evening: number, night: number};
    taskDistribution?: {[taskId: string]: { timeSpent: number, percentage: number }}; // Distribution of time by task
  };
  clearSessionHistory: () => void;
  exportSessionData: () => string; // JSON string for export
  importSessionData: (jsonData: string) => boolean;
  // Developer utilities
  toggleDebugMode: () => void;
  toggleTestingMode: () => void;
  setSpeedFactor: (factor: number) => void;
  eventEmitter: TimerEventEmitter;
}

const defaultTimerSettings: TimerSettings = {
  workDuration: 25, // 25 minutes
  shortBreakDuration: 5, // 5 minutes
  longBreakDuration: 15, // 15 minutes
  longBreakInterval: 4, // every 4 pomodoros
  autoStartBreaks: false,
  autoStartPomodoros: false,
  // Task association settings
  autoAssociateLastTask: true,
  trackTimePerTask: true,
  // Developer settings
  debugMode: false,
  testingMode: false,
  speedFactor: 1,
  // Visual defaults
  theme: 'default',
  workColor: '#ef4444', // red-500
  shortBreakColor: '#22c55e', // green-500
  longBreakColor: '#3b82f6', // blue-500
  showProgressCircle: true,
  progressCircleSize: 'medium',
  progressCircleWidth: 12,
  fontFamily: 'system-ui, sans-serif',
  showCompletedCount: true,
  // Notification defaults
  desktopNotificationsEnabled: true,
  soundNotificationsEnabled: true,
  workCompleteSound: 'bell',
  breakCompleteSound: 'bell',
  notificationVolume: 80
};

const defaultTimerState: TimerState = {
  mode: 'work',
  timeRemaining: defaultTimerSettings.workDuration * 60, // Convert to seconds
  isRunning: false,
  isPaused: false,
  completedPomodoros: 0,
  totalTime: 0,
  sessionStartTime: null,
  currentModeDuration: defaultTimerSettings.workDuration * 60,
  associatedTask: null
};

// Initialize or load session data from storage
const getInitialSessionData = (): TimerSessionData | null => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  try {
    const storedData = localStorage.getItem('pomodoroSessionData');
    if (storedData) {
      const parsedData = JSON.parse(storedData) as TimerSessionData;
      
      // If stored data is from today, use it; otherwise create new session
      if (parsedData.date === today) {
        return parsedData;
      }
    }
  } catch (error) {
    console.error('Error loading session data:', error);
  }
  
  // Initialize new session with more metrics
  return {
    date: today,
    completedPomodoros: 0,
    totalWorkTime: 0,
    totalBreakTime: 0,
    interruptions: 0,
    longestStreak: 0,
    focusScore: 100, // Start perfect, reduce with interruptions
    startTime: Date.now(),
    endTime: Date.now(),
    taskTimeMap: {}
  };
};

// Load historical session data from storage
const loadSessionHistory = (): TimerHistoryRecord[] => {
  try {
    const storedHistory = localStorage.getItem('pomodoroSessionHistory');
    if (storedHistory) {
      return JSON.parse(storedHistory) as TimerHistoryRecord[];
    }
  } catch (error) {
    console.error('Error loading session history:', error);
  }
  return [];
};

// Logger utility for structured debug logging
const createLogger = (debugMode: boolean) => {
  return {
    log: (message: string, data?: any) => {
      if (debugMode) {
        console.log(`[Timer] ${message}`, data ? data : '');
      }
    },
    info: (message: string, data?: any) => {
      if (debugMode) {
        console.info(`[Timer INFO] ${message}`, data ? data : '');
      }
    },
    warn: (message: string, data?: any) => {
      if (debugMode) {
        console.warn(`[Timer WARN] ${message}`, data ? data : '');
      }
    },
    error: (message: string, error?: any) => {
      if (debugMode) {
        console.error(`[Timer ERROR] ${message}`, error ? error : '');
      }
    },
    group: (label: string) => {
      if (debugMode) {
        console.group(`[Timer] ${label}`);
      }
    },
    groupEnd: () => {
      if (debugMode) {
        console.groupEnd();
      }
    }
  };
};

// Create event emitter for timer events
const createEventEmitter = (): TimerEventEmitter => {
  const eventMap = new Map<TimerEvent, Set<(data?: any) => void>>();
  
  return {
    on: (event: TimerEvent, callback: (data?: any) => void) => {
      if (!eventMap.has(event)) {
        eventMap.set(event, new Set());
      }
      eventMap.get(event)?.add(callback);
    },
    off: (event: TimerEvent, callback: (data?: any) => void) => {
      if (eventMap.has(event)) {
        eventMap.get(event)?.delete(callback);
      }
    },
    emit: (event: TimerEvent, data?: any) => {
      if (eventMap.has(event)) {
        eventMap.get(event)?.forEach(callback => {
          try {
            callback(data);
          } catch (err) {
            console.error(`Error in timer event callback for ${event}:`, err);
          }
        });
      }
    }
  };
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Sound assets for notifications
// These will be preloaded and cached
const notificationSounds = {
  bell: '/sounds/bell.mp3',
  digital: '/sounds/digital.mp3',
  calm: '/sounds/calm.mp3',
  alert: '/sounds/alert.mp3',
  gong: '/sounds/gong.mp3'
};

// Audio elements cache to avoid recreating them
const audioCache: {[key: string]: HTMLAudioElement} = {};

// Preload audio files
const preloadAudio = (url: string): HTMLAudioElement => {
  if (audioCache[url]) {
    return audioCache[url];
  }
  
  try {
    const audio = new Audio(url);
    audio.load();
    audioCache[url] = audio;
    return audio;
  } catch (error) {
    console.error('Error preloading audio:', error);
    // Return a dummy audio element that won't throw errors when played
    return new Audio();
  }
};

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<TimerSettings>(() => {
    // Try to load settings from localStorage
    try {
      const savedSettings = localStorage.getItem('pomodoroSettings');
      return savedSettings ? { ...defaultTimerSettings, ...JSON.parse(savedSettings) } : defaultTimerSettings;
    } catch (e) {
      return defaultTimerSettings;
    }
  });
  
  const [state, setState] = useState<TimerState>(defaultTimerState);
  
  // Session data for the current day
  const [sessionData, setSessionData] = useState<TimerSessionData | null>(getInitialSessionData);
  
  // Historical session data for analytics
  const [sessionHistory, setSessionHistory] = useState<TimerHistoryRecord[]>(loadSessionHistory);
  
  // Track current session for detailed history
  const currentSessionRef = useRef<{
    startTime: number;
    mode: TimerMode;
    interruptions: number;
    completed: boolean;
  } | null>(null);
  
  // Create event emitter instance
  const eventEmitterRef = useRef(createEventEmitter());
  
  // Logger instance
  const loggerRef = useRef(createLogger(settings.debugMode));
  
  // Use refs for timer to prevent issues with stale closures
  const timerRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const stateRef = useRef(state);
  const settingsRef = useRef(settings);
  const sessionDataRef = useRef(sessionData);
  const rafIdRef = useRef<number | null>(null);

  // Update refs and debug logger when settings change
  useEffect(() => {
    settingsRef.current = settings;
    loggerRef.current = createLogger(settings.debugMode);
    
    // Save settings to localStorage
    try {
      localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    } catch (error) {
      loggerRef.current.error('Error saving settings', error);
    }
    
    loggerRef.current.info('Settings updated', settings);
  }, [settings]);

  // Update refs when state changes
  useEffect(() => {
    stateRef.current = state;
    loggerRef.current.log('State updated', state);
  }, [state]);
  
  useEffect(() => {
    sessionDataRef.current = sessionData;
    
    // Save session data to localStorage whenever it changes
    if (sessionData) {
      try {
        localStorage.setItem('pomodoroSessionData', JSON.stringify(sessionData));
      } catch (error) {
        loggerRef.current.error('Error saving session data:', error);
      }
    }
  }, [sessionData]);

  // Initialize timer state based on settings
  useEffect(() => {
    resetTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      loggerRef.current.info('Timer component unmounted');
    };
  }, []);

  // Handle visibility change to prevent timer drift
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && state.isRunning) {
        loggerRef.current.info('Tab became visible, recalculating time');
        
        // Recalculate time remaining based on actual elapsed time
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - lastUpdateTimeRef.current) / 1000);
        lastUpdateTimeRef.current = now;
        
        setState(prevState => {
          const newTimeRemaining = Math.max(0, prevState.timeRemaining - elapsedSeconds);
          return {
            ...prevState,
            timeRemaining: newTimeRemaining,
          };
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.isRunning]);

  // Calculate accurate elapsed time since session start
  const getElapsedTime = (): number => {
    if (!state.sessionStartTime) return 0;
    
    const elapsed = Math.floor((Date.now() - state.sessionStartTime) / 1000);
    return elapsed;
  };

  // Get current timer status as an enum
  const getStatus = (): TimerStatus => {
    if (state.isRunning) return 'running';
    if (state.isPaused) return 'paused';
    return 'idle';
  };

  // Calculate progress as percentage
  const getProgressPercent = (): number => {
    if (state.currentModeDuration === 0) return 0;
    
    const completed = state.currentModeDuration - state.timeRemaining;
    return (completed / state.currentModeDuration) * 100;
  };

  // Get current session data
  const getSessionData = (): TimerSessionData | null => {
    return sessionData;
  };

  // Helper to determine the next mode based on Pomodoro rules
  const determineNextMode = (currentMode: TimerMode, completedCount: number): TimerMode => {
    if (currentMode === 'work') {
      // After work period, determine break type
      return (completedCount % settingsRef.current.longBreakInterval === 0) 
        ? 'longBreak' 
        : 'shortBreak';
    } else {
      // After any break, go back to work
      return 'work';
    }
  };

  // Get duration for specified mode in seconds
  const getDurationForMode = (mode: TimerMode): number => {
    switch (mode) {
      case 'work':
        return settingsRef.current.workDuration * 60;
      case 'shortBreak':
        return settingsRef.current.shortBreakDuration * 60;
      case 'longBreak':
        return settingsRef.current.longBreakDuration * 60;
      default:
        return settingsRef.current.workDuration * 60;
    }
  };

  // Save current day's session data to history when day changes
  useEffect(() => {
    const checkForDayChange = () => {
      const today = new Date().toISOString().split('T')[0];
      if (sessionData && sessionData.date !== today) {
        // Archive yesterday's data to history
        archiveSessionData(sessionData);
        
        // Create new session for today
        setSessionData({
          date: today,
          completedPomodoros: 0,
          totalWorkTime: 0,
          totalBreakTime: 0,
          interruptions: 0,
          longestStreak: 0,
          focusScore: 100,
          startTime: Date.now(),
          endTime: Date.now()
        });
      }
    };
    
    // Check on component mount and set interval to check periodically
    checkForDayChange();
    const interval = setInterval(checkForDayChange, 60 * 60 * 1000); // Check hourly
    
    return () => clearInterval(interval);
  }, [sessionData]);
  
  // Archive a day's session data to history
  const archiveSessionData = (data: TimerSessionData) => {
    // Check if we already have this date in history
    const existingIndex = sessionHistory.findIndex(record => record.date === data.date);
    
    // Calculate focus score if not already set
    const focusScore = data.focusScore ?? Math.max(0, 100 - (data.interruptions || 0) * 5);
    
    // Create history record for the completed day
    const historyRecord: TimerHistoryRecord = {
      date: data.date,
      sessions: [], // We don't have detailed session info from before this implementation
      summary: {
        completedPomodoros: data.completedPomodoros,
        totalWorkTime: data.totalWorkTime,
        totalBreakTime: data.totalBreakTime,
        focusScore,
        longestStreak: data.longestStreak || 0
      }
    };
    
    // Update history state
    setSessionHistory(prev => {
      if (existingIndex >= 0) {
        // Replace existing record
        const newHistory = [...prev];
        newHistory[existingIndex] = historyRecord;
        return newHistory;
      } else {
        // Add new record
        return [...prev, historyRecord].sort((a, b) => a.date.localeCompare(b.date));
      }
    });
  };
  
  // Save session history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('pomodoroSessionHistory', JSON.stringify(sessionHistory));
    } catch (error) {
      loggerRef.current.error('Error saving session history:', error);
    }
  }, [sessionHistory]);
  
  // Get session history for the specified number of days
  const getSessionHistory = (days: number): TimerHistoryRecord[] => {
    // Include today's data in the result
    const result = [...sessionHistory];
    
    // Calculate the start date (N days ago)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1); // +1 to include today
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Filter history to only include records from startDate onwards
    return result
      .filter(record => record.date >= startDateStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  };
  
  // Get aggregate statistics for sessions within date range
  const getSessionStats = (dateRange?: {start: string, end: string}) => {
    // Start with an empty result
    const stats = {
      totalSessions: 0,
      totalTime: 0,
      averageDailyPomodoros: 0,
      mostProductiveDay: null as {date: string, count: number} | null,
      focusScoreAvg: 0,
      weekdayDistribution: {
        'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0,
        'Thursday': 0, 'Friday': 0, 'Saturday': 0
      },
      timeOfDayDistribution: {
        morning: 0, // 5-12
        afternoon: 0, // 12-17
        evening: 0, // 17-22
        night: 0 // 22-5
      },
      taskDistribution: {} as {[taskId: string]: { timeSpent: number, percentage: number }}
    };
    
    // Filter history based on date range if provided
    let filteredHistory = [...sessionHistory];
    if (dateRange) {
      filteredHistory = filteredHistory.filter(
        record => record.date >= dateRange.start && record.date <= dateRange.end
      );
    }
    
    // Add today's data if in range
    if (sessionData) {
      const today = sessionData.date;
      if (!dateRange || (today >= dateRange.start && today <= dateRange.end)) {
        // Convert today's data to history record format
        const todayRecord: TimerHistoryRecord = {
          date: today,
          sessions: [], // We don't track individual sessions yet
          summary: {
            completedPomodoros: sessionData.completedPomodoros,
            totalWorkTime: sessionData.totalWorkTime,
            totalBreakTime: sessionData.totalBreakTime,
            focusScore: sessionData.focusScore || 100,
            longestStreak: sessionData.longestStreak || 0,
            taskTimeMap: sessionData.taskTimeMap
          }
        };
        
        // Add to filtered history
        filteredHistory.push(todayRecord);
      }
    }
    
    // If no data in range, return empty stats
    if (filteredHistory.length === 0) {
      return stats;
    }
    
    // Calculate aggregate statistics
    let totalPomodoros = 0;
    let totalFocusScore = 0;
    let maxPomodoros = 0;
    let maxPomodorosDate = '';
    let totalTaskTime = 0;
    const taskTimes: {[taskId: string]: number} = {};
    
    filteredHistory.forEach(record => {
      // Count total pomodoros
      totalPomodoros += record.summary.completedPomodoros;
      
      // Find most productive day
      if (record.summary.completedPomodoros > maxPomodoros) {
        maxPomodoros = record.summary.completedPomodoros;
        maxPomodorosDate = record.date;
      }
      
      // Add to total time (work + break)
      stats.totalTime += record.summary.totalWorkTime + record.summary.totalBreakTime;
      
      // Accumulate focus score
      totalFocusScore += record.summary.focusScore;
      
      // Update weekday distribution
      const date = new Date(record.date);
      const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
      stats.weekdayDistribution[weekday] += record.summary.completedPomodoros;
      
      // Calculate time of day distribution based on sessions
      record.sessions.forEach(session => {
        const hour = new Date(session.startTime).getHours();
        if (hour >= 5 && hour < 12) {
          stats.timeOfDayDistribution.morning += 1;
        } else if (hour >= 12 && hour < 17) {
          stats.timeOfDayDistribution.afternoon += 1;
        } else if (hour >= 17 && hour < 22) {
          stats.timeOfDayDistribution.evening += 1;
        } else {
          stats.timeOfDayDistribution.night += 1;
        }
      });
      
      // Accumulate task time distribution
      if (record.summary.taskTimeMap) {
        Object.entries(record.summary.taskTimeMap).forEach(([taskId, time]) => {
          taskTimes[taskId] = (taskTimes[taskId] || 0) + time;
          totalTaskTime += time;
        });
      }
    });
    
    // Calculate final statistics
    stats.totalSessions = totalPomodoros;
    stats.averageDailyPomodoros = totalPomodoros / filteredHistory.length;
    stats.focusScoreAvg = totalFocusScore / filteredHistory.length;
    
    // Set most productive day
    if (maxPomodorosDate) {
      stats.mostProductiveDay = {
        date: maxPomodorosDate,
        count: maxPomodoros
      };
    }
    
    // Calculate task distribution percentages
    if (totalTaskTime > 0) {
      Object.entries(taskTimes).forEach(([taskId, timeSpent]) => {
        stats.taskDistribution[taskId] = {
          timeSpent,
          percentage: (timeSpent / totalTaskTime) * 100
        };
      });
    }
    
    return stats;
  };
  
  // Clear all session history
  const clearSessionHistory = () => {
    setSessionHistory([]);
    localStorage.removeItem('pomodoroSessionHistory');
  };
  
  // Export session data as JSON string
  const exportSessionData = (): string => {
    const exportData = {
      currentSession: sessionData,
      history: sessionHistory,
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(exportData);
  };
  
  // Import session data from JSON string
  const importSessionData = (jsonData: string): boolean => {
    try {
      const importedData = JSON.parse(jsonData);
      
      // Validate basic structure
      if (!importedData.history || !Array.isArray(importedData.history)) {
        return false;
      }
      
      // Import history
      setSessionHistory(importedData.history);
      
      // Import current session if from today
      const today = new Date().toISOString().split('T')[0];
      if (importedData.currentSession && importedData.currentSession.date === today) {
        setSessionData(importedData.currentSession);
      }
      
      return true;
    } catch (error) {
      loggerRef.current.error('Error importing session data:', error);
      return false;
    }
  };
  
  // Add the task association methods
  const associateTask = (taskId: string, taskTitle: string, completed: boolean) => {
    loggerRef.current.info(`Associating task: ${taskId} - ${taskTitle}`);
    
    const newAssociatedTask: AssociatedTask = {
      id: taskId,
      title: taskTitle,
      completed,
      timeSpent: 0
    };
    
    // Check if we have already tracked time for this task today
    if (sessionData && sessionData.taskTimeMap && sessionData.taskTimeMap[taskId]) {
      newAssociatedTask.timeSpent = sessionData.taskTimeMap[taskId];
    }
    
    setState(prevState => ({
      ...prevState,
      associatedTask: newAssociatedTask
    }));
    
    // Update session data to track last associated task
    setSessionData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        lastAssociatedTaskId: taskId
      };
    });
    
    // Emit task associated event
    eventEmitterRef.current.emit('taskAssociated', { taskId, taskTitle });
  };
  
  const disassociateTask = () => {
    if (!state.associatedTask) return;
    
    loggerRef.current.info(`Disassociating task: ${state.associatedTask.id}`);
    
    // Emit task removed event
    eventEmitterRef.current.emit('taskRemoved', { 
      taskId: state.associatedTask.id,
      taskTitle: state.associatedTask.title
    });
    
    setState(prevState => ({
      ...prevState,
      associatedTask: null
    }));
  };
  
  const getTaskTimeSpent = (taskId: string): number => {
    if (!sessionData || !sessionData.taskTimeMap) return 0;
    return sessionData.taskTimeMap[taskId] || 0;
  };
  
  const getAssociatedTasksWithTime = () => {
    if (!sessionData || !sessionData.taskTimeMap) return [];
    
    // Convert taskTimeMap to an array of objects with id, title, and timeSpent
    // Note: We won't have titles here, just IDs and time spent
    return Object.entries(sessionData.taskTimeMap).map(([id, timeSpent]) => ({
      id,
      title: "Unknown", // This will need to be filled in by the UI component
      timeSpent
    }));
  };

  // Update session data when completing a timer interval
  const updateSessionData = (mode: TimerMode, duration: number) => {
    if (!sessionData) return;
    
    loggerRef.current.info(`Updating session data for ${mode} mode, duration: ${duration}s`);
    
    // Calculate new streak and update end time
    const newEndTime = Date.now();
    
    setSessionData(prev => {
      if (!prev) return prev;
      
      // Calculate longest streak
      let newLongestStreak = prev.longestStreak || 0;
      let currentStreak = 0;
      
      // Create or update taskTimeMap
      const taskTimeMap = { ...(prev.taskTimeMap || {}) };
      
      // If there's an associated task and this is work mode, update time spent
      if (state.associatedTask && mode === 'work' && settings.trackTimePerTask) {
        const taskId = state.associatedTask.id;
        const currentTime = taskTimeMap[taskId] || 0;
        taskTimeMap[taskId] = currentTime + duration;
        
        // Also update the time spent in the state
        if (state.associatedTask) {
          setState(prevState => ({
            ...prevState,
            associatedTask: prevState.associatedTask ? {
              ...prevState.associatedTask,
              timeSpent: (prevState.associatedTask.timeSpent || 0) + duration
            } : null
          }));
        }
      }
      
      if (mode === 'work') {
        // If completing work, increment streak
        currentStreak = (prev as any).currentStreak || 0;
        currentStreak += 1;
        
        // Update longest streak if needed
        if (currentStreak > newLongestStreak) {
          newLongestStreak = currentStreak;
        }
        
        return {
          ...prev,
          completedPomodoros: prev.completedPomodoros + 1,
          totalWorkTime: prev.totalWorkTime + duration,
          endTime: newEndTime,
          longestStreak: newLongestStreak,
          currentStreak: currentStreak,
          taskTimeMap
        };
      } else {
        // Reset streak on long break
        if (mode === 'longBreak') {
          currentStreak = 0;
        }
        
        return {
          ...prev,
          totalBreakTime: prev.totalBreakTime + duration,
          endTime: newEndTime,
          currentStreak: currentStreak,
          taskTimeMap
        };
      }
    });
    
    // Record detailed session information for history
    if (currentSessionRef.current) {
      const sessionInfo = currentSessionRef.current;
      sessionInfo.completed = true;
      
      // Update session history with detailed session info
      const sessionRecord = {
        startTime: sessionInfo.startTime,
        endTime: Date.now(),
        duration: duration,
        completed: true,
        mode: mode,
        interruptions: sessionInfo.interruptions,
        taskId: state.associatedTask?.id // Add task ID if a task is associated
      };
      
      // Add to today's history record
      setSessionHistory(prev => {
        const today = new Date().toISOString().split('T')[0];
        const existingIndex = prev.findIndex(record => record.date === today);
        
        if (existingIndex >= 0) {
          // Update existing record
          const updatedRecord = { ...prev[existingIndex] };
          updatedRecord.sessions.push(sessionRecord);
          
          // Update summary
          if (mode === 'work') {
            updatedRecord.summary.completedPomodoros += 1;
            updatedRecord.summary.totalWorkTime += duration;
            
            // Update task time mapping if applicable
            if (state.associatedTask && settings.trackTimePerTask) {
              const taskTimeMap = { ...(updatedRecord.summary.taskTimeMap || {}) };
              const taskId = state.associatedTask.id;
              taskTimeMap[taskId] = (taskTimeMap[taskId] || 0) + duration;
              updatedRecord.summary.taskTimeMap = taskTimeMap;
            }
          } else {
            updatedRecord.summary.totalBreakTime += duration;
          }
          
          // Update focus score based on interruptions
          if (sessionRecord.interruptions > 0) {
            // Reduce focus score for interruptions (5 points per interruption)
            const reduction = Math.min(5 * sessionRecord.interruptions, 15);
            updatedRecord.summary.focusScore = Math.max(
              0, 
              updatedRecord.summary.focusScore - reduction / updatedRecord.summary.completedPomodoros
            );
          }
          
          const newHistory = [...prev];
          newHistory[existingIndex] = updatedRecord;
          return newHistory;
        } else {
          // Create new record for today
          const taskTimeMap: {[taskId: string]: number} = {};
          
          // Initialize task time mapping if applicable
          if (state.associatedTask && mode === 'work' && settings.trackTimePerTask) {
            taskTimeMap[state.associatedTask.id] = duration;
          }
          
          const newRecord: TimerHistoryRecord = {
            date: today,
            sessions: [sessionRecord],
            summary: {
              completedPomodoros: mode === 'work' ? 1 : 0,
              totalWorkTime: mode === 'work' ? duration : 0,
              totalBreakTime: mode === 'work' ? 0 : duration,
              focusScore: 100 - (sessionRecord.interruptions * 5),
              longestStreak: mode === 'work' ? 1 : 0,
              taskTimeMap: Object.keys(taskTimeMap).length > 0 ? taskTimeMap : undefined
            }
          };
          
          return [...prev, newRecord];
        }
      });
    }
    
    // Reset current session ref
    currentSessionRef.current = null;
  };
  
  // Start timer with enhanced session tracking
  const startTimer = () => {
    loggerRef.current.info('Timer started');
    eventEmitterRef.current.emit('start');
    
    // Initialize current session tracking
    currentSessionRef.current = {
      startTime: Date.now(),
      mode: state.mode,
      interruptions: 0,
      completed: false
    };
    
    setState(prevState => ({
      ...prevState,
      isRunning: true,
      isPaused: false,
      sessionStartTime: Date.now(),
    }));
    runTimer();
  };
  
  // Pause timer with interruption tracking
  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    
    loggerRef.current.info('Timer paused');
    eventEmitterRef.current.emit('pause');
    
    // Track interruption if this is a work session
    if (state.mode === 'work' && currentSessionRef.current) {
      currentSessionRef.current.interruptions += 1;
      
      // Update session data to track interruptions
      setSessionData(prev => {
        if (!prev) return prev;
        const interruptions = (prev.interruptions || 0) + 1;
        
        // Calculate focus score (reduce by 5 points per interruption, but never below 0)
        const focusScore = Math.max(0, 100 - interruptions * 5);
        
        return {
          ...prev,
          interruptions,
          focusScore
        };
      });
    }
    
    setState(prevState => ({
      ...prevState,
      isRunning: false,
      isPaused: true,
    }));
  };

  const resumeTimer = () => {
    loggerRef.current.info('Timer resumed');
    eventEmitterRef.current.emit('resume');
    
    setState(prevState => ({
      ...prevState,
      isRunning: true,
      isPaused: false,
      sessionStartTime: Date.now(),
    }));
    runTimer();
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    
    loggerRef.current.info('Timer reset');
    eventEmitterRef.current.emit('reset');
    
    // Reset to work mode
    const workDuration = settings.workDuration * 60;
    setState({
      mode: 'work',
      timeRemaining: workDuration,
      isRunning: false,
      isPaused: false,
      completedPomodoros: 0,
      totalTime: 0,
      sessionStartTime: null,
      currentModeDuration: workDuration,
      associatedTask: null
    });
  };

  const skipTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    
    loggerRef.current.info('Timer skipped');
    eventEmitterRef.current.emit('skip');
    
    // Update session data for the skipped interval
    updateSessionData(state.mode, state.currentModeDuration - state.timeRemaining);
    
    let nextCompletedPomodoros = state.completedPomodoros;
    
    if (state.mode === 'work') {
      // If skipping work, count it as completed
      nextCompletedPomodoros = state.completedPomodoros + 1;
    }
    
    // Determine next mode
    const nextMode = determineNextMode(state.mode, nextCompletedPomodoros);
    const nextDuration = getDurationForMode(nextMode);
    
    // Emit mode change event
    eventEmitterRef.current.emit('modeChange', { 
      from: state.mode, 
      to: nextMode 
    });
    
    setState({
      ...state,
      mode: nextMode,
      timeRemaining: nextDuration,
      currentModeDuration: nextDuration,
      isRunning: false,
      isPaused: false,
      completedPomodoros: nextCompletedPomodoros,
      sessionStartTime: null,
      associatedTask: null
    });
  };

  const updateSettings = (newSettings: Partial<TimerSettings>) => {
    loggerRef.current.info('Updating settings', newSettings);
    
    setSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      
      // If we're updating the duration for the current mode, update timeRemaining
      if (
        (state.mode === 'work' && newSettings.workDuration !== undefined) ||
        (state.mode === 'shortBreak' && newSettings.shortBreakDuration !== undefined) ||
        (state.mode === 'longBreak' && newSettings.longBreakDuration !== undefined)
      ) {
        const currentDuration = state.mode === 'work' 
          ? updatedSettings.workDuration 
          : state.mode === 'shortBreak' 
            ? updatedSettings.shortBreakDuration 
            : updatedSettings.longBreakDuration;
            
        const newDuration = currentDuration * 60;
        
        setState(prevState => ({
          ...prevState,
          timeRemaining: newDuration,
          currentModeDuration: newDuration,
        }));
      }
      
      return updatedSettings;
    });
  };

  const formatTimeRemaining = (): string => {
    const minutes = Math.floor(state.timeRemaining / 60);
    const seconds = state.timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const adjustDuration = (seconds: number) => {
    loggerRef.current.info(`Adjusting duration by ${seconds} seconds`);
    
    setState(prevState => {
      const newTimeRemaining = Math.max(0, prevState.timeRemaining + seconds);
      return {
        ...prevState,
        timeRemaining: newTimeRemaining,
      };
    });
  };
  
  // Developer utility functions
  const toggleDebugMode = () => {
    setSettings(prev => {
      const newDebugMode = !prev.debugMode;
      loggerRef.current = createLogger(newDebugMode);
      loggerRef.current.info(`Debug mode ${newDebugMode ? 'enabled' : 'disabled'}`);
      return { ...prev, debugMode: newDebugMode };
    });
  };
  
  const toggleTestingMode = () => {
    setSettings(prev => {
      const newTestingMode = !prev.testingMode;
      loggerRef.current.info(`Testing mode ${newTestingMode ? 'enabled' : 'disabled'}`);
      
      // If timer is running, restart it with new interval
      if (state.isRunning) {
        if (timerRef.current) clearInterval(timerRef.current);
        runTimer();
      }
      
      return { ...prev, testingMode: newTestingMode };
    });
  };
  
  const setSpeedFactor = (factor: number) => {
    setSettings(prev => {
      loggerRef.current.info(`Speed factor set to ${factor}x`);
      
      // If timer is running, restart it with new speed
      if (state.isRunning && prev.testingMode) {
        if (timerRef.current) clearInterval(timerRef.current);
        runTimer();
      }
      
      return { ...prev, speedFactor: factor };
    });
  };

  // Advanced timer logic with drift compensation using requestAnimationFrame
  const runTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

    lastUpdateTimeRef.current = Date.now();
    
    loggerRef.current.info('Starting timer', { 
      mode: stateRef.current.mode, 
      duration: stateRef.current.timeRemaining,
      testingMode: settingsRef.current.testingMode,
      speedFactor: settingsRef.current.speedFactor
    });
    
    // Using setInterval for regular timer updates (better battery performance than rAF)
    const interval = settingsRef.current.testingMode 
      ? Math.max(100, 1000 / settingsRef.current.speedFactor) // Minimum 100ms even in testing mode
      : 1000;
    
    timerRef.current = window.setInterval(() => {
      // Compensate for potential drift
      const now = Date.now();
      const expectedElapsed = settingsRef.current.testingMode 
        ? settingsRef.current.speedFactor // In testing mode, reduce by speed factor
        : 1; // We expect 1 second to have passed in normal mode
      
      const actualElapsed = Math.round((now - lastUpdateTimeRef.current) / 1000);
      const adjustment = actualElapsed - expectedElapsed;
      lastUpdateTimeRef.current = now;

      setState(prevState => {
        // Apply adjustment to compensate for drift
        const timeDecrease = expectedElapsed + adjustment;
        const adjustedTimeRemaining = Math.max(0, prevState.timeRemaining - timeDecrease);

        // Timer completed
        if (adjustedTimeRemaining <= 0) {
          clearInterval(timerRef.current as number);
          loggerRef.current.info('Timer reached zero');
          handleTimerComplete();
          return prevState; // State will be updated by handleTimerComplete
        }
        
        // For debug logging, every 5 seconds
        if (settingsRef.current.debugMode && prevState.timeRemaining % 5 === 0) {
          loggerRef.current.log(`Time update: ${adjustedTimeRemaining}s remaining`);
        }
        
        return {
          ...prevState,
          timeRemaining: adjustedTimeRemaining,
          totalTime: prevState.totalTime + expectedElapsed,
        };
      });
    }, interval);
  };

  // Handle timer completion
  const handleTimerComplete = () => {
    const currentMode = stateRef.current.mode;
    const completedPomodoros = stateRef.current.completedPomodoros;
    const currentModeDuration = stateRef.current.currentModeDuration;
    
    loggerRef.current.group('Timer completed');
    loggerRef.current.info(`Mode: ${currentMode}`);
    loggerRef.current.info(`Completed pomodoros: ${completedPomodoros}`);
    
    // Update session data
    updateSessionData(currentMode, currentModeDuration);
    
    // Determine next mode
    let nextCompletedPomodoros = completedPomodoros;
    if (currentMode === 'work') {
      nextCompletedPomodoros = completedPomodoros + 1;
      loggerRef.current.info(`Incrementing pomodoro count to ${nextCompletedPomodoros}`);
    }
    
    const nextMode = determineNextMode(currentMode, nextCompletedPomodoros);
    loggerRef.current.info(`Next mode: ${nextMode}`);
    
    const nextDuration = getDurationForMode(nextMode);
    
    // Play notification
    playNotification(currentMode);
    
    // Auto-start logic
    const shouldAutoStart = 
      (nextMode !== 'work' && settingsRef.current.autoStartBreaks) || 
      (nextMode === 'work' && settingsRef.current.autoStartPomodoros);
    
    loggerRef.current.info(`Auto-start: ${shouldAutoStart}`);
    loggerRef.current.groupEnd();
    
    // Emit timer complete event
    eventEmitterRef.current.emit('complete', { 
      previousMode: currentMode, 
      nextMode,
      completedPomodoros: nextCompletedPomodoros
    });
    
    // Emit mode change event
    eventEmitterRef.current.emit('modeChange', { 
      from: currentMode, 
      to: nextMode 
    });
    
    setState(prev => ({
      ...prev,
      mode: nextMode,
      timeRemaining: nextDuration,
      currentModeDuration: nextDuration,
      isRunning: shouldAutoStart,
      isPaused: false,
      completedPomodoros: nextCompletedPomodoros,
      sessionStartTime: shouldAutoStart ? Date.now() : null,
      associatedTask: null
    }));
    
    // If auto-starting, run the timer
    if (shouldAutoStart) {
      runTimer();
    }
  };

  // Preload notification sounds when component mounts
  useEffect(() => {
    if (settings.soundNotificationsEnabled) {
      Object.values(notificationSounds).forEach(url => {
        preloadAudio(url);
      });
    }
  }, []);

  // Request notification permissions if not already granted
  const requestNotificationPermission = async () => {
    try {
      if (!("Notification" in window)) {
        loggerRef.current.warn('Notifications not supported in this browser');
        return false;
      }
      
      if (Notification.permission === "granted") {
        return true;
      } 
      
      if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      }
      
      return false;
    } catch (error) {
      loggerRef.current.error('Error requesting notification permission:', error);
      return false;
    }
  };

  // Play appropriate notification sound based on mode
  const playNotification = (completedMode: TimerMode) => {
    loggerRef.current.info(`Playing notification for completed ${completedMode} session`);
    
    // Show desktop notification if enabled
    if (settingsRef.current.desktopNotificationsEnabled) {
      try {
        // Check if browser supports notifications
        if ("Notification" in window) {
          if (Notification.permission === "granted") {
            const title = completedMode === 'work' 
              ? 'Work session completed!' 
              : 'Break time is over!';
            
            const message = completedMode === 'work' 
              ? 'Time for a break' 
              : 'Back to work';
              
            const icon = completedMode === 'work'
              ? '/icons/break-icon.png'  // A relaxing icon for break time
              : '/icons/work-icon.png';  // A focus icon for work time
            
            new Notification(title, {
              body: message,
              icon: icon
            });
          } else if (Notification.permission !== "denied") {
            requestNotificationPermission();
          }
        }
      } catch (error) {
        loggerRef.current.error('Notification error:', error);
      }
    }
    
    // Play sound notification if enabled
    if (settingsRef.current.soundNotificationsEnabled) {
      try {
        // Determine which sound to play
        const soundSetting = completedMode === 'work'
          ? settingsRef.current.workCompleteSound
          : settingsRef.current.breakCompleteSound;
          
        // Skip if set to none
        if (soundSetting === 'none') {
          return;
        }
        
        const soundUrl = notificationSounds[soundSetting];
        if (!soundUrl) {
          loggerRef.current.error(`Sound not found: ${soundSetting}`);
          return;
        }
        
        // Get or create audio element
        const audio = preloadAudio(soundUrl);
        
        // Set volume (convert from 0-100 to 0-1)
        audio.volume = settingsRef.current.notificationVolume / 100;
        
        // Play the sound
        audio.play().catch(error => {
          loggerRef.current.error('Error playing sound:', error);
        });
      } catch (error) {
        loggerRef.current.error('Sound notification error:', error);
      }
    }
  };

  const value: TimerContextType = {
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
    // Task association methods
    associateTask,
    disassociateTask,
    getTaskTimeSpent,
    getAssociatedTasksWithTime,
    // Session tracking methods
    getSessionHistory,
    getSessionStats,
    clearSessionHistory,
    exportSessionData,
    importSessionData,
    // Developer utilities
    toggleDebugMode,
    toggleTestingMode,
    setSpeedFactor,
    eventEmitter: eventEmitterRef.current,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}; 