-- Add user_email field to wanted_list_entries table
-- This allows storing the user's email for price alert notifications

-- Add user_email column to wanted_list_entries table
ALTER TABLE wanted_list_entries 
ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);

-- Add index for user_email lookups
CREATE INDEX IF NOT EXISTS idx_wanted_list_user_email ON wanted_list_entries(user_email);

-- Add comment for documentation
COMMENT ON COLUMN wanted_list_entries.user_email IS 'User email address for sending price alert notifications';

-- Update existing entries with a default email (if any exist)
-- This is a fallback for existing data
UPDATE wanted_list_entries 
SET user_email = 'user@example.com' 
WHERE user_email IS NULL;
