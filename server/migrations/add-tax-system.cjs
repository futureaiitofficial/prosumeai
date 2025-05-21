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
    console.log('Starting tax system migration...');
    console.log('Using database connection from environment variables');

    // Create tax_type enum
    const taxTypeEnumExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'tax_type'
      );
    `);
    
    if (!taxTypeEnumExists[0].exists) {
      console.log('Creating tax_type enum...');
      await db.execute(sql`
        CREATE TYPE tax_type AS ENUM ('GST', 'CGST', 'SGST', 'IGST');
      `);
      console.log('tax_type enum created successfully');
    } else {
      console.log('tax_type enum already exists');
    }

    // Check if tax_settings table exists
    const taxSettingsExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tax_settings'
      );
    `);
    
    if (!taxSettingsExists[0].exists) {
      console.log('Creating tax_settings table...');
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "tax_settings" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "type" tax_type NOT NULL,
          "percentage" DECIMAL(5, 2) NOT NULL,
          "country" TEXT NOT NULL,
          "state_applicable" TEXT,
          "enabled" BOOLEAN NOT NULL DEFAULT true,
          "apply_to_region" target_region NOT NULL,
          "apply_currency" currency NOT NULL,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('tax_settings table created successfully');
      
      // Insert default GST settings for India
      await db.execute(sql`
        INSERT INTO "tax_settings" (
          "name", 
          "type", 
          "percentage", 
          "country", 
          "state_applicable", 
          "enabled", 
          "apply_to_region", 
          "apply_currency"
        ) VALUES (
          'GST', 
          'GST', 
          18.00, 
          'IN', 
          NULL, 
          true, 
          'INDIA', 
          'INR'
        ), (
          'CGST', 
          'CGST', 
          9.00, 
          'IN', 
          NULL, 
          true, 
          'INDIA', 
          'INR'
        ), (
          'SGST', 
          'SGST', 
          9.00, 
          'IN', 
          NULL, 
          true, 
          'INDIA', 
          'INR'
        ), (
          'IGST', 
          'IGST', 
          18.00, 
          'IN', 
          NULL, 
          true, 
          'INDIA', 
          'INR'
        );
      `);
      console.log('Inserted default tax settings for India');
    } else {
      console.log('tax_settings table already exists');
    }

    // Check if company_tax_info table exists
    const companyTaxInfoExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'company_tax_info'
      );
    `);
    
    if (!companyTaxInfoExists[0].exists) {
      console.log('Creating company_tax_info table...');
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "company_tax_info" (
          "id" SERIAL PRIMARY KEY,
          "company_name" TEXT NOT NULL,
          "address" TEXT NOT NULL,
          "city" TEXT NOT NULL,
          "state" TEXT NOT NULL,
          "country" TEXT NOT NULL,
          "postal_code" TEXT NOT NULL,
          "gstin" TEXT,
          "pan" TEXT,
          "tax_reg_number" TEXT,
          "email" TEXT NOT NULL,
          "phone" TEXT NOT NULL,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('company_tax_info table created successfully');
      
      // Insert default company tax info
      await db.execute(sql`
        INSERT INTO "company_tax_info" (
          "company_name",
          "address",
          "city",
          "state",
          "country",
          "postal_code",
          "gstin",
          "pan",
          "tax_reg_number",
          "email",
          "phone"
        ) VALUES (
          'ProsumeAI',
          '123 Company Street',
          'Bangalore',
          'Karnataka',
          'India',
          '560001',
          '29AADCB2230M1ZT',
          'AADCB2230M',
          'TRN12345678',
          'billing@prosumeai.com',
          '+91 9876543210'
        );
      `);
      console.log('Inserted default company tax info');
    } else {
      console.log('company_tax_info table already exists');
    }

    // Check if invoice_settings table exists
    const invoiceSettingsExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'invoice_settings'
      );
    `);
    
    if (!invoiceSettingsExists[0].exists) {
      console.log('Creating invoice_settings table...');
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "invoice_settings" (
          "id" SERIAL PRIMARY KEY,
          "logo_url" TEXT,
          "footer_text" TEXT,
          "terms_and_conditions" TEXT,
          "invoice_prefix" TEXT NOT NULL DEFAULT 'INV-',
          "show_tax_breakdown" BOOLEAN NOT NULL DEFAULT true,
          "next_invoice_number" INTEGER NOT NULL DEFAULT 1000,
          "default_due_days" INTEGER NOT NULL DEFAULT 15,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('invoice_settings table created successfully');
      
      // Insert default invoice settings
      await db.execute(sql`
        INSERT INTO "invoice_settings" (
          "logo_url",
          "footer_text",
          "terms_and_conditions",
          "invoice_prefix",
          "show_tax_breakdown",
          "next_invoice_number",
          "default_due_days"
        ) VALUES (
          '/logo.png',
          'Thank you for your business. All payments are due within the payment terms.',
          'Terms and conditions apply. Please refer to our website for more details.',
          'INV-',
          true,
          1000,
          15
        );
      `);
      console.log('Inserted default invoice settings');
    } else {
      console.log('invoice_settings table already exists');
    }

    // Check if invoices table exists
    const invoicesExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'invoices'
      );
    `);
    
    if (!invoicesExists[0].exists) {
      console.log('Creating invoices table...');
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "invoices" (
          "id" SERIAL PRIMARY KEY,
          "invoice_number" TEXT NOT NULL UNIQUE,
          "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
          "transaction_id" INTEGER REFERENCES "payment_transactions"("id"),
          "subtotal" DECIMAL(10, 2) NOT NULL,
          "tax_amount" DECIMAL(10, 2) NOT NULL,
          "total" DECIMAL(10, 2) NOT NULL,
          "currency" currency NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'paid',
          "billing_details" JSONB NOT NULL,
          "company_details" JSONB NOT NULL,
          "tax_details" JSONB,
          "items" JSONB NOT NULL,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "paid_at" TIMESTAMP,
          "due_date" TIMESTAMP,
          "notes" TEXT
        );
      `);
      console.log('invoices table created successfully');
    } else {
      console.log('invoices table already exists');
    }

    console.log('Migration completed successfully!');
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