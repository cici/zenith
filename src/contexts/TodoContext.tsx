import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Todo, getTodos, getTodoById, addTodo as addTodoService, updateTodo as updateTodoService, deleteTodo as deleteTodoService } from '@/services/database';

interface TodoContextType {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  addTodo: (todo: Omit<Todo, 'id' | 'created_at'>) => Promise<Todo | null>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<Todo | null>;
  deleteTodo: (id: string) => Promise<boolean>;
  toggleTodo: (id: string) => Promise<Todo | null>;
  refreshTodos: () => Promise<void>;
  clearError: () => void;
  reorderTodos: (newOrder: Todo[]) => void;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

interface TodoProviderProps {
  children: ReactNode;
  userId: string;
}

export const TodoProvider: React.FC<TodoProviderProps> = ({ children, userId }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const clearError = () => setError(null);

  // Load todos when the component mounts
  useEffect(() => {
    refreshTodos();
  }, [userId]);

  const refreshTodos = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const todosData = await getTodos(userId);
      setTodos(todosData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load todos';
      setError(errorMessage);
      toast({
        title: 'Error loading todos',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (todoData: Omit<Todo, 'id' | 'created_at'>): Promise<Todo | null> => {
    setError(null);
    try {
      const newTodo = await addTodoService(todoData);
      setTodos((prevTodos) => [newTodo, ...prevTodos]);
      toast({
        title: 'Task added',
        description: 'Your new task has been added to the list.',
      });
      return newTodo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add todo';
      setError(errorMessage);
      toast({
        title: 'Error adding task',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateTodo = async (id: string, updates: Partial<Todo>): Promise<Todo | null> => {
    setError(null);
    try {
      const updatedTodo = await updateTodoService(id, updates);
      setTodos((prevTodos) =>
        prevTodos.map((todo) => (todo.id === id ? updatedTodo : todo))
      );
      toast({
        title: 'Task updated',
        description: 'Your task has been updated.',
      });
      return updatedTodo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update todo';
      setError(errorMessage);
      toast({
        title: 'Error updating task',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  const toggleTodo = async (id: string): Promise<Todo | null> => {
    const todoToToggle = todos.find((todo) => todo.id === id);
    if (!todoToToggle) return null;
    
    return updateTodo(id, { completed: !todoToToggle.completed });
  };

  const deleteTodo = async (id: string): Promise<boolean> => {
    setError(null);
    try {
      await deleteTodoService(id);
      setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
      toast({
        title: 'Task deleted',
        description: 'The task has been removed from your list.',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete todo';
      setError(errorMessage);
      toast({
        title: 'Error deleting task',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  const reorderTodos = (newOrder: Todo[]): void => {
    setTodos(newOrder);
    
    // For now, we'll just update the local state
    // In a real application, you might want to persist this order to the server
    // by adding a 'position' or 'order' field to your Todo model
    
    // Example of persisting order (commented out):
    // const updatePositions = async () => {
    //   try {
    //     // Update positions on the server
    //     const updates = newOrder.map((todo, index) => 
    //       updateTodoService(todo.id, { position: index })
    //     );
    //     await Promise.all(updates);
    //   } catch (err) {
    //     const errorMessage = err instanceof Error ? err.message : 'Failed to save task order';
    //     setError(errorMessage);
    //     toast({
    //       title: 'Error saving task order',
    //       description: errorMessage,
    //       variant: 'destructive',
    //     });
    //   }
    // };
    // updatePositions();
  };

  const value = {
    todos,
    loading,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    refreshTodos,
    clearError,
    reorderTodos,
  };

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
};

export const useTodos = (): TodoContextType => {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
}; 