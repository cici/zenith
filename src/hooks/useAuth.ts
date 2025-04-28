import { useState } from 'react';
import { supabase } from '@/services/supabase';

interface AuthState {
  user: any;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: false,
    error: null,
  });

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await supabase.auth.signUp({ email, password });
    setState((s) => ({ ...s, loading: false, user: data.user, error: error?.message || null }));
    return { data, error };
  };

  // Log in with email and password
  const signIn = async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setState((s) => ({ ...s, loading: false, user: data.user, error: error?.message || null }));
    return { data, error };
  };

  // Log out
  const signOut = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { error } = await supabase.auth.signOut();
    setState((s) => ({ ...s, loading: false, user: null, error: error?.message || null }));
    return { error };
  };

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    signUp,
    signIn,
    signOut,
  };
} 