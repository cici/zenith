import { supabase } from '@/services/supabase';

async function main() {
  try {
    console.log('Attempting to create books table...');
    const { error } = await supabase.rpc('create_books_table');
    if (error) {
      console.error('❌ Failed to create books table:', error.message);
      process.exit(1);
    }
    console.log('✅ Books table created successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating books table:', err);
    process.exit(1);
  }
}

main(); 