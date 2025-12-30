-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id, product_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wishlist_customer_id ON wishlist(customer_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_created_at ON wishlist(created_at);

-- Enable RLS
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can add to their own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can remove from their own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Service role can manage all wishlists" ON wishlist;

-- RLS Policies
-- Users can view their own wishlist items
CREATE POLICY "Users can view their own wishlist"
  ON wishlist
  FOR SELECT
  USING (customer_id = auth.uid()::uuid);

-- Users can add items to their own wishlist
CREATE POLICY "Users can add to their own wishlist"
  ON wishlist
  FOR INSERT
  WITH CHECK (customer_id = auth.uid()::uuid);

-- Users can remove items from their own wishlist
CREATE POLICY "Users can remove from their own wishlist"
  ON wishlist
  FOR DELETE
  USING (customer_id = auth.uid()::uuid);

-- Service role can manage all wishlist items (for admin purposes)
CREATE POLICY "Service role can manage all wishlists"
  ON wishlist
  FOR ALL
  USING (auth.role() = 'service_role');
