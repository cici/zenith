import { AppError } from '@/utils/errorHandling';
import { cn } from '@/utils/cn';
import { AlertCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ErrorAlertProps {
  error: AppError;
  onDismiss?: () => void;
  className?: string;
  'aria-live'?: 'polite' | 'assertive' | 'off';
}

export function ErrorAlert({ 
  error, 
  onDismiss, 
  className,
  'aria-live': ariaLive = 'assertive'
}: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  // Auto-dismiss info messages after 5 seconds
  useEffect(() => {
    if (error.severity === 'info') {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle animation end
  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        setShouldRender(false);
        onDismiss?.();
      }, 300); // Match this with CSS animation duration
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  if (!shouldRender) return null;

  const severityStyles = {
    error: 'bg-destructive/15 text-destructive border-destructive/50',
    warning: 'bg-warning/15 text-warning border-warning/50',
    info: 'bg-info/15 text-info border-info/50'
  };

  const SeverityIcon = {
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  }[error.severity];

  return (
    <div
      role="alert"
      aria-live={ariaLive}
      className={cn(
        'relative rounded-lg border p-4 transition-all duration-300',
        severityStyles[error.severity],
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <SeverityIcon className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium leading-6">{error.message}</p>
          {error.details && error.severity === 'error' && (
            <p className="mt-1 text-sm opacity-90">
              {error.details}
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="ml-4 inline-flex h-6 w-6 items-center justify-center rounded-full opacity-50 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Dismiss error"
          >
            <AlertCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
} 