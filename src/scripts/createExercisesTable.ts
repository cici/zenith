import { supabase } from '@/services/supabase';

async function main() {
  try {
    console.log('Attempting to create exercises table...');
    const { error } = await supabase.rpc('create_exercises_table');
    if (error) {
      console.error('❌ Failed to create exercises table:', error.message);
      process.exit(1);
    }
    console.log('✅ Exercises table created successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating exercises table:', err);
    process.exit(1);
  }
}

main(); 