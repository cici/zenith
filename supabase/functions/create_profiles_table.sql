CREATE OR REPLACE FUNCTION create_profiles_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    display_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now()
  );
  COMMENT ON TABLE profiles IS 'User profile extension for auth.users.';
  COMMENT ON COLUMN profiles.display_name IS 'User display name.';
  COMMENT ON COLUMN profiles.avatar_url IS 'Profile picture URL.';
END;
$$; 