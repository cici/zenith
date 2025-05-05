
import { createClient, SupabaseClient, User, AuthResponse } from '@supabase/supabase-js';
import { validatePassword } from '@/utils/validation';
import { handleAuthError } from '@/utils/errorHandling';

// Debug: Log all Vite env variables
console.log('Vite Environment Variables:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
});

// Default fallback values for development (DO NOT USE THESE IN PRODUCTION)
const DEFAULT_SUPABASE_URL = 'https://placeholder.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.J2eiPLx-3X7Z0YSvYfXMEm_H25yu4QLbV9pQRLfZzHw';

// Vite environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Log configuration for debugging
console.log('Supabase Configuration:', {
  url: supabaseUrl,
  keyDefined: supabaseAnonKey ? 'Yes (length: ' + supabaseAnonKey.length + ')' : 'No'
});

// Create a dummy client for development if real credentials aren't available
const isUsingDummyClient = supabaseUrl === DEFAULT_SUPABASE_URL;
if (isUsingDummyClient) {
  console.warn(
    'WARNING: Using placeholder Supabase credentials. The app will not connect to a real database. ' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
  );
}

// Create Supabase client with custom settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce', // Use PKCE flow for better security
    autoRefreshToken: true, // Automatically refresh the token before it expires
    persistSession: true, // Keep the session alive between page refreshes
    detectSessionInUrl: true, // Look for tokens in the URL on initial load
    storage: {
      // Custom storage implementation using cookies
      getItem: async (key: string) => {
        // Get cookie by name
        const value = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${key}=`))
          ?.split('=')[1];
        if (value) {
          return value;
        }
        return null;
      },
      setItem: async (key: string, value: string) => {
        // Set secure, HTTP-only cookie with SameSite=Strict
        document.cookie = `${key}=${value}; path=/; secure; samesite=strict; max-age=${value ? '31536000' : '0'}`; // 1 year or delete if no value
      },
      removeItem: async (key: string) => {
        // Remove cookie by setting expired date
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict`;
      },
    },
  },
});

// Added a function to check if we're using a real Supabase connection
export const isSupabaseConfigured = (): boolean => {
  return !isUsingDummyClient;
};

// Helper function to get current user
export const getCurrentUser = async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase is not properly configured. getCurrentUser will return null.');
    return null;
  }
  
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
  if (!isSupabaseConfigured()) {
    console.warn('Supabase is not properly configured. getSession will return null.');
    return null;
  }
  
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    throw handleAuthError(error);
  }
};

// Helper function to refresh session
export const refreshSession = async (refreshToken?: string) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase is not properly configured. refreshSession will return null.');
    return null;
  }
  
  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) throw error;
    return data.session;
  } catch (error) {
    throw handleAuthError(error);
  }
};

// Helper function to sign up
export const signUp = async (email: string, password: string, metadata?: { [key: string]: any }) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase is not properly configured. signUp will simulate success but not actually create an account.');
    return { user: null, session: null };
  }
  
  try {
    // Validate password strength
    const validation = validatePassword(password);
    if (!validation.isValid) {
      throw new Error(validation.errors.join('. '));
    }

    // Sign up with email and password
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: metadata, // Add any additional user metadata
      },
    });

    if (error) throw error;

    console.log("Data returned from signUpWithPassword:", data);
    return data;
  } catch (error) {
    throw handleAuthError(error);
  }
};

// Helper function to sign in
export const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase is not properly configured. signIn will simulate success but not actually authenticate.');
    return { user: null, session: null };
  }
  
  try {
    // Sign in with password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // If rememberMe is true and we have a session, refresh it for long-lived token
    if (rememberMe && data.session?.refresh_token) {
      const { error: refreshError } = await supabase.auth.refreshSession({
        refresh_token: data.session.refresh_token,
      });

      if (refreshError) throw refreshError;
    }

    console.log("Data returned from signInWithPassword:", data);
    return data;
  } catch (error) {
    throw handleAuthError(error);
  }
};

// Helper function to sign out
export const signOut = async () => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase is not properly configured. signOut will not actually sign out a user.');
    return;
  }
  
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    throw handleAuthError(error);
  }
};

// Helper function to reset password
export const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase is not properly configured. resetPassword will not actually send a reset email.');
    return { error: null };
  }
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  return { error };
};

// Helper function to update password
export const updatePassword = async (newPassword: string): Promise<{ error: Error | null }> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase is not properly configured. updatePassword will not actually update a password.');
    return { error: null };
  }
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { error };
};
