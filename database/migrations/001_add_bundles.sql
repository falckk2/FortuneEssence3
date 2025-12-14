-- Migration: Add bundle support
-- Date: 2025-12-13
-- Description: Adds 'bundles' category and bundle_configurations table

-- Add 'bundles' to product_category enum
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'bundles';

-- Create bundle_configurations table
CREATE TABLE IF NOT EXISTS bundle_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bundle_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  required_quantity INTEGER NOT NULL CHECK (required_quantity > 0),
  allowed_category product_category NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bundle_product_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bundle_configurations_product_id
  ON bundle_configurations(bundle_product_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_bundle_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bundle_configurations_updated_at
  BEFORE UPDATE ON bundle_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_bundle_configurations_updated_at();

-- Add comment for documentation
COMMENT ON TABLE bundle_configurations IS 'Stores configuration for bundle products (mix-and-match essential oil packs)';
COMMENT ON COLUMN bundle_configurations.required_quantity IS 'Number of products required to complete the bundle';
COMMENT ON COLUMN bundle_configurations.allowed_category IS 'Category of products allowed in this bundle (e.g., essential-oils)';
COMMENT ON COLUMN bundle_configurations.discount_percentage IS 'Percentage discount applied vs buying individual items';
