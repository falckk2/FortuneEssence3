-- Add RLS policies for bundle_configurations table
-- This allows public read access to bundle configurations

-- Enable RLS on bundle_configurations
ALTER TABLE bundle_configurations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read bundle configurations (public data)
CREATE POLICY "Allow public read access to bundle configurations"
  ON bundle_configurations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Grant SELECT permission to anon and authenticated roles
GRANT SELECT ON bundle_configurations TO anon, authenticated;
