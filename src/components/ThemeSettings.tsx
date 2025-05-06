import { useState, useEffect } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun, Laptop, RefreshCw, Eye, Check, X, MoveHorizontal, Cloud, CloudOff, DatabaseBackup } from "lucide-react";
import { ThemeConfig, ColorScheme, ThemeMode, defaultThemeConfig } from "@/types/theme";
import { useAuth } from "@/hooks/useAuth";

export function ThemeSettings() {
  const { 
    theme, 
    preferences, 
    setTheme, 
    updateThemePreferences, 
    previewTheme, 
    applyPreviewedTheme, 
    cancelPreview,
    isSyncing
  } = useTheme();
  
  const { user } = useAuth();
  const isAuthenticated = !!user;

  // Local state for theme editing
  const [editingTheme, setEditingTheme] = useState<ThemeConfig>({ ...theme });
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [timePickerStart, setTimePickerStart] = useState(preferences.darkModeStartTime || "22:00");
  const [timePickerEnd, setTimePickerEnd] = useState(preferences.darkModeEndTime || "06:00");
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Update last sync time when syncing completes
  useEffect(() => {
    if (!isSyncing) {
      setLastSyncTime(new Date().toLocaleTimeString());
    }
  }, [isSyncing]);

  // Update local state when theme changes
  useEffect(() => {
    if (!isPreviewing) {
      setEditingTheme({ ...theme });
    }
  }, [theme, isPreviewing]);

  // Handle theme mode change
  const handleModeChange = (mode: ThemeMode) => {
    const newTheme = { ...editingTheme, mode };
    setEditingTheme(newTheme);
    
    if (isPreviewing) {
      previewTheme(newTheme);
    }
  };

  // Handle color scheme change
  const handleColorSchemeChange = (colorScheme: ColorScheme) => {
    const newTheme = { ...editingTheme, colorScheme };
    setEditingTheme(newTheme);
    
    if (isPreviewing) {
      previewTheme(newTheme);
    }
  };

  // Handle font size change
  const handleFontSizeChange = (size: "small" | "medium" | "large") => {
    const newTheme = { ...editingTheme, fontSize: size };
    setEditingTheme(newTheme);
    
    if (isPreviewing) {
      previewTheme(newTheme);
    }
  };

  // Handle border radius change
  const handleBorderRadiusChange = (radius: "none" | "small" | "medium" | "large") => {
    const newTheme = { ...editingTheme, borderRadius: radius };
    setEditingTheme(newTheme);
    
    if (isPreviewing) {
      previewTheme(newTheme);
    }
  };

  // Handle animation toggle
  const handleAnimationChange = (enabled: boolean) => {
    const newTheme = { ...editingTheme, animation: enabled };
    setEditingTheme(newTheme);
    
    if (isPreviewing) {
      previewTheme(newTheme);
    }
  };

  // Handle reduced motion toggle
  const handleReducedMotionChange = (enabled: boolean) => {
    const newTheme = { ...editingTheme, reducedMotion: enabled };
    setEditingTheme(newTheme);
    
    if (isPreviewing) {
      previewTheme(newTheme);
    }
  };

  // Toggle preview mode
  const togglePreview = () => {
    if (isPreviewing) {
      cancelPreview();
      setIsPreviewing(false);
    } else {
      previewTheme(editingTheme);
      setIsPreviewing(true);
    }
  };

  // Apply the edited theme
  const applyTheme = () => {
    setTheme(editingTheme);
    
    if (isPreviewing) {
      applyPreviewedTheme();
      setIsPreviewing(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setEditingTheme({ ...defaultThemeConfig });
    
    if (isPreviewing) {
      previewTheme(defaultThemeConfig);
    }
  };

  // Handle auto dark mode toggle
  const handleAutoDarkModeChange = (enabled: boolean) => {
    updateThemePreferences({
      ...preferences,
      autoDarkMode: enabled,
    });
  };

  // Handle time picker changes
  const handleTimePickerStartChange = (value: string) => {
    setTimePickerStart(value);
    updateThemePreferences({
      ...preferences,
      darkModeStartTime: value,
    });
  };

  const handleTimePickerEndChange = (value: string) => {
    setTimePickerEnd(value);
    updateThemePreferences({
      ...preferences,
      darkModeEndTime: value,
    });
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="relative">
        <div className="absolute right-6 top-6 flex gap-2">
          {isAuthenticated ? (
            <Badge variant="outline" className="flex gap-1 items-center">
              {isSyncing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Cloud className="h-3 w-3" />}
              {isSyncing ? "Syncing..." : "Cloud Synced"}
            </Badge>
          ) : (
            <Badge variant="outline" className="flex gap-1 items-center">
              <CloudOff className="h-3 w-3" />
              Local Only
            </Badge>
          )}
        </div>
        <CardTitle>Theme Settings</CardTitle>
        <CardDescription>
          Customize the appearance of your application
          {lastSyncTime && isAuthenticated && (
            <span className="text-xs block mt-1 text-muted-foreground">
              Last synced: {lastSyncTime}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="appearance">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          
          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            {/* Theme Mode */}
            <div className="space-y-2">
              <Label>Theme Mode</Label>
              <RadioGroup 
                value={editingTheme.mode} 
                onValueChange={(v) => handleModeChange(v as ThemeMode)}
                className="grid grid-cols-3 gap-4 pt-2"
              >
                <div className="flex flex-col items-center space-y-2">
                  <Label
                    htmlFor="light-mode"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <Sun className="h-6 w-6 mb-2" />
                    <div className="text-sm">Light</div>
                    <RadioGroupItem value="light" id="light-mode" className="sr-only" />
                  </Label>
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  <Label
                    htmlFor="dark-mode"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <Moon className="h-6 w-6 mb-2" />
                    <div className="text-sm">Dark</div>
                    <RadioGroupItem value="dark" id="dark-mode" className="sr-only" />
                  </Label>
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  <Label
                    htmlFor="system-mode"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <Laptop className="h-6 w-6 mb-2" />
                    <div className="text-sm">System</div>
                    <RadioGroupItem value="system" id="system-mode" className="sr-only" />
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Color Scheme */}
            <div className="space-y-2">
              <Label>Color Scheme</Label>
              <RadioGroup 
                value={editingTheme.colorScheme} 
                onValueChange={(v) => handleColorSchemeChange(v as ColorScheme)}
                className="grid grid-cols-5 gap-2 pt-2"
              >
                <div className="flex items-center justify-center">
                  <Label
                    htmlFor="default-scheme"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted w-12 h-12 bg-primary cursor-pointer"
                  >
                    <RadioGroupItem value="default" id="default-scheme" className="sr-only" />
                    {editingTheme.colorScheme === "default" && (
                      <Check className="h-6 w-6 text-white" />
                    )}
                  </Label>
                </div>
                
                <div className="flex items-center justify-center">
                  <Label
                    htmlFor="blue-scheme"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted w-12 h-12 bg-blue-500 cursor-pointer"
                  >
                    <RadioGroupItem value="blue" id="blue-scheme" className="sr-only" />
                    {editingTheme.colorScheme === "blue" && (
                      <Check className="h-6 w-6 text-white" />
                    )}
                  </Label>
                </div>
                
                <div className="flex items-center justify-center">
                  <Label
                    htmlFor="green-scheme"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted w-12 h-12 bg-green-500 cursor-pointer"
                  >
                    <RadioGroupItem value="green" id="green-scheme" className="sr-only" />
                    {editingTheme.colorScheme === "green" && (
                      <Check className="h-6 w-6 text-white" />
                    )}
                  </Label>
                </div>
                
                <div className="flex items-center justify-center">
                  <Label
                    htmlFor="purple-scheme"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted w-12 h-12 bg-purple-500 cursor-pointer"
                  >
                    <RadioGroupItem value="purple" id="purple-scheme" className="sr-only" />
                    {editingTheme.colorScheme === "purple" && (
                      <Check className="h-6 w-6 text-white" />
                    )}
                  </Label>
                </div>
                
                <div className="flex items-center justify-center">
                  <Label
                    htmlFor="orange-scheme"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted w-12 h-12 bg-orange-500 cursor-pointer"
                  >
                    <RadioGroupItem value="orange" id="orange-scheme" className="sr-only" />
                    {editingTheme.colorScheme === "orange" && (
                      <Check className="h-6 w-6 text-white" />
                    )}
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Font Size */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Font Size</Label>
                <span className="text-sm text-muted-foreground">
                  {editingTheme.fontSize === "small" ? "Small" : 
                   editingTheme.fontSize === "medium" ? "Medium" : "Large"}
                </span>
              </div>
              <RadioGroup 
                value={editingTheme.fontSize} 
                onValueChange={(v) => handleFontSizeChange(v as "small" | "medium" | "large")}
                className="grid grid-cols-3 gap-2 pt-2"
              >
                <Label
                  htmlFor="small-font"
                  className="flex items-center justify-center rounded-md border-2 border-muted p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm"
                >
                  Small
                  <RadioGroupItem value="small" id="small-font" className="sr-only" />
                </Label>
                
                <Label
                  htmlFor="medium-font"
                  className="flex items-center justify-center rounded-md border-2 border-muted p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  Medium
                  <RadioGroupItem value="medium" id="medium-font" className="sr-only" />
                </Label>
                
                <Label
                  htmlFor="large-font"
                  className="flex items-center justify-center rounded-md border-2 border-muted p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-lg"
                >
                  Large
                  <RadioGroupItem value="large" id="large-font" className="sr-only" />
                </Label>
              </RadioGroup>
            </div>
            
            {/* Border Radius */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Border Radius</Label>
                <span className="text-sm text-muted-foreground capitalize">
                  {editingTheme.borderRadius}
                </span>
              </div>
              <RadioGroup 
                value={editingTheme.borderRadius} 
                onValueChange={(v) => handleBorderRadiusChange(v as "none" | "small" | "medium" | "large")}
                className="grid grid-cols-4 gap-2 pt-2"
              >
                <Label
                  htmlFor="none-radius"
                  className="flex items-center justify-center rounded-none border-2 border-muted p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  None
                  <RadioGroupItem value="none" id="none-radius" className="sr-only" />
                </Label>
                
                <Label
                  htmlFor="small-radius"
                  className="flex items-center justify-center rounded-sm border-2 border-muted p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  Small
                  <RadioGroupItem value="small" id="small-radius" className="sr-only" />
                </Label>
                
                <Label
                  htmlFor="medium-radius"
                  className="flex items-center justify-center rounded-md border-2 border-muted p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  Medium
                  <RadioGroupItem value="medium" id="medium-radius" className="sr-only" />
                </Label>
                
                <Label
                  htmlFor="large-radius"
                  className="flex items-center justify-center rounded-lg border-2 border-muted p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  Large
                  <RadioGroupItem value="large" id="large-radius" className="sr-only" />
                </Label>
              </RadioGroup>
            </div>
            
            {/* Animation Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="animations" className="flex flex-1 items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Enable Animations
                </Label>
                <Switch 
                  id="animations" 
                  checked={editingTheme.animation}
                  onCheckedChange={handleAnimationChange}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="reduced-motion" className="flex flex-1 items-center gap-2">
                  <MoveHorizontal className="h-4 w-4" />
                  Reduced Motion
                </Label>
                <Switch 
                  id="reduced-motion" 
                  checked={editingTheme.reducedMotion}
                  onCheckedChange={handleReducedMotionChange}
                  disabled={!editingTheme.animation}
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="auto-dark-mode" className="flex flex-1 items-center gap-2">
                  <Moon className="h-4 w-4" />
                  Auto Dark Mode (Time-based)
                </Label>
                <Switch 
                  id="auto-dark-mode" 
                  checked={preferences.autoDarkMode}
                  onCheckedChange={handleAutoDarkModeChange}
                />
              </div>
              
              {preferences.autoDarkMode && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="dark-mode-start">Dark Mode Start</Label>
                    <Input 
                      id="dark-mode-start" 
                      type="time" 
                      value={timePickerStart}
                      onChange={(e) => handleTimePickerStartChange(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dark-mode-end">Dark Mode End</Label>
                    <Input 
                      id="dark-mode-end" 
                      type="time" 
                      value={timePickerEnd}
                      onChange={(e) => handleTimePickerEndChange(e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="use-cookies" className="flex flex-1">
                  Store theme preferences in cookies
                </Label>
                <Switch 
                  id="use-cookies" 
                  checked={preferences.useCookies}
                  onCheckedChange={(checked) => updateThemePreferences({
                    ...preferences,
                    useCookies: checked,
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="use-local-storage" className="flex flex-1">
                  Store theme preferences in local storage
                </Label>
                <Switch 
                  id="use-local-storage" 
                  checked={preferences.useLocalStorage}
                  onCheckedChange={(checked) => updateThemePreferences({
                    ...preferences,
                    useLocalStorage: checked,
                  })}
                />
              </div>
              
              {isAuthenticated && (
                <div className="pt-4 border-t mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-medium">Cloud Synchronization</h4>
                      <p className="text-xs text-muted-foreground">Your preferences are synced across devices</p>
                    </div>
                    <DatabaseBackup className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <p className="text-muted-foreground">
                      Theme preferences are automatically synced to your account. Any changes you make will be available on all your devices.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            className="gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePreview}
            className="gap-1"
          >
            {isPreviewing ? (
              <>
                <X className="h-4 w-4" />
                Cancel Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Preview
              </>
            )}
          </Button>
          
          <Button
            size="sm"
            onClick={applyTheme}
            className="gap-1"
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Apply Changes
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 