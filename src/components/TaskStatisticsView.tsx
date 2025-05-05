import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTimer } from '@/contexts/TimerContext';
import { useTodos } from '@/contexts/TodoContext';
import { formatDuration, getFormattedTotalTime } from '@/utils/timeUtils';
import { Clock, CheckCircle2, PieChart, BarChart3 } from 'lucide-react';

export interface TaskStatisticsViewProps {
  className?: string;
  dateRange?: 'today' | 'week' | 'month' | 'all';
}

export function TaskStatisticsView({ className, dateRange = 'today' }: TaskStatisticsViewProps) {
  const { state, getSessionData, getSessionStats } = useTimer();
  const { todos } = useTodos();
  const [activeDateRange, setActiveDateRange] = useState<'today' | 'week' | 'month' | 'all'>(dateRange);
  const [taskTitles, setTaskTitles] = useState<{[key: string]: string}>({});
  const sessionData = getSessionData();
  
  // Get date range for statistics
  const getDateRange = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (activeDateRange) {
      case 'week': {
        // Get start of this week (Sunday)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return {
          start: startOfWeek.toISOString().split('T')[0],
          end: todayStr
        };
      }
      case 'month': {
        // Get start of this month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          start: startOfMonth.toISOString().split('T')[0],
          end: todayStr
        };
      }
      case 'all':
        // Return past year for 'all'
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        return {
          start: oneYearAgo.toISOString().split('T')[0],
          end: todayStr
        };
      case 'today':
      default:
        return {
          start: todayStr,
          end: todayStr
        };
    }
  };
  
  // Load task titles for IDs
  useEffect(() => {
    const titleMap: {[key: string]: string} = {};
    
    // First, get any titles from current session data
    if (sessionData?.taskTimeMap) {
      // Initialize with current associated task if any
      if (state.associatedTask) {
        titleMap[state.associatedTask.id] = state.associatedTask.title;
      }
      
      // Then add any task titles from the todo list
      todos.forEach(todo => {
        titleMap[todo.id] = todo.title;
      });
    }
    
    setTaskTitles(titleMap);
  }, [todos, sessionData, state.associatedTask]);
  
  const stats = getSessionStats(getDateRange());
  
  // Calculate total focus time
  const totalFocusTime = sessionData ? sessionData.totalWorkTime : 0;
  
  // Format task name for display
  const getTaskName = (taskId: string): string => {
    return taskTitles[taskId] || `Task ${taskId.slice(0, 6)}...`;
  };
  
  // Sort task distribution by time spent
  const sortedTaskDistribution = stats.taskDistribution 
    ? Object.entries(stats.taskDistribution)
        .sort(([, a], [, b]) => b.timeSpent - a.timeSpent)
    : [];
    
  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Task Statistics</h2>
          <Select 
            value={activeDateRange} 
            onValueChange={(value) => setActiveDateRange(value as any)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <CheckCircle2 className="h-8 w-8 mb-2 text-primary" />
              <div className="text-3xl font-bold">
                {stats.totalSessions}
              </div>
              <div className="text-sm text-muted-foreground text-center">
                Completed Pomodoros
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <Clock className="h-8 w-8 mb-2 text-primary" />
              <div className="text-3xl font-bold">
                {Math.round(stats.totalTime / 3600)}h
              </div>
              <div className="text-sm text-muted-foreground text-center">
                Total Focus Time
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="tasks">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="tasks">
              <PieChart className="h-4 w-4 mr-2" />
              Task Breakdown
            </TabsTrigger>
            <TabsTrigger value="distribution">
              <BarChart3 className="h-4 w-4 mr-2" />
              Time Distribution
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks" className="space-y-4 mt-4">
            {sortedTaskDistribution.length > 0 ? (
              <div className="space-y-3">
                {sortedTaskDistribution.map(([taskId, { timeSpent, percentage }]) => (
                  <div key={taskId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate max-w-[200px]">{getTaskName(taskId)}</span>
                      <span className="text-muted-foreground">
                        {formatDuration(timeSpent)} ({Math.round(percentage)}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${Math.round(percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <p>No task data available for this period.</p>
                <p className="text-sm mt-1">Associate tasks with your pomodoro sessions to see statistics.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="distribution" className="mt-4">
            <div className="text-center p-8 text-muted-foreground">
              <p>Detailed time distribution coming soon!</p>
              <p className="text-sm mt-1">This feature is under development.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 