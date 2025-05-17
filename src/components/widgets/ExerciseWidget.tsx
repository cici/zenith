import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Grip, Plus, BarChart, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import ResizableWidget from "@/components/ResizableWidget";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
  
  // 1. Add common exercises for quick entry
  const COMMON_EXERCISES = [
    "Running",
    "Cycling",
    "Bench Press",
    "Squats",
    "Deadlift",
    "Yoga",
    "Swimming",
  ];

  // 2. Store previous session for duplication
  const [previousSession, setPreviousSession] = useState<Exercise[]>([]);

  // 3. Timer state
  const [sessionTimer, setSessionTimer] = useState(0); // seconds
  const [timerActive, setTimerActive] = useState(false);
  const [restTimer, setRestTimer] = useState(0); // seconds
  const [restActive, setRestActive] = useState(false);

  // 4. Effect for session timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive) {
      interval = setInterval(() => setSessionTimer((t) => t + 1), 1000);
    } else if (!timerActive && sessionTimer !== 0) {
      if (interval) clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [timerActive]);

  // 5. Effect for rest timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (restActive) {
      interval = setInterval(() => setRestTimer((t) => t + 1), 1000);
    } else if (!restActive && restTimer !== 0) {
      if (interval) clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [restActive]);

  // 6. Improved addExercise with validation
  const addExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName.trim()) return;
    if (!/^[1-9][0-9]*$/.test(duration)) return; // duration must be positive integer
    if (exercises.some((ex) => ex.name.toLowerCase() === exerciseName.trim().toLowerCase())) return; // prevent duplicate names
    const exercise = {
      id: Date.now().toString(),
      name: exerciseName.trim(),
      duration: parseInt(duration) || 30,
      completed: false,
    };
    setExercises([...exercises, exercise]);
    setExerciseName("");
    setDuration("30");
  };

  // 7. Quick-add handler
  const quickAddExercise = (name: string) => {
    if (exercises.some((ex) => ex.name.toLowerCase() === name.toLowerCase())) return;
    const exercise = {
      id: Date.now().toString(),
      name,
      duration: 30,
      completed: false,
    };
    setExercises([...exercises, exercise]);
  };

  // 8. Duplicate last workout
  const duplicateLastWorkout = () => {
    if (previousSession.length > 0) {
      setExercises(previousSession.map((ex) => ({ ...ex, id: Date.now().toString() + Math.random() })));
    }
  };

  // 9. Save current session as previous on change
  useEffect(() => {
    if (exercises.length > 0) setPreviousSession(exercises);
  }, [exercises]);
  
  const toggleExercise = (id: string) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === id ? { ...ex, completed: !ex.completed } : ex
      )
    );
  };
  
  const [tab, setTab] = useState<'log' | 'stats'>('log');

  // Aggregate data for statistics
  const sessionsByDay: Record<string, number> = {};
  const durationByDay: Record<string, number> = {};
  exercises.forEach((ex) => {
    // For demo, use today as the date for all
    const date = new Date().toLocaleDateString();
    sessionsByDay[date] = (sessionsByDay[date] || 0) + 1;
    durationByDay[date] = (durationByDay[date] || 0) + ex.duration;
  });
  const frequencyData = Object.keys(sessionsByDay).map((date) => ({ date, sessions: sessionsByDay[date] }));
  const durationData = Object.keys(durationByDay).map((date) => ({ date, duration: durationByDay[date] }));
  const personalRecord = exercises.length > 0 ? Math.max(...exercises.map((ex) => ex.duration)) : 0;
  const mostExercises = exercises.length;
  const totalDuration = exercises.reduce((acc, ex) => acc + ex.duration, 0);

  return (
    <div ref={setNodeRef} style={style}>
      <ResizableWidget color={color} minSize={15} defaultSize={30}>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div />
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
        
        <Tabs value={tab} onValueChange={(value) => setTab(value as 'log' | 'stats')} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="log">Log</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>
          <TabsContent value="log">
            <CardContent className="space-y-4">
              {/* Session Timer Controls */}
              <div className="flex items-center gap-2 mb-2">
                <Button size="sm" variant={timerActive ? "default" : "outline"} onClick={() => setTimerActive((a) => !a)}>
                  {timerActive ? "Pause" : "Start"} Session
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setSessionTimer(0); setTimerActive(false); }}>
                  Reset
                </Button>
                <span className="ml-2 text-muted-foreground text-xs">Session Time: {Math.floor(sessionTimer / 60)}:{(sessionTimer % 60).toString().padStart(2, '0')}</span>
              </div>

              {/* Rest Timer Controls */}
              <div className="flex items-center gap-2 mb-2">
                <Button size="sm" variant={restActive ? "default" : "outline"} onClick={() => setRestActive((a) => !a)}>
                  {restActive ? "Pause" : "Start"} Rest
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setRestTimer(0); setRestActive(false); }}>
                  Reset
                </Button>
                <span className="ml-2 text-muted-foreground text-xs">Rest Time: {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}</span>
              </div>

              {/* Quick-entry for common exercises */}
              <div className="flex flex-wrap gap-2 mb-2">
                {COMMON_EXERCISES.map((ex) => (
                  <Button key={ex} size="sm" variant="secondary" onClick={() => quickAddExercise(ex)}>
                    {ex}
                  </Button>
                ))}
              </div>

              {/* Duplicate last workout */}
              <div className="mb-2">
                <Button size="sm" variant="outline" onClick={duplicateLastWorkout} disabled={previousSession.length === 0}>
                  Duplicate Last Workout
                </Button>
              </div>

              {/* Progress bar and percentage */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>

              {/* Exercise form */}
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

              {/* Exercise list */}
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
          </TabsContent>
          <TabsContent value="stats">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="font-semibold text-sm mb-1">Personal Record</div>
                  <div className="text-2xl font-bold">{personalRecord} min</div>
                  <div className="text-xs text-muted-foreground">Longest single exercise</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="font-semibold text-sm mb-1">Total Duration</div>
                  <div className="text-2xl font-bold">{totalDuration} min</div>
                  <div className="text-xs text-muted-foreground">All exercises</div>
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="font-semibold text-sm mb-2">Workout Frequency</div>
                <ResponsiveContainer width="100%" height={180}>
                  <RechartsBarChart data={frequencyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="sessions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="font-semibold text-sm mb-2">Total Duration per Day</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={durationData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="duration" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
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
