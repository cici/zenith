
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Grip, Plus, BarChart, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import ResizableWidget from "@/components/ResizableWidget";

interface Exercise {
  id: string;
  name: string;
  duration: number; // in minutes
  completed: boolean;
}

interface ExerciseWidgetProps {
  id: string;
  title: string;
  color?: string;
}

const ExerciseWidget = ({ id, title, color = "bg-card" }: ExerciseWidgetProps) => {
  const [exercises, setExercises] = useState<Exercise[]>([
    { id: "1", name: "Running", duration: 30, completed: true },
    { id: "2", name: "Weightlifting", duration: 45, completed: false },
    { id: "3", name: "Yoga", duration: 20, completed: false },
  ]);
  
  const [exerciseName, setExerciseName] = useState("");
  const [duration, setDuration] = useState("30");
  
  const completedExercises = exercises.filter((ex) => ex.completed).length;
  const completionPercentage = exercises.length > 0 
    ? Math.round((completedExercises / exercises.length) * 100) 
    : 0;
  
  const totalMinutes = exercises.reduce((acc, exercise) => {
    return exercise.completed ? acc + exercise.duration : acc;
  }, 0);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const addExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName.trim()) return;
    
    const exercise = {
      id: Date.now().toString(),
      name: exerciseName,
      duration: parseInt(duration) || 30,
      completed: false,
    };
    
    setExercises([...exercises, exercise]);
    setExerciseName("");
    setDuration("30");
  };
  
  const toggleExercise = (id: string) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === id ? { ...ex, completed: !ex.completed } : ex
      )
    );
  };
  
  return (
    <div ref={setNodeRef} style={style}>
      <ResizableWidget color={color} minSize={15} defaultSize={30}>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="cursor-grab"
            {...attributes}
            {...listeners}
          >
            <Grip size={16} />
            <span className="sr-only">Move widget</span>
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
          
          <form onSubmit={addExercise} className="grid gap-2">
            <Input
              placeholder="Exercise name"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              className="bg-background/50"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Minutes"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-background/50"
                min="1"
              />
              <Button type="submit" className="shrink-0 bg-primary/90 hover:bg-primary">
                <Plus size={16} />
                <span className="sr-only">Add exercise</span>
              </Button>
            </div>
          </form>
          
          <div className="space-y-1">
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <Button
                    variant={exercise.completed ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-6 w-6 p-0 rounded-full",
                      exercise.completed ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    )}
                    onClick={() => toggleExercise(exercise.id)}
                  >
                    <Activity size={12} />
                    <span className="sr-only">Toggle exercise</span>
                  </Button>
                  <span
                    className={cn(
                      "text-sm",
                      exercise.completed && "text-muted-foreground"
                    )}
                  >
                    {exercise.name} ({exercise.duration} min)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        
        <CardFooter className="bg-muted/20 border-t border-border/40">
          <div className="w-full flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <BarChart size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground">Total Time</span>
            </div>
            <div className="font-medium">
              {totalMinutes} minutes
            </div>
          </div>
        </CardFooter>
      </ResizableWidget>
    </div>
  );
};

export default ExerciseWidget;
