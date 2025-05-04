// src/utils/dashboardUtils.ts

// --- Type Definitions (Mirroring react-grid-layout) ---

/** Represents a single layout item within the grid */
export interface LayoutItem {
  i: string;      // Item ID
  x: number;      // Grid column position (horizontal)
  y: number;      // Grid row position (vertical)
  w: number;      // Width in grid units
  h: number;      // Height in grid units
  minW?: number;   // Minimum width
  maxW?: number;   // Maximum width
  minH?: number;   // Minimum height
  maxH?: number;   // Maximum height
  static?: boolean;// If true, item cannot be moved or resized
  isDraggable?: boolean; // If false, overrides grid isDraggable
  isResizable?: boolean; // If false, overrides grid isResizable
  resizeHandles?: Array<'s' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne'>;
  isBounded?: boolean; // If true, stops drag outside container
}

/** Represents an array of layout items for a single breakpoint */
export type Layout = LayoutItem[];

/** Represents the complete layout configuration across multiple breakpoints */
export interface Layouts {
  [breakpoint: string]: Layout; // e.g., { lg: Layout, md: Layout, ... }
}

// --- Validation Function ---

/**
 * Basic validation to check if the fetched data resembles the Layouts structure.
 * This acts as a simple deserialization check.
 * @param data - The data fetched from the database (expected to be layout_data)
 * @returns True if the data appears to be a valid Layouts object, false otherwise.
 */
export function isValidLayoutsObject(data: any): data is Layouts {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    console.error('Invalid Layouts: Data is not an object.');
    return false;
  }

  // Check if all top-level keys have array values
  for (const breakpoint in data) {
    if (Object.prototype.hasOwnProperty.call(data, breakpoint)) {
      const layout = data[breakpoint];
      if (!Array.isArray(layout)) {
        console.error(`Invalid Layouts: Layout for breakpoint "${breakpoint}" is not an array.`);
        return false;
      }
      // Optional: Add deeper validation for LayoutItem structure if needed
      // for (const item of layout) {
      //   if (typeof item !== 'object' || item === null || ... check required fields ... ) {
      //     return false;
      //   }
      // }
    }
  }

  // If all checks pass, assume it's a valid Layouts object
  return true;
}

// Note: Explicit serialization function is usually not needed
// as the Supabase client library handles JS object -> JSONB conversion.

// --- Local Storage Utilities ---

const LOCAL_STORAGE_KEY = 'dashboardLayout';

/**
 * Saves the layout object to local storage.
 * @param layouts - The Layouts object to save.
 */
export function saveLayoutToLocalStorage(layouts: Layouts): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(layouts));
    console.log('Layout saved to local storage.');
  } catch (error) {
    console.error('Error saving layout to local storage:', error);
  }
}

/**
 * Loads the layout object from local storage.
 * @returns The Layouts object or null if not found, invalid, or error occurred.
 */
export function loadLayoutFromLocalStorage(): Layouts | null {
  try {
    const storedLayout = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedLayout) {
      const parsedLayout = JSON.parse(storedLayout);
      if (isValidLayoutsObject(parsedLayout)) {
        console.log('Layout loaded from local storage.');
        return parsedLayout;
      } else {
        console.warn('Invalid layout data found in local storage. Removing.');
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error('Error loading layout from local storage:', error);
    return null;
  }
} 