import { zxcvbn, ZxcvbnResult } from '@zxcvbn-ts/core';

/**
 * Password validation rules:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for numbers
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special characters
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calculate password strength using zxcvbn
 */
export const getPasswordStrength = (password: string): ZxcvbnResult => {
  if (!password) {
    return {
      password: '',
      score: 0,
      feedback: {
        warning: '',
        suggestions: ['Enter a password'],
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
  }
  return zxcvbn(password);
};

/**
 * Get password strength label based on zxcvbn score
 */
export const getPasswordStrengthLabel = (score: number): string => {
  switch (score) {
    case 0:
      return 'Very Weak';
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Strong';
    case 4:
      return 'Very Strong';
    default:
      return 'Very Weak';
  }
};

/**
 * Get color for password strength indicator based on zxcvbn score
 */
export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
      return '#ef4444'; // red-500
    case 1:
      return '#f97316'; // orange-500
    case 2:
      return '#eab308'; // yellow-500
    case 3:
      return '#84cc16'; // lime-500
    case 4:
      return '#22c55e'; // green-500
    default:
      return '#ef4444'; // red-500
  }
}; 