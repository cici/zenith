import { supabase } from '@/services/supabase';

async function main() {
  try {
    console.log('Attempting to create todos table...');
    const { error } = await supabase.rpc('create_todos_table');
    if (error) {
      console.error('❌ Failed to create todos table:', error.message);
      process.exit(1);
    }
    console.log('✅ Todos table created successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating todos table:', err);
    process.exit(1);
  }
}

main(); 