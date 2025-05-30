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
    console.log('Starting blog system migration...');
    console.log('Using database connection from environment variables');

    // Create enum for blog post status
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE blog_post_status AS ENUM ('draft', 'published', 'archived', 'scheduled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('Created blog_post_status enum');

    // Create blog_categories table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "blog_categories" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL UNIQUE,
        "slug" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "parent_id" INTEGER REFERENCES "blog_categories"("id"),
        "seo_title" TEXT,
        "seo_description" TEXT,
        "seo_keywords" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "sort_order" INTEGER NOT NULL DEFAULT 0,
        "post_count" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created blog_categories table');

    // Create blog_tags table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "blog_tags" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL UNIQUE,
        "slug" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "color" TEXT DEFAULT '#4f46e5',
        "post_count" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created blog_tags table');

    // Create blog_posts table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "blog_posts" (
        "id" SERIAL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "excerpt" TEXT,
        "content" TEXT NOT NULL,
        "featured_image" TEXT,
        "featured_image_alt" TEXT,
        "status" blog_post_status NOT NULL DEFAULT 'draft',
        "seo_title" TEXT,
        "seo_description" TEXT,
        "seo_keywords" TEXT,
        "meta_tags" JSONB DEFAULT '{}',
        "canonical_url" TEXT,
        "allow_comments" BOOLEAN NOT NULL DEFAULT true,
        "is_featured" BOOLEAN NOT NULL DEFAULT false,
        "is_sticky" BOOLEAN NOT NULL DEFAULT false,
        "category_id" INTEGER REFERENCES "blog_categories"("id"),
        "author_id" INTEGER NOT NULL REFERENCES "users"("id"),
        "published_at" TIMESTAMP,
        "scheduled_at" TIMESTAMP,
        "view_count" INTEGER NOT NULL DEFAULT 0,
        "read_time" INTEGER,
        "table_of_contents" JSONB,
        "custom_fields" JSONB DEFAULT '{}',
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created blog_posts table');

    // Create blog_post_tags junction table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "blog_post_tags" (
        "id" SERIAL PRIMARY KEY,
        "post_id" INTEGER NOT NULL REFERENCES "blog_posts"("id") ON DELETE CASCADE,
        "tag_id" INTEGER NOT NULL REFERENCES "blog_tags"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("post_id", "tag_id")
      );
    `);
    console.log('Created blog_post_tags junction table');

    // Create blog_comments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "blog_comments" (
        "id" SERIAL PRIMARY KEY,
        "post_id" INTEGER NOT NULL REFERENCES "blog_posts"("id") ON DELETE CASCADE,
        "author_name" TEXT NOT NULL,
        "author_email" TEXT NOT NULL,
        "author_website" TEXT,
        "content" TEXT NOT NULL,
        "parent_id" INTEGER REFERENCES "blog_comments"("id"),
        "is_approved" BOOLEAN NOT NULL DEFAULT false,
        "is_spam" BOOLEAN NOT NULL DEFAULT false,
        "ip_address" TEXT,
        "user_agent" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created blog_comments table');

    // Create blog_settings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "blog_settings" (
        "id" SERIAL PRIMARY KEY,
        "blog_title" TEXT NOT NULL DEFAULT 'Blog',
        "blog_description" TEXT DEFAULT 'Latest news and updates',
        "blog_keywords" TEXT,
        "posts_per_page" INTEGER NOT NULL DEFAULT 10,
        "allow_comments" BOOLEAN NOT NULL DEFAULT true,
        "moderate_comments" BOOLEAN NOT NULL DEFAULT true,
        "enable_rss" BOOLEAN NOT NULL DEFAULT true,
        "enable_sitemap" BOOLEAN NOT NULL DEFAULT true,
        "featured_image_required" BOOLEAN NOT NULL DEFAULT false,
        "enable_read_time" BOOLEAN NOT NULL DEFAULT true,
        "enable_table_of_contents" BOOLEAN NOT NULL DEFAULT true,
        "social_share_buttons" JSONB DEFAULT '["twitter", "facebook", "linkedin", "email"]',
        "custom_css" TEXT,
        "custom_js" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created blog_settings table');

    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_blog_posts_status" ON "blog_posts"("status");
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_blog_posts_category" ON "blog_posts"("category_id");
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_blog_posts_author" ON "blog_posts"("author_id");
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_blog_posts_published" ON "blog_posts"("published_at");
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_blog_posts_featured" ON "blog_posts"("is_featured");
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_blog_categories_active" ON "blog_categories"("is_active");
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_blog_comments_post" ON "blog_comments"("post_id");
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_blog_comments_approved" ON "blog_comments"("is_approved");
    `);

    console.log('Created indexes for blog tables');

    // Initialize default blog settings
    await db.execute(sql`
      INSERT INTO "blog_settings" (
        "blog_title", 
        "blog_description", 
        "blog_keywords",
        "posts_per_page",
        "allow_comments",
        "moderate_comments",
        "enable_rss",
        "enable_sitemap",
        "featured_image_required",
        "enable_read_time",
        "enable_table_of_contents"
      ) VALUES (
        'Blog', 
        'Latest news and updates about resume building, career advice, and job applications', 
        'resume, career, job, AI, recruitment',
        10,
        true,
        true,
        true,
        true,
        false,
        true,
        true
      ) ON CONFLICT DO NOTHING;
    `);
    console.log('Initialized default blog settings');

    // Create some default categories
    await db.execute(sql`
      INSERT INTO "blog_categories" ("name", "slug", "description", "seo_title", "seo_description", "sort_order") VALUES
      ('Career Advice', 'career-advice', 'Tips and guidance for career development and job searching', 'Career Advice - Resume Building Tips', 'Get expert career advice and tips for building better resumes and landing your dream job', 1),
      ('Resume Tips', 'resume-tips', 'Best practices for creating effective resumes', 'Resume Tips - How to Write Better Resumes', 'Learn how to write compelling resumes that get noticed by employers and ATS systems', 2),
      ('Interview Guide', 'interview-guide', 'Guides and tips for successful job interviews', 'Interview Guide - Ace Your Next Job Interview', 'Master the art of job interviews with our comprehensive guides and expert tips', 3),
      ('Industry News', 'industry-news', 'Latest news and trends in recruitment and career development', 'Industry News - Latest Career and Job Market Trends', 'Stay updated with the latest trends in the job market and recruitment industry', 4),
      ('AI & Technology', 'ai-technology', 'How AI and technology are changing the job market', 'AI & Technology in Career Development', 'Discover how AI and technology are transforming resumes, job applications, and career development', 5)
      ON CONFLICT (slug) DO NOTHING;
    `);
    console.log('Created default blog categories');

    // Create some default tags
    await db.execute(sql`
      INSERT INTO "blog_tags" ("name", "slug", "description", "color") VALUES
      ('Resume Writing', 'resume-writing', 'Tips and techniques for writing effective resumes', '#4f46e5'),
      ('Career Development', 'career-development', 'Growth and advancement in your career', '#10b981'),
      ('Job Search', 'job-search', 'Strategies for finding and applying to jobs', '#f97316'),
      ('Interview Tips', 'interview-tips', 'How to succeed in job interviews', '#ef4444'),
      ('AI Tools', 'ai-tools', 'Artificial intelligence tools for job seekers', '#8b5cf6'),
      ('ATS Optimization', 'ats-optimization', 'Optimizing resumes for Applicant Tracking Systems', '#06b6d4'),
      ('Cover Letter', 'cover-letter', 'Writing compelling cover letters', '#f59e0b'),
      ('Professional Growth', 'professional-growth', 'Personal and professional development', '#84cc16'),
      ('Industry Trends', 'industry-trends', 'Latest trends in various industries', '#ec4899'),
      ('Remote Work', 'remote-work', 'Tips for remote work and virtual interviews', '#6366f1')
      ON CONFLICT (slug) DO NOTHING;
    `);
    console.log('Created default blog tags');

    console.log('Blog system migration completed successfully!');
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