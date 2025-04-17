
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, Plus, Settings, Activity } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type Exercise = {
  id: string;
  type: string;
  duration: number;
  date: string;
};

type ExerciseWidgetProps = {
  id: string;
  title: string;
};

const EXERCISE_TYPES = ["Running", "Cycling", "Swimming", "Weight Training", "Yoga", "Walking"];

const ExerciseWidget = ({ id, title }: ExerciseWidgetProps) => {
  const [exercises, setExercises] = useState<Exercise[]>([
    { id: '1', type: 'Running', duration: 30, date: '2025-04-14' },
    { id: '2', type: 'Cycling', duration: 45, date: '2025-04-15' },
    { id: '3', type: 'Weight Training', duration: 60, date: '2025-04-16' },
    { id: '4', type: 'Running', duration: 35, date: '2025-04-17' },
  ]);

  const [newExercise, setNewExercise] = useState({
    type: '',
    duration: '',
  });

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const addExercise = () => {
    if (newExercise.type && newExercise.duration) {
      const exercise = {
        id: Date.now().toString(),
        type: newExercise.type,
        duration: parseInt(newExercise.duration),
        date: format(new Date(), 'yyyy-MM-dd'),
      };
      
      setExercises([...exercises, exercise]);
      setNewExercise({ type: '', duration: '' });
    }
  };

  // Prepare chart data - Last 7 days
  const chartData = exercises
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7)
    .map(exercise => ({
      date: format(new Date(exercise.date), 'MMM dd'),
      minutes: exercise.duration
    }));

  // Calculate total minutes for the week
  const totalMinutes = exercises.reduce((total, exercise) => total + exercise.duration, 0);
  const averageMinutes = exercises.length > 0 ? Math.round(totalMinutes / exercises.length) : 0;

  return (
    <Card ref={setNodeRef} style={style} className="shadow-md">
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <div className="flex items-center">
          <div {...attributes} {...listeners} className="cursor-grab mr-2">
            <GripVertical size={16} className="text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <Button variant="ghost" size="icon" title="Widget Settings">
          <Settings size={14} />
        </Button>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <Activity className="mr-2 h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Weekly Activity</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Avg: {averageMinutes} min/day
          </div>
        </div>
        
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderColor: 'hsl(var(--border))',
                  fontSize: '12px',
                  borderRadius: '6px'
                }} 
              />
              <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
          {exercises.slice(-5).reverse().map((exercise) => (
            <div key={exercise.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {format(new Date(exercise.date), 'MMM dd')}
              </span>
              <span>{exercise.type}</span>
              <span className="font-medium">{exercise.duration} min</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addExercise();
          }}
          className="flex w-full gap-2"
        >
          <Select
            value={newExercise.type}
            onValueChange={(value) => setNewExercise({...newExercise, type: value})}
          >
            <SelectTrigger className="flex-grow text-sm">
              <SelectValue placeholder="Exercise type" />
            </SelectTrigger>
            <SelectContent>
              {EXERCISE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min="1"
            value={newExercise.duration}
            onChange={(e) => setNewExercise({...newExercise, duration: e.target.value})}
            placeholder="Minutes"
            className="w-20 text-sm"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newExercise.type || !newExercise.duration}
          >
            <Plus size={16} />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default ExerciseWidget;
