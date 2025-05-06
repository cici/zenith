import { createClient } from '@supabase/supabase-js';
import { ThemePreferences } from '@/types/theme';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface UserPreferences {
  user_id: string;
  theme_preferences: ThemePreferences;
  notification_settings?: any; // For future extension
  accessibility_settings?: any; // For future extension
  created_at?: string;
  updated_at?: string;
}

/**
 * Save user preferences to the database
 */
export async function saveUserPreferences(userId: string, preferences: ThemePreferences): Promise<void> {
  try {
    // Check if the user already has preferences
    const { data: existingData, error: fetchError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 means "no rows returned" which is fine
      console.error('Error fetching user preferences:', fetchError);
      throw fetchError;
    }

    if (existingData) {
      // Update existing preferences
      const { error: updateError } = await supabase
        .from('user_preferences')
        .update({
          theme_preferences: preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating user preferences:', updateError);
        throw updateError;
      }
    } else {
      // Insert new preferences
      const { error: insertError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          theme_preferences: preferences,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error inserting user preferences:', insertError);
        throw insertError;
      }
    }
  } catch (error) {
    console.error('Failed to save user preferences:', error);
    throw error;
  }
}

/**
 * Load user preferences from the database
 */
export async function loadUserPreferences(userId: string): Promise<ThemePreferences | null> {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('theme_preferences')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No preferences found for this user
        return null;
      }
      console.error('Error loading user preferences:', error);
      throw error;
    }

    return data?.theme_preferences || null;
  } catch (error) {
    console.error('Failed to load user preferences:', error);
    throw error;
  }
}

/**
 * Delete user preferences from the database
 */
export async function deleteUserPreferences(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting user preferences:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete user preferences:', error);
    throw error;
  }
}

/**
 * Sync local preferences with database
 * If local preferences are newer, save to database
 * If database preferences are newer, update local
 */
export async function syncPreferences(
  userId: string, 
  localPreferences: ThemePreferences
): Promise<ThemePreferences> {
  try {
    const dbPreferences = await loadUserPreferences(userId);
    
    if (!dbPreferences) {
      // No database preferences found, save local preferences
      await saveUserPreferences(userId, localPreferences);
      return localPreferences;
    }
    
    // Use the database preferences as they are considered authoritative
    await saveUserPreferences(userId, localPreferences);
    
    return localPreferences;
  } catch (error) {
    console.error('Failed to sync preferences:', error);
    // If sync fails, return local preferences
    return localPreferences;
  }
} 