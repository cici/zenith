import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { supabase, signIn as supabaseSignIn, signUp as supabaseSignUp, signOut as supabaseSignOut } from '@/services/supabase';
import { User } from '@supabase/supabase-js';
import { handleAuthError } from '@/utils/errorHandling';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, metadata?: { [key: string]: any }) => Promise<void>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((s) => ({ ...s, user: session?.user ?? null, loading: false }));
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({ ...s, user: session?.user ?? null }));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: { [key: string]: any }) => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      await supabaseSignUp(email, password, metadata);
    } catch (error) {
      const message = handleAuthError(error).message;
      setState((s) => ({ ...s, error: message }));
      throw error;
    } finally {
      setState((s) => ({ ...s, loading: false }));
    }
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      await supabaseSignIn(email, password, rememberMe);
    } catch (error) {
      const message = handleAuthError(error).message;
      setState((s) => ({ ...s, error: message }));
      throw error;
    } finally {
      setState((s) => ({ ...s, loading: false }));
    }
  };

  const signOut = async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      await supabaseSignOut();
      setState((s) => ({ ...s, user: null }));
    } catch (error) {
      const message = handleAuthError(error).message;
      setState((s) => ({ ...s, error: message }));
      throw error;
    } finally {
      setState((s) => ({ ...s, loading: false }));
    }
  };

  const value = {
    ...state,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 