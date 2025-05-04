import { AuthError } from '@supabase/supabase-js';

export interface AppError {
  message: string;
  code?: string;
  details?: string;
  severity: 'error' | 'warning' | 'info';
}

// Map of error codes to user-friendly messages
const errorMessages: Record<string, string> = {
  // Auth errors
  'auth/invalid-email': 'Please enter a valid email address',
  'auth/user-not-found': 'No account found with this email',
  'auth/wrong-password': 'Incorrect password',
  'auth/email-already-in-use': 'An account with this email already exists',
  'auth/weak-password': 'Password is too weak',
  'auth/invalid-login-credentials': 'Invalid email or password',
  'auth/requires-recent-login': 'Please log in again to continue',
  'auth/popup-closed-by-user': 'Authentication cancelled',
  'auth/network-request-failed': 'Network error. Please check your connection',
  'auth/too-many-requests': 'Too many attempts. Please try again later',
  'auth/expired-action-code': 'This link has expired. Please request a new one',
  'auth/invalid-action-code': 'Invalid verification link',
  'auth/user-disabled': 'This account has been disabled',
  
  // Database errors
  'db/connection-error': 'Unable to connect to the database. Please try again',
  'db/write-error': 'Error saving your information. Please try again',
  'db/read-error': 'Error retrieving your information. Please try again',
  'db/constraint-error': 'This information conflicts with existing data',
  'db/timeout': 'Database operation timed out. Please try again',
  'db/unavailable': 'Service temporarily unavailable. Please try again later',
  
  // Validation errors
  'validation/required': 'This field is required',
  'validation/email': 'Please enter a valid email address',
  'validation/password-length': 'Password must be at least 8 characters',
  'validation/password-uppercase': 'Password must contain at least one uppercase letter',
  'validation/password-lowercase': 'Password must contain at least one lowercase letter',
  'validation/password-number': 'Password must contain at least one number',
  'validation/password-special': 'Password must contain at least one special character',
  
  // API errors
  'api/network-error': 'Unable to connect to the server',
  'api/timeout': 'Request timed out',
  'api/server-error': 'Something went wrong on our end',
  'api/not-found': 'The requested resource was not found',
  'api/unauthorized': 'You are not authorized to perform this action',
  'api/forbidden': 'Access denied',
  'api/rate-limit': 'Too many requests. Please try again later',
  
  // Default error
  'default': 'An unexpected error occurred. Please try again'
};

// Helper function to get user-friendly message from error code
function getUserFriendlyMessage(code: string): string {
  return errorMessages[code] || errorMessages['default'];
}

// Helper function to extract error code from Supabase error message
function extractErrorCode(error: AuthError): string {
  // Handle specific Supabase error codes
  switch (error.status) {
    case 400:
      return error.message.includes('password') ? 'auth/weak-password' : 'auth/invalid-email';
    case 401:
      return 'auth/invalid-login-credentials';
    case 403:
      return 'auth/forbidden';
    case 404:
      return 'auth/user-not-found';
    case 409:
      return 'auth/email-already-in-use';
    case 429:
      return 'auth/too-many-requests';
    default:
      return 'default';
  }
}

// Helper function to extract database error code from error message
function extractDatabaseErrorCode(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('connection')) return 'db/connection-error';
  if (message.includes('timeout')) return 'db/timeout';
  if (message.includes('constraint') || message.includes('duplicate')) return 'db/constraint-error';
  if (message.includes('unavailable')) return 'db/unavailable';
  if (message.includes('write') || message.includes('save')) return 'db/write-error';
  if (message.includes('read') || message.includes('retrieve')) return 'db/read-error';
  
  return 'default';
}

// Main error handler
export function handleError(error: unknown): AppError {
  // Handle Supabase AuthError
  if (error instanceof AuthError) {
    const code = extractErrorCode(error);
    return {
      message: getUserFriendlyMessage(code),
      code,
      details: error.message,
      severity: 'error'
    };
  }

  // Handle database errors
  if (error instanceof Error && 
      (error.message.toLowerCase().includes('database') || 
       error.message.toLowerCase().includes('db'))) {
    const code = extractDatabaseErrorCode(error);
    return {
      message: getUserFriendlyMessage(code),
      code,
      details: error.message,
      severity: code === 'db/unavailable' ? 'warning' : 'error'
    };
  }

  // Handle validation errors
  if (error instanceof Error && error.message.startsWith('validation/')) {
    return {
      message: getUserFriendlyMessage(error.message),
      code: error.message,
      severity: 'warning'
    };
  }

  // Handle network errors
  if (error instanceof Error && error.name === 'NetworkError') {
    return {
      message: getUserFriendlyMessage('api/network-error'),
      code: 'api/network-error',
      details: error.message,
      severity: 'error'
    };
  }

  // Handle timeout errors
  if (error instanceof Error && error.name === 'TimeoutError') {
    return {
      message: getUserFriendlyMessage('api/timeout'),
      code: 'api/timeout',
      details: error.message,
      severity: 'error'
    };
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Check if it might be a database error based on the message
    if (error.message.toLowerCase().includes('database') || 
        error.message.toLowerCase().includes('saving') ||
        error.message.toLowerCase().includes('db')) {
      const code = extractDatabaseErrorCode(error);
      return {
        message: getUserFriendlyMessage(code),
        code,
        details: error.message,
        severity: 'error'
      };
    }

    return {
      message: error.message || getUserFriendlyMessage('default'),
      details: error.stack,
      severity: 'error'
    };
  }

  // Handle unknown errors (check for message property before defaulting)
  const errorMessage = (error as any)?.message || getUserFriendlyMessage('default');
  return {
    message: errorMessage,
    details: typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error),
    severity: 'error'
  };
}

// Specific handler for auth errors
export function handleAuthError(error: unknown): AppError {
  const appError = handleError(error);
  
  // Add authentication-specific handling
  if (error instanceof AuthError) {
    // Handle specific auth cases
    switch (error.status) {
      case 422: // Unprocessable Entity
        return {
          ...appError,
          message: 'Please check your email and password',
          severity: 'warning'
        };
      case 401: // Unauthorized
        return {
          ...appError,
          message: 'Your session has expired. Please log in again',
          severity: 'info'
        };
    }
  }
  
  return appError;
}

// Helper function to determine if an error requires user action
export function requiresUserAction(error: AppError): boolean {
  return error.code?.startsWith('auth/') || error.code?.startsWith('validation/') || false;
}

// Helper function to determine if an error is retryable
export function isRetryableError(error: AppError): boolean {
  return error.code === 'api/network-error' || 
         error.code === 'api/timeout' || 
         error.code === 'auth/too-many-requests' ||
         error.code === 'db/connection-error' ||
         error.code === 'db/timeout' ||
         error.code === 'db/write-error' ||
         error.code === 'db/unavailable' ||
         false;
}

// Helper function to get retry delay in milliseconds
export function getRetryDelay(error: AppError, attempt: number): number {
  if (!isRetryableError(error)) return 0;
  
  // Use longer delays for database errors
  const baseDelay = error.code?.startsWith('db/') ? 2000 : 1000; // 2 seconds for DB errors
  const maxDelay = error.code?.startsWith('db/') ? 45000 : 30000; // 45 seconds for DB errors
  
  // Exponential backoff with jitter
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
  const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
  
  return exponentialDelay + jitter;
} 