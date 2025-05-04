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
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    throw handleAuthError(error);
  }
};

// Helper function to refresh session
export const refreshSession = async (refreshToken?: string) => {
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
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    throw handleAuthError(error);
  }
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