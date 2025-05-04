import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegistrationForm } from '../RegistrationForm';
import { AuthError } from '@supabase/supabase-js';

// Mock zxcvbn
vi.mock('@zxcvbn-ts/core', () => ({
  zxcvbn: (password: string) => {
    // Simple mock implementation
    const score = password.length >= 12 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
      ? 4 // Strong
      : password.length >= 8
      ? 2 // Fair
      : 0; // Weak

    return {
      password,
      score,
      feedback: {
        warning: score < 3 ? 'This is a weak password' : '',
        suggestions: score < 3 ? ['Make it stronger'] : [],
      },
      crackTimesSeconds: {
        onlineThrottling100PerHour: 0,
        onlineNoThrottling10PerSecond: 0,
        offlineSlowHashing1e4PerSecond: 0,
        offlineFastHashing1e10PerSecond: 0,
      },
      crackTimesDisplay: {
        onlineThrottling100PerHour: 'less than a second',
        onlineNoThrottling10PerSecond: 'less than a second',
        offlineSlowHashing1e4PerSecond: 'less than a second',
        offlineFastHashing1e10PerSecond: 'less than a second',
      },
      guesses: 0,
      guessesLog10: 0,
      sequence: [],
      calcTime: 0,
    };
  },
}));

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    signUp: vi.fn().mockImplementation((email, password) => {
      // Simulate API behavior
      if (email === 'exists@example.com') {
        throw new AuthError('Email already exists', 400);
      }
      if (email === 'network@example.com') {
        throw new Error('Network error');
      }
      return Promise.resolve();
    }),
  }),
}));

describe('RegistrationForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('renders all form elements correctly', () => {
    render(<RegistrationForm />);

    // Check for form elements
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/terms and conditions/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(<RegistrationForm onError={mockOnError} />);
    
    // Try to submit empty form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Wait for error messages to appear
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/must be at least 12 characters/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<RegistrationForm onError={mockOnError} />);
    
    // Enter invalid email
    await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email');
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('validates password requirements', async () => {
    render(<RegistrationForm onError={mockOnError} />);
    
    // Enter valid email but weak password
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'weak');
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Wait for error messages to appear
    await waitFor(() => {
      expect(screen.getByText(/must be at least 12 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/must contain at least one uppercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/must contain at least one number/i)).toBeInTheDocument();
      expect(screen.getByText(/must contain at least one special character/i)).toBeInTheDocument();
    });
  });

  it('validates password confirmation match', async () => {
    render(<RegistrationForm onError={mockOnError} />);
    
    // Enter different passwords
    await userEvent.type(screen.getByLabelText(/^password$/i), 'StrongP@ssword123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'DifferentP@ssword123');
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('requires terms acceptance', async () => {
    render(<RegistrationForm onError={mockOnError} />);
    
    // Fill form without accepting terms
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'StrongP@ssword123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'StrongP@ssword123');
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/you must accept the terms and conditions/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    render(<RegistrationForm onSuccess={mockOnSuccess} />);
    
    // Fill form correctly
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'StrongP@ssword123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'StrongP@ssword123');
    await userEvent.click(screen.getByLabelText(/terms and conditions/i));

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Check for loading state
    expect(screen.getByText(/creating account/i)).toBeInTheDocument();

    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.queryByText(/creating account/i)).not.toBeInTheDocument();
    });
  });

  it('handles successful registration', async () => {
    render(<RegistrationForm onSuccess={mockOnSuccess} />);
    
    // Fill form correctly
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'StrongP@ssword123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'StrongP@ssword123');
    await userEvent.click(screen.getByLabelText(/terms and conditions/i));

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Wait for success callback
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles duplicate email error', async () => {
    render(<RegistrationForm onError={mockOnError} />);
    
    // Fill form with existing email
    await userEvent.type(screen.getByLabelText(/email/i), 'exists@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'StrongP@ssword123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'StrongP@ssword123');
    await userEvent.click(screen.getByLabelText(/terms and conditions/i));

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/an account with this email already exists/i)).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalledWith(expect.any(AuthError));
    });
  });

  it('handles network error', async () => {
    render(<RegistrationForm onError={mockOnError} />);
    
    // Fill form with email that triggers network error
    await userEvent.type(screen.getByLabelText(/email/i), 'network@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'StrongP@ssword123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'StrongP@ssword123');
    await userEvent.click(screen.getByLabelText(/terms and conditions/i));

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/unable to connect to the server/i)).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
}); 