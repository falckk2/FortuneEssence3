-- Migration: Tighten returns RLS
-- ReturnRepository now uses the service role client (bypasses RLS).
-- The overly permissive authenticated policy is replaced with a read-only
-- customer-scoped policy so direct publishable-key queries are also restricted.

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can manage returns" ON returns;
DROP POLICY IF EXISTS "Authenticated users can manage return items" ON return_items;

-- Customers can only read their own returns (authenticated role)
CREATE POLICY "Customers can view their own returns"
  ON returns
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid()::uuid);

-- Customers can only read items belonging to their own returns (authenticated role)
CREATE POLICY "Customers can view their own return items"
  ON return_items
  FOR SELECT
  TO authenticated
  USING (
    return_id IN (
      SELECT id FROM returns WHERE customer_id = auth.uid()::uuid
    )
  );

-- Service role bypasses RLS entirely — no policy needed for admin operations
