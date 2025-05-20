import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { widgets } from "@/data/widgets";

type AddWidgetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddWidget: (type: string) => void;
};

const WIDGETS_PER_PAGE = 8;

const AddWidgetDialog = ({ open, onOpenChange, onAddWidget }: AddWidgetDialogProps) => {
  const [visibleCount, setVisibleCount] = useState(WIDGETS_PER_PAGE);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + WIDGETS_PER_PAGE);
  };

  const visibleWidgets = widgets.slice(0, visibleCount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {visibleWidgets.map((widget) => (
            <Button
              key={widget.id}
              variant="outline"
              className="h-auto w-full flex-col items-center justify-start p-4 gap-2 hover:bg-accent text-center"
              onClick={() => onAddWidget(widget.id)}
            >
              <div className="rounded-full bg-primary/10 p-2">
                {widget.icon && React.createElement(widget.icon, { className: "h-8 w-8 text-primary" })}
              </div>
              <div className="font-medium">{widget.name}</div>
              <div className="text-xs text-muted-foreground text-center break-words whitespace-normal">
                {widget.description}
              </div>
            </Button>
          ))}
        </div>
        {visibleCount < widgets.length && (
          <div className="flex justify-center mt-4">
            <Button
              onClick={handleLoadMore}
              aria-label="Load more widgets"
              className="px-6 py-2"
            >
              Load More
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddWidgetDialog;
