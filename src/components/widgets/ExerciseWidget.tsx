import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Grip, Plus, BarChart, Activity, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import ResizableWidget from "@/components/ResizableWidget";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { exerciseConfigSchema } from "./exerciseConfigSchema";
import { WidgetConfigPanel } from "@/components/WidgetConfigPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem("exerciseWidgetConfig") : null;
    if (saved) return JSON.parse(saved);
    const defaults: Record<string, any> = {};
    exerciseConfigSchema.fields.forEach(f => (defaults[f.name] = f.default));
    return defaults;
  });
  useEffect(() => {
    localStorage.setItem("exerciseWidgetConfig", JSON.stringify(config));
  }, [config]);
  const handleConfigChange = (name: string, value: any) => {
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div ref={setNodeRef} style={style} className="h-full">
      <ResizableWidget color={config.themeColor || color} minSize={15} defaultSize={30}>
        <Card className="h-full flex flex-col">
          <CardContent className="flex flex-col h-full">
            {/* Unified Header Bar */}
            <div className="flex items-center justify-between w-full px-2 py-2 border-b mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-6 w-6 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-transparent bg-clip-text" />
                <span className="font-poppins font-semibold text-lg">{title || 'Exercise'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" aria-label="Settings" onClick={() => setIsConfigOpen(true)}>
                  <Settings className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-grab"
                  {...attributes}
                  {...listeners}
                  aria-label="Move widget"
                >
                  <Grip size={16} />
                </Button>
              </div>
            </div>
            {/* Session Timer Controls, Tabs, Exercise List, etc. */}
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
                <Button
                  key={ex}
                  size="sm"
                  variant="secondary"
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  onClick={() => quickAddExercise(ex)}
                >
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
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>

            {/* Exercise form */}
            <form onSubmit={addExercise} className="flex gap-2 mb-4">
              <Input
                placeholder="Exercise name"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-background mb-0 text-foreground"
              />
              <Input
                type="number"
                placeholder="Minutes"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-24 rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-background mb-0 text-foreground"
                min="1"
              />
              <Button type="submit" size="icon" variant="default" className="rounded-full ml-2">
                <Plus size={16} />
                <span className="sr-only">Add exercise</span>
              </Button>
            </form>

            {/* Exercise list */}
            <div className="flex-1 min-h-0 space-y-2 overflow-y-auto pr-1">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className={cn(
                    "bg-white rounded-lg shadow-sm flex items-center justify-between px-3 py-2 gap-2 mb-2",
                    exercise.completed ? "opacity-70" : "!opacity-100"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "rounded-full border border-gray-200",
                        exercise.completed
                          ? "bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-white"
                          : "text-gray-400"
                      )}
                      onClick={() => toggleExercise(exercise.id)}
                      aria-label="Toggle exercise"
                    >
                      <Activity size={16} />
                    </Button>
                    <span
                      style={
                        exercise.completed
                          ? undefined
                          : { color: '#111', opacity: 1 }
                      }
                      className={cn(
                        exercise.completed
                          ? "text-sm font-medium text-[#888] dark:text-[#adb5bd] line-through"
                          : "text-sm font-medium"
                      )}
                    >
                      {exercise.name} ({exercise.duration} min)
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Time Footer (was in CardFooter) */}
            <div className="w-full flex items-center justify-between text-sm bg-muted/20 border-t border-border/40 mt-4 pt-2">
              <div className="flex items-center gap-2">
                <BarChart size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">Total Time</span>
              </div>
              <div className="font-medium">
                {totalMinutes} minutes
              </div>
            </div>

            {/* Statistics/Charts Area (in TabsContent value="stats") */}
            <Tabs value={tab} onValueChange={(value) => setTab(value as 'log' | 'stats')} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="log">Log</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
              </TabsList>
              <TabsContent value="log">
                {/* ...log content remains unchanged... */}
              </TabsContent>
              <TabsContent value="stats">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center gap-1 text-center">
                      <div className="font-semibold text-sm mb-1">Personal Record</div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-transparent bg-clip-text">{personalRecord} min</div>
                      <div className="text-xs text-muted-foreground">Longest single exercise</div>
                    </div>
                    <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center gap-1 text-center">
                      <div className="font-semibold text-sm mb-1">Total Duration</div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-transparent bg-clip-text">{totalDuration} min</div>
                      <div className="text-xs text-muted-foreground">All exercises</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg shadow-sm p-4 mb-2">
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
                  <div className="bg-gray-50 rounded-lg shadow-sm p-4 mb-2">
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
          </CardContent>
        </Card>
      </ResizableWidget>
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exercise Widget Settings</DialogTitle>
          </DialogHeader>
          <WidgetConfigPanel
            schema={exerciseConfigSchema}
            values={config}
            onChange={handleConfigChange}
          />
          <div className="flex justify-end mt-4">
            <Button onClick={() => setIsConfigOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExerciseWidget;
