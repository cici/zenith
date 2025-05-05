"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { supabase } from '@/services/supabase';
import { toast } from "sonner";

// Define props if needed, e.g., for user data and open state control
interface DashboardSettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Add user prop type, replace 'any' with your actual user type
  user?: any; 
  // Add a prop for available widgets and their visibility state
  widgets?: { id: string; name: string; visible: boolean }[];
  // Modified callback to accept preview flag
  onWidgetVisibilityChange?: (widgetId: string, isVisible: boolean, isPreview?: boolean) => void;
  // Add props for current layout preset and handler
  currentLayoutPreset?: string;
  // Modified callback to accept preview flag
  onLayoutPresetChange?: (preset: string, isPreview?: boolean) => void;
  // Add props for theme
  currentTheme?: string;
  // Modified callback to accept preview flag
  onThemeChange?: (theme: string, isPreview?: boolean) => void;
  // Add props for grid settings
  currentGridSettings?: {
    cols: number;
    rowHeight: number;
    // Add gap if needed
  };
  // Modified callback to accept preview flag
  onGridSettingsChange?: (settings: { cols: number; rowHeight: number }, isPreview?: boolean) => void;
}

export function DashboardSettingsPanel({
  open,
  onOpenChange,
  user,
  // Provide default empty array for widgets if not passed
  widgets = [], 
  onWidgetVisibilityChange = () => {},
  // Get current preset and handler, provide default
  currentLayoutPreset = 'default', 
  onLayoutPresetChange = () => {},
  // Get theme props
  currentTheme = 'system', 
  onThemeChange = () => {},
  // Get grid settings props, provide defaults
  currentGridSettings = { cols: 12, rowHeight: 80 }, 
  onGridSettingsChange = () => {},
}: DashboardSettingsPanelProps) {
  // Example state for form data - integrate with your actual user data source
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    email: user?.email || "",
    timezone: user?.timezone || "UTC", // Default or fetch from user data
    // Add layoutPreset to internal state, initialized from prop
    layoutPreset: currentLayoutPreset, 
    // Add theme to internal state
    theme: currentTheme,
    // Add grid settings to internal state
    gridCols: currentGridSettings.cols,
    rowHeight: currentGridSettings.rowHeight,
  });
  // Add state for the widget search term
  const [widgetSearchTerm, setWidgetSearchTerm] = useState("");
  // Add loading state for save button
  const [isSaving, setIsSaving] = useState(false);

  // Store initial state for reverting preview
  const [initialFormData, setInitialFormData] = useState(formData);
  
  // State for preview mode
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Update internal state if the prop changes (e.g., after save)
  React.useEffect(() => {
    setFormData(prev => ({ 
      ...prev, 
      layoutPreset: currentLayoutPreset, 
      theme: currentTheme,
      // Sync grid settings
      gridCols: currentGridSettings.cols,
      rowHeight: currentGridSettings.rowHeight,
    }));
    setInitialFormData(prev => ({ 
      ...prev, 
      layoutPreset: currentLayoutPreset, 
      theme: currentTheme,
      // Sync grid settings
      gridCols: currentGridSettings.cols,
      rowHeight: currentGridSettings.rowHeight,
    }));
    setIsPreviewing(false);
  }, [currentLayoutPreset, currentTheme, currentGridSettings]);

  // Function to apply changes (either preview or permanent)
  const applyChanges = (isPreview: boolean) => {
    console.log(isPreview ? "Applying preview:" : "Applying permanent changes:" , formData);
    // Call parent callbacks with the current form data
    onLayoutPresetChange(formData.layoutPreset, isPreview);
    onThemeChange(formData.theme, isPreview);
    onGridSettingsChange({
      cols: formData.gridCols,
      rowHeight: formData.rowHeight
    }, isPreview);
    // Note: Widget visibility is handled separately by its own callback
  };

  // Handler for the Preview button
  const handlePreview = () => {
    applyChanges(true); // Apply changes with preview flag
    setIsPreviewing(true);
    toast.info("Preview mode activated. Changes are temporary.");
  };

  // Handler for reverting preview changes
  const handleRevertPreview = () => {
    if (isPreviewing) {
      console.log("Reverting preview to initial state:", initialFormData);
      // Apply the initial state with preview flag (to signal revert)
      onLayoutPresetChange(initialFormData.layoutPreset, true);
      onThemeChange(initialFormData.theme, true);
      onGridSettingsChange({
        cols: initialFormData.gridCols,
        rowHeight: initialFormData.rowHeight
      }, true);
      // Revert widget changes as well if necessary (requires tracking initial widget state)
      
      setFormData(initialFormData); // Reset local form state
      setIsPreviewing(false);
      toast.info("Preview reverted.");
    } 
  };

  // Updated Save handler
  const handleSave = async () => {
    if (!user || !user.id) {
      toast.error("User information is missing. Cannot save settings.");
      return;
    }
    setIsSaving(true);
    try {
      const updates = {
        user_id: user.id, 
        display_name: formData.displayName,
        timezone: formData.timezone,
        layout_preset: formData.layoutPreset,
        theme: formData.theme,
        grid_cols: formData.gridCols,
        row_height: formData.rowHeight,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('user_preferences') 
        .upsert(updates, { onConflict: 'user_id' });

      if (error) throw error;

      // Apply changes permanently AFTER successful save
      applyChanges(false); 
      setIsPreviewing(false); // Ensure preview mode is off after save
      toast.success("Settings saved successfully!");
      onOpenChange(false); // Close panel

    } catch (error: any) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings.", { description: error.message || "Please try again." });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handler for the Cancel button / Sheet close
  const handleCancelOrClose = (isOpen: boolean) => {
    if (!isOpen) { // Only act when closing
      handleRevertPreview(); // Revert if previewing
    }
    onOpenChange(isOpen); // Propagate open state change
  };

  // Filter widgets based on the search term
  const filteredWidgets = widgets.filter((widget) =>
    widget.name.toLowerCase().includes(widgetSearchTerm.toLowerCase())
  );

  // Determine if there are unsaved changes (excluding profile fields for now)
  const hasUnsavedChanges = 
    formData.layoutPreset !== initialFormData.layoutPreset ||
    formData.theme !== initialFormData.theme ||
    formData.gridCols !== initialFormData.gridCols ||
    formData.rowHeight !== initialFormData.rowHeight;
    // Add widget visibility comparison if needed

  return (
    <Sheet open={open} onOpenChange={handleCancelOrClose}>
      {/* Adjust width: full on mobile, fixed max-width on larger screens */}
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto"> 
        {/* Preview Mode Banner */} 
        {isPreviewing && (
          <div 
            role="status"
            className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md text-sm"
          >
             Preview mode active. Changes are temporary. Click Cancel to revert or Save to keep.
          </div>
        )}
        
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Manage your account and dashboard preferences.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="profile" className="py-6">
          {/* Adjust grid columns for tabs on smaller screens */}
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6"> 
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="widgets">Widgets</TabsTrigger>
            {/* Add more triggers if needed */}
          </TabsList>

          {/* Profile Tab Content */}
          <TabsContent value="profile">
            <div className="grid gap-4">
              <h3 className="text-sm font-medium text-foreground">User Profile</h3>
              {/* Make label/input pairs stack on small screens */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="displayName" className="sm:text-right sm:col-span-1">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className="col-span-1 sm:col-span-3"
                />
              </div>
              {/* Repeat responsive pattern for other label/input pairs */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="email" className="sm:text-right sm:col-span-1">
                  Email
                </Label>
                <Input
                  id="email"
                  value={formData.email}
                  disabled
                  className="col-span-1 sm:col-span-3 bg-muted"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="timezone" className="sm:text-right sm:col-span-1">
                  Timezone
                </Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) =>
                    setFormData({ ...formData, timezone: value })
                  }
                >
                  <SelectTrigger id="timezone" className="col-span-1 sm:col-span-3">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* TODO: Populate with a comprehensive list of timezones */}
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">
                      Eastern Time (ET)
                    </SelectItem>
                    <SelectItem value="America/Chicago">
                      Central Time (CT)
                    </SelectItem>
                    <SelectItem value="America/Denver">
                      Mountain Time (MT)
                    </SelectItem>
                    <SelectItem value="America/Los_Angeles">
                      Pacific Time (PT)
                    </SelectItem>
                    <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                    <SelectItem value="Europe/Berlin">Berlin (CET/CEST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Layout Tab Content */}
          <TabsContent value="layout">
            <div className="grid gap-6"> {/* Increased gap for sections */}
               {/* Layout Preset Section */}
               <div className="space-y-2">
                 <Label htmlFor="layout-preset" className="text-sm font-medium">
                   Layout Preset
                 </Label>
                 <Select
                   value={formData.layoutPreset} // Use internal state
                   onValueChange={(value) =>
                     // Update internal state
                     setFormData({ ...formData, layoutPreset: value })
                   }
                 >
                   <SelectTrigger id="layout-preset" className="w-full">
                     <SelectValue placeholder="Select a layout preset" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="default">Default</SelectItem>
                     <SelectItem value="compact">Compact</SelectItem>
                     <SelectItem value="spacious">Spacious</SelectItem>
                     <SelectItem value="analytics">Analytics Focus</SelectItem> 
                     <SelectItem value="minimal">Minimal</SelectItem>
                     {/* Add more presets as needed */}
                   </SelectContent>
                 </Select>
                 <p className="text-sm text-muted-foreground">
                    Choose a predefined layout structure for your widgets.
                 </p>
               </div>

               {/* Grid Density Section */}
               <div className="space-y-2 pt-4 border-t">
                 <h4 className="text-sm font-medium">Grid Density</h4>
                 {/* Column Slider */}
                 <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="columns-slider">Columns</Label>
                    <span className="text-sm font-mono text-muted-foreground">{formData.gridCols}</span>
                  </div>
                  <Slider
                    id="columns-slider"
                    min={4} // Example range
                    max={24}
                    step={1}
                    value={[formData.gridCols]}
                    onValueChange={(value) => 
                      setFormData({ ...formData, gridCols: value[0] })
                    }
                    aria-label="Number of columns"
                  />
                 </div>
                 {/* Row Height Slider */}
                 <div className="space-y-2 pt-2">
                   <div className="flex justify-between items-center">
                     <Label htmlFor="row-height-slider">Row Height (px)</Label>
                     <span className="text-sm font-mono text-muted-foreground">{formData.rowHeight}</span>
                    </div>
                   <Slider
                     id="row-height-slider"
                     min={50} // Example range
                     max={150}
                     step={5}
                     value={[formData.rowHeight]}
                     onValueChange={(value) => 
                      setFormData({ ...formData, rowHeight: value[0] })
                    }
                     aria-label="Row height in pixels"
                   />
                 </div>
                 <p className="text-sm text-muted-foreground pt-1">
                    Adjust the grid columns and row height for density.
                 </p>
               </div>

            </div>
          </TabsContent>

          {/* Appearance Tab Content */}
          <TabsContent value="appearance">
             <div className="grid gap-6">
               {/* Theme Selection Section */}
               <div className="space-y-2">
                 <Label className="text-sm font-medium">Theme</Label>
                 <p className="text-sm text-muted-foreground pb-2">
                   Select the appearance of the dashboard.
                 </p>
                 <RadioGroup
                   value={formData.theme} // Use internal state
                   onValueChange={(value) =>
                     // Update internal state
                     setFormData({ ...formData, theme: value })
                   }
                   className="grid grid-cols-3 gap-4"
                 >
                   <div>
                     <RadioGroupItem value="light" id="light" className="peer sr-only" />
                     <Label
                       htmlFor="light"
                       className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                     >
                       {/* TODO: Add Light theme icon (e.g., Sun) */}
                       Light
                     </Label>
                   </div>
                   <div>
                     <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                     <Label
                       htmlFor="dark"
                       className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                     >
                       {/* TODO: Add Dark theme icon (e.g., Moon) */}
                       Dark
                     </Label>
                   </div>
                   <div>
                     <RadioGroupItem value="system" id="system" className="peer sr-only" />
                     <Label
                       htmlFor="system"
                       className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                     >
                       {/* TODO: Add System theme icon (e.g., Laptop) */}
                       System
                     </Label>
                   </div>
                 </RadioGroup>
               </div>

               {/* TODO: Add Color Scheme Selection */}

             </div>
          </TabsContent>

          {/* Widgets Tab Content */}
          <TabsContent value="widgets">
             <div className="grid gap-4">
               <h3 className="text-sm font-medium text-foreground">Widget Visibility</h3>
               <p className="text-sm text-muted-foreground mb-4">
                 Choose which widgets appear on your dashboard.
               </p>
               {/* Add Search Input */}
               <div className="mb-4">
                 <Label htmlFor="widget-search" className="sr-only">Search Widgets</Label>
                 <Input 
                   id="widget-search"
                   type="text"
                   placeholder="Search widgets..."
                   value={widgetSearchTerm}
                   onChange={(e) => setWidgetSearchTerm(e.target.value)}
                   className="w-full"
                 />
               </div>

               <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2"> {/* Added max-height and overflow */}
                 {/* Map over FILTERED widgets */}
                 {filteredWidgets.length > 0 ? (
                   filteredWidgets.map((widget) => (
                    <div key={widget.id} className="flex items-center justify-between space-x-2 py-2 border-b last:border-b-0">
                      <Label htmlFor={`widget-toggle-${widget.id}`} className="flex flex-col space-y-1">
                        <span>{widget.name}</span>
                      </Label>
                      <Switch
                        id={`widget-toggle-${widget.id}`}
                        checked={widget.visible}
                        onCheckedChange={(checked) => onWidgetVisibilityChange(widget.id, checked)}
                      />
                    </div>
                  ))
                 ) : (
                   <p className="text-sm text-muted-foreground italic">
                     {widgets.length > 0 ? "No widgets match your search." : "No configurable widgets found."}
                   </p>
                 )}
               </div>
            </div>
          </TabsContent>

        </Tabs>

        {/* Updated Footer with Preview Button */} 
        <SheetFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-6">
          {/* Cancel Button - Uses SheetClose which triggers onOpenChange(false) */}
          <SheetClose asChild>
            <Button 
              variant="outline" 
              disabled={isSaving} 
              className="w-full sm:w-auto"
              onClick={() => {
                // Explicitly handle revert if previewing when cancel is clicked
                if (isPreviewing) handleRevertPreview();
              }}
            >
              {isPreviewing ? "Cancel Preview" : "Cancel"}
            </Button>
          </SheetClose>
          
          {/* Preview Button */} 
          <Button 
             variant="secondary" 
             onClick={handlePreview} 
             disabled={isSaving || isPreviewing || !hasUnsavedChanges} 
             className="w-full sm:w-auto"
          >
             Preview Changes
          </Button>
          
          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={isSaving || (!hasUnsavedChanges && !isPreviewing)} // Disable if no changes or saving
            className="w-full sm:w-auto"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
} 