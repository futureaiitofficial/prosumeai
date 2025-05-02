-- Add fullName column to user_billing_details table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'user_billing_details'
        AND column_name = 'full_name'
    ) THEN
        ALTER TABLE user_billing_details ADD COLUMN full_name TEXT;
    END IF;
END
$$;

-- Make full_name column non-null with a default value for existing records
UPDATE user_billing_details SET full_name = (
  SELECT full_name FROM users WHERE users.id = user_billing_details.user_id
) WHERE full_name IS NULL;

-- Make the column required for future records
ALTER TABLE user_billing_details ALTER COLUMN full_name SET NOT NULL; 