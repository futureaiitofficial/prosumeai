import { db } from '../config/db';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

async function checkDbConnection() {
  console.log('Checking database connection...');
  
  // Print current environment
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // Check for .env file
  const envPath = path.resolve(process.cwd(), '.env');
  console.log('.env file exists:', fs.existsSync(envPath));
  
  // Print database connection info (without credentials)
  if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;
    const sanitizedUrl = dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log('DATABASE_URL:', sanitizedUrl);
  } else {
    console.log('DATABASE_URL is not set');
  }
  
  // Display any other database-related env vars (sanitized)
  const dbEnvVars: Record<string, string | undefined> = Object.keys(process.env)
    .filter(key => key.includes('DB_') || key.includes('DATABASE'))
    .reduce((obj: Record<string, string | undefined>, key) => {
      // Mask potential passwords
      let value = process.env[key];
      if (key.includes('PASS') || key.includes('SECRET')) {
        value = '***';
      }
      obj[key] = value;
      return obj;
    }, {});
  
  console.log('Database-related environment variables:', dbEnvVars);
  
  try {
    // Try a simple query to check connection
    const result = await db.execute('SELECT 1 as test');
    console.log('Database connection successful!', result);
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    
    // Check what's in db config
    try {
      // Check the db configuration
      const dbConfigPath = path.resolve(process.cwd(), 'server', 'config', 'db.ts');
      if (fs.existsSync(dbConfigPath)) {
        const dbConfigContent = fs.readFileSync(dbConfigPath, 'utf8');
        console.log('\nDB config file content:');
        console.log(dbConfigContent);
      }
    } catch (err) {
      console.error('Error reading db config:', err);
    }
    
    return false;
  }
}

// Run the function
checkDbConnection().then((success) => {
  console.log('Check completed with status:', success ? 'SUCCESS' : 'FAILED');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Script execution failed:', error);
  process.exit(1);
}); 