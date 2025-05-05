import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';

// Interface for the auth context value
interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock demo user for development without auth
const DEMO_USER: User = {
  id: 'demo-user',
  app_metadata: {},
  user_metadata: { name: 'Demo User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [usingDemoUser, setUsingDemoUser] = useState(false);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        setLoading(true);
        
        // Attempt to get the session from Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          // If there's an auth error, use demo user
          console.warn('Auth error, using demo user:', error.message);
          if (mounted) {
            setUsingDemoUser(true);
            setUser(DEMO_USER);
            setSession(null);
            setError(null);
          }
        } else if (!data.session || !data.session.user) {
          // If there's no session or user, use demo user
          console.log('No authenticated user, using demo mode');
          if (mounted) {
            setUsingDemoUser(true);
            setUser(DEMO_USER);
            setSession(null);
            setError(null);
          }
        } else {
          // If we have a valid session, use it
          if (mounted) {
            setUsingDemoUser(false);
            setSession(data.session);
            setUser(data.session.user);
            setError(null);
          }
        }
      } catch (error) {
        console.error('Error in auth initialization:', error);
        if (mounted) {
          setUsingDemoUser(true);
          setUser(DEMO_USER);
          setError(error instanceof Error ? error : new Error('Unknown error'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    getInitialSession();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          if (session && session.user) {
            // Real authenticated user
            setUsingDemoUser(false);
            setSession(session);
            setUser(session.user);
          } else if (usingDemoUser) {
            // Continue using demo user
            setUser(DEMO_USER);
            setSession(null);
          } else {
            // No real user and not using demo user
            setUsingDemoUser(true);
            setUser(DEMO_USER);
            setSession(null);
          }
        }
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Unknown sign-in error'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // When signed out, switch to demo user
      setUsingDemoUser(true);
      setUser(DEMO_USER);
      setSession(null);
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Unknown sign-out error'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user, // This will be either the real user or DEMO_USER
    loading,
    error,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook for using auth
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 