// src/services/dashboardLayoutService.ts
import { supabase } from '@/services/supabase'; // Corrected import path
import { Layouts, isValidLayoutsObject } from '@/utils/dashboardUtils';

const TABLE_NAME = 'dashboard_layouts';

// Placeholder for the Supabase client - replace with actual import later
// const supabase: any = null; // REMOVED Placeholder
// if (!supabase) {
//     console.warn('Supabase client is not initialized in dashboardLayoutService. Functions will not work.'); // REMOVED Warning
// }

/**
 * Fetches the specified dashboard layout for the current user.
 * @param layoutName - The name of the layout to fetch (defaults to 'default').
 * @returns The Layouts object or null if not found or invalid.
 */
export const getLayout = async (layoutName: string = 'default'): Promise<Layouts | null> => {
  console.log(`Attempting to fetch layout: ${layoutName}`);
  // if (!supabase) return null; // REMOVED Early exit check

  // --- Supabase Logic (Uncommented) ---
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    console.error('Error fetching user or user not logged in:', userError);
    return null;
  }

  const userId = userData.user.id;
  console.log(`Fetching layout for user: ${userId}, layout: ${layoutName}`);

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('layout_data')
    .eq('user_id', userId)
    .eq('layout_name', layoutName)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log(`No layout found for user ${userId}, layout: ${layoutName}. Will use default.`);
      return null;
    } else {
      console.error(`Error fetching layout (user: ${userId}, layout: ${layoutName}):`, error);
      return null;
    }
  }

  if (data && data.layout_data && isValidLayoutsObject(data.layout_data)) {
    console.log(`Successfully fetched and validated layout: ${layoutName}`);
    return data.layout_data;
  } else {
    console.error(`Fetched layout data is invalid or missing for user ${userId}, layout: ${layoutName}. Data:`, data);
    return null;
  }
  // --- End Supabase Logic ---
  // return null; // REMOVED Default return
};

/**
 * Saves (Upserts) the dashboard layout for the current user.
 * @param layoutData - The Layouts object to save.
 * @param layoutName - The name of the layout to save (defaults to 'default').
 * @returns True if successful, false otherwise.
 */
export const saveLayout = async (layoutData: Layouts, layoutName: string = 'default'): Promise<boolean> => {
  console.log(`Attempting to save layout: ${layoutName}`);
  // if (!supabase) return false; // REMOVED Early exit check

  // --- Supabase Logic (Uncommented) ---
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    console.error('Error fetching user or user not logged in for save:', userError);
    return false;
  }

  const userId = userData.user.id;
  console.log(`Saving layout for user: ${userId}, layout: ${layoutName}`);

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert({
      user_id: userId,
      layout_name: layoutName,
      layout_data: layoutData,
    }, {
      onConflict: 'user_id, layout_name'
    });

  if (error) {
    console.error(`Error saving layout (user: ${userId}, layout: ${layoutName}):`, error);
    return false;
  } else {
    console.log(`Successfully saved layout: ${layoutName}`);
    return true;
  }
  // --- End Supabase Logic ---
  // return false; // REMOVED Default return
};

// Add functions for createLayout, deleteLayout, listLayouts etc. if needed later. 