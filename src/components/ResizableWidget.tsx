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
  id?: string;
  title?: string;
}

const ResizableWidget = ({ 
  children, 
  minSize = 20, 
  defaultSize = 70,
  color = "bg-card",
  className,
  id,
  title 
}: ResizableWidgetProps) => {
  return (
    <ResizablePanelGroup 
      direction="vertical" 
      className={cn("min-h-[450px] max-h-[2000px]", className)}
    >
      <ResizablePanel 
        defaultSize={defaultSize}
        minSize={minSize}
        maxSize={98}
        className="transition-all duration-200 ease-in-out"
      >
        <Card className={cn("h-full shadow-lg overflow-y-auto", color)}>
          {children}
        </Card>
      </ResizablePanel>
      <ResizableHandle 
        withHandle 
        className="h-6 bg-transparent hover:bg-primary/10 cursor-ns-resize"
      />
      <ResizablePanel defaultSize={100 - defaultSize} minSize={2} maxSize={100 - minSize} className="h-0" />
    </ResizablePanelGroup>
  );
};

export default ResizableWidget;