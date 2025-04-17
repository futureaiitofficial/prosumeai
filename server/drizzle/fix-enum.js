import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

async function fixEnum() {
  console.log('Starting enum fix...');
  
  // Create a PostgreSQL connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // 1. Fix any invalid status values first
    const updateInvalid = await pool.query(`
      UPDATE job_applications
      SET status = 'applied'
      WHERE status NOT IN ('applied', 'screening', 'interview', 'assessment', 'offer', 'rejected', 'accepted')
    `);
    console.log('Fixed invalid status values:', updateInvalid.rowCount || 0, 'rows affected');

    // 2. Temporarily allow NULL values to facilitate conversion
    await pool.query(`ALTER TABLE job_applications ALTER COLUMN status DROP NOT NULL`);
    console.log('NOT NULL constraint removed temporarily');

    // 3. Convert the column from text to enum
    await pool.query(`
      ALTER TABLE job_applications 
      ALTER COLUMN status TYPE job_application_status 
      USING status::job_application_status
    `);
    console.log('Column type converted to enum');

    // 4. Restore NOT NULL constraint
    await pool.query(`ALTER TABLE job_applications ALTER COLUMN status SET NOT NULL`);
    console.log('NOT NULL constraint restored');

    // 5. Set default value
    await pool.query(`ALTER TABLE job_applications ALTER COLUMN status SET DEFAULT 'applied'`);
    console.log('Default value set to "applied"');

    // 6. Verify the change
    const result = await pool.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'job_applications' AND column_name = 'status'
    `);
    console.log('Status column information:', result.rows[0]);

    console.log('Enum fix completed successfully!');
  } catch (error) {
    console.error('Error fixing enum:', error);
  } finally {
    await pool.end();
  }
}

fixEnum().catch(console.error); 