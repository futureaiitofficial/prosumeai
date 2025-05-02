-- Update user_subscriptions table
ALTER TABLE user_subscriptions
-- Change autoRenew default to false
ALTER COLUMN auto_renew SET DEFAULT false,

-- Change payment_gateway to enum type
ALTER COLUMN payment_gateway TYPE payment_gateway USING payment_gateway::payment_gateway,

-- Remove trial-related columns
DROP COLUMN IF EXISTS is_trial,
DROP COLUMN IF EXISTS trial_expiry_date,
DROP COLUMN IF EXISTS converted_from_trial,

-- Add cancelDate column
ADD COLUMN IF NOT EXISTS cancel_date TIMESTAMP;

-- Update the reference constraint on previousPlanId
ALTER TABLE user_subscriptions
DROP CONSTRAINT IF EXISTS user_subscriptions_previous_plan_id_fkey;

COMMENT ON TABLE user_subscriptions IS 'Stores user subscription data with updated structure to handle payment gateways and cancellation'; 