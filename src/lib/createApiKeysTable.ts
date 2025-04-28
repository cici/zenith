import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY as string;

// Create a client with the service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function createApiKeysTable() {
  try {
    // Create the table
    const { error: tableError } = await supabase.rpc('create_api_keys_table');
    if (tableError) throw tableError;

    console.log('API keys table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating API keys table:', error);
    return false;
  }
} 