export type ThemeMode = 'light' | 'dark' | 'system';

export type ColorScheme = 'default' | 'blue' | 'green' | 'purple' | 'orange';

export type ThemeConfig = {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  fontSize: 'small' | 'medium' | 'large';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  animation: boolean;
  reducedMotion: boolean;
};

export type ThemePreferences = {
  theme: ThemeConfig;
  useCookies: boolean;
  useLocalStorage: boolean;
  autoDarkMode: boolean;
  darkModeStartTime?: string; // Format: "HH:MM"
  darkModeEndTime?: string; // Format: "HH:MM"
};

export const defaultThemeConfig: ThemeConfig = {
  mode: 'system',
  colorScheme: 'default',
  fontSize: 'medium',
  borderRadius: 'medium',
  animation: true,
  reducedMotion: false,
};

export const defaultThemePreferences: ThemePreferences = {
  theme: defaultThemeConfig,
  useCookies: true,
  useLocalStorage: true,
  autoDarkMode: false,
}; 