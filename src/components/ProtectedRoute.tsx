import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getUserSubscriptionTier } from '@/services/profileService';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredSubscriptionTier?: string; // e.g., 'pro', 'premium'
}

function SubscriptionGuard({ userId, requiredTier, children }: { userId: string; requiredTier: string; children: ReactNode }) {
  const [tier, setTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getUserSubscriptionTier(userId).then((t) => {
      if (mounted) {
        setTier(t);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [userId]);

  if (loading) return null; // Or a spinner
  if (!tier || (requiredTier && tier !== requiredTier)) {
    // Redirect to subscription/upgrade page
    return <Navigate to="/subscribe" replace />;
  }
  return <>{children}</>;
}

export default function ProtectedRoute({ children, requiredSubscriptionTier }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Show nothing while checking authentication status
  if (loading) {
    return null; // Or a loading spinner
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredSubscriptionTier) {
    return (
      <SubscriptionGuard userId={user.id} requiredTier={requiredSubscriptionTier}>
        {children}
      </SubscriptionGuard>
    );
  }

  // Render children if authenticated and no subscription required
  return <>{children}</>;
} 