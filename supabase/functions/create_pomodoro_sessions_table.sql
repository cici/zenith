CREATE OR REPLACE FUNCTION create_pomodoro_sessions_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id),
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    task_id uuid REFERENCES todos(id),
    session_type text,
    created_at timestamp with time zone DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_pomodoro_user_id ON pomodoro_sessions(user_id);
  COMMENT ON TABLE pomodoro_sessions IS 'Pomodoro timer sessions for each user.';
  COMMENT ON COLUMN pomodoro_sessions.session_type IS 'work or break.';
END;
$$; 