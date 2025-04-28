import { supabase } from '@/services/supabase';

async function main() {
  try {
    console.log('Attempting to create guitar_practice table...');
    const { error } = await supabase.rpc('create_guitar_practice_table');
    if (error) {
      console.error('❌ Failed to create guitar_practice table:', error.message);
      process.exit(1);
    }
    console.log('✅ Guitar practice table created successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating guitar_practice table:', err);
    process.exit(1);
  }
}

main(); 