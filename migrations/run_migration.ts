import { runMigration as addLastLoginMigration } from './add_last_login';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log('Starting migrations...');
  
  try {
    // Run migrations in sequence
    await addLastLoginMigration();
    
    console.log('All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this is the main module
// Use import.meta.url check instead of require.main for ES modules
const isMainModule = import.meta.url.endsWith(process.argv[1]);
if (isMainModule) {
  main();
}

export { main as runMigrations }; 