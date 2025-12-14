-- Add RLS policies for products table
-- This allows public read access to products

-- Enable RLS on products (if not already enabled)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active products
CREATE POLICY "Allow public read access to products"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Grant SELECT permission to anon and authenticated roles
GRANT SELECT ON products TO anon, authenticated;

-- Also grant INSERT permission to authenticated users (for admin operations)
GRANT INSERT, UPDATE, DELETE ON products TO authenticated;

-- Check if products exist
SELECT
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE category = 'essential-oils') as essential_oils_count,
  COUNT(*) FILTER (WHERE category = 'bundles') as bundles_count
FROM products;

-- Show all essential oils
SELECT sku, name, is_active, stock
FROM products
WHERE category = 'essential-oils'
ORDER BY sku;
