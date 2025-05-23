import { supabase } from './supabase';
import { validateNewTodo, validateTodoUpdate } from '@/utils/todoValidation';
import { Dashboard, Widget } from '@/types/database';

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority?: number;
  completed: boolean;
  created_at: string;
  tags?: string[];
}

// Local storage key for todos
const LOCAL_STORAGE_KEY = 'zenith_todos';

// Local storage key for widgets
const LOCAL_WIDGETS_KEY = 'zenith_widgets';

// Helper function to check if we should use local storage
async function shouldUseLocalStorage(): Promise<boolean> {
  try {
    // Try to access supabase auth - this will throw if not authenticated
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('Auth error, using local storage fallback:', error.message);
      return true;
    }
    
    // If there's no session data or no user, use local storage
    if (!data.session || !data.session.user) {
      console.log('No active session, using local storage fallback');
      return true;
    }
    
    // There's an active session, use Supabase
    return false;
  } catch (error) {
    // If there's an error accessing auth, use local storage
    console.log('Using local storage fallback for todos:', error);
    return true;
  }
}

// Local storage implementation for getTodos
async function getLocalTodos(userId: string): Promise<Todo[]> {
  try {
    const storedTodos = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!storedTodos) return [];
    
    const allTodos = JSON.parse(storedTodos) as Todo[];
    // Filter todos by user_id
    return allTodos.filter(todo => todo.user_id === userId);
  } catch (error) {
    console.error('Error getting todos from local storage:', error);
    return [];
  }
}

// Local storage implementation for addTodo
async function addLocalTodo(todo: Omit<Todo, 'id' | 'created_at'>): Promise<Todo> {
  try {
    const storedTodos = localStorage.getItem(LOCAL_STORAGE_KEY);
    const allTodos = storedTodos ? JSON.parse(storedTodos) as Todo[] : [];
    
    const newTodo: Todo = {
      ...todo,
      id: crypto.randomUUID(), // Generate a unique ID
      created_at: new Date().toISOString(),
    };
    
    // Add the new todo and save to local storage
    allTodos.push(newTodo);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allTodos));
    
    return newTodo;
  } catch (error) {
    console.error('Error adding todo to local storage:', error);
    throw new Error('Failed to add todo to local storage');
  }
}

// Local storage implementation for getTodoById
async function getLocalTodoById(id: string): Promise<Todo | null> {
  try {
    const storedTodos = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!storedTodos) return null;
    
    const allTodos = JSON.parse(storedTodos) as Todo[];
    return allTodos.find(todo => todo.id === id) || null;
  } catch (error) {
    console.error('Error getting todo by ID from local storage:', error);
    return null;
  }
}

// Local storage implementation for updateTodo
async function updateLocalTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
  try {
    const storedTodos = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!storedTodos) {
      throw new Error('Todo not found');
    }
    
    const allTodos = JSON.parse(storedTodos) as Todo[];
    const todoIndex = allTodos.findIndex(todo => todo.id === id);
    
    if (todoIndex === -1) {
      throw new Error('Todo not found');
    }
    
    // Update the todo
    const updatedTodo = {
      ...allTodos[todoIndex],
      ...updates,
    };
    
    allTodos[todoIndex] = updatedTodo;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allTodos));
    
    return updatedTodo;
  } catch (error) {
    console.error('Error updating todo in local storage:', error);
    throw new Error('Failed to update todo in local storage');
  }
}

// Local storage implementation for deleteTodo
async function deleteLocalTodo(id: string): Promise<void> {
  try {
    const storedTodos = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!storedTodos) return;
    
    const allTodos = JSON.parse(storedTodos) as Todo[];
    const updatedTodos = allTodos.filter(todo => todo.id !== id);
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTodos));
  } catch (error) {
    console.error('Error deleting todo from local storage:', error);
    throw new Error('Failed to delete todo from local storage');
  }
}

// Local storage helpers for widgets
async function getLocalWidgets(dashboardId: string): Promise<Widget[]> {
  try {
    const stored = localStorage.getItem(LOCAL_WIDGETS_KEY);
    if (!stored) return [];
    const all = JSON.parse(stored) as Widget[];
    return all.filter(w => w.dashboard_id === dashboardId);
  } catch (e) {
    console.error('Error getting widgets from local storage:', e);
    return [];
  }
}

async function addLocalWidget(widget: Omit<Widget, 'id' | 'created_at'> & { dashboard_id: string }): Promise<Widget> {
  try {
    const stored = localStorage.getItem(LOCAL_WIDGETS_KEY);
    const all = stored ? JSON.parse(stored) as Widget[] : [];
    const newWidget: Widget = {
      ...widget,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    all.push(newWidget);
    localStorage.setItem(LOCAL_WIDGETS_KEY, JSON.stringify(all));
    return newWidget;
  } catch (e) {
    console.error('Error adding widget to local storage:', e);
    throw new Error('Failed to add widget to local storage');
  }
}

async function updateLocalWidget(id: string, dashboardId: string, updates: Partial<Widget>): Promise<Widget> {
  try {
    const stored = localStorage.getItem(LOCAL_WIDGETS_KEY);
    if (!stored) throw new Error('Widget not found');
    const all = JSON.parse(stored) as Widget[];
    const idx = all.findIndex(w => w.id === id && w.dashboard_id === dashboardId);
    if (idx === -1) throw new Error('Widget not found');
    const updated = { ...all[idx], ...updates };
    all[idx] = updated;
    localStorage.setItem(LOCAL_WIDGETS_KEY, JSON.stringify(all));
    return updated;
  } catch (e) {
    console.error('Error updating widget in local storage:', e);
    throw new Error('Failed to update widget in local storage');
  }
}

async function deleteLocalWidget(id: string, dashboardId: string): Promise<void> {
  try {
    const stored = localStorage.getItem(LOCAL_WIDGETS_KEY);
    if (!stored) return;
    const all = JSON.parse(stored) as Widget[];
    const updated = all.filter(w => !(w.id === id && w.dashboard_id === dashboardId));
    localStorage.setItem(LOCAL_WIDGETS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error deleting widget from local storage:', e);
    throw new Error('Failed to delete widget from local storage');
  }
}

export async function getTodos(userId: string): Promise<Todo[]> {
  // Check if we should use local storage
  if (await shouldUseLocalStorage()) {
    return getLocalTodos(userId);
  }
  
  // Otherwise use Supabase
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getTodoById(id: string): Promise<Todo | null> {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid ID provided');
  }

  // Check if we should use local storage
  if (await shouldUseLocalStorage()) {
    return getLocalTodoById(id);
  }

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') { // Record not found
      return null;
    }
    throw error;
  }
  
  return data;
}

export async function addTodo(todo: Omit<Todo, 'id' | 'created_at'>): Promise<Todo> {
  // Validate the todo before insertion
  const validation = validateNewTodo(todo);
  if (!validation.isValid) {
    throw new Error(`Invalid todo data: ${JSON.stringify(validation.errors)}`);
  }

  // Check if we should use local storage
  if (await shouldUseLocalStorage()) {
    return addLocalTodo(todo);
  }

  const { data, error } = await supabase
    .from('todos')
    .insert([todo])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
  // Validate the updates
  const validation = validateTodoUpdate(updates);
  if (!validation.isValid) {
    throw new Error(`Invalid todo data: ${JSON.stringify(validation.errors)}`);
  }

  // Check if we should use local storage
  if (await shouldUseLocalStorage()) {
    return updateLocalTodo(id, updates);
  }

  const { data, error } = await supabase
    .from('todos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTodo(id: string): Promise<void> {
  // Check if we should use local storage
  if (await shouldUseLocalStorage()) {
    return deleteLocalTodo(id);
  }

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Get all widgets for a specific dashboard
export async function getWidgets(dashboardId: string): Promise<Widget[]> {
  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('dashboard_id', dashboardId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Get a specific widget by ID
export async function getWidgetById(id: string): Promise<Widget | null> {
  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// Create a new widget
export async function createWidget(widget: Partial<Widget>): Promise<Widget> {
  const { data, error } = await supabase
    .from('widgets')
    .insert([widget])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Update a widget
export async function updateWidget(id: string, updates: Partial<Widget>): Promise<Widget> {
  const { data, error } = await supabase
    .from('widgets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Delete a widget
export async function deleteWidget(id: string): Promise<void> {
  const { error } = await supabase
    .from('widgets')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Get all dashboards for the current user
export async function getDashboards(): Promise<Dashboard[]> {
  const { data, error } = await supabase
    .from('dashboards')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Get a specific dashboard by ID
export async function getDashboardById(id: string): Promise<Dashboard | null> {
  const { data, error } = await supabase
    .from('dashboards')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// Create a new dashboard
export async function createDashboard(dashboard: Partial<Dashboard>): Promise<Dashboard> {
  const { data, error } = await supabase
    .from('dashboards')
    .insert([dashboard])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Update a dashboard
export async function updateDashboard(id: string, updates: Partial<Dashboard>): Promise<Dashboard> {
  const { data, error } = await supabase
    .from('dashboards')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Delete a dashboard
export async function deleteDashboard(id: string): Promise<void> {
  const { error } = await supabase
    .from('dashboards')
    .delete()
    .eq('id', id);
  if (error) throw error;
} 