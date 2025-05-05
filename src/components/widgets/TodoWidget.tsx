import { useState, useEffect, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { 
  Check, Grip, Plus, X, AlertCircle, Loader2, 
  CalendarIcon, TagIcon, Edit, ChevronDown,
  SlidersHorizontal, FilterX, Search, ArrowUpDown,
  ArrowUp, ArrowDown, MoveVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import ResizableWidget from "@/components/ResizableWidget";
import { validateTodo } from "@/utils/todoValidation";
import { Todo } from "@/services/database";
import { useToast } from "@/components/ui/use-toast";
import { useTodos } from "@/contexts/TodoContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Priority utilities
function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 1: return 'High priority';
    case 2: return 'Medium priority';
    case 3: return 'Low priority';
    default: return 'Unknown priority';
  }
}

function getPriorityColor(priority: number): string {
  switch (priority) {
    case 1: return 'text-red-500';
    case 2: return 'text-yellow-500';
    case 3: return 'text-green-500';
    default: return '';
  }
}

function getPriorityBgColor(priority: number): string {
  switch (priority) {
    case 1: return 'bg-red-500/10';
    case 2: return 'bg-yellow-500/10';
    case 3: return 'bg-green-500/10';
    default: return '';
  }
}

// Add due date proximity utility functions
function getDueDateStatus(dateString?: string): 'overdue' | 'today' | 'tomorrow' | 'soon' | 'future' | 'none' {
  if (!dateString) return 'none';
  
  try {
    const dueDate = new Date(dateString);
    const today = new Date();
    
    // Reset hours to compare dates only
    today.setHours(0, 0, 0, 0);
    const dueDateOnly = new Date(dueDate);
    dueDateOnly.setHours(0, 0, 0, 0);
    
    // Calculate difference in days
    const diffTime = dueDateOnly.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'tomorrow';
    if (diffDays <= 3) return 'soon';
    return 'future';
  } catch (err) {
    console.error("Error calculating due date status:", err);
    return 'none';
  }
}

function getDueDateColor(status: 'overdue' | 'today' | 'tomorrow' | 'soon' | 'future' | 'none'): string {
  switch (status) {
    case 'overdue': return 'text-red-500';
    case 'today': return 'text-orange-500';
    case 'tomorrow': return 'text-amber-500';
    case 'soon': return 'text-blue-500';
    case 'future': return 'text-muted-foreground';
    default: return 'text-muted-foreground';
  }
}

function getDueDateBgColor(status: 'overdue' | 'today' | 'tomorrow' | 'soon' | 'future' | 'none'): string {
  switch (status) {
    case 'overdue': return 'bg-red-500/10';
    case 'today': return 'bg-orange-500/10';
    case 'tomorrow': return 'bg-amber-500/10';
    case 'soon': return 'bg-blue-500/10';
    default: return '';
  }
}

function getDueDateLabel(status: 'overdue' | 'today' | 'tomorrow' | 'soon' | 'future' | 'none'): string {
  switch (status) {
    case 'overdue': return 'Overdue';
    case 'today': return 'Due today';
    case 'tomorrow': return 'Due tomorrow';
    case 'soon': return 'Due soon';
    case 'future': return 'Upcoming';
    default: return '';
  }
}

const priorityOptions = [
  { value: 1, label: 'High' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Low' },
];

interface TodoWidgetProps {
  id: string;
  title?: string;
  color?: string;
  userId?: string;
}

// Filter type definitions
interface TodoFilters {
  completionStatus: 'all' | 'completed' | 'active';
  priority: number[] | null;
  dueDateRange: {
    from: Date | null;
    to: Date | null;
  } | null;
  tags: string[] | null;
  searchQuery: string;
}

// Sorting options
type SortField = 'dueDate' | 'priority' | 'title' | 'none';
type SortDirection = 'asc' | 'desc';

interface SortOptions {
  field: SortField;
  direction: SortDirection;
}

// Create a new SortableTaskItem component
const SortableTaskItem = ({ 
  todo, 
  onToggle, 
  onDelete, 
  onEdit,
  getPriorityColor,
  getPriorityLabel,
  formatDueDate
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };
  
  // Get due date status for visual indicators
  const dueDateStatus = todo.due_date ? getDueDateStatus(todo.due_date) : 'none';
  const dueDateColor = getDueDateColor(dueDateStatus);
  const dueDateBgColor = getDueDateBgColor(dueDateStatus);
  const dueDateLabel = getDueDateLabel(dueDateStatus);
  
  // Get priority styles
  const priorityBgColor = todo.priority ? getPriorityBgColor(todo.priority) : '';

  // State to manage the delete confirmation dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col sm:flex-row sm:items-start justify-between py-2 border-b border-border/50 last:border-0",
        dueDateStatus === 'overdue' && "border-l-2 border-l-red-500"
      )}
    >
      <div className="flex items-start gap-2 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground cursor-grab flex-shrink-0 p-0"
          {...attributes}
          {...listeners}
        >
          <MoveVertical size={14} />
          <span className="sr-only">Move task</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-5 w-5 rounded-full p-0 border-[#4D45D6]/50 mt-1 flex-shrink-0",
            todo.completed && "bg-[#4D45D6] text-primary-foreground border-[#4D45D6]"
          )}
          onClick={() => onToggle(todo.id)}
        >
          {todo.completed && <Check size={12} />}
          <span className="sr-only">Toggle todo</span>
        </Button>
        <div className="flex flex-col w-full min-w-0">
          <span
            className={cn(
              "flex-1 font-medium break-words",
              todo.completed && "line-through text-muted-foreground"
            )}
          >
            {todo.title}
          </span>
          
          {todo.description && (
            <span className={cn(
              "text-sm text-muted-foreground break-words",
              todo.completed && "line-through"
            )}>
              {todo.description}
            </span>
          )}
          
          <div className="flex flex-wrap gap-2 mt-1">
            {todo.priority && (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-sm flex items-center",
                getPriorityColor(todo.priority),
                priorityBgColor
              )}>
                <span className="mr-1">●</span>
                {getPriorityLabel(todo.priority)}
              </span>
            )}
            
            {todo.due_date && (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-sm flex items-center",
                dueDateColor,
                dueDateBgColor
              )}>
                <CalendarIcon size={10} className="mr-1" />
                {dueDateLabel && <span className="mr-1 font-medium">{dueDateLabel}:</span>}
                {formatDueDate(todo.due_date)}
              </span>
            )}
          </div>
          
          {todo.tags && todo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {todo.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0 h-5 border-[#4D45D6]/20 bg-[#4D45D6]/5 text-[#4D45D6] max-w-full overflow-hidden text-ellipsis">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-1 mt-2 sm:mt-0 justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-[#4D45D6] hover:bg-[#4D45D6]/10"
          onClick={() => onEdit(todo)}
        >
          <Edit size={14} />
          <span className="sr-only">Edit todo</span>
        </Button>
        
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <X size={14} />
              <span className="sr-only">Delete todo</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the task <span className="font-bold">{todo.title}</span>.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onDelete(todo.id)}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

const TodoWidget = ({ id, title, color = "bg-[#32224A]", userId = "demo-user" }: TodoWidgetProps) => {
  const { todos, loading, error, addTodo, updateTodo, toggleTodo, deleteTodo, reorderTodos } = useTodos();
  const [newTodo, setNewTodo] = useState<Partial<Todo>>({
    title: "",
    description: "",
    priority: 2,
    completed: false,
    tags: [],
  });
  const [expandedForm, setExpandedForm] = useState(false);
  const [todoError, setTodoError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentTag, setCurrentTag] = useState("");
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const { toast } = useToast();
  
  // Filter states
  const [filters, setFilters] = useState<TodoFilters>({
    completionStatus: 'all',
    priority: null,
    dueDateRange: null,
    tags: null,
    searchQuery: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  // Sorting state
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    field: 'none',
    direction: 'asc'
  });
  
  // Add a confirmation state for clearing all filters
  const [showClearFiltersConfirm, setShowClearFiltersConfirm] = useState(false);
  
  // Update available tags when todos change
  useEffect(() => {
    const uniqueTags = new Set<string>();
    todos.forEach(todo => {
      if (todo.tags && todo.tags.length > 0) {
        todo.tags.forEach(tag => uniqueTags.add(tag));
      }
    });
    setAvailableTags(Array.from(uniqueTags).sort());
  }, [todos]);
  
  // Update active filter count
  useEffect(() => {
    let count = 0;
    if (filters.completionStatus !== 'all') count++;
    if (filters.priority && filters.priority.length > 0) count++;
    if (filters.dueDateRange && (filters.dueDateRange.from || filters.dueDateRange.to)) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    setActiveFilterCount(count);
  }, [filters]);
  
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

  // Reset form to default state
  const resetForm = () => {
    setNewTodo({
      title: "",
      description: "",
      priority: 2,
      completed: false,
      tags: [],
    });
    setSelectedDate(undefined);
    setCurrentTag("");
    setExpandedForm(false);
    setTodoError(null);
  };

  // Filter and sort todos based on current filters and sort options
  const filteredTodos = useMemo(() => {
    // First filter todos
    const filtered = todos.filter(todo => {
      // Filter by search query
      if (filters.searchQuery.trim()) {
        const searchLower = filters.searchQuery.toLowerCase().trim();
        const titleMatch = todo.title.toLowerCase().includes(searchLower);
        const descMatch = todo.description ? todo.description.toLowerCase().includes(searchLower) : false;
        if (!titleMatch && !descMatch) return false;
      }
      
      // Filter by completion status
      if (filters.completionStatus === 'completed' && !todo.completed) return false;
      if (filters.completionStatus === 'active' && todo.completed) return false;
      
      // Filter by priority
      if (filters.priority && filters.priority.length > 0) {
        if (!todo.priority || !filters.priority.includes(todo.priority)) return false;
      }
      
      // Filter by due date range
      if (filters.dueDateRange) {
        if (todo.due_date) {
          const dueDate = parseISO(todo.due_date);
          if (filters.dueDateRange.from && isBefore(dueDate, filters.dueDateRange.from)) return false;
          if (filters.dueDateRange.to && isAfter(dueDate, filters.dueDateRange.to)) return false;
        } else if (filters.dueDateRange.from || filters.dueDateRange.to) {
          // If we're filtering by date range and the todo has no due date, exclude it
          return false;
        }
      }
      
      // Filter by tags
      if (filters.tags && filters.tags.length > 0) {
        if (!todo.tags || todo.tags.length === 0) return false;
        // Check if todo has at least one of the selected tags
        if (!todo.tags.some(tag => filters.tags!.includes(tag))) return false;
      }
      
      return true;
    });
    
    // Then sort the filtered todos
    if (sortOptions.field === 'none') return filtered;
    
    return [...filtered].sort((a, b) => {
      const direction = sortOptions.direction === 'asc' ? 1 : -1;
      
      switch (sortOptions.field) {
        case 'dueDate':
          // Handle cases where due date might be undefined
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return direction;
          if (!b.due_date) return -direction;
          
          return direction * (new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
          
        case 'priority':
          // Handle cases where priority might be undefined
          if (!a.priority && !b.priority) return 0;
          if (!a.priority) return direction;
          if (!b.priority) return -direction;
          
          // For priority, higher number means lower priority (3 is lowest, 1 is highest)
          // So we invert the comparison
          return direction * (a.priority - b.priority);
          
        case 'title':
          return direction * a.title.localeCompare(b.title);
          
        default:
          return 0;
      }
    });
  }, [todos, filters, sortOptions]);
  
  // Update the clearFilters function to use the confirmation dialog when there are active filters
  const resetFilters = () => {
    setFilters({
      completionStatus: 'all',
      priority: null,
      dueDateRange: null,
      tags: null,
      searchQuery: ''
    });
    setSortOptions({
      field: 'none',
      direction: 'asc'
    });
  };
  
  // Toggle sort field
  const toggleSort = (field: SortField) => {
    setSortOptions(prev => {
      // If we're already sorting by this field, toggle direction
      if (prev.field === field) {
        return {
          field,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      // Otherwise, start sorting by this field in ascending order
      return {
        field,
        direction: 'asc'
      };
    });
  };
  
  // Get sort icon for a field
  const getSortIcon = (field: SortField) => {
    if (sortOptions.field !== field) return <ArrowUpDown size={14} className="ml-1 opacity-40" />;
    return sortOptions.direction === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-primary" />
      : <ArrowDown size={14} className="ml-1 text-primary" />;
  };

  // Add a tag to the new todo
  const addTag = () => {
    if (!currentTag.trim()) return;
    
    setNewTodo(prev => ({
      ...prev,
      tags: [...(prev.tags || []), currentTag.trim()]
    }));
    setCurrentTag("");
  };

  // Remove a tag from the new todo
  const removeTag = (tagToRemove: string) => {
    setNewTodo(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    }));
  };

  // Add a tag to the editing todo
  const addTagToEdit = () => {
    if (!currentTag.trim() || !editingTodo) return;
    
    setEditingTodo(prev => ({
      ...prev!,
      tags: [...(prev.tags || []), currentTag.trim()]
    }));
    setCurrentTag("");
  };

  // Remove a tag from the editing todo
  const removeTagFromEdit = (tagToRemove: string) => {
    if (!editingTodo) return;
    
    setEditingTodo(prev => ({
      ...prev!,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    setTodoError(null);
    
    // Basic validation
    if (!newTodo.title?.trim()) {
      setTodoError("Task name cannot be empty");
      return;
    }
    
    const todoData: Omit<Todo, 'id' | 'created_at'> = {
      user_id: userId,
      title: newTodo.title.trim(),
      description: newTodo.description?.trim(),
      due_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined,
      priority: newTodo.priority || 2,
      completed: false,
      tags: newTodo.tags,
    };
    
    // Validate the todo using our validation utility
    const validation = validateTodo(todoData);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      setTodoError(firstError);
      return;
    }
    
    // Submit to the API with error handling
    setIsSubmitting(true);
    try {
      const result = await addTodo(todoData);
      if (result) {
        resetForm();
      }
    } catch (err) {
      console.error("Error adding todo:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTodo) return;
    
    // Basic validation
    if (!editingTodo.title?.trim()) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "Task name cannot be empty"
      });
      return;
    }
    
    try {
      await updateTodo(editingTodo.id, {
        title: editingTodo.title.trim(),
        description: editingTodo.description?.trim(),
        due_date: editingTodo.due_date,
        priority: editingTodo.priority,
        tags: editingTodo.tags,
      });
      setEditingTodo(null);
    } catch (err) {
      console.error("Error updating todo:", err);
    }
  };

  const handleToggleTodo = async (id: string) => {
    try {
      await toggleTodo(id);
    } catch (err) {
      console.error("Error toggling todo:", err);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await deleteTodo(id);
    } catch (err) {
      console.error("Error deleting todo:", err);
    }
  };

  // Format the due date for display
  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (err) {
      console.error("Error formatting date:", err);
      return dateString;
    }
  };

  // Add DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Minimum drag distance before activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Find the indices of the dragged item and the drop target
      const activeIndex = filteredTodos.findIndex(todo => todo.id === active.id);
      const overIndex = filteredTodos.findIndex(todo => todo.id === over.id);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        // Get the reordered filtered todos
        const newFilteredTodos = arrayMove(filteredTodos, activeIndex, overIndex);
        
        // Find the indices in the original todos array
        const originalActiveIndex = todos.findIndex(todo => todo.id === active.id);
        const originalOverIndex = todos.findIndex(todo => todo.id === over.id);
        
        if (originalActiveIndex !== -1 && originalOverIndex !== -1) {
          // Create a reordered version of all todos
          const newTodos = arrayMove(todos, originalActiveIndex, originalOverIndex);
          
          // Update the todos order in the context/database
          reorderTodos(newTodos);
          
          // Provide visual feedback
          toast({
            title: "Tasks reordered",
            description: "The task order has been updated.",
            duration: 2000,
          });
        }
      }
    }
  };
  
  // Function to handle edit dialog
  const handleOpenEditDialog = (todo: Todo) => {
    setEditingTodo(todo);
    setCurrentTag("");
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ResizableWidget color={color} minSize={15} defaultSize={35}>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div className="flex-1"></div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 relative",
                    activeFilterCount > 0 && "text-[#4D45D6] bg-[#4D45D6]/10"
                  )}
                >
                  <SlidersHorizontal size={16} />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#4D45D6] text-[10px] flex items-center justify-center text-white">
                      {activeFilterCount}
                    </span>
                  )}
                  <span className="sr-only">Filter tasks</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-[200px] max-w-[95vw] sm:w-56">
                <DropdownMenuLabel>Filter Tasks</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Completion Status Filter */}
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-medium pt-1">Status</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={filters.completionStatus === 'all'}
                    onCheckedChange={() => setFilters(prev => ({ ...prev, completionStatus: 'all' }))}
                  >
                    All
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.completionStatus === 'active'}
                    onCheckedChange={() => setFilters(prev => ({ ...prev, completionStatus: 'active' }))}
                  >
                    Active
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.completionStatus === 'completed'}
                    onCheckedChange={() => setFilters(prev => ({ ...prev, completionStatus: 'completed' }))}
                  >
                    Completed
                  </DropdownMenuCheckboxItem>
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator />
                
                {/* Priority Filter */}
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-medium pt-1">Priority</DropdownMenuLabel>
                  {[1, 2, 3].map(priority => (
                    <DropdownMenuCheckboxItem
                      key={priority}
                      checked={filters.priority?.includes(priority) ?? false}
                      onCheckedChange={(checked) => {
                        setFilters(prev => {
                          const currentPriorities = prev.priority || [];
                          const newPriorities = checked 
                            ? [...currentPriorities, priority] 
                            : currentPriorities.filter(p => p !== priority);
                          
                          return {
                            ...prev,
                            priority: newPriorities.length > 0 ? newPriorities : null
                          };
                        });
                      }}
                    >
                      <span className={cn("pr-1", getPriorityColor(priority))}>●</span> 
                      {getPriorityLabel(priority)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator />
                
                {/* Due Date Range Filter */}
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-medium pt-1">Due Date</DropdownMenuLabel>
                  <div className="px-2 py-1.5">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal text-xs h-8"
                            size="sm"
                          >
                            <CalendarIcon className="mr-1 h-3 w-3" />
                            {filters.dueDateRange?.from 
                              ? format(filters.dueDateRange.from, 'MM/dd/yy') 
                              : <span>From</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.dueDateRange?.from || undefined}
                            onSelect={(date) => setFilters(prev => ({
                              ...prev,
                              dueDateRange: {
                                from: date,
                                to: prev.dueDateRange?.to || null
                              }
                            }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal text-xs h-8"
                            size="sm"
                          >
                            <CalendarIcon className="mr-1 h-3 w-3" />
                            {filters.dueDateRange?.to 
                              ? format(filters.dueDateRange.to, 'MM/dd/yy') 
                              : <span>To</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={filters.dueDateRange?.to || undefined}
                            onSelect={(date) => setFilters(prev => ({
                              ...prev,
                              dueDateRange: {
                                from: prev.dueDateRange?.from || null,
                                to: date
                              }
                            }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator />
                
                {/* Tags Filter */}
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-medium pt-1">Tags</DropdownMenuLabel>
                  {availableTags.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      No tags available
                    </div>
                  ) : (
                    availableTags.map(tag => (
                      <DropdownMenuCheckboxItem
                        key={tag}
                        checked={filters.tags?.includes(tag) ?? false}
                        onCheckedChange={(checked) => {
                          setFilters(prev => {
                            const currentTags = prev.tags || [];
                            const newTags = checked 
                              ? [...currentTags, tag] 
                              : currentTags.filter(t => t !== tag);
                            
                            return {
                              ...prev,
                              tags: newTags.length > 0 ? newTags : null
                            };
                          });
                        }}
                      >
                        <span className="text-xs">{tag}</span>
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator />
                
                {/* Reset Filters Button */}
                <DropdownMenuItem 
                  className="justify-center text-center cursor-pointer"
                  onClick={resetFilters}
                  disabled={activeFilterCount === 0}
                >
                  <FilterX className="h-4 w-4 mr-1" />
                  Reset Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
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
          </div>
        </CardHeader>
        
        <CardContent className="px-2 sm:px-4">
          <form onSubmit={handleAddTodo} className="flex flex-col space-y-2 mb-4">
            {!expandedForm ? (
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a new task..."
                  value={newTodo.title || ""}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
                  className={cn(
                    "flex-1 bg-background/50",
                    todoError && "border-red-500"
                  )}
                  disabled={isSubmitting}
                />
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={() => setExpandedForm(true)}
                  disabled={isSubmitting}
                  className="hidden sm:flex"
                >
                  <ChevronDown size={16} />
                </Button>
                <Button 
                  type="submit" 
                  size="sm" 
                  className="shrink-0 bg-[#4D45D6] hover:bg-[#4D45D6]/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 p-3 bg-background/50 rounded-md">
                <div>
                  <Input
                    placeholder="Task title..."
                    value={newTodo.title || ""}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
                    className={cn(
                      "flex-1 bg-background",
                      todoError && "border-red-500"
                    )}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <Textarea
                    placeholder="Description (optional)"
                    value={newTodo.description || ""}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-background"
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Select
                      value={String(newTodo.priority || 2)}
                      onValueChange={(value) => setNewTodo(prev => ({ ...prev, priority: Number(value) }))}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map(option => (
                          <SelectItem key={option.value} value={String(option.value)}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-background"
                          disabled={isSubmitting}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, 'MMM d, yyyy') : <span>Due date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag..."
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      className="bg-background"
                      disabled={isSubmitting}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="bg-[#4D45D6]/10 text-[#4D45D6] hover:bg-[#4D45D6]/20 hover:text-[#4D45D6] flex-shrink-0"
                      onClick={addTag}
                      disabled={isSubmitting || !currentTag.trim()}
                    >
                      <TagIcon size={16} />
                    </Button>
                  </div>
                  
                  {(newTodo.tags && newTodo.tags.length > 0) && (
                    <div className="flex flex-wrap gap-1">
                      {newTodo.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1 bg-[#4D45D6]/10 text-[#4D45D6] hover:bg-[#4D45D6]/20 max-w-full overflow-hidden text-ellipsis">
                          {tag}
                          <X
                            size={12}
                            className="cursor-pointer hover:text-destructive flex-shrink-0"
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-[#4D45D6] hover:bg-[#4D45D6]/90"
                    disabled={isSubmitting || !newTodo.title?.trim()}
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
                    Add Task
                  </Button>
                </div>
              </div>
            )}
            
            {todoError && !expandedForm && (
              <div className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} />
                <span>{todoError}</span>
              </div>
            )}
          </form>
          
          {/* Search and Sort Controls - update for better responsiveness */}
          <div className="flex flex-col space-y-2 mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="pl-8 bg-background/50"
              />
            </div>
            
            <div className="flex flex-wrap gap-1 text-xs">
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-7 px-2 text-xs font-normal",
                  sortOptions.field === 'title' && "text-[#4D45D6] bg-[#4D45D6]/10"
                )}
                onClick={() => toggleSort('title')}
              >
                Name{getSortIcon('title')}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-7 px-2 text-xs font-normal",
                  sortOptions.field === 'priority' && "text-[#4D45D6] bg-[#4D45D6]/10"
                )}
                onClick={() => toggleSort('priority')}
              >
                Priority{getSortIcon('priority')}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-7 px-2 text-xs font-normal",
                  sortOptions.field === 'dueDate' && "text-[#4D45D6] bg-[#4D45D6]/10"
                )}
                onClick={() => toggleSort('dueDate')}
              >
                Due Date{getSortIcon('dueDate')}
              </Button>
              
              {(sortOptions.field !== 'none' || filters.searchQuery || activeFilterCount > 1) && (
                activeFilterCount > 2 ? (
                  <AlertDialog open={showClearFiltersConfirm} onOpenChange={setShowClearFiltersConfirm}>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-xs font-normal ml-auto"
                      >
                        <FilterX size={12} className="mr-1" />
                        Clear All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear all filters?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove all active filters and sorting. Your current filtered view will be lost.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={resetFilters}>
                          Clear All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs font-normal ml-auto"
                    onClick={resetFilters}
                  >
                    <FilterX size={12} className="mr-1" />
                    Clear
                  </Button>
                )
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-sm text-red-500 flex items-center gap-1 py-4">
              <AlertCircle size={14} />
              <span>Error loading tasks. Please try again later.</span>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              {todos.length === 0 
                ? "No tasks yet. Add your first task above."
                : "No tasks match the current filters or search."}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredTodos.map(todo => todo.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {filteredTodos.map((todo) => (
                    <SortableTaskItem
                      key={todo.id}
                      todo={todo}
                      onToggle={handleToggleTodo}
                      onDelete={handleDeleteTodo}
                      onEdit={handleOpenEditDialog}
                      getPriorityColor={getPriorityColor}
                      getPriorityLabel={getPriorityLabel}
                      formatDueDate={formatDueDate}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
          
          {/* Edit Dialog */}
          <Dialog open={editingTodo !== null} onOpenChange={(open) => {
            if (!open) setEditingTodo(null);
          }}>
            <DialogContent className="sm:max-w-[425px] max-w-[90vw] w-full">
              <DialogHeader>
                <DialogTitle className="text-gradient">Edit Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={editingTodo?.title || ""}
                    onChange={(e) => setEditingTodo(prev => ({ ...prev!, title: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={editingTodo?.description || ""}
                    onChange={(e) => setEditingTodo(prev => ({ ...prev!, description: e.target.value }))}
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select
                      value={String(editingTodo?.priority || 2)}
                      onValueChange={(value) => setEditingTodo(prev => ({ ...prev!, priority: Number(value) }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map(option => (
                          <SelectItem key={option.value} value={String(option.value)}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editingTodo?.due_date ? formatDueDate(editingTodo.due_date) : <span>No date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editingTodo?.due_date ? new Date(editingTodo.due_date) : undefined}
                          onSelect={(date) => setEditingTodo(prev => ({ 
                            ...prev!, 
                            due_date: date ? format(date, 'yyyy-MM-dd') : undefined 
                          }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag..."
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTagToEdit();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="bg-[#4D45D6]/10 text-[#4D45D6] hover:bg-[#4D45D6]/20 hover:text-[#4D45D6]"
                      onClick={addTagToEdit}
                      disabled={!currentTag.trim()}
                    >
                      <TagIcon size={16} />
                    </Button>
                  </div>
                  
                  {(editingTodo?.tags && editingTodo.tags.length > 0) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {editingTodo.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1 bg-[#4D45D6]/10 text-[#4D45D6] hover:bg-[#4D45D6]/20">
                          {tag}
                          <X
                            size={12}
                            className="cursor-pointer hover:text-destructive"
                            onClick={() => removeTagFromEdit(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <Button variant="outline" onClick={() => setEditingTodo(null)}>Cancel</Button>
                <Button className="bg-[#4D45D6] hover:bg-[#4D45D6]/90 mb-2 sm:mb-0" onClick={handleSaveEdit}>Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </ResizableWidget>
    </div>
  );
};

export default TodoWidget;
