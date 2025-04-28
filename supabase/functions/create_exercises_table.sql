CREATE OR REPLACE FUNCTION create_exercises_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS exercises (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id),
    type text,
    duration int,
    calories int,
    date date,
    created_at timestamp with time zone DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
  COMMENT ON TABLE exercises IS 'Exercise logs for users.';
END;
$$; 