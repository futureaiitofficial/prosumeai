// Script to reset all user passwords in database
import pg from 'pg';
import crypto from 'crypto';
import { promisify } from 'util';
const { Client } = pg;

// Use scrypt for proper password hashing
const scryptAsync = promisify(crypto.scrypt);

// Function to hash password properly
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

// Connection string from command line or default
const connectionString = process.argv[2] || 'postgres://raja:raja@localhost:5432/prosumeai';

async function resetAllPasswords() {
  const client = new Client({
    connectionString
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // First hash the password
    console.log('Generating properly hashed password for "Password123"');
    const hashedPassword = await hashPassword('Password123');
    console.log(`Generated hash: ${hashedPassword}`);
    console.log(`Hash format valid: ${hashedPassword.includes('.')}`);
    
    // Get all users
    const { rows: users } = await client.query('SELECT id, username FROM users');
    console.log(`Found ${users.length} users`);

    // Update each user's password
    for (const user of users) {
      await client.query(
        'UPDATE users SET password = $1, failed_login_attempts = 0, lockout_until = NULL, last_password_change = NOW() WHERE id = $2',
        [hashedPassword, user.id]
      );
      console.log(`Reset password for user ${user.username} (ID: ${user.id})`);
    }

    console.log('All passwords reset successfully to "Password123"');
  } catch (error) {
    console.error('Error resetting passwords:', error);
  } finally {
    await client.end();
  }
}

resetAllPasswords(); 