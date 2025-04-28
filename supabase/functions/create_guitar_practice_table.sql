CREATE OR REPLACE FUNCTION create_guitar_practice_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS guitar_practice (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id),
    practice_type text,
    duration int,
    notes text,
    date date,
    created_at timestamp with time zone DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_guitar_practice_user_id ON guitar_practice(user_id);
  COMMENT ON TABLE guitar_practice IS 'Guitar practice logs for users.';
END;
$$; 