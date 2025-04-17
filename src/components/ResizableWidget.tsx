
import React, { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
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
  defaultSize = 30, 
  color = "bg-card",
  className 
}: ResizableWidgetProps) => {
  return (
    <ResizablePanel 
      defaultSize={defaultSize}
      minSize={minSize}
      className={cn("transition-all duration-200 ease-in-out", className)}
    >
      <Card className={cn("h-full shadow-md", color)}>
        {children}
      </Card>
      <ResizableHandle withHandle className="h-2" />
    </ResizablePanel>
  );
};

export default ResizableWidget;
