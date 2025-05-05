import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';

interface SupabaseState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export function useSupabase() {
  const [state, setState] = useState<SupabaseState>({
    session: null,
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    const fetchSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        setState({
          session: data.session,
          user: data.session?.user || null,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching Supabase session:', error);
        setState(current => ({
          ...current,
          loading: false,
          error: error instanceof Error ? error : new Error('Unknown error fetching session'),
        }));
      }
    };

    fetchSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(current => ({
        ...current,
        session,
        user: session?.user || null,
        loading: false,
      }));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return state;
} 