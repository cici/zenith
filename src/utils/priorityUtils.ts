/**
 * Convert a numeric priority to its text label
 * Priority values: 1 = high, 2 = medium, 3 = low
 */
export function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 1:
      return 'High priority';
    case 2:
      return 'Medium priority';
    case 3:
      return 'Low priority';
    default:
      return 'Unknown priority';
  }
}

/**
 * Get CSS classes for priority level styling
 */
export function getPriorityClasses(priority: number): string {
  switch (priority) {
    case 1:
      return 'text-red-500 font-medium';
    case 2:
      return 'text-yellow-500';
    case 3:
      return 'text-green-500';
    default:
      return '';
  }
}

/**
 * Get all available priority options
 */
export function getPriorityOptions(): { value: number; label: string }[] {
  return [
    { value: 1, label: 'High' },
    { value: 2, label: 'Medium' },
    { value: 3, label: 'Low' }
  ];
} 