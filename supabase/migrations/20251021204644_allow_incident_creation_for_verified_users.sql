-- Drop the existing policy that requires authentication
DROP POLICY IF EXISTS "Authenticated users can create incidents" ON incidents;

-- Create a new policy that allows incident creation for users in our custom users table
-- This allows our OTP-based authentication to work with Supabase Auth users
CREATE POLICY "Users can create incidents" ON incidents
  FOR INSERT WITH CHECK (
    user_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = incidents.user_id 
      AND users.is_verified = true
    )
  );
