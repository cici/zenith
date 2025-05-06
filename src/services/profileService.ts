import { supabase } from './supabase';

// Profile interface
export interface Profile {
  id: string;
  full_name?: string;
  username?: string;
  bio?: string;
  website?: string;
  location?: string;
  avatar_url?: string;
  updated_at?: string;
}

/**
 * Fetch a user profile by ID
 */
export async function getProfileById(userId: string): Promise<Profile | null> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getProfileById:', error);
    return null;
  }
}

/**
 * Update a user profile
 */
export async function updateProfile(profile: Partial<Profile> & { id: string }): Promise<{ success: boolean; error?: any }> {
  try {
    if (!profile.id) {
      throw new Error('Profile ID is required');
    }

    // Add updated timestamp
    const updates = {
      ...profile,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(updates);

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in updateProfile:', error);
    return { success: false, error };
  }
}

/**
 * Check if a username is already taken
 */
export async function isUsernameTaken(username: string, excludeUserId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('profiles')
      .select('id')
      .eq('username', username);

    // Exclude the current user if an ID is provided
    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking username:', error);
      // Assume taken on error to prevent conflicts
      return true;
    }

    // If data exists and has length > 0, username is taken
    return Boolean(data && data.length > 0);
  } catch (error) {
    console.error('Unexpected error in isUsernameTaken:', error);
    return true;
  }
}

/**
 * Create profiles table if it doesn't exist
 * This is useful for initial setup
 */
export async function createProfilesTableIfNeeded(): Promise<void> {
  try {
    // Check if the table exists
    const { error } = await supabase.rpc('create_profiles_if_not_exists');
    
    if (error) {
      console.error('Error creating profiles table:', error);
    }
  } catch (error) {
    console.error('Error in createProfilesTableIfNeeded:', error);
  }
}

/**
 * Initialize a profile for a new user
 */
export async function initializeUserProfile(userId: string, email?: string): Promise<void> {
  try {
    // Check if profile already exists
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    // If profile exists, do nothing
    if (data) return;

    // Generate a username from email or use a default
    let username = '';
    if (email) {
      // Extract username from email and sanitize
      username = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '') + 
                 Math.floor(Math.random() * 1000).toString();
    } else {
      username = `user${Math.floor(Math.random() * 10000)}`;
    }

    // Create new profile
    const { error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);

    if (error) {
      console.error('Error initializing user profile:', error);
    }
  } catch (error) {
    console.error('Unexpected error in initializeUserProfile:', error);
  }
}

/**
 * Create trigger for profile creation on user signup
 * This should be run once during application setup
 */
export async function setupProfileTrigger(): Promise<void> {
  // This would typically be done in database migrations
  console.log('Profile trigger should be set up in database migrations');
} 