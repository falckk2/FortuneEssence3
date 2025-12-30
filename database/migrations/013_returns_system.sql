-- Migration: Returns System
-- Creates tables and functions for handling product returns

-- Returns table
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'received', 'refunded', 'cancelled')),
  reason TEXT NOT NULL,
  refund_amount DECIMAL(10, 2) NOT NULL,
  refund_method VARCHAR(50),
  admin_notes TEXT,
  tracking_number VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE
);

-- Return items table (which specific items are being returned)
CREATE TABLE IF NOT EXISTS return_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT,
  condition VARCHAR(50) CHECK (condition IN ('unopened', 'opened', 'damaged', 'defective')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_returns_order_id ON returns(order_id);
CREATE INDEX idx_returns_customer_id ON returns(customer_id);
CREATE INDEX idx_returns_status ON returns(status);
CREATE INDEX idx_returns_created_at ON returns(created_at);
CREATE INDEX idx_return_items_return_id ON return_items(return_id);
CREATE INDEX idx_return_items_product_id ON return_items(product_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_returns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_returns_timestamp
BEFORE UPDATE ON returns
FOR EACH ROW
EXECUTE FUNCTION update_returns_updated_at();

-- Function to check if order is eligible for return
CREATE OR REPLACE FUNCTION is_order_eligible_for_return(
  p_order_id UUID,
  p_days_limit INTEGER DEFAULT 14
)
RETURNS BOOLEAN AS $$
DECLARE
  v_order_date TIMESTAMP;
  v_order_status VARCHAR(50);
  v_days_since_order INTEGER;
BEGIN
  -- Get order details
  SELECT created_at, status INTO v_order_date, v_order_status
  FROM orders
  WHERE id = p_order_id;

  -- Check if order exists
  IF v_order_date IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Calculate days since order
  v_days_since_order := EXTRACT(DAY FROM NOW() - v_order_date);

  -- Order must be delivered and within return window
  IF v_order_status IN ('delivered', 'shipped') AND v_days_since_order <= p_days_limit THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate refund amount
CREATE OR REPLACE FUNCTION calculate_return_refund(
  p_return_id UUID,
  p_include_shipping BOOLEAN DEFAULT FALSE
)
RETURNS DECIMAL AS $$
DECLARE
  v_refund_amount DECIMAL(10, 2) := 0;
  v_order_id UUID;
  v_shipping_cost DECIMAL(10, 2);
BEGIN
  -- Get order ID from return
  SELECT order_id INTO v_order_id FROM returns WHERE id = p_return_id;

  -- Sum up the price of all returned items
  SELECT COALESCE(SUM(oi.price * ri.quantity), 0)
  INTO v_refund_amount
  FROM return_items ri
  JOIN order_items oi ON oi.product_id = ri.product_id AND oi.order_id = v_order_id
  WHERE ri.return_id = p_return_id;

  -- Optionally include shipping cost
  IF p_include_shipping THEN
    SELECT shipping INTO v_shipping_cost FROM orders WHERE id = v_order_id;
    v_refund_amount := v_refund_amount + COALESCE(v_shipping_cost, 0);
  END IF;

  RETURN v_refund_amount;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE returns IS 'Tracks return requests for orders';
COMMENT ON TABLE return_items IS 'Specific items being returned within a return request';
COMMENT ON COLUMN returns.status IS 'pending: awaiting approval, approved: approved for return, received: items received back, refunded: refund processed';
COMMENT ON FUNCTION is_order_eligible_for_return IS 'Checks if an order can be returned based on date and status';
COMMENT ON FUNCTION calculate_return_refund IS 'Calculates the total refund amount for a return request';
