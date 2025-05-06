import { ColorScheme, ThemeConfig, ThemeMode, ThemePreferences, defaultThemeConfig, defaultThemePreferences } from "@/types/theme";

const THEME_STORAGE_KEY = "zenith-theme-preferences";

/**
 * Get the system preferred color scheme
 */
export function getSystemTheme(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Apply a theme mode (light/dark/system) to the document
 */
export function applyThemeMode(mode: ThemeMode): void {
  const root = document.documentElement;
  
  // Remove existing theme classes
  root.classList.remove("light", "dark");
  
  // Apply the appropriate theme class
  if (mode === "system") {
    const systemTheme = getSystemTheme();
    root.classList.add(systemTheme);
  } else {
    root.classList.add(mode);
  }
}

/**
 * Apply a color scheme by updating CSS variables
 */
export function applyColorScheme(colorScheme: ColorScheme): void {
  const root = document.documentElement;
  
  // Remove existing color scheme classes
  root.classList.remove("theme-default", "theme-blue", "theme-green", "theme-purple", "theme-orange");
  
  // Apply the new color scheme class
  root.classList.add(`theme-${colorScheme}`);
}

/**
 * Apply font size adjustment
 */
export function applyFontSize(size: ThemeConfig['fontSize']): void {
  const root = document.documentElement;
  
  // Remove existing font size classes
  root.classList.remove("text-size-small", "text-size-medium", "text-size-large");
  
  // Apply the new font size class
  root.classList.add(`text-size-${size}`);
}

/**
 * Apply border radius settings
 */
export function applyBorderRadius(radius: ThemeConfig['borderRadius']): void {
  const root = document.documentElement;
  
  // Remove existing border radius classes
  root.classList.remove("radius-none", "radius-small", "radius-medium", "radius-large");
  
  // Apply the new border radius class
  root.classList.add(`radius-${radius}`);
}

/**
 * Apply animation settings
 */
export function applyAnimationSettings(enableAnimation: boolean, reducedMotion: boolean): void {
  const root = document.documentElement;
  
  // Handle animation settings
  if (!enableAnimation) {
    root.classList.add("no-animations");
  } else {
    root.classList.remove("no-animations");
  }
  
  // Handle reduced motion
  if (reducedMotion) {
    root.classList.add("reduced-motion");
  } else {
    root.classList.remove("reduced-motion");
  }
}

/**
 * Apply the complete theme configuration to the document
 */
export function applyThemeConfig(config: ThemeConfig): void {
  applyThemeMode(config.mode);
  applyColorScheme(config.colorScheme);
  applyFontSize(config.fontSize);
  applyBorderRadius(config.borderRadius);
  applyAnimationSettings(config.animation, config.reducedMotion);
}

/**
 * Save theme preferences to local storage
 */
export function saveThemePreferences(prefs: ThemePreferences): void {
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(prefs));
}

/**
 * Load theme preferences from local storage
 */
export function loadThemePreferences(): ThemePreferences {
  const storedPrefs = localStorage.getItem(THEME_STORAGE_KEY);
  
  if (!storedPrefs) {
    return defaultThemePreferences;
  }
  
  try {
    return JSON.parse(storedPrefs) as ThemePreferences;
  } catch (error) {
    console.error("Failed to parse stored theme preferences:", error);
    return defaultThemePreferences;
  }
}

/**
 * Check if it's time for auto dark mode based on preferences
 */
export function shouldUseDarkMode(prefs: ThemePreferences): boolean {
  if (!prefs.autoDarkMode || !prefs.darkModeStartTime || !prefs.darkModeEndTime) {
    return false;
  }
  
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  
  const startTimeParts = prefs.darkModeStartTime.split(':');
  const startHours = parseInt(startTimeParts[0], 10);
  const startMinutes = parseInt(startTimeParts[1], 10);
  
  const endTimeParts = prefs.darkModeEndTime.split(':');
  const endHours = parseInt(endTimeParts[0], 10);
  const endMinutes = parseInt(endTimeParts[1], 10);
  
  // Check if current time is within the dark mode period
  const currentTimeInMinutes = (currentHours * 60) + currentMinutes;
  const startTimeInMinutes = (startHours * 60) + startMinutes;
  const endTimeInMinutes = (endHours * 60) + endMinutes;
  
  // Handle the case where dark mode spans across midnight
  if (startTimeInMinutes > endTimeInMinutes) {
    return currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes <= endTimeInMinutes;
  } else {
    return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
  }
} 