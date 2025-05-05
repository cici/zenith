import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimer } from '@/contexts/TimerContext';
import { useTodos } from '@/contexts/TodoContext';
import { formatDuration } from '@/utils/timeUtils';

export interface TaskSelectorProps {
  className?: string;
}

export function TaskSelector({ className }: TaskSelectorProps) {
  const [open, setOpen] = useState(false);
  const { todos, loading } = useTodos();
  const { state, associateTask, disassociateTask, getTaskTimeSpent } = useTimer();
  const [searchValue, setSearchValue] = useState("");
  const [taskTimeSpent, setTaskTimeSpent] = useState<{[key: string]: number}>({});
  
  // Load time spent for all tasks
  useEffect(() => {
    const timeMap: {[key: string]: number} = {};
    todos.forEach(todo => {
      timeMap[todo.id] = getTaskTimeSpent(todo.id);
    });
    setTaskTimeSpent(timeMap);
  }, [todos, getTaskTimeSpent]);
  
  const handleSelectTask = (taskId: string, taskTitle: string, completed: boolean) => {
    associateTask(taskId, taskTitle, completed);
    setOpen(false);
  };
  
  const handleClearTask = () => {
    disassociateTask();
  };
  
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between overflow-hidden"
          >
            {state.associatedTask ? (
              <div className="flex items-center gap-2 truncate">
                <span className={cn(
                  "flex-shrink-0 mr-1 h-2 w-2 rounded-full",
                  state.associatedTask.completed ? "bg-green-500" : "bg-blue-500"
                )} />
                <span className="truncate">{state.associatedTask.title}</span>
                {state.associatedTask.timeSpent > 0 && (
                  <span className="flex items-center text-xs text-muted-foreground ml-auto">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDuration(state.associatedTask.timeSpent)}
                  </span>
                )}
              </div>
            ) : (
              <span>Select a task</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search tasks..." 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>No tasks found.</CommandEmpty>
              <CommandGroup>
                {loading ? (
                  <CommandItem disabled>Loading tasks...</CommandItem>
                ) : (
                  todos
                    .filter(todo => 
                      todo.title.toLowerCase().includes(searchValue.toLowerCase()) ||
                      (todo.description || "").toLowerCase().includes(searchValue.toLowerCase())
                    )
                    .map(todo => (
                      <CommandItem
                        key={todo.id}
                        value={todo.id}
                        onSelect={() => handleSelectTask(todo.id, todo.title, todo.completed)}
                        className="flex items-center"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <span className={cn(
                              "flex-shrink-0 mr-2 h-2 w-2 rounded-full",
                              todo.completed ? "bg-green-500" : "bg-blue-500"
                            )} />
                            <span className={cn(
                              todo.completed && "line-through text-muted-foreground"
                            )}>
                              {todo.title}
                            </span>
                          </div>
                          <div className="flex items-center">
                            {taskTimeSpent[todo.id] > 0 && (
                              <span className="text-xs text-muted-foreground mr-2">
                                {formatDuration(taskTimeSpent[todo.id])}
                              </span>
                            )}
                            {state.associatedTask?.id === todo.id && (
                              <Check className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {state.associatedTask && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleClearTask}
          className="h-9 w-9 p-0"
        >
          <XCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
} 