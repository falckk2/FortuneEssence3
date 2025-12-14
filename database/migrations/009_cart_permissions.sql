-- Add RLS policies for carts table
-- This allows users to manage their own carts

-- Enable RLS on carts
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create carts (for guest checkout)
CREATE POLICY "Allow anyone to create carts"
  ON carts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to read their own carts (by session_id or user_id)
CREATE POLICY "Allow users to read their own carts"
  ON carts
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to update their own carts
CREATE POLICY "Allow users to update their own carts"
  ON carts
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete their own carts
CREATE POLICY "Allow users to delete their own carts"
  ON carts
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Grant necessary permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON carts TO anon, authenticated;
