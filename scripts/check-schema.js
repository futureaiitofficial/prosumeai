import { sql } from 'drizzle-orm';
import { db } from '../server/db.js';

async function checkSchema() {
  try {
    // Check job_applications table structure
    const schemaInfo = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'job_applications'
    `);
    
    console.log('JOB APPLICATIONS TABLE SCHEMA:');
    console.log(JSON.stringify(schemaInfo, null, 2));
    
    // Get a sample row
    const sampleData = await db.execute(sql`
      SELECT * FROM job_applications LIMIT 1
    `);
    
    console.log('\nSAMPLE DATA:');
    console.log(JSON.stringify(sampleData, null, 2));
    
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    process.exit(0);
  }
}

checkSchema();