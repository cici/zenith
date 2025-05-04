import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and tailwind-merge.
 * This utility helps prevent Tailwind class conflicts while allowing conditional classes.
 * 
 * @example
 * cn('px-2 py-1', condition && 'bg-blue-500', 'hover:bg-blue-600')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 