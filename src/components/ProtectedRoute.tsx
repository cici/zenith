import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Show nothing while checking authentication status
  if (loading) {
    return null; // Or a loading spinner
  }

  // Temporarily disabled authentication check for development (Task #11)
  /*
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }
  */

  // Render children if authenticated (or if check is disabled)
  return <>{children}</>;
} 