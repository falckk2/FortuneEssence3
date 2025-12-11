-- Newsletter Subscriptions Table
-- Stores all newsletter subscribers with double opt-in support
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'unsubscribed', 'bounced')),
  verification_token VARCHAR(255) UNIQUE,
  verified_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  source VARCHAR(100) DEFAULT 'website',
  ip_address VARCHAR(45),
  user_agent TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX idx_newsletter_status ON newsletter_subscriptions(status);
CREATE INDEX idx_newsletter_created_at ON newsletter_subscriptions(created_at DESC);
CREATE INDEX idx_newsletter_customer_id ON newsletter_subscriptions(customer_id);
CREATE INDEX idx_newsletter_verification_token ON newsletter_subscriptions(verification_token);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_newsletter_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_newsletter_subscription_timestamp
BEFORE UPDATE ON newsletter_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_newsletter_subscription_timestamp();

-- Add comment
COMMENT ON TABLE newsletter_subscriptions IS 'Newsletter subscribers with double opt-in verification and preference management';
