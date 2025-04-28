import { supabase } from '@/services/supabase';

async function main() {
  try {
    console.log('Attempting to create profiles table...');
    const { error } = await supabase.rpc('create_profiles_table');
    if (error) {
      console.error('❌ Failed to create profiles table:', error.message);
      process.exit(1);
    }
    console.log('✅ Profiles table created successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating profiles table:', err);
    process.exit(1);
  }
}

main(); 