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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  maxRetries?: number;
}

// Form schema with Zod
const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export function LoginForm({ 
  onSuccess, 
  onError,
  maxRetries = 3 
}: LoginFormProps) {
  const { signIn } = useAuth();
  const [error, setError] = useState<AppError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const isLoading = form.formState.isSubmitting;

  const handleSubmitWithRetry = async (data: FormData, attempt: number = 1) => {
    try {
      setError(null);
      await signIn(data.email, data.password, data.rememberMe);
      onSuccess?.();
    } catch (err) {
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
        aria-label="Login form"
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
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    disabled={isLoading}
                    error={!!fieldState.error}
                    aria-describedby={fieldState.error ? "password-error" : undefined}
                    required
                    {...field}
                  />
                </FormControl>
                <FormMessage id="password-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    id="rememberMe"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                    aria-describedby="remember-me-label"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel 
                    htmlFor="rememberMe" 
                    className="text-sm cursor-pointer"
                    id="remember-me-label"
                  >
                    Remember me
                  </FormLabel>
                </div>
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
              retryCount > 0 ? `Retrying... (${retryCount}/${maxRetries})` : 'Signing in...'
            ) : (
              'Sign in'
            )}
          </Button>
        </Stack>
      </form>
    </Form>
  );
} 