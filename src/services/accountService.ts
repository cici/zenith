import { supabase } from './supabase';
import { getProfileById, updateProfile } from './profileService';
import { deleteUserPreferences } from './preferenceService';
import { StorageBucket, deleteFile } from './storageService';

/**
 * Interface for account activity log
 */
export interface AccountActivity {
  id: string;
  user_id: string;
  activity_type: 'login' | 'logout' | 'password_change' | 'email_update' | 'profile_update' | 'account_creation';
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

/**
 * Interface for active sessions
 */
export interface ActiveSession {
  id: string;
  user_id: string;
  created_at: string;
  last_active_at: string;
  ip_address?: string;
  device_info?: string;
  is_current?: boolean;
}

/**
 * Change user password
 * Requires the current password for verification
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: any }> {
  try {
    // First, verify the current password by attempting to sign in
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user?.email) {
      return { success: false, error: new Error('User email not found') };
    }

    // Try to sign in with the current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: currentPassword,
    });

    if (signInError) {
      return { success: false, error: new Error('Current password is incorrect') };
    }

    // If verification succeeded, update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { success: false, error: updateError };
    }

    // Log the activity
    await logAccountActivity(userData.user.id, 'password_change');

    return { success: true };
  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, error };
  }
}

/**
 * Update email address with verification
 * This sends a verification email to the new address
 */
export async function updateEmail(
  newEmail: string,
  password: string
): Promise<{ success: boolean; message?: string; error?: any }> {
  try {
    // First, verify the password by attempting to sign in
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user?.email) {
      return { success: false, error: new Error('User email not found') };
    }

    // Try to sign in with the password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password,
    });

    if (signInError) {
      return { success: false, error: new Error('Password is incorrect') };
    }

    // If verification succeeded, update the email
    const { error: updateError } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (updateError) {
      return { success: false, error: updateError };
    }

    // Log the activity
    await logAccountActivity(userData.user.id, 'email_update');

    return { 
      success: true, 
      message: 'Verification email sent to your new address. Please check your inbox.' 
    };
  } catch (error) {
    console.error('Error updating email:', error);
    return { success: false, error };
  }
}

/**
 * Delete user files from storage
 */
async function deleteUserFiles(userId: string): Promise<void> {
  try {
    // List all user files in avatars bucket
    const { data: avatarFiles } = await supabase.storage
      .from(StorageBucket.AVATARS)
      .list(`${userId}`);
      
    // Delete each file
    if (avatarFiles && avatarFiles.length > 0) {
      for (const file of avatarFiles) {
        await deleteFile(StorageBucket.AVATARS, `${userId}/${file.name}`);
      }
    }
    
    // List all user files in other buckets as needed
    // ... similar code for other buckets
  } catch (error) {
    console.error('Error deleting user files:', error);
  }
}

/**
 * Delete user account with full data cleanup
 * Requires password confirmation for security
 */
export async function deleteAccount(
  password: string
): Promise<{ success: boolean; error?: any }> {
  try {
    // First, verify the password by attempting to sign in
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user?.email || !userData.user?.id) {
      return { success: false, error: new Error('User information not found') };
    }

    // Try to sign in with the password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password,
    });

    if (signInError) {
      return { success: false, error: new Error('Password is incorrect') };
    }

    const userId = userData.user.id;

    // Delete user data in correct order to respect foreign key constraints
    
    // 1. Delete user preferences
    await deleteUserPreferences(userId);
    
    // 2. Delete user files from storage
    await deleteUserFiles(userId);
    
    // 3. Delete account activity logs
    const { error: activityError } = await supabase
      .from('account_activity')
      .delete()
      .eq('user_id', userId);
      
    if (activityError) {
      console.error('Error deleting account activity:', activityError);
    }
    
    // 4. Delete user sessions
    const { error: sessionsError } = await supabase
      .from('active_sessions')
      .delete()
      .eq('user_id', userId);
      
    if (sessionsError) {
      console.error('Error deleting user sessions:', sessionsError);
    }
    
    // 5. Delete user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
      
    if (profileError) {
      console.error('Error deleting user profile:', profileError);
    }
    
    // Finally, delete the user account itself
    const { error: userError } = await supabase.auth.admin.deleteUser(userId);
    
    if (userError) {
      return { success: false, error: userError };
    }
    
    // Sign out after deletion
    await supabase.auth.signOut();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { success: false, error };
  }
}

/**
 * Log user account activity for auditing
 */
export async function logAccountActivity(
  userId: string,
  activityType: AccountActivity['activity_type'],
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    // Use browser info if not provided
    const finalUserAgent = userAgent || navigator.userAgent;
    
    // Use a placeholder IP since we can't get real IP on client side
    const finalIpAddress = ipAddress || '0.0.0.0';
    
    const { error } = await supabase
      .from('account_activity')
      .insert([
        {
          user_id: userId,
          activity_type: activityType,
          ip_address: finalIpAddress,
          user_agent: finalUserAgent,
          timestamp: new Date().toISOString(),
        },
      ]);
      
    if (error) {
      console.error('Error logging account activity:', error);
    }
  } catch (error) {
    console.error('Unexpected error in logAccountActivity:', error);
  }
}

/**
 * Get user's account activity history
 */
export async function getAccountActivity(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ data: AccountActivity[] | null; error?: any }> {
  try {
    const { data, error } = await supabase
      .from('account_activity')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      return { data: null, error };
    }
    
    return { data };
  } catch (error) {
    console.error('Error getting account activity:', error);
    return { data: null, error };
  }
}

/**
 * Get user's active sessions
 */
export async function getActiveSessions(
  userId: string
): Promise<{ data: ActiveSession[] | null; error?: any }> {
  try {
    const { data, error } = await supabase
      .from('active_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false });
      
    if (error) {
      return { data: null, error };
    }
    
    // Mark the current session
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData.session) {
      // Access session id from session.id (if available) or use a fallback method
      const currentSessionId = sessionData.session.access_token?.split('.')[0] || '';
      
      return {
        data: data.map(session => ({
          ...session,
          is_current: session.id === currentSessionId,
        })),
      };
    }
    
    return { data };
  } catch (error) {
    console.error('Error getting active sessions:', error);
    return { data: null, error };
  }
}

/**
 * Terminate a specific session
 */
export async function terminateSession(
  sessionId: string
): Promise<{ success: boolean; error?: any }> {
  try {
    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user?.id) {
      return { success: false, error: new Error('User not found') };
    }
    
    // Verify the session belongs to the user
    const { data: sessionData, error: sessionError } = await supabase
      .from('active_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();
      
    if (sessionError || !sessionData) {
      return { success: false, error: new Error('Session not found') };
    }
    
    if (sessionData.user_id !== userData.user.id) {
      return { success: false, error: new Error('Unauthorized') };
    }
    
    // If it's the current session, sign out
    const { data: currentSession } = await supabase.auth.getSession();
    const currentSessionId = currentSession.session?.access_token?.split('.')[0] || '';
    
    if (currentSessionId === sessionId) {
      await supabase.auth.signOut();
      return { success: true };
    }
    
    // Otherwise just delete the session record
    const { error } = await supabase
      .from('active_sessions')
      .delete()
      .eq('id', sessionId);
      
    if (error) {
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error terminating session:', error);
    return { success: false, error };
  }
}

/**
 * Terminate all sessions except the current one
 */
export async function terminateAllOtherSessions(): Promise<{ success: boolean; error?: any }> {
  try {
    // Get current session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      return { success: false, error: new Error('No active session') };
    }
    
    const currentSessionId = sessionData.session.access_token?.split('.')[0] || '';
    const userId = sessionData.session.user.id;
    
    // Delete all other sessions
    const { error } = await supabase
      .from('active_sessions')
      .delete()
      .eq('user_id', userId)
      .neq('id', currentSessionId);
      
    if (error) {
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error terminating other sessions:', error);
    return { success: false, error };
  }
}

/**
 * Update user's last active timestamp
 */
export async function updateSessionActivity(): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;
    
    const sessionId = sessionData.session.access_token?.split('.')[0] || '';
    const userId = sessionData.session.user.id;
    
    // Update last active timestamp
    const { error } = await supabase
      .from('active_sessions')
      .upsert({
        id: sessionId,
        user_id: userId,
        last_active_at: new Date().toISOString(),
      });
      
    if (error) {
      console.error('Error updating session activity:', error);
    }
  } catch (error) {
    console.error('Unexpected error in updateSessionActivity:', error);
  }
}

/**
 * Create SQL migration for account_activity and active_sessions tables
 */
export const accountManagementMigration = `
-- Create account_activity table for tracking user actions
CREATE TABLE IF NOT EXISTS account_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'password_change', 'email_update', 'profile_update', 'account_creation')),
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Add index for faster queries
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add index on user_id and timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_account_activity_user_timestamp ON account_activity(user_id, timestamp DESC);

-- Create RLS policies for account_activity
ALTER TABLE account_activity ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own activity
CREATE POLICY account_activity_select_policy ON account_activity
  FOR SELECT USING (auth.uid() = user_id);

-- Only allow the system to insert activity
CREATE POLICY account_activity_insert_policy ON account_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- No updates allowed
CREATE POLICY account_activity_update_policy ON account_activity
  FOR UPDATE USING (false);

-- Only allow users to delete their own activity
CREATE POLICY account_activity_delete_policy ON account_activity
  FOR DELETE USING (auth.uid() = user_id);

-- Create active_sessions table
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY,  -- This will be the session id from supabase auth
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  device_info TEXT,
  
  -- Add index for faster queries
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add index on user_id
CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON active_sessions(user_id);

-- Create RLS policies for active_sessions
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own sessions
CREATE POLICY active_sessions_select_policy ON active_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Only allow the system or the user to insert sessions
CREATE POLICY active_sessions_insert_policy ON active_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only allow updates to the user's own sessions
CREATE POLICY active_sessions_update_policy ON active_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Only allow users to delete their own sessions
CREATE POLICY active_sessions_delete_policy ON active_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle session tracking
CREATE OR REPLACE FUNCTION handle_new_session()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update the session record
  INSERT INTO active_sessions (id, user_id, created_at, last_active_at)
  VALUES (NEW.id, NEW.user_id, NEW.created_at, now())
  ON CONFLICT (id) 
  DO UPDATE SET last_active_at = now();
  
  -- Log the login activity
  INSERT INTO account_activity (user_id, activity_type, timestamp)
  VALUES (NEW.user_id, 'login', now());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new sessions
DROP TRIGGER IF EXISTS on_auth_session_created ON auth.sessions;
CREATE TRIGGER on_auth_session_created
  AFTER INSERT ON auth.sessions
  FOR EACH ROW EXECUTE FUNCTION handle_new_session();

-- Create function to handle session deletion
CREATE OR REPLACE FUNCTION handle_session_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the logout activity
  INSERT INTO account_activity (user_id, activity_type, timestamp)
  VALUES (OLD.user_id, 'logout', now());
  
  -- Remove the session from active_sessions
  DELETE FROM active_sessions WHERE id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for deleted sessions
DROP TRIGGER IF EXISTS on_auth_session_deleted ON auth.sessions;
CREATE TRIGGER on_auth_session_deleted
  AFTER DELETE ON auth.sessions
  FOR EACH ROW EXECUTE FUNCTION handle_session_deletion();
`; 