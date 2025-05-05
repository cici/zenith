import { Todo } from '@/services/database';

/**
 * Todo validation errors object
 */
export interface TodoValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates a todo item before creation or update
 * Checks for required fields and proper data types
 */
export function validateTodo(todo: Partial<Todo>): TodoValidationResult {
  const errors: Record<string, string> = {};
  
  // Validate required fields
  if (!todo.title) {
    errors.title = 'Title is required';
  } else if (typeof todo.title !== 'string') {
    errors.title = 'Title must be a string';
  } else if (todo.title.trim().length === 0) {
    errors.title = 'Title cannot be empty';
  } else if (todo.title.length > 100) {
    errors.title = 'Title cannot exceed 100 characters';
  }
  
  if (!todo.user_id) {
    errors.user_id = 'User ID is required';
  }

  // Validate optional fields if they're present
  if (todo.description !== undefined && typeof todo.description !== 'string') {
    errors.description = 'Description must be a string';
  }

  if (todo.due_date !== undefined) {
    if (typeof todo.due_date !== 'string') {
      errors.due_date = 'Due date must be a string in ISO format or valid date string';
    } else {
      const date = new Date(todo.due_date);
      if (isNaN(date.getTime())) {
        errors.due_date = 'Due date must be a valid date string';
      }
    }
  }

  if (todo.priority !== undefined) {
    if (typeof todo.priority !== 'number') {
      errors.priority = 'Priority must be a number';
    } else if (![1, 2, 3].includes(todo.priority)) {
      errors.priority = 'Priority must be 1 (high), 2 (medium), or 3 (low)';
    }
  }

  if (todo.completed !== undefined && typeof todo.completed !== 'boolean') {
    errors.completed = 'Completed must be a boolean';
  }

  if (todo.tags !== undefined) {
    if (!Array.isArray(todo.tags)) {
      errors.tags = 'Tags must be an array of strings';
    } else {
      const invalidTags = todo.tags.filter(tag => typeof tag !== 'string');
      if (invalidTags.length > 0) {
        errors.tags = 'All tags must be strings';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates data for a new todo creation
 * Ensures all required fields are present
 */
export function validateNewTodo(todo: Partial<Todo>): TodoValidationResult {
  const baseValidation = validateTodo(todo);
  
  // For new todos, certain fields are always required
  if (!todo.user_id) {
    baseValidation.errors.user_id = 'User ID is required for new todos';
    baseValidation.isValid = false;
  }
  
  if (!todo.title) {
    baseValidation.errors.title = 'Title is required for new todos';
    baseValidation.isValid = false;
  }
  
  return baseValidation;
}

/**
 * Validates data for an update to an existing todo
 * Allows partial updates
 */
export function validateTodoUpdate(updates: Partial<Todo>): TodoValidationResult {
  return validateTodo(updates);
} 