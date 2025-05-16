-- Add metadata column to payment_transactions table
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL; 