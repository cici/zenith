import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAccountActivity, AccountActivity } from '@/services/accountService';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';

interface ActivityHistoryProps {
  limit?: number;
}

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({ limit = 20 }) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<AccountActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Function to get activity icon
  const getActivityIcon = (type: AccountActivity['activity_type']) => {
    switch (type) {
      case 'login':
        return '🔒'; // Login icon
      case 'logout':
        return '🔓'; // Logout icon
      case 'password_change':
        return '🔑'; // Key icon
      case 'email_update':
        return '✉️'; // Email icon
      case 'profile_update':
        return '👤'; // Profile icon
      case 'account_creation':
        return '✨'; // Sparkles icon
      default:
        return '🔔'; // Default bell icon
    }
  };
  
  // Function to get activity description
  const getActivityDescription = (activity: AccountActivity) => {
    switch (activity.activity_type) {
      case 'login':
        return 'Logged in to your account';
      case 'logout':
        return 'Logged out of your account';
      case 'password_change':
        return 'Changed your password';
      case 'email_update':
        return 'Updated your email address';
      case 'profile_update':
        return 'Updated your profile information';
      case 'account_creation':
        return 'Created your account';
      default:
        return 'Performed an account action';
    }
  };
  
  // Fetch account activity
  const fetchActivity = async (reset = false) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const newPage = reset ? 0 : page;
      const offset = newPage * limit;
      
      const { data, error } = await getAccountActivity(user.id, limit, offset);
      
      if (error) {
        setError(error.message || 'Failed to load activity history');
      } else if (data) {
        if (reset) {
          setActivities(data);
        } else {
          setActivities(prev => [...prev, ...data]);
        }
        
        setHasMore(data.length === limit);
        if (!reset) {
          setPage(prev => prev + 1);
        } else {
          setPage(1);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Load activity on component mount
  useEffect(() => {
    fetchActivity(true);
  }, [user]);
  
  // Format date for display
  const formatActivityDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      full: format(date, 'PPpp'), // Format like "Apr 29, 2023, 3:45 PM"
    };
  };
  
  if (!user) {
    return <Alert variant="destructive">Please log in to view activity history</Alert>;
  }
  
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Account Activity History</h1>
      
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This is a log of recent activity on your account, including logins, logouts, and account changes.
          </p>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              {error}
            </Alert>
          )}
          
          {loading && activities.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {activities.length === 0 ? (
                  <div className="py-4 text-center text-gray-500">
                    No activity history found
                  </div>
                ) : (
                  activities.map(activity => {
                    const date = formatActivityDate(activity.timestamp);
                    
                    return (
                      <div key={activity.id} className="py-4 first:pt-0">
                        <div className="flex items-start">
                          <div className="mr-4 text-2xl">
                            {getActivityIcon(activity.activity_type)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="font-medium">
                              {getActivityDescription(activity)}
                            </div>
                            
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              <p title={date.full}>{date.relative}</p>
                              {activity.ip_address && (
                                <p>IP: {activity.ip_address}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => fetchActivity()}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
      
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>
          <strong>Activity Log FAQ:</strong>
        </p>
        <ul className="list-disc pl-5 mt-1">
          <li>Activity history is stored for security and auditing purposes.</li>
          <li>If you see any suspicious activity, please change your password immediately.</li>
          <li>Some activities, like password changes, may trigger security emails.</li>
        </ul>
      </div>
    </div>
  );
}; 