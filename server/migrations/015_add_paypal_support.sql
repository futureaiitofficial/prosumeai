-- Add PayPal support to payment gateways
-- 
-- This migration ensures PayPal is properly added to the payment_gateway enum
-- and updates existing tables to fully support PayPal payments

-- First check if PayPal is already in the enum
DO $$
BEGIN
    -- Check if PayPal is already in the enum
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'payment_gateway'
        AND pg_enum.enumlabel = 'PAYPAL'
    ) THEN
        -- If not, add it to the enum
        ALTER TYPE payment_gateway ADD VALUE IF NOT EXISTS 'PAYPAL';
    END IF;
END
$$;

-- Add any PayPal-specific indexes or constraints to payment_gateway_configs
CREATE INDEX IF NOT EXISTS idx_payment_gateway_configs_paypal 
ON payment_gateway_configs(service) 
WHERE service = 'PAYPAL';

-- Add additional columns to payment_transactions table for PayPal-specific data if needed
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS paypal_order_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_payer_id TEXT;

-- Add comment to document this migration
COMMENT ON TYPE payment_gateway IS 'Payment gateways supported including STRIPE, RAZORPAY, PAYPAL, and NONE'; 