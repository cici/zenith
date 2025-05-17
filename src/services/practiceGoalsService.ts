import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type PracticeGoal = {
  id: string;
  user_id: string;
  goal_type: "daily" | "weekly";
  minutes: number;
  active: boolean;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
};

export type PracticeReminder = {
  id: string;
  user_id: string;
  routine_id?: string;
  reminder_time: string; // 'HH:MM:SS'
  days_of_week: number[]; // 0=Sunday ... 6=Saturday
  method: "email" | "push" | "in-app";
  active: boolean;
  created_at: string;
  updated_at: string;
};

export class PracticeGoalsService {
  private client: SupabaseClient;

  constructor(client: SupabaseClient = supabase) {
    this.client = client;
  }

  // Practice Goals
  async getGoals(userId: string): Promise<PracticeGoal[]> {
    const { data, error } = await this.client
      .from("practice_goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async createGoal(goal: Omit<PracticeGoal, "id" | "created_at" | "updated_at">): Promise<PracticeGoal> {
    const { data, error } = await this.client
      .from("practice_goals")
      .insert([goal])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateGoal(id: string, updates: Partial<PracticeGoal>): Promise<PracticeGoal> {
    const { data, error } = await this.client
      .from("practice_goals")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteGoal(id: string): Promise<void> {
    const { error } = await this.client.from("practice_goals").delete().eq("id", id);
    if (error) throw error;
  }

  // Practice Reminders
  async getReminders(userId: string): Promise<PracticeReminder[]> {
    const { data, error } = await this.client
      .from("practice_reminders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async createReminder(reminder: Omit<PracticeReminder, "id" | "created_at" | "updated_at">): Promise<PracticeReminder> {
    const { data, error } = await this.client
      .from("practice_reminders")
      .insert([reminder])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateReminder(id: string, updates: Partial<PracticeReminder>): Promise<PracticeReminder> {
    const { data, error } = await this.client
      .from("practice_reminders")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteReminder(id: string): Promise<void> {
    const { error } = await this.client.from("practice_reminders").delete().eq("id", id);
    if (error) throw error;
  }
}

// Export a singleton instance
export const practiceGoalsService = new PracticeGoalsService(); 