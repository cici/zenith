import { supabase } from '@/services/supabase';

const tableFns = [
  { name: 'profiles', fn: 'create_profiles_table' },
  { name: 'widgets', fn: 'create_widgets_table' },
  { name: 'todos', fn: 'create_todos_table' },
  { name: 'pomodoro_sessions', fn: 'create_pomodoro_sessions_table' },
  { name: 'books', fn: 'create_books_table' },
  { name: 'exercises', fn: 'create_exercises_table' },
  { name: 'guitar_practice', fn: 'create_guitar_practice_table' },
  { name: 'subscriptions', fn: 'create_subscriptions_table' },
  { name: 'api_keys', fn: 'create_api_keys_table' },
];

async function main() {
  for (const { name, fn } of tableFns) {
    try {
      console.log(`Creating ${name} table...`);
      const { error } = await supabase.rpc(fn);
      if (error) {
        console.error(`❌ Failed to create ${name} table:`, error.message);
        process.exit(1);
      }
      console.log(`✅ ${name} table created successfully`);
    } catch (err) {
      console.error(`❌ Error creating ${name} table:`, err);
      process.exit(1);
    }
  }
  process.exit(0);
}

main(); 