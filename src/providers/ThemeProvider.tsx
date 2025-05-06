import { createContext, useContext, useEffect, useState } from 'react';
import { ThemeConfig, ThemeMode, ThemePreferences, ColorScheme, defaultThemeConfig, defaultThemePreferences } from '@/types/theme';
import { applyThemeConfig, loadThemePreferences, saveThemePreferences, shouldUseDarkMode } from '@/utils/themeUtils';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: ThemeConfig;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: ThemeConfig;
  preferences: ThemePreferences;
  setTheme: (theme: ThemeConfig) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setColorScheme: (colorScheme: ColorScheme) => void;
  toggleThemeMode: () => void;
  updateThemePreferences: (prefs: Partial<ThemePreferences>) => void;
  previewTheme: (theme: ThemeConfig) => void;
  applyPreviewedTheme: () => void;
  cancelPreview: () => void;
};

const initialState: ThemeProviderState = {
  theme: defaultThemeConfig,
  preferences: defaultThemePreferences,
  setTheme: () => null,
  setThemeMode: () => null,
  setColorScheme: () => null,
  toggleThemeMode: () => null,
  updateThemePreferences: () => null,
  previewTheme: () => null,
  applyPreviewedTheme: () => null,
  cancelPreview: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = defaultThemeConfig,
  ...props
}: ThemeProviderProps) {
  // Main theme configuration
  const [theme, setThemeState] = useState<ThemeConfig>(defaultTheme);
  
  // Theme preferences
  const [preferences, setPreferences] = useState<ThemePreferences>(defaultThemePreferences);
  
  // Theme preview state
  const [previewingTheme, setPreviewingTheme] = useState<ThemeConfig | null>(null);
  
  // Auto dark mode timer
  const [autoDarkModeTimer, setAutoDarkModeTimer] = useState<NodeJS.Timeout | null>(null);

  // Load saved preferences on initial render
  useEffect(() => {
    const savedPreferences = loadThemePreferences();
    setPreferences(savedPreferences);
    setThemeState(savedPreferences.theme);
    
    // Apply the theme immediately
    applyThemeConfig(savedPreferences.theme);
  }, []);

  // Set up auto dark mode timer if enabled
  useEffect(() => {
    if (preferences.autoDarkMode) {
      // Check every minute if dark mode should be applied
      const timer = setInterval(() => {
        if (shouldUseDarkMode(preferences)) {
          setThemeMode('dark');
        } else {
          setThemeMode('light');
        }
      }, 60000); // Check every minute
      
      setAutoDarkModeTimer(timer);
      
      // Clean up timer on unmount
      return () => {
        if (autoDarkModeTimer) {
          clearInterval(autoDarkModeTimer);
        }
      };
    } else if (autoDarkModeTimer) {
      // If auto dark mode is disabled but timer exists, clear it
      clearInterval(autoDarkModeTimer);
      setAutoDarkModeTimer(null);
    }
  }, [preferences.autoDarkMode, preferences.darkModeStartTime, preferences.darkModeEndTime]);

  // Apply theme whenever theme changes
  useEffect(() => {
    // If previewing, don't save to storage
    if (previewingTheme) {
      applyThemeConfig(previewingTheme);
    } else {
      applyThemeConfig(theme);
      
      // Save preferences to storage
      const updatedPreferences = { ...preferences, theme };
      setPreferences(updatedPreferences);
      saveThemePreferences(updatedPreferences);
    }
  }, [theme, previewingTheme]);

  // Update the entire theme
  const setTheme = (newTheme: ThemeConfig) => {
    setThemeState(newTheme);
  };

  // Update just the theme mode (light/dark/system)
  const setThemeMode = (mode: ThemeMode) => {
    setThemeState(prev => ({ ...prev, mode }));
  };

  // Update just the color scheme
  const setColorScheme = (colorScheme: ColorScheme) => {
    setThemeState(prev => ({ ...prev, colorScheme }));
  };

  // Toggle between light and dark mode
  const toggleThemeMode = () => {
    setThemeState(prev => ({
      ...prev,
      mode: prev.mode === 'dark' ? 'light' : 'dark'
    }));
  };

  // Update theme preferences
  const updateThemePreferences = (prefs: Partial<ThemePreferences>) => {
    const updatedPreferences = { ...preferences, ...prefs };
    setPreferences(updatedPreferences);
    saveThemePreferences(updatedPreferences);
  };

  // Preview a theme without saving it
  const previewTheme = (theme: ThemeConfig) => {
    setPreviewingTheme(theme);
  };

  // Apply the previewed theme
  const applyPreviewedTheme = () => {
    if (previewingTheme) {
      setThemeState(previewingTheme);
      setPreviewingTheme(null);
    }
  };

  // Cancel theme preview
  const cancelPreview = () => {
    setPreviewingTheme(null);
  };

  const value = {
    theme: previewingTheme || theme,
    preferences,
    setTheme,
    setThemeMode,
    setColorScheme,
    toggleThemeMode,
    updateThemePreferences,
    previewTheme,
    applyPreviewedTheme,
    cancelPreview,
  };

  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
}; 