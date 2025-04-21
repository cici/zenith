
import React, { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";

interface ResizableWidgetProps {
  children: ReactNode;
  minSize?: number;
  defaultSize?: number;
  color?: string;
  className?: string;
}

const ResizableWidget = ({ 
  children, 
  minSize = 20, 
  defaultSize = 50,
  color = "bg-card",
  className 
}: ResizableWidgetProps) => {
  return (
    <ResizablePanelGroup 
      direction="vertical" 
      className={cn("min-h-[300px] max-h-[1500px]", className)} // Increased max-height to 1500px
    >
      <ResizablePanel 
        defaultSize={defaultSize}
        minSize={minSize}
        maxSize={95} // Added explicit maxSize to allow larger expansion
        className="transition-all duration-200 ease-in-out"
      >
        <Card className={cn("h-full shadow-md overflow-y-auto", color)}>
          {children}
        </Card>
      </ResizablePanel>
      <ResizableHandle 
        withHandle 
        className="h-4 bg-transparent hover:bg-primary/10" // Increased handle height for better usability
      />
      <ResizablePanel defaultSize={20} minSize={5} maxSize={5} className="h-0" /> {/* Set small maxSize to ensure more space for content panel */}
    </ResizablePanelGroup>
  );
};

export default ResizableWidget;
