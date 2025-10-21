-- Create users table (minimal for incident reporting)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE
);

-- Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'water_logging', 
    'fallen_trees', 
    'sewage_issues', 
    'house_flooding', 
    'wildlife_hazard', 
    'vehicle_stuck', 
    'other'
  )),
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'urgent')),
  location POINT NOT NULL, -- PostGIS point for lat/lng
  address TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'expired')),
  images TEXT[], -- Array of image URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '48 hours'),
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_incidents_location ON incidents USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents (created_at);
CREATE INDEX IF NOT EXISTS idx_incidents_expires_at ON incidents (expires_at);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents (type);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for incidents
CREATE POLICY "Anyone can view active incidents" ON incidents
  FOR SELECT USING (status = 'active');

CREATE POLICY "Authenticated users can create incidents" ON incidents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own incidents" ON incidents
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically expire incidents
CREATE OR REPLACE FUNCTION expire_old_incidents()
RETURNS void AS $$
BEGIN
  UPDATE incidents 
  SET status = 'expired' 
  WHERE expires_at < NOW() 
  AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run the expiration function (requires pg_cron extension)
-- This would typically be set up in the Supabase dashboard or via a cron job
