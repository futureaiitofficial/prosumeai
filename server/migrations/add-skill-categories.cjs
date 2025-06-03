const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const dotenv = require('dotenv');
const { sql } = require('drizzle-orm');

// Load environment variables
dotenv.config();

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

// For migrations and one-time script execution
const migrationClient = postgres(connectionString, { max: 1 });
const db = drizzle(migrationClient);

async function runMigration() {
  try {
    console.log('Starting skill categories migration...');
    console.log('Using database connection from environment variables');

    // 1. Add the skill_categories column to resumes table
    await db.execute(sql`
      ALTER TABLE "resumes" 
      ADD COLUMN IF NOT EXISTS "skill_categories" JSONB;
    `);
    console.log('Added skill_categories column to resumes table');

    // 2. Create an index for the skill_categories column for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_resumes_skill_categories" 
      ON "resumes" USING GIN ("skill_categories");
    `);
    console.log('Created index for skill_categories column');

    // 3. Migrate existing data from technicalSkills and softSkills to skillCategories
    // This will only affect resumes that have useSkillCategories set to true
    console.log('Starting data migration for existing resumes...');
    
    const resumesWithLegacySkills = await db.execute(sql`
      SELECT id, technical_skills, soft_skills, use_skill_categories 
      FROM "resumes" 
      WHERE (technical_skills IS NOT NULL AND array_length(technical_skills, 1) > 0)
         OR (soft_skills IS NOT NULL AND array_length(soft_skills, 1) > 0)
    `);

    console.log(`Found ${resumesWithLegacySkills.length} resumes with legacy skills data`);

    let migratedCount = 0;
    
    for (const resume of resumesWithLegacySkills) {
      const skillCategories = {};
      
      // Migrate technical skills
      if (resume.technical_skills && Array.isArray(resume.technical_skills) && resume.technical_skills.length > 0) {
        skillCategories['Technical Skills'] = resume.technical_skills;
      }
      
      // Migrate soft skills
      if (resume.soft_skills && Array.isArray(resume.soft_skills) && resume.soft_skills.length > 0) {
        skillCategories['Soft Skills'] = resume.soft_skills;
      }
      
      // Only update if we have categories to migrate
      if (Object.keys(skillCategories).length > 0) {
        await db.execute(sql`
          UPDATE "resumes" 
          SET "skill_categories" = ${JSON.stringify(skillCategories)}
          WHERE "id" = ${resume.id}
        `);
        migratedCount++;
      }
    }

    console.log(`Successfully migrated ${migratedCount} resumes with skill categories`);

    // 4. For resumes that have useSkillCategories set to true, ensure they have the migrated data
    await db.execute(sql`
      UPDATE "resumes" 
      SET "use_skill_categories" = true
      WHERE "skill_categories" IS NOT NULL 
        AND "skill_categories" != '{}'::jsonb
        AND "use_skill_categories" = false
    `);
    console.log('Updated useSkillCategories flag for migrated resumes');

    console.log('Skill categories migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await migrationClient.end();
  }
}

// Run the migration
runMigration(); 