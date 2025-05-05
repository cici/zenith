import React, { useMemo, useState } from "react";
import { useTodos } from "@/contexts/TodoContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { format as formatDate, isAfter, isBefore, parseISO, addDays, subDays, isSameDay, startOfWeek, endOfWeek, differenceInDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  DownloadIcon,
  FilterIcon,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper function to get priority label
function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 1: return 'High';
    case 2: return 'Medium';
    case 3: return 'Low';
    default: return 'Unknown';
  }
}

interface StatisticsDashboardProps {
  className?: string;
}

export const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({ className }) => {
  const { todos } = useTodos();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  
  // Calculate metrics
  const metrics = useMemo(() => {
    const totalTasks = todos.length;
    const completedTasks = todos.filter(todo => todo.completed).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdueTasks = todos.filter(todo => {
      if (!todo.due_date || todo.completed) return false;
      const dueDate = parseISO(todo.due_date);
      return isBefore(dueDate, today);
    });
    
    const upcomingDeadlines = todos.filter(todo => {
      if (!todo.due_date || todo.completed) return false;
      const dueDate = parseISO(todo.due_date);
      const nextWeek = addDays(today, 7);
      return isBefore(dueDate, nextWeek) && !isBefore(dueDate, today);
    });
    
    // Group by priority
    const priorityDistribution = todos.reduce((acc, todo) => {
      const priority = todo.priority || 3; // Default to low priority
      const priorityLabel = getPriorityLabel(priority);
      
      if (!acc[priorityLabel]) {
        acc[priorityLabel] = 0;
      }
      acc[priorityLabel]++;
      return acc;
    }, {} as Record<string, number>);
    
    // Group by completion status
    const statusDistribution = [
      { name: 'Completed', value: completedTasks },
      { name: 'Active', value: totalTasks - completedTasks }
    ];
    
    // Generate time-series data for productivity trends
    let timeRangeStart: Date;
    let timeRangeEnd: Date = new Date();
    
    // Determine date range based on selected timeRange
    switch(timeRange) {
      case 'week':
        timeRangeStart = startOfWeek(today);
        timeRangeEnd = endOfWeek(today);
        break;
      case 'month':
        timeRangeStart = startOfMonth(today);
        timeRangeEnd = endOfMonth(today);
        break;
      case 'all':
      default:
        // Find the earliest creation date among all todos or default to 30 days ago
        timeRangeStart = todos.reduce((earliest, todo) => {
          const createdAt = new Date(todo.created_at);
          return createdAt < earliest ? createdAt : earliest;
        }, subDays(today, 30));
        break;
    }
    
    // Generate date range array
    const dateRange: Date[] = [];
    const dayCount = differenceInDays(timeRangeEnd, timeRangeStart) + 1;
    
    for (let i = 0; i < dayCount; i++) {
      dateRange.push(addDays(new Date(timeRangeStart), i));
    }
    
    // Create productivity data
    const productivityData = dateRange.map(date => {
      // Tasks completed on this date
      const completedOnDate = todos.filter(todo => {
        // This is an approximation since we don't have a "completed_at" field
        // In a real app, you'd track when a task was completed
        return todo.completed && 
               todo.created_at && 
               isWithinInterval(new Date(todo.created_at), {
                 start: startOfWeek(date),
                 end: endOfWeek(date)
               });
      }).length;
      
      // Tasks created on this date
      const createdOnDate = todos.filter(todo => {
        return todo.created_at && isSameDay(new Date(todo.created_at), date);
      }).length;
      
      return {
        date: formatDate(date, 'MMM dd'),
        completed: completedOnDate,
        created: createdOnDate,
        fullDate: date
      };
    });
    
    return {
      totalTasks,
      completedTasks,
      completionRate: completionRate.toFixed(0),
      overdueTasks: overdueTasks.length,
      upcomingDeadlines: upcomingDeadlines.length,
      priorityDistribution: Object.entries(priorityDistribution).map(([name, value]) => ({ name, value })),
      statusDistribution,
      productivityData
    };
  }, [todos, timeRange]);
  
  // Function to export data
  const exportData = (exportFormat: 'csv' | 'json') => {
    let dataStr: string;
    let fileName: string;
    
    if (exportFormat === 'json') {
      dataStr = JSON.stringify(todos, null, 2);
      const formattedDate = formatDate(new Date(), 'yyyy-MM-dd');
      fileName = `todo-data-${formattedDate}.json`;
    } else {
      // Create CSV data
      const headers = ['ID', 'Title', 'Description', 'Due Date', 'Priority', 'Status', 'Created At', 'Tags'];
      const csvRows = [headers.join(',')];
      
      todos.forEach(todo => {
        const tags = todo.tags ? `"${todo.tags.join(', ')}"` : '';
        const description = todo.description ? `"${todo.description.replace(/"/g, '""')}"` : '';
        const row = [
          todo.id,
          `"${todo.title.replace(/"/g, '""')}"`,
          description,
          todo.due_date || '',
          todo.priority || '',
          todo.completed ? 'Completed' : 'Active',
          todo.created_at,
          tags
        ];
        csvRows.push(row.join(','));
      });
      
      dataStr = csvRows.join('\n');
      const formattedDate = formatDate(new Date(), 'yyyy-MM-dd');
      fileName = `todo-data-${formattedDate}.csv`;
    }
    
    // Create a download link and trigger it
    const downloadLink = document.createElement('a');
    const blob = new Blob([dataStr], { type: exportFormat === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };
  
  // Colors for charts - matching the theme colors used in TodoWidget
  const PRIORITY_COLORS = {
    High: '#ef4444',
    Medium: '#f59e0b',
    Low: '#22c55e'
  };
  
  const STATUS_COLORS = ['#22c55e', '#64748b'];
  
  if (todos.length === 0) {
    return (
      <CardContent className="px-2 sm:px-4">
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No tasks available to display statistics</p>
        </div>
      </CardContent>
    );
  }
  
  return (
    <CardContent className="px-2 sm:px-4">
      <div className="flex justify-between items-center mb-4">
        <Tabs defaultValue="overview" className="w-full">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Productivity Trends</TabsTrigger>
            </TabsList>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => exportData('csv')}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportData('json')}>
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-background/50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Completion Rate</h3>
                <p className="text-2xl font-bold">{metrics.completionRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.completedTasks} of {metrics.totalTasks} tasks completed
                </p>
              </div>
              
              <div className="bg-background/50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Overdue Tasks</h3>
                <p className="text-2xl font-bold text-red-500">{metrics.overdueTasks}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tasks past their due date
                </p>
              </div>
              
              <div className="bg-background/50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Upcoming Deadlines</h3>
                <p className="text-2xl font-bold text-amber-500">{metrics.upcomingDeadlines}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tasks due in the next 7 days
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Priority Distribution */}
              <div className="h-[240px] bg-background/50 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Tasks by Priority</h3>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart
                    data={metrics.priorityDistribution}
                    margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip 
                      formatter={(value: number) => [`${value} task${value !== 1 ? 's' : ''}`, 'Count']}
                    />
                    <Bar dataKey="value" name="Tasks">
                      {metrics.priorityDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={PRIORITY_COLORS[entry.name as keyof typeof PRIORITY_COLORS] || '#888'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Completion Status */}
              <div className="h-[240px] bg-background/50 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Completion Status</h3>
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie
                      data={metrics.statusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {metrics.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value} task${value !== 1 ? 's' : ''}`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="trends" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium">Productivity Trends</h3>
              <Select 
                value={timeRange} 
                onValueChange={(value) => setTimeRange(value as 'week' | 'month' | 'all')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-background/50 p-4 rounded-lg h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={metrics.productivityData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      const formattedName = name === 'completed' ? 'Completed' : 'Created';
                      return [`${value} task${value !== 1 ? 's' : ''}`, formattedName];
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    name="Completed" 
                    stroke="#22c55e" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="created" 
                    name="Created" 
                    stroke="#3b82f6" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-background/50 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Weekly Completion Rate</h3>
                <p className="text-4xl font-bold">{metrics.completionRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on tasks created and completed within selected time period
                </p>
              </div>
              
              <div className="bg-background/50 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Task Velocity</h3>
                <div className="flex items-end gap-1">
                  <p className="text-4xl font-bold">{(metrics.completedTasks / Math.max(1, metrics.productivityData.length)).toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground mb-1">tasks/day</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average number of tasks completed per day
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </CardContent>
  );
};

export default StatisticsDashboard; 