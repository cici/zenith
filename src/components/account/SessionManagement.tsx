import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getActiveSessions, terminateSession, terminateAllOtherSessions } from '@/services/accountService';
import { ActiveSession } from '@/services/accountService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export const SessionManagement: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Fetch active sessions
  const fetchSessions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await getActiveSessions(user.id);
      
      if (error) {
        setError(error.message || 'Failed to load sessions');
      } else if (data) {
        setSessions(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Load sessions on component mount
  useEffect(() => {
    fetchSessions();
  }, [user]);
  
  // Handle session termination
  const handleTerminateSession = async (sessionId: string) => {
    try {
      setActionStatus(null);
      
      const { success, error } = await terminateSession(sessionId);
      
      if (success) {
        setActionStatus({
          type: 'success',
          message: 'Session terminated successfully',
        });
        
        // Refresh the session list
        fetchSessions();
      } else {
        setActionStatus({
          type: 'error',
          message: error.message || 'Failed to terminate session',
        });
      }
    } catch (err) {
      setActionStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    }
  };
  
  // Handle termination of all other sessions
  const handleTerminateAllOtherSessions = async () => {
    try {
      setActionStatus(null);
      
      const { success, error } = await terminateAllOtherSessions();
      
      if (success) {
        setActionStatus({
          type: 'success',
          message: 'All other sessions terminated successfully',
        });
        
        // Refresh the session list
        fetchSessions();
      } else {
        setActionStatus({
          type: 'error',
          message: error.message || 'Failed to terminate other sessions',
        });
      }
    } catch (err) {
      setActionStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    }
  };
  
  if (!user) {
    return <Alert variant="destructive">Please log in to view sessions</Alert>;
  }
  
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Active Sessions</h1>
      
      {actionStatus && (
        <Alert 
          variant={actionStatus.type === 'success' ? 'default' : 'destructive'}
          className="mb-4"
        >
          {actionStatus.message}
        </Alert>
      )}
      
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex flex-row items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Sessions</h2>
            
            <Button 
              variant="outline" 
              onClick={handleTerminateAllOtherSessions}
              disabled={loading || sessions.filter(s => !s.is_current).length === 0}
            >
              Logout from All Other Devices
            </Button>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            These are your active sessions across all devices. You can terminate any session to log out from that device.
          </p>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              {error}
            </Alert>
          )}
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {sessions.length === 0 ? (
                <div className="py-4 text-center text-gray-500">
                  No active sessions found
                </div>
              ) : (
                sessions.map(session => (
                  <div key={session.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-md font-medium">
                            {session.device_info || 'Unknown Device'}
                          </span>
                          
                          {session.is_current && (
                            <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800">
                              Current Session
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <p>IP: {session.ip_address || 'Unknown'}</p>
                          <p>
                            Last active: {
                              session.last_active_at 
                                ? formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true })
                                : 'Unknown'
                            }
                          </p>
                          <p>
                            Created: {
                              session.created_at
                                ? formatDistanceToNow(new Date(session.created_at), { addSuffix: true })
                                : 'Unknown'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleTerminateSession(session.id)}
                        disabled={loading}
                      >
                        {session.is_current ? 'Log Out' : 'Terminate'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Card>
      
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>
          <strong>Security Tips:</strong>
        </p>
        <ul className="list-disc pl-5 mt-1">
          <li>Regularly review your active sessions and terminate any you don't recognize.</li>
          <li>If you suspect unauthorized access, change your password immediately.</li>
          <li>Use the "Logout from All Other Devices" button after changing your password for maximum security.</li>
        </ul>
      </div>
    </div>
  );
}; 