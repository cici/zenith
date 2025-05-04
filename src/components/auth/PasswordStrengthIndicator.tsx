import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/cn';

export interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
}

export function PasswordStrengthIndicator({ 
  password,
  className 
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo((): StrengthResult => {
    if (!password) {
      return { score: 0, label: 'No password', color: 'bg-gray-200' };
    }

    let score = 0;
    const checks = [
      password.length >= 8,                    // +20%
      /[A-Z]/.test(password),                 // +20%
      /[a-z]/.test(password),                 // +20%
      /[0-9]/.test(password),                 // +20%
      /[^A-Za-z0-9]/.test(password),          // +20%
    ];

    score = (checks.filter(Boolean).length / checks.length) * 100;

    if (score === 0) return { score, label: 'Very weak', color: 'bg-destructive' };
    if (score <= 20) return { score, label: 'Weak', color: 'bg-destructive' };
    if (score <= 40) return { score, label: 'Fair', color: 'bg-warning' };
    if (score <= 60) return { score, label: 'Good', color: 'bg-info' };
    if (score <= 80) return { score, label: 'Strong', color: 'bg-success' };
    return { score, label: 'Very strong', color: 'bg-success' };
  }, [password]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between text-sm">
        <span>Password strength:</span>
        <span className={cn(
          strength.score >= 60 && 'text-success',
          strength.score >= 40 && strength.score < 60 && 'text-info',
          strength.score >= 20 && strength.score < 40 && 'text-warning',
          strength.score < 20 && 'text-destructive'
        )}>
          {strength.label}
        </span>
      </div>
      <Progress 
        value={strength.score} 
        max={100}
        className={cn('h-2', strength.color)}
        aria-label="Password strength indicator"
      />
    </div>
  );
} 