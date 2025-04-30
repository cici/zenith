import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/services/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      
      if (code) {
        try {
          // Exchange the auth code for a session
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Error exchanging code for session:', error.message);
            navigate('/auth/error');
            return;
          }

          // Successful authentication
          navigate('/dashboard');
        } catch (error) {
          console.error('Error in auth callback:', error);
          navigate('/auth/error');
        }
      } else {
        // No code present, redirect to login
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  // Show loading state while processing
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Processing Authentication...</h2>
        <p className="text-gray-600">Please wait while we complete your sign-in.</p>
      </div>
    </div>
  );
} 