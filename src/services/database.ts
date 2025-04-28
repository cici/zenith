import { supabase } from './supabase';

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority?: number;
  completed: boolean;
  created_at: string;
}

export async function getTodos(userId: string): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addTodo(todo: Omit<Todo, 'id' | 'created_at'>): Promise<Todo> {
  const { data, error } = await supabase
    .from('todos')
    .insert([todo])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
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
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id);
  if (error) throw error;
} 