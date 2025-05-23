import { useEffect, useState } from 'react';

/**
 * useOnlineStatus - React hook to detect browser online/offline status
 * @returns {boolean} true if online, false if offline
 *
 * Usage:
 *   const isOnline = useOnlineStatus();
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
} 