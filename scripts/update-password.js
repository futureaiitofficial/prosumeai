#!/usr/bin/env node

/**
 * This script generates a properly hashed password for a user
 * and updates it in the database
 */

import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Generate a proper password hash for 'password'
    const hashedPassword = await hashPassword('password');
    console.log('Generated password hash:', hashedPassword);
    
    // Connect to the database
    const sql = postgres(connectionString);
    
    // Update the user's password
    const result = await sql`
      UPDATE users 
      SET password = ${hashedPassword} 
      WHERE username = 'testuser'
      RETURNING id, username
    `;
    
    if (result.length === 0) {
      console.log('User not found');
    } else {
      console.log(`Updated password for user id ${result[0].id} (${result[0].username})`);
      console.log('You can now log in with username "testuser" and password "password"');
    }
    
    // Close the database connection
    await sql.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 