import React from 'react';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton component
import { AlertTriangle, GripVertical, X, Settings as SettingsIcon } from 'lucide-react'; // Import an icon for the error state, GripVertical icon, and X icon, and Settings icon
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";

// Define the props interface for the WidgetContainer
interface WidgetContainerProps {
  children: React.ReactNode; // Content of the widget
  isLoading?: boolean;        // Optional loading state flag
  error?: string;             // Optional error message string
  config?: Record<string, any>; // Optional configuration object for widget-specific settings
  onRemove?: () => void;       // Add this prop
  onSettings?: () => void;     // Add this prop
  allowRemove?: boolean;       // New: controls visibility of remove button
  // Add other common props like isLoading, error, etc., as needed later
}

const WidgetContainer: React.FC<WidgetContainerProps> = ({ children, isLoading = false, error, onRemove, allowRemove = true }) => {
  return (
    <article
      className="widget-container bg-white dark:bg-[#232a36] rounded-2xl shadow-lg text-card-foreground overflow-hidden h-full flex flex-col font-[Poppins] transition-all duration-200"
    >
      {/* Header with Remove Button */}
      <div className="flex justify-end p-2">
        {allowRemove && onRemove && (
          <button
            onClick={onRemove}
            aria-label="Remove widget"
            className="text-gray-400 hover:text-red-500 focus:outline-none"
            tabIndex={0}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      {/* Body (now includes everything, including header/controls, passed as children) */}
      <div className="p-4 flex-grow overflow-auto">
        {error ? (
          <div className="text-destructive flex flex-col items-center justify-center h-full">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p className="text-center font-semibold">Error loading widget</p>
            <p className="text-sm text-center mt-1">{error}</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : (
          children
        )}
      </div>
    </article>
  );
};

export default WidgetContainer; 