-- Create plan_change_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE plan_change_type AS ENUM ('UPGRADE', 'DOWNGRADE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add pending_plan_change_to column if it doesn't exist
DO $$ 
BEGIN
    ALTER TABLE user_subscriptions ADD COLUMN pending_plan_change_to INTEGER REFERENCES subscription_plans(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add pending_plan_change_date column if it doesn't exist
DO $$ 
BEGIN
    ALTER TABLE user_subscriptions ADD COLUMN pending_plan_change_date TIMESTAMP;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add pending_plan_change_type column if it doesn't exist
DO $$ 
BEGIN
    ALTER TABLE user_subscriptions ADD COLUMN pending_plan_change_type plan_change_type;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$; 