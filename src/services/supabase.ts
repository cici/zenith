import { createClient, SupabaseClient, User, AuthResponse } from '@supabase/supabase-js';
import { validatePassword } from '@/utils/validation';

// Debug: Log all Vite env variables
console.log('Vite Environment Variables:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
});

// Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase Configuration Error:', {
    url: supabaseUrl ? 'defined' : 'undefined',
    key: supabaseAnonKey ? 'defined' : 'undefined'
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with custom settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce', // Use PKCE flow for better security
    autoRefreshToken: true, // Automatically refresh the token before it expires
    persistSession: true, // Keep the session alive between page refreshes
    detectSessionInUrl: true, // Look for tokens in the URL on initial load
    storageKey: 'zenith-auth-token', // Custom storage key
    storage: localStorage, // Use localStorage (you can switch to cookies if needed)
  },
});

// Helper function to get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Helper function to get session
export const getSession = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

// Helper function to refresh session
export const refreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error refreshing session:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('Error refreshing session:', error);
    return null;
  }
};

// Helper function to sign up
export const signUp = async (email: string, password: string): Promise<AuthResponse | { error: Error }> => {
  // Validate password strength
  const { isValid, errors } = validatePassword(password);
  if (!isValid) {
    return {
      error: new Error(`Invalid password: ${errors.join(', ')}`)
    };
  }

  return await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
};

// Helper function to sign in
export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

// Helper function to sign out
export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut();
};

// Helper function to reset password
export const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  return { error };
};

// Helper function to update password
export const updatePassword = async (newPassword: string): Promise<{ error: Error | null }> => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { error };
}; 