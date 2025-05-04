import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Stack } from '@/components/layout/Stack';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ErrorAlert } from '@/components/ui/error-alert';
import { handleError, AppError, isRetryableError, getRetryDelay } from '@/utils/errorHandling';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface RegistrationFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  maxRetries?: number;
}

// Form schema with Zod
const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

export function RegistrationForm({ 
  onSuccess, 
  onError,
  maxRetries = 3 
}: RegistrationFormProps) {
  const { signUp } = useAuth();
  const [error, setError] = useState<AppError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const isLoading = form.formState.isSubmitting;
  const password = form.watch('password');

  const handleSubmitWithRetry = async (data: FormData, attempt: number = 1) => {
    try {
      setError(null);
      await signUp(data.email, data.password);
      onSuccess?.();
    } catch (err) {
      console.log("Error caught in handleSubmitWithRetry:", err);
      const appError = handleError(err);
      
      // Handle retryable errors
      if (isRetryableError(appError) && attempt < maxRetries) {
        setError({
          ...appError,
          message: `${appError.message}. Retrying... (Attempt ${attempt} of ${maxRetries})`,
          severity: 'info'
        });

        // Wait for the calculated delay before retrying
        const delay = getRetryDelay(appError, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Increment retry count and try again
        setRetryCount(attempt);
        return handleSubmitWithRetry(data, attempt + 1);
      }

      // If we've exhausted retries or it's not retryable, show the error
      setError(appError);
      onError?.(err as Error);
    }
  };

  const onSubmit = (data: FormData) => handleSubmitWithRetry(data);

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        className="w-full max-w-md"
        aria-label="Registration form"
        noValidate
      >
        <Stack space="lg">
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel htmlFor="email">Email</FormLabel>
                <FormControl>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    disabled={isLoading}
                    error={!!fieldState.error}
                    aria-describedby={fieldState.error ? "email-error" : undefined}
                    required
                    {...field}
                  />
                </FormControl>
                <FormMessage id="email-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel htmlFor="password">Password</FormLabel>
                <FormControl>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Create a password"
                    disabled={isLoading}
                    error={!!fieldState.error}
                    aria-describedby={fieldState.error ? "password-error" : undefined}
                    required
                    {...field}
                  />
                </FormControl>
                <FormMessage id="password-error" />
                <PasswordStrengthIndicator password={password} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    disabled={isLoading}
                    error={!!fieldState.error}
                    aria-describedby={fieldState.error ? "confirm-password-error" : undefined}
                    required
                    {...field}
                  />
                </FormControl>
                <FormMessage id="confirm-password-error" />
              </FormItem>
            )}
          />

          {error && (
            <ErrorAlert 
              error={error}
              onDismiss={() => setError(null)}
              aria-live={error.severity === 'error' ? 'assertive' : 'polite'}
            />
          )}

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full"
            aria-busy={isLoading}
          >
            {isLoading ? (
              retryCount > 0 ? `Retrying... (${retryCount}/${maxRetries})` : 'Creating account...'
            ) : (
              'Create account'
            )}
          </Button>
        </Stack>
      </form>
    </Form>
  );
} 