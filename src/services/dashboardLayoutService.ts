// src/services/dashboardLayoutService.ts
import { supabase } from '@/services/supabase';
import { Layouts, isValidLayoutsObject } from '@/utils/dashboardUtils';

const TABLE_NAME = 'dashboard_layouts';
const LOCAL_STORAGE_KEY = 'zenith_dashboard_layouts';

// Helper function to check if we should use local storage
async function shouldUseLocalStorage(): Promise<boolean> {
  try {
    // Try to access supabase auth
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('Auth error, using local storage fallback for dashboard layouts:', error.message);
      return true;
    }
    
    // If there's no session data or no user, use local storage
    if (!data.session || !data.session.user) {
      console.log('No active session, using local storage fallback for dashboard layouts');
      return true;
    }
    
    // There's an active session, use Supabase
    return false;
  } catch (error) {
    // If there's an error accessing auth, use local storage
    console.log('Using local storage fallback for dashboard layouts:', error);
    return true;
  }
}

// Get a demo user ID for local storage
function getDemoUserId(): string {
  return 'demo-user';
}

/**
 * Fetches the specified dashboard layout for the current user.
 * @param layoutName - The name of the layout to fetch (defaults to 'default').
 * @returns The Layouts object or null if not found or invalid.
 */
export const getLayout = async (layoutName: string = 'default'): Promise<Layouts | null> => {
  console.log(`Attempting to fetch layout: ${layoutName}`);

  // Check if we should use local storage
  if (await shouldUseLocalStorage()) {
    // Local storage implementation
    try {
      const key = `${LOCAL_STORAGE_KEY}_${getDemoUserId()}_${layoutName}`;
      const stored = localStorage.getItem(key);
      
      if (!stored) {
        console.log(`No layout found in local storage for layout: ${layoutName}. Will use default.`);
        return null;
      }
      
      const layoutData = JSON.parse(stored);
      if (isValidLayoutsObject(layoutData)) {
        console.log(`Successfully fetched and validated layout from local storage: ${layoutName}`);
        return layoutData;
      } else {
        console.error(`Stored layout data is invalid for layout: ${layoutName}.`);
        return null;
      }
    } catch (error) {
      console.error('Error fetching layout from local storage:', error);
      return null;
    }
  }

  // Supabase implementation
  try {
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
  } catch (error) {
    console.error(`Unexpected error fetching layout (layout: ${layoutName}):`, error);
    return null;
  }
};

/**
 * Saves (Upserts) the dashboard layout for the current user.
 * @param layoutData - The Layouts object to save.
 * @param layoutName - The name of the layout to save (defaults to 'default').
 * @returns True if successful, false otherwise.
 */
export const saveLayout = async (layoutData: Layouts, layoutName: string = 'default'): Promise<boolean> => {
  console.log(`Attempting to save layout: ${layoutName}`);

  // Check if we should use local storage
  if (await shouldUseLocalStorage()) {
    // Local storage implementation
    try {
      const key = `${LOCAL_STORAGE_KEY}_${getDemoUserId()}_${layoutName}`;
      localStorage.setItem(key, JSON.stringify(layoutData));
      console.log(`Successfully saved layout to local storage: ${layoutName}`);
      return true;
    } catch (error) {
      console.error('Error saving layout to local storage:', error);
      return false;
    }
  }

  // Supabase implementation
  try {
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
  } catch (error) {
    console.error(`Unexpected error saving layout (layout: ${layoutName}):`, error);
    return false;
  }
};

// Add functions for createLayout, deleteLayout, listLayouts etc. if needed later. 