-- Fix RLS policy to allow the create_incident function to work
-- The function needs to bypass RLS since it's handling the security logic internally

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can create incidents" ON incidents;

-- Create a new policy that allows incident creation for verified users
-- This policy will work with both direct inserts and function calls
CREATE POLICY "Users can create incidents" ON incidents
  FOR INSERT WITH CHECK (
    user_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = incidents.user_id 
      AND users.is_verified = true
    )
  );

-- Grant necessary permissions to the function
-- The function should be able to insert incidents regardless of RLS
-- since it's handling the security logic internally
GRANT INSERT ON incidents TO authenticated;
GRANT INSERT ON incidents TO anon;
