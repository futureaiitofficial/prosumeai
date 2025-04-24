import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../shared/schema';
import dotenv from 'dotenv';

dotenv.config();

export async function runMigration() {
  console.log('Starting migration: Adding subscription model tables');
  
  // Use environment variables or fallback to default values
  const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/prosumeai';
  
  // Create a postgres client
  const client = postgres(dbUrl, { max: 1 });
  
  try {
    // Create enums separately
    await client`
      DO $$ BEGIN
        CREATE TYPE billing_cycle AS ENUM ('MONTHLY', 'YEARLY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    await client`
      DO $$ BEGIN
        CREATE TYPE target_region AS ENUM ('INDIA', 'GLOBAL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    await client`
      DO $$ BEGIN
        CREATE TYPE currency AS ENUM ('INR', 'USD');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    await client`
      DO $$ BEGIN
        CREATE TYPE feature_type AS ENUM ('CORE', 'PREMIUM', 'ENTERPRISE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    await client`
      DO $$ BEGIN
        CREATE TYPE limit_type AS ENUM ('UNLIMITED', 'COUNT', 'BOOLEAN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    await client`
      DO $$ BEGIN
        CREATE TYPE reset_frequency AS ENUM ('NEVER', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    await client`
      DO $$ BEGIN
        CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'GRACE_PERIOD', 'EXPIRED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    await client`
      DO $$ BEGIN
        CREATE TYPE payment_gateway AS ENUM ('RAZORPAY', 'STRIPE', 'PAYPAL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    await client`
      DO $$ BEGIN
        CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    await client`
      DO $$ BEGIN
        CREATE TYPE dispute_status AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    // Create subscription_plans table
    await client`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        currency currency NOT NULL,
        billing_cycle billing_cycle NOT NULL,
        target_region target_region NOT NULL,
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        is_freemium BOOLEAN NOT NULL DEFAULT FALSE,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    // Create features table
    await client`
      CREATE TABLE IF NOT EXISTS features (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        feature_type feature_type NOT NULL,
        is_countable BOOLEAN NOT NULL DEFAULT TRUE,
        cost_factor DECIMAL(10, 4) DEFAULT '1.0000',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    // Create plan_features table
    await client`
      CREATE TABLE IF NOT EXISTS plan_features (
        id SERIAL PRIMARY KEY,
        plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
        feature_id INTEGER NOT NULL REFERENCES features(id),
        limit_type limit_type NOT NULL,
        limit_value INTEGER,
        reset_frequency reset_frequency NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(plan_id, feature_id)
      );
    `;
    
    // Create user_subscriptions table
    await client`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
        payment_gateway TEXT NOT NULL,
        payment_reference TEXT,
        status subscription_status NOT NULL DEFAULT 'ACTIVE',
        is_trial BOOLEAN NOT NULL DEFAULT FALSE,
        trial_expiry_date TIMESTAMP,
        converted_from_trial BOOLEAN NOT NULL DEFAULT FALSE,
        grace_period_end TIMESTAMP,
        previous_plan_id INTEGER REFERENCES subscription_plans(id),
        upgrade_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    // Create feature_usage table
    await client`
      CREATE TABLE IF NOT EXISTS feature_usage (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        feature_id INTEGER NOT NULL REFERENCES features(id),
        usage_count INTEGER NOT NULL DEFAULT 0,
        ai_model_type TEXT,
        ai_token_count INTEGER,
        ai_cost DECIMAL(10, 4),
        last_used TIMESTAMP DEFAULT NOW(),
        reset_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, feature_id)
      );
    `;
    
    // Create payment_transactions table
    await client`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        subscription_id INTEGER NOT NULL REFERENCES user_subscriptions(id),
        amount DECIMAL(10, 2) NOT NULL,
        currency currency NOT NULL,
        gateway payment_gateway NOT NULL,
        gateway_transaction_id TEXT,
        status payment_status NOT NULL DEFAULT 'PENDING',
        refund_reason TEXT,
        refund_amount DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    // Create disputes table
    await client`
      CREATE TABLE IF NOT EXISTS disputes (
        id SERIAL PRIMARY KEY,
        transaction_id INTEGER NOT NULL REFERENCES payment_transactions(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        reason TEXT NOT NULL,
        status dispute_status NOT NULL DEFAULT 'OPEN',
        resolution_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP
      );
    `;
    
    // Create document_versions table
    await client`
      CREATE TABLE IF NOT EXISTS document_versions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        document_id INTEGER NOT NULL,
        document_type TEXT NOT NULL,
        version_number INTEGER NOT NULL,
        content_hash TEXT NOT NULL,
        is_significant_change BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(document_id, document_type, version_number)
      );
    `;
    
    console.log('Migration complete: Subscription model tables created successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Close the postgres client
    await client.end();
  }
} 