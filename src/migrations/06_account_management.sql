-- Create account_activity table for tracking user actions
CREATE TABLE IF NOT EXISTS account_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'password_change', 'email_update', 'profile_update', 'account_creation')),
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Add index for faster queries
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add index on user_id and timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_account_activity_user_timestamp ON account_activity(user_id, timestamp DESC);

-- Create RLS policies for account_activity
ALTER TABLE account_activity ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own activity
CREATE POLICY account_activity_select_policy ON account_activity
  FOR SELECT USING (auth.uid() = user_id);

-- Only allow the system to insert activity
CREATE POLICY account_activity_insert_policy ON account_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- No updates allowed
CREATE POLICY account_activity_update_policy ON account_activity
  FOR UPDATE USING (false);

-- Only allow users to delete their own activity
CREATE POLICY account_activity_delete_policy ON account_activity
  FOR DELETE USING (auth.uid() = user_id);

-- Create active_sessions table
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY,  -- This will be the session id from supabase auth
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  device_info TEXT,
  
  -- Add index for faster queries
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add index on user_id
CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON active_sessions(user_id);

-- Create RLS policies for active_sessions
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own sessions
CREATE POLICY active_sessions_select_policy ON active_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Only allow the system or the user to insert sessions
CREATE POLICY active_sessions_insert_policy ON active_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only allow updates to the user's own sessions
CREATE POLICY active_sessions_update_policy ON active_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Only allow users to delete their own sessions
CREATE POLICY active_sessions_delete_policy ON active_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle session tracking
CREATE OR REPLACE FUNCTION handle_new_session()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update the session record
  INSERT INTO active_sessions (id, user_id, created_at, last_active_at)
  VALUES (NEW.id, NEW.user_id, NEW.created_at, now())
  ON CONFLICT (id) 
  DO UPDATE SET last_active_at = now();
  
  -- Log the login activity
  INSERT INTO account_activity (user_id, activity_type, timestamp)
  VALUES (NEW.user_id, 'login', now());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new sessions
DROP TRIGGER IF EXISTS on_auth_session_created ON auth.sessions;
CREATE TRIGGER on_auth_session_created
  AFTER INSERT ON auth.sessions
  FOR EACH ROW EXECUTE FUNCTION handle_new_session();

-- Create function to handle session deletion
CREATE OR REPLACE FUNCTION handle_session_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the logout activity
  INSERT INTO account_activity (user_id, activity_type, timestamp)
  VALUES (OLD.user_id, 'logout', now());
  
  -- Remove the session from active_sessions
  DELETE FROM active_sessions WHERE id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for deleted sessions
DROP TRIGGER IF EXISTS on_auth_session_deleted ON auth.sessions;
CREATE TRIGGER on_auth_session_deleted
  AFTER DELETE ON auth.sessions
  FOR EACH ROW EXECUTE FUNCTION handle_session_deletion(); 