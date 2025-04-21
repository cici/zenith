
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
  defaultSize = 50, // Increased from 30 to 50
  color = "bg-card",
  className 
}: ResizableWidgetProps) => {
  return (
    <ResizablePanelGroup 
      direction="vertical" 
      className={cn("min-h-[300px] max-h-[1000px]", className)} // Increased min-height and max-height
    >
      <ResizablePanel 
        defaultSize={defaultSize}
        minSize={minSize}
        className="transition-all duration-200 ease-in-out"
      >
        <Card className={cn("h-full shadow-md overflow-y-auto", color)}>
          {children}
        </Card>
      </ResizablePanel>
      <ResizableHandle 
        withHandle 
        className="h-3 bg-transparent hover:bg-primary/10" // Made handle slightly taller for easier grabbing
      />
      <ResizablePanel defaultSize={20} minSize={5} maxSize={70} className="h-0" /> {/* Increased from 5 to allow more resizing space */}
    </ResizablePanelGroup>
  );
};

export default ResizableWidget;
