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
 * Calculate password strength score (0-100)
 */
export const getPasswordStrength = (password: string): number => {
  let score = 0;

  // Length contribution (up to 25 points)
  score += Math.min(25, Math.floor(password.length * 2));

  // Character variety contribution (up to 75 points)
  if (/[A-Z]/.test(password)) score += 15; // uppercase
  if (/[a-z]/.test(password)) score += 15; // lowercase
  if (/\d/.test(password)) score += 15; // numbers
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15; // special chars
  if (/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{12,}$/.test(password)) score += 15; // all criteria met

  return Math.min(100, score);
};

/**
 * Get password strength label based on score
 */
export const getPasswordStrengthLabel = (score: number): string => {
  if (score >= 80) return 'Very Strong';
  if (score >= 60) return 'Strong';
  if (score >= 40) return 'Medium';
  if (score >= 20) return 'Weak';
  return 'Very Weak';
};

/**
 * Get color for password strength indicator
 */
export const getPasswordStrengthColor = (score: number): string => {
  if (score >= 80) return '#22c55e'; // green-500
  if (score >= 60) return '#84cc16'; // lime-500
  if (score >= 40) return '#eab308'; // yellow-500
  if (score >= 20) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}; 