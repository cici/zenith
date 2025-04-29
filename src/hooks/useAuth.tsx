import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { supabase } from '@/services/supabase';

interface AuthState {
  user: any;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setState((s) => ({ ...s, user: data.session?.user || null, loading: false }));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({ ...s, user: session?.user || null, loading: false }));
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await supabase.auth.signUp({ email, password });
    setState((s) => ({ ...s, loading: false, user: data.user, error: error?.message || null }));
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setState((s) => ({ ...s, loading: false, user: data.user, error: error?.message || null }));
    return { data, error };
  };

  const signOut = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { error } = await supabase.auth.signOut();
    setState((s) => ({ ...s, loading: false, user: null, error: error?.message || null }));
    return { error };
  };

  return (
    <AuthContext.Provider value={{ ...state, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
} 