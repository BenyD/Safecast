-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add updated_at column to incidents table
ALTER TABLE incidents ADD COLUMN updated_at timestamp with time zone default now();

-- Create function to automatically set updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on incidents
CREATE TRIGGER update_incidents_updated_at 
    BEFORE UPDATE ON incidents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add default expiration time (24 hours from creation) for incidents without explicit expiration
-- This will be handled in the application layer, but we can add a function for it
CREATE OR REPLACE FUNCTION set_default_expiration()
RETURNS TRIGGER AS $$
BEGIN
    -- If expires_at is null, set it to 24 hours from now
    IF NEW.expires_at IS NULL THEN
        NEW.expires_at = now() + interval '24 hours';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to set default expiration
CREATE TRIGGER set_incidents_default_expiration
    BEFORE INSERT ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION set_default_expiration();

-- Create a function to get active incidents (excluding expired ones)
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
    user_id uuid
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
        i.user_id
    FROM incidents i
    WHERE i.status = 'active'
    AND (i.expires_at IS NULL OR i.expires_at > now())
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_active_incidents() TO anon, authenticated;
