-- Create a function to insert incidents with proper PostGIS POINT handling
-- SECURITY DEFINER allows the function to run with the privileges of the function owner
CREATE OR REPLACE FUNCTION create_incident(
  p_title VARCHAR(255),
  p_type VARCHAR(50),
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_description TEXT DEFAULT NULL,
  p_severity VARCHAR(20) DEFAULT 'medium',
  p_address TEXT DEFAULT NULL,
  p_images TEXT[] DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  title VARCHAR(255),
  description TEXT,
  type VARCHAR(50),
  severity VARCHAR(20),
  location POINT,
  address TEXT,
  status VARCHAR(20),
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN,
  user_id UUID
) AS $$
DECLARE
  new_incident incidents%ROWTYPE;
  final_user_id UUID;
BEGIN
  -- Handle user_id: if it's provided but doesn't exist in users table, set to NULL
  IF p_user_id IS NOT NULL THEN
    -- Check if user exists in our users table
    IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = p_user_id) THEN
      -- User doesn't exist in our users table, set to NULL
      final_user_id := NULL;
    ELSE
      final_user_id := p_user_id;
    END IF;
  ELSE
    final_user_id := NULL;
  END IF;

  -- Insert the incident with proper PostGIS POINT creation
  INSERT INTO incidents (
    title,
    description,
    type,
    severity,
    location,
    address,
    images,
    user_id
  ) VALUES (
    p_title,
    p_description,
    p_type,
    p_severity,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::point,
    p_address,
    p_images,
    final_user_id
  )
  RETURNING * INTO new_incident;
  
  -- Return the created incident
  RETURN QUERY SELECT 
    new_incident.id,
    new_incident.title,
    new_incident.description,
    new_incident.type,
    new_incident.severity,
    new_incident.location,
    new_incident.address,
    new_incident.status,
    new_incident.images,
    new_incident.created_at,
    new_incident.expires_at,
    new_incident.is_verified,
    new_incident.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
