import React from 'react';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton component
import { AlertTriangle, GripVertical } from 'lucide-react'; // Import an icon for the error state and GripVertical icon

// Define the props interface for the WidgetContainer
interface WidgetContainerProps {
  children: React.ReactNode; // Content of the widget
  title: string;             // Title displayed in the widget header
  isLoading?: boolean;        // Optional loading state flag
  error?: string;             // Optional error message string
  config?: Record<string, any>; // Optional configuration object for widget-specific settings
  // Add other common props like isLoading, error, etc., as needed later
}

const WidgetContainer: React.FC<WidgetContainerProps> = ({ children, title, isLoading = false, error, config }) => {
  // Generate a unique ID for ARIA attributes
  const titleId = `widget-title-${React.useId()}`;

  // Basic structure - will be expanded in subsequent steps (header, body, styling, etc.)
  return (
    <article
      className="widget-container border rounded-lg shadow-md bg-card text-card-foreground overflow-hidden h-full flex flex-col"
      aria-labelledby={titleId} // Associate the article with its title
    >
      {/* Header - Now with drag handle class and icon */}
      <div 
        className="p-4 border-b flex justify-between items-center widget-drag-handle cursor-move" 
        tabIndex={0} // Make the handle focusable for potential keyboard interaction
      >
        {/* Title section */}
        <div className="flex-1 min-w-0 flex items-center space-x-2"> {/* Wrap title and icon */}
          <GripVertical size={18} className="text-muted-foreground flex-shrink-0" /> {/* Add drag icon */}
          {isLoading && !error ? (
            <Skeleton className="h-6 w-3/4" />
          ) : (
            <h2 id={titleId} className="text-lg font-semibold truncate" title={title}>{title}</h2> // Added ID and title attribute
          )}
        </div>
        {/* Controls/Actions section (Placeholder) */}
        <div className="flex items-center space-x-2 ml-4">
          {/* Add optional controls/buttons here later */}
          {/* Example: <Button variant="ghost" size="icon"><Settings size={16} /></Button> */}
        </div>
      </div>

      {/* Body - where the main content resides */}
      <div className="p-4 flex-grow overflow-auto">
        {error ? (
          <div className="text-destructive flex flex-col items-center justify-center h-full">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p className="text-center font-semibold">Error loading widget</p>
            <p className="text-sm text-center mt-1">{error}</p>
            {/* Optionally add a retry button here */}
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/6" />
            {/* Add more skeleton lines or blocks as needed to mimic content shape */}
          </div>
        ) : (
          children
        )}
      </div>

      {/* Footer (optional) can go here (Task 3.2, step 2) */}
      {/* <div className="p-2 border-t text-sm text-muted-foreground">
        Footer content if needed
      </div> */}

      {/* Displaying config for debugging/demonstration - remove later */}
      {/* Removed config display for clarity, can be added back if needed for debugging */}
      {/* {config && (
        <pre className="text-xs p-2 bg-muted text-muted-foreground overflow-x-auto">
          Config: {JSON.stringify(config, null, 2)}
        </pre>
      )} */}
    </article>
  );
};

export default WidgetContainer; 