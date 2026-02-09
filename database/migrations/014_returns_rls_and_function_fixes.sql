-- Migration: Fix returns system functions and add RLS policies
-- Addresses two issues from 013_returns_system.sql:
--   1. calculate_return_refund joins non-existent order_items table
--   2. is_order_eligible_for_return uses created_at instead of updated_at
--   3. Missing RLS policies on returns and return_items

-- ============================================================================
-- Fix: Rewrite calculate_return_refund to parse JSON items column
-- ============================================================================
-- Orders store items as a JSON array in orders.items (no order_items table).
-- This function now extracts item prices from that JSON column.
CREATE OR REPLACE FUNCTION calculate_return_refund(
  p_return_id UUID,
  p_include_shipping BOOLEAN DEFAULT FALSE
)
RETURNS DECIMAL AS $$
DECLARE
  v_refund_amount DECIMAL(10, 2) := 0;
  v_order_id UUID;
  v_shipping_cost DECIMAL(10, 2);
  v_order_items JSONB;
  v_return_item RECORD;
  v_order_item JSONB;
BEGIN
  -- Get order ID from return
  SELECT order_id INTO v_order_id FROM returns WHERE id = p_return_id;

  IF v_order_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Get the JSON items array from the order
  SELECT items::jsonb INTO v_order_items FROM orders WHERE id = v_order_id;

  IF v_order_items IS NULL THEN
    RETURN 0;
  END IF;

  -- For each return item, find matching product in order JSON and sum price
  FOR v_return_item IN
    SELECT product_id, quantity FROM return_items WHERE return_id = p_return_id
  LOOP
    -- Find the matching order item by productId in the JSON array
    SELECT elem INTO v_order_item
    FROM jsonb_array_elements(v_order_items) AS elem
    WHERE elem->>'productId' = v_return_item.product_id::text
    LIMIT 1;

    IF v_order_item IS NOT NULL THEN
      v_refund_amount := v_refund_amount +
        (v_order_item->>'price')::DECIMAL * v_return_item.quantity;
    END IF;
  END LOOP;

  -- Optionally include shipping cost
  IF p_include_shipping THEN
    SELECT shipping INTO v_shipping_cost FROM orders WHERE id = v_order_id;
    v_refund_amount := v_refund_amount + COALESCE(v_shipping_cost, 0);
  END IF;

  RETURN v_refund_amount;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Fix: Rewrite is_order_eligible_for_return to use updated_at for delivered
-- ============================================================================
-- The application code uses updated_at as a proxy for delivery date when the
-- order status is 'delivered', since there is no dedicated delivered_at column.
-- The DB trigger sets updated_at on each status change, so for delivered orders
-- this approximates the delivery timestamp.
CREATE OR REPLACE FUNCTION is_order_eligible_for_return(
  p_order_id UUID,
  p_days_limit INTEGER DEFAULT 14
)
RETURNS BOOLEAN AS $$
DECLARE
  v_reference_date TIMESTAMP;
  v_order_status VARCHAR(50);
  v_order_created_at TIMESTAMP;
  v_order_updated_at TIMESTAMP;
  v_days_since INTEGER;
BEGIN
  SELECT created_at, updated_at, status
  INTO v_order_created_at, v_order_updated_at, v_order_status
  FROM orders
  WHERE id = p_order_id;

  IF v_order_created_at IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Must be delivered or shipped
  IF v_order_status NOT IN ('delivered', 'shipped') THEN
    RETURN FALSE;
  END IF;

  -- Use updated_at as delivery proxy for delivered orders, created_at otherwise
  IF v_order_status = 'delivered' THEN
    v_reference_date := v_order_updated_at;
  ELSE
    v_reference_date := v_order_created_at;
  END IF;

  v_days_since := EXTRACT(DAY FROM NOW() - v_reference_date);

  RETURN v_days_since <= p_days_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS: Enable Row Level Security on returns tables
-- ============================================================================
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (idempotent)
DROP POLICY IF EXISTS "Service role can manage all returns" ON returns;
DROP POLICY IF EXISTS "Customers can view their own returns" ON returns;
DROP POLICY IF EXISTS "Service role can manage all return items" ON return_items;
DROP POLICY IF EXISTS "Customers can view their own return items" ON return_items;
DROP POLICY IF EXISTS "Authenticated users can manage returns" ON returns;
DROP POLICY IF EXISTS "Authenticated users can manage return items" ON return_items;

-- Authenticated users: full access for admin API routes
-- Matches codebase pattern (see 009_cart_permissions.sql, 010_products_permissions.sql)
-- where repositories use the publishable key client (anon/authenticated role).
CREATE POLICY "Authenticated users can manage returns"
  ON returns
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage return items"
  ON return_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Customers: read-only access to their own returns (for future customer-facing views)
CREATE POLICY "Customers can view their own returns"
  ON returns
  FOR SELECT
  TO anon
  USING (customer_id = auth.uid()::uuid);

-- Customers: read-only access to return items for their own returns
CREATE POLICY "Customers can view their own return items"
  ON return_items
  FOR SELECT
  TO anon
  USING (
    return_id IN (
      SELECT id FROM returns WHERE customer_id = auth.uid()::uuid
    )
  );

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON returns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON return_items TO authenticated;

-- Update comments
COMMENT ON FUNCTION calculate_return_refund IS 'Calculates refund from order JSON items column (no order_items table)';
COMMENT ON FUNCTION is_order_eligible_for_return IS 'Checks return eligibility using updated_at as delivery proxy for delivered orders';
