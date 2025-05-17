import 'dotenv/config';
import { pool } from '../config/db.js';

/**
 * Cleanup expired sessions from the database
 * This is meant to be run as a scheduled job
 */
export async function cleanupExpiredSessions() {
  console.log('Starting session cleanup...');
  
  try {
    // Using the connect-pg-simple table schema
    const result = await pool.query(`
      DELETE FROM "session" 
      WHERE "expire" < NOW()
    `);
    
    console.log(`Cleaned up ${result.count} expired sessions`);
    return result.count;
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    throw error;
  }
}

// Allow running script directly 
if (process.argv[1].includes('cleanup-sessions')) {
  cleanupExpiredSessions()
    .then(count => {
      console.log(`Session cleanup complete. Removed ${count} expired sessions.`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Session cleanup failed:', error);
      process.exit(1);
    });
} 