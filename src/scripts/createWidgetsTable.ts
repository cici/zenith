import { supabase } from '@/services/supabase';

async function main() {
  try {
    console.log('Attempting to create widgets table...');
    const { error } = await supabase.rpc('create_widgets_table');
    if (error) {
      console.error('❌ Failed to create widgets table:', error.message);
      process.exit(1);
    }
    console.log('✅ Widgets table created successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating widgets table:', err);
    process.exit(1);
  }
}

main(); 