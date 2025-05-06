import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ThemeSettings } from "@/components/ThemeSettings";
import { useTheme } from "@/providers/ThemeProvider";
import { Check, Download, Upload, Trash2, RefreshCw } from "lucide-react";
import { ThemePreferences, defaultThemePreferences } from "@/types/theme";
import { useToast } from "@/components/ui/use-toast";
import { loadUserPreferences, saveUserPreferences, deleteUserPreferences } from "@/services/preferenceService";
import { useAuth } from "@/hooks/useAuth";

export function PreferenceManagement() {
  const { preferences, updateThemePreferences } = useTheme();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const isAuthenticated = !!user;

  // Handle import preferences
  const handleImportPreferences = () => {
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';
    
    fileInput.onchange = async (e) => {
      if (!fileInput.files || fileInput.files.length === 0) return;
      
      try {
        setIsImporting(true);
        const file = fileInput.files[0];
        const text = await file.text();
        const importedPrefs: ThemePreferences = JSON.parse(text);
        
        // Apply preferences
        updateThemePreferences(importedPrefs);
        
        toast({
          title: "Preferences Imported",
          description: "Your preferences have been imported successfully.",
          variant: "default",
        });
      } catch (error) {
        console.error('Failed to import preferences:', error);
        toast({
          title: "Import Failed",
          description: "Failed to import preferences. Please check the file format.",
          variant: "destructive",
        });
      } finally {
        setIsImporting(false);
      }
    };
    
    // Trigger file dialog
    fileInput.click();
  };
  
  // Handle export preferences
  const handleExportPreferences = () => {
    try {
      setIsExporting(true);
      
      // Create JSON string
      const data = JSON.stringify(preferences, null, 2);
      
      // Create blob
      const blob = new Blob([data], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'zenith-preferences.json';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Preferences Exported",
        description: "Your preferences have been exported successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to export preferences:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle reset preferences
  const handleResetPreferences = () => {
    try {
      setIsResetting(true);
      
      // Reset to defaults
      updateThemePreferences(defaultThemePreferences);
      
      // Delete from database if authenticated
      if (user) {
        deleteUserPreferences(user.id)
          .catch(error => console.error('Failed to delete preferences from database:', error));
      }
      
      toast({
        title: "Preferences Reset",
        description: "Your preferences have been reset to default values.",
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };
  
  // Handle save preferences to server
  const handleSavePreferencesToServer = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      await saveUserPreferences(user.id, preferences);
      
      toast({
        title: "Preferences Saved",
        description: "Your preferences have been saved to your account.",
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to save preferences to server:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save preferences to server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Application Preferences</CardTitle>
          <CardDescription>
            Manage your application preferences and personalization settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="theme">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="theme">Theme Settings</TabsTrigger>
              <TabsTrigger value="storage">Data & Storage</TabsTrigger>
            </TabsList>
            
            <TabsContent value="theme" className="mt-4">
              <ThemeSettings />
            </TabsContent>
            
            <TabsContent value="storage" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Data & Storage Settings</CardTitle>
                  <CardDescription>
                    Control how your preferences are stored and synced
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="use-local-storage">Local Storage</Label>
                        <p className="text-xs text-muted-foreground">
                          Store preferences in browser local storage
                        </p>
                      </div>
                      <Switch 
                        id="use-local-storage" 
                        checked={preferences.useLocalStorage}
                        onCheckedChange={(checked) => updateThemePreferences({
                          ...preferences,
                          useLocalStorage: checked,
                        })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="use-cookies">Cookies</Label>
                        <p className="text-xs text-muted-foreground">
                          Store essential preferences in browser cookies
                        </p>
                      </div>
                      <Switch 
                        id="use-cookies" 
                        checked={preferences.useCookies}
                        onCheckedChange={(checked) => updateThemePreferences({
                          ...preferences,
                          useCookies: checked,
                        })}
                      />
                    </div>
                    
                    {isAuthenticated && (
                      <div className="pt-4 border-t">
                        <h3 className="text-sm font-medium mb-3">Account Synchronization</h3>
                        <p className="text-xs text-muted-foreground mb-4">
                          Your preferences are automatically saved to your account when you make changes.
                          This allows you to have the same experience across all your devices.
                        </p>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full flex items-center justify-center gap-2"
                          onClick={handleSavePreferencesToServer}
                          disabled={isSaving || !isAuthenticated}
                        >
                          {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          {isSaving ? "Saving..." : "Save to Account Now"}
                        </Button>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-medium mb-3">Import & Export</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center justify-center gap-2"
                          onClick={handleImportPreferences}
                          disabled={isImporting}
                        >
                          {isImporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                          {isImporting ? "Importing..." : "Import"}
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center justify-center gap-2"
                          onClick={handleExportPreferences}
                          disabled={isExporting}
                        >
                          {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          {isExporting ? "Exporting..." : "Export"}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-medium mb-3 text-destructive">Reset Preferences</h3>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={handleResetPreferences}
                        disabled={isResetting}
                      >
                        {isResetting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        {isResetting ? "Resetting..." : "Reset All Preferences"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 