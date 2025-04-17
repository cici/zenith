
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ListChecks, Activity } from "lucide-react";

type AddWidgetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddWidget: (type: string) => void;
};

const AddWidgetDialog = ({ open, onOpenChange, onAddWidget }: AddWidgetDialogProps) => {
  const widgetOptions = [
    {
      type: "todo",
      title: "To-Do List",
      description: "Keep track of tasks and to-dos with checkboxes.",
      icon: <ListChecks className="h-8 w-8 text-primary" />,
    },
    {
      type: "exercise",
      title: "Exercise Tracking",
      description: "Log your workouts and track your fitness progress.",
      icon: <Activity className="h-8 w-8 text-primary" />,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {widgetOptions.map((widget) => (
            <Button
              key={widget.type}
              variant="outline"
              className="h-auto flex-col items-center justify-start p-4 gap-2 hover:bg-accent"
              onClick={() => onAddWidget(widget.type)}
            >
              <div className="rounded-full bg-primary/10 p-2">{widget.icon}</div>
              <div className="font-medium">{widget.title}</div>
              <div className="text-xs text-muted-foreground text-center">
                {widget.description}
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddWidgetDialog;
