import { supabase } from '@/services/supabase';

async function main() {
  try {
    console.log('Attempting to create subscriptions table...');
    const { error } = await supabase.rpc('create_subscriptions_table');
    if (error) {
      console.error('❌ Failed to create subscriptions table:', error.message);
      process.exit(1);
    }
    console.log('✅ Subscriptions table created successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating subscriptions table:', err);
    process.exit(1);
  }
}

main(); 