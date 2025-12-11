-- Migration: Abandoned Carts Tracking
-- Description: Tracks abandoned shopping carts for recovery campaigns
-- Created: 2025-12-07

-- Create abandoned_carts table
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id VARCHAR(255) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  session_id VARCHAR(255),
  items JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'SEK',
  recovery_token VARCHAR(255) UNIQUE NOT NULL,
  abandoned_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reminded_at TIMESTAMP WITH TIME ZONE,
  recovered_at TIMESTAMP WITH TIME ZONE,
  recovery_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  reminder_count INTEGER DEFAULT 0 CHECK (reminder_count >= 0 AND reminder_count <= 3),
  status VARCHAR(20) DEFAULT 'abandoned' CHECK (status IN ('abandoned', 'reminded', 'recovered', 'expired')),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_abandoned_carts_customer_id ON abandoned_carts(customer_id);
CREATE INDEX idx_abandoned_carts_email ON abandoned_carts(email);
CREATE INDEX idx_abandoned_carts_status ON abandoned_carts(status);
CREATE INDEX idx_abandoned_carts_abandoned_at ON abandoned_carts(abandoned_at);
CREATE INDEX idx_abandoned_carts_reminded_at ON abandoned_carts(reminded_at);
CREATE INDEX idx_abandoned_carts_recovery_token ON abandoned_carts(recovery_token);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_abandoned_carts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_abandoned_carts_updated_at
  BEFORE UPDATE ON abandoned_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_abandoned_carts_updated_at();

-- Add comments
COMMENT ON TABLE abandoned_carts IS 'Tracks abandoned shopping carts for recovery campaigns';
COMMENT ON COLUMN abandoned_carts.cart_id IS 'Unique identifier for the cart (matches cart session)';
COMMENT ON COLUMN abandoned_carts.recovery_token IS 'Secure token for cart recovery link';
COMMENT ON COLUMN abandoned_carts.abandoned_at IS 'Timestamp when cart was marked as abandoned';
COMMENT ON COLUMN abandoned_carts.reminded_at IS 'Timestamp of last recovery email sent';
COMMENT ON COLUMN abandoned_carts.recovered_at IS 'Timestamp when cart was recovered (order created)';
COMMENT ON COLUMN abandoned_carts.reminder_count IS 'Number of reminder emails sent (max 3)';
COMMENT ON COLUMN abandoned_carts.status IS 'Current status: abandoned, reminded, recovered, or expired';
