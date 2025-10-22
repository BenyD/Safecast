-- Add name column to users table
ALTER TABLE users ADD COLUMN name VARCHAR(255);

-- Add comment to document the column
COMMENT ON COLUMN users.name IS 'User display name';
