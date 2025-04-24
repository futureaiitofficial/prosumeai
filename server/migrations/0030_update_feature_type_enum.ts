import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

// Migration to update feature_type enum
export async function updateFeatureTypeEnum() {
  console.log('Starting migration to update feature_type enum...');
  
  // Use environment variables or fallback to provided value
  const dbUrl = process.env.DATABASE_URL || 'postgres://raja:raja@localhost:5432/prosumeai';
  
  // Create a postgres client
  const client = postgres(dbUrl, { max: 1 });
  
  try {
    // Step 0: Update the enum type to include new values
    console.log('Updating feature_type enum to include new values...');
    await client`
      ALTER TYPE feature_type ADD VALUE IF NOT EXISTS 'ESSENTIAL';
    `;
    await client`
      ALTER TYPE feature_type ADD VALUE IF NOT EXISTS 'ADVANCED';
    `;
    await client`
      ALTER TYPE feature_type ADD VALUE IF NOT EXISTS 'PROFESSIONAL';
    `;
    console.log('Enum values added.');
    
    // Check if the temporary column already exists
    const columnCheck = await client`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'features' AND column_name = 'feature_type_temp';
    `;
    const tempColumnExists = columnCheck.length > 0;
    console.log(tempColumnExists ? 'Temporary column already exists, skipping creation.' : 'Temporary column does not exist, will create it.');
    // Step 1: Add a temporary column with the new enum if it doesn't exist
    if (!tempColumnExists) {
      await client`
        ALTER TABLE features ADD COLUMN feature_type_temp feature_type;
      `;
      console.log('Temporary column created.');
    }
    // Check if the original column exists
    const origColumnCheck = await client`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'features' AND column_name = 'feature_type';
    `;
    const origColumnExists = origColumnCheck.length > 0;
    console.log(origColumnExists ? 'Original column exists, will update data.' : 'Original column already dropped, skipping data update.');
    if (origColumnExists) {
      // Step 2: Update the temporary column with mapped values from the old enum
      await client`
        UPDATE features SET feature_type_temp = CASE feature_type 
          WHEN 'CORE' THEN 'ESSENTIAL' 
          WHEN 'PREMIUM' THEN 'ADVANCED' 
          WHEN 'ENTERPRISE' THEN 'PROFESSIONAL' 
          ELSE 'ESSENTIAL' END::feature_type;
      `;
      console.log('Data updated in temporary column.');
      // Step 3: Drop the old column and rename the temporary column
      await client`
        ALTER TABLE features DROP COLUMN feature_type;
      `;
      console.log('Original column dropped.');
    }
    // Check if the rename has already happened
    const finalColumnCheck = await client`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'features' AND column_name = 'feature_type';
    `;
    const finalColumnExists = finalColumnCheck.length > 0;
    if (!finalColumnExists) {
      await client`
        ALTER TABLE features RENAME COLUMN feature_type_temp TO feature_type;
      `;
      console.log('Temporary column renamed to feature_type.');
    } else {
      console.log('Final column already exists, skipping rename.');
    }
    console.log('Migration completed: feature_type enum updated to ESSENTIAL, ADVANCED, PROFESSIONAL.');
  } catch (error) {
    console.error('Error during migration of feature_type enum:', error);
    throw error;
  } finally {
    // Close the postgres client
    await client.end();
  }
}

updateFeatureTypeEnum().catch((err) => {
  console.error('Migration failed:', err);
}); 