-- Fix the get_active_incidents function to match the actual table schema
-- Drop the existing function first
DROP FUNCTION IF EXISTS get_active_incidents();

-- Recreate the function with correct return types
CREATE OR REPLACE FUNCTION get_active_incidents()
RETURNS TABLE (
    id uuid,
    title varchar(255),
    description text,
    type varchar(50),
    severity varchar(20),
    location geography,
    address varchar(500),
    images text[],
    created_at timestamp with time zone,
    expires_at timestamp with time zone,
    status varchar(20),
    is_verified boolean,
    user_id uuid,
    updated_at timestamp with time zone,
    verified_at timestamp with time zone,
    verified_by uuid
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.title,
        i.description,
        i.type,
        i.severity,
        i.location,
        i.address,
        i.images,
        i.created_at,
        i.expires_at,
        i.status,
        i.is_verified,
        i.user_id,
        i.updated_at,
        i.verified_at,
        i.verified_by
    FROM incidents i
    WHERE i.status = 'active'
    AND (i.expires_at IS NULL OR i.expires_at > NOW())
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql;



