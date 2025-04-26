
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
      className={cn("min-h-[400px] max-h-[1500px]", className)}
    >
      <ResizablePanel 
        defaultSize={defaultSize}
        minSize={minSize}
        maxSize={95}
        className="transition-all duration-200 ease-in-out"
      >
        <Card className={cn("h-full shadow-lg overflow-y-auto", color)}>
          {children}
        </Card>
      </ResizablePanel>
      <ResizableHandle 
        withHandle 
        className="h-5 bg-transparent hover:bg-primary/10 cursor-ns-resize"
      />
      <ResizablePanel defaultSize={20} minSize={5} maxSize={5} className="h-0" />
    </ResizablePanelGroup>
  );
};

export default ResizableWidget;
