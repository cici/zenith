import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';
import { AuthError } from '@supabase/supabase-js';

// Mock the useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: vi.fn().mockImplementation((email, password) => {
      // Simulate API behavior
      if (email === 'invalid@example.com') {
        throw new AuthError('Invalid credentials', 400);
      }
      if (email === 'network@example.com') {
        throw new Error('Network error');
      }
      return Promise.resolve();
    }),
  }),
}));

describe('LoginForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('renders all form elements correctly', () => {
    render(<LoginForm />);

    // Check for form elements
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(<LoginForm onError={mockOnError} />);
    
    // Try to submit empty form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for error messages to appear
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<LoginForm onError={mockOnError} />);
    
    // Enter invalid email
    await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    render(<LoginForm onSuccess={mockOnSuccess} />);
    
    // Fill form correctly
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check for loading state
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();

    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument();
    });
  });

  it('handles successful login', async () => {
    render(<LoginForm onSuccess={mockOnSuccess} />);
    
    // Fill form correctly
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for success callback
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles authentication error', async () => {
    render(<LoginForm onError={mockOnError} />);
    
    // Fill form with invalid credentials
    await userEvent.type(screen.getByLabelText(/email/i), 'invalid@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalledWith(expect.any(AuthError));
    });
  });

  it('handles network error', async () => {
    render(<LoginForm onError={mockOnError} />);
    
    // Fill form with email that triggers network error
    await userEvent.type(screen.getByLabelText(/email/i), 'network@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/unable to connect to the server/i)).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it('remembers user when remember me is checked', async () => {
    render(<LoginForm onSuccess={mockOnSuccess} />);
    
    // Fill form correctly and check remember me
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByLabelText(/remember me/i));

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for success callback
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
}); 