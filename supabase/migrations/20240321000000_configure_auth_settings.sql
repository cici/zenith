-- Update auth settings for password hashing
ALTER TABLE auth.users 
  ALTER COLUMN encrypted_password TYPE text;  -- Ensure sufficient length for hash

-- Configure auth.users table settings
ALTER TABLE auth.users REPLICA IDENTITY FULL;

-- Configure password policy in auth.users
CREATE OR REPLACE FUNCTION auth.set_password_policy()
RETURNS trigger AS $$
BEGIN
  -- Check password length (minimum 12 characters)
  IF length(NEW.encrypted_password) < 12 THEN
    RAISE EXCEPTION 'Password must be at least 12 characters long';
  END IF;

  -- Check for mixed case
  IF NEW.encrypted_password !~ '[A-Z]' OR NEW.encrypted_password !~ '[a-z]' THEN
    RAISE EXCEPTION 'Password must contain both uppercase and lowercase letters';
  END IF;

  -- Check for numbers
  IF NEW.encrypted_password !~ '[0-9]' THEN
    RAISE EXCEPTION 'Password must contain at least one number';
  END IF;

  -- Check for special characters
  IF NEW.encrypted_password !~ '[!@#$%^&*(),.?":{}|<>]' THEN
    RAISE EXCEPTION 'Password must contain at least one special character';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for password policy
DROP TRIGGER IF EXISTS enforce_password_policy ON auth.users;
CREATE TRIGGER enforce_password_policy
  BEFORE INSERT OR UPDATE OF encrypted_password ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.set_password_policy();

-- Configure auth settings
ALTER TABLE auth.users
  -- Set password attempt limits
  ADD COLUMN IF NOT EXISTS failed_attempts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_failed_attempt timestamp with time zone,
  ADD COLUMN IF NOT EXISTS lockout_until timestamp with time zone;

-- Create function to handle failed login attempts
CREATE OR REPLACE FUNCTION auth.handle_failed_login()
RETURNS trigger AS $$
BEGIN
  -- Reset failed attempts if last attempt was more than 30 minutes ago
  IF NEW.last_failed_attempt < now() - interval '30 minutes' THEN
    NEW.failed_attempts := 1;
  ELSE
    NEW.failed_attempts := NEW.failed_attempts + 1;
  END IF;

  -- Lock account after 5 failed attempts
  IF NEW.failed_attempts >= 5 THEN
    NEW.lockout_until := now() + interval '30 minutes';
  END IF;

  NEW.last_failed_attempt := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for failed login attempts
DROP TRIGGER IF EXISTS handle_failed_login ON auth.users;
CREATE TRIGGER handle_failed_login
  BEFORE UPDATE OF failed_attempts ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_failed_login();

-- Create function to reset failed attempts on successful login
CREATE OR REPLACE FUNCTION auth.reset_failed_attempts()
RETURNS trigger AS $$
BEGIN
  UPDATE auth.users
  SET failed_attempts = 0,
      last_failed_attempt = NULL,
      lockout_until = NULL
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to reset failed attempts on successful login
DROP TRIGGER IF EXISTS reset_failed_attempts ON auth.users;
CREATE TRIGGER reset_failed_attempts
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.reset_failed_attempts();

COMMENT ON COLUMN auth.users.failed_attempts IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN auth.users.last_failed_attempt IS 'Timestamp of the last failed login attempt';
COMMENT ON COLUMN auth.users.lockout_until IS 'Timestamp until which the account is locked out';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_auth_users_failed_attempts ON auth.users(failed_attempts) WHERE failed_attempts > 0; 