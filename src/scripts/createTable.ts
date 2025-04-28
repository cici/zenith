import { createApiKeysTable } from '@/lib/createApiKeysTable';

async function main() {
  try {
    // Verify required environment variables
    const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_SERVICE_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingVars.join(', '));
      console.error('Please check your .env file');
      process.exit(1);
    }

    console.log('Attempting to create API keys table...');
    const success = await createApiKeysTable();
    
    if (success) {
      console.log('✅ API keys table created successfully');
      process.exit(0);
    } else {
      console.error('❌ Failed to create API keys table');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error creating API keys table:', error);
    process.exit(1);
  }
}

main(); 