import { supabase } from '@/services/supabase';

async function main() {
  try {
    console.log('Attempting to create pomodoro_sessions table...');
    const { error } = await supabase.rpc('create_pomodoro_sessions_table');
    if (error) {
      console.error('❌ Failed to create pomodoro_sessions table:', error.message);
      process.exit(1);
    }
    console.log('✅ Pomodoro sessions table created successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating pomodoro_sessions table:', err);
    process.exit(1);
  }
}

main(); 