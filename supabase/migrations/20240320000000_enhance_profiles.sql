-- Add new columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS last_login timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_active timestamp with time zone,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS subscription_period_end timestamp with time zone,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add comments for the new columns
COMMENT ON COLUMN profiles.email IS 'User email from auth.users, maintained in sync via trigger.';
COMMENT ON COLUMN profiles.last_login IS 'Timestamp of the user''s last successful login.';
COMMENT ON COLUMN profiles.last_active IS 'Timestamp of the user''s last activity.';
COMMENT ON COLUMN profiles.full_name IS 'User''s full name.';
COMMENT ON COLUMN profiles.bio IS 'User''s biography or description.';
COMMENT ON COLUMN profiles.location IS 'User''s location (city, country, etc.).';
COMMENT ON COLUMN profiles.website IS 'User''s personal website URL.';
COMMENT ON COLUMN profiles.social_links IS 'JSON object containing user''s social media links.';
COMMENT ON COLUMN profiles.preferences IS 'JSON object containing user preferences (theme, notifications, etc.).';
COMMENT ON COLUMN profiles.subscription_tier IS 'User''s subscription tier (free, pro, enterprise).';
COMMENT ON COLUMN profiles.subscription_status IS 'Status of user''s subscription (active, cancelled, past_due).';
COMMENT ON COLUMN profiles.subscription_period_end IS 'When the current subscription period ends.';
COMMENT ON COLUMN profiles.updated_at IS 'Timestamp of the last profile update.';

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- Create an index on last_login for analytics queries
CREATE INDEX IF NOT EXISTS profiles_last_login_idx ON profiles(last_login);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at_trigger ON profiles;
CREATE TRIGGER update_profiles_updated_at_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- Create a function to update last_login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles
  SET last_login = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger on auth.users to update last_login
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER INSERT OR UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION update_last_login();

-- Create a function to sync email from auth.users
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to keep email in sync with auth.users
DROP TRIGGER IF EXISTS on_auth_user_email_update ON auth.users;
CREATE TRIGGER on_auth_user_email_update
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email();

-- Initial population of email field from auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL; 