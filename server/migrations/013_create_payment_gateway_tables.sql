-- Create payment_gateway_configs table
CREATE TABLE IF NOT EXISTS payment_gateway_configs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  service payment_gateway NOT NULL,
  key TEXT NOT NULL, -- Encrypted API key
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  config_options JSONB DEFAULT '{}',
  last_used TIMESTAMP,
  test_mode BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_gateway_service ON payment_gateway_configs(service);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_active ON payment_gateway_configs(is_active);

-- Create payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  gateway payment_gateway NOT NULL,
  type TEXT NOT NULL, -- "card", "upi", "netbanking", etc.
  last_four TEXT, -- Last 4 digits of card or partial payment info
  expiry_month INTEGER,
  expiry_year INTEGER,
  gateway_payment_method_id TEXT NOT NULL, -- ID from the payment gateway
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Create indexes for payment methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_gateway ON payment_methods(gateway);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = TRUE;

-- Create payment webhook events table
CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id SERIAL PRIMARY KEY,
  gateway payment_gateway NOT NULL,
  event_type TEXT NOT NULL, -- e.g., "payment.success", "subscription.created"
  event_id TEXT NOT NULL, -- ID from payment gateway
  raw_data JSONB NOT NULL, -- Complete webhook payload
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processing_errors TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for webhook events
CREATE INDEX IF NOT EXISTS idx_webhook_events_gateway ON payment_webhook_events(gateway);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON payment_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON payment_webhook_events(event_id);

-- Add unique constraint to prevent duplicate webhook processing
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_unique ON payment_webhook_events(gateway, event_id);

-- Add constraint to ensure only one default payment method per user per gateway
ALTER TABLE payment_methods
  ADD CONSTRAINT unique_default_payment_method_per_user_gateway
  EXCLUDE USING btree (user_id WITH =, gateway WITH =) 
  WHERE (is_default = TRUE AND deleted_at IS NULL);

-- Add constraint to ensure only one default gateway per service
ALTER TABLE payment_gateway_configs
  ADD CONSTRAINT unique_default_gateway_per_service
  EXCLUDE USING btree (service WITH =) 
  WHERE (is_default = TRUE AND is_active = TRUE); 