-- Migration to add metadata column to user_subscriptions table

-- Check if column already exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'user_subscriptions'
        AND column_name = 'metadata'
    ) THEN
        -- Add metadata column to user_subscriptions table
        ALTER TABLE user_subscriptions
        ADD COLUMN metadata JSONB DEFAULT '{}' NOT NULL;
        
        RAISE NOTICE 'Added metadata column to user_subscriptions table';
    ELSE
        RAISE NOTICE 'Column metadata already exists on user_subscriptions table';
    END IF;
END $$; 