CREATE OR REPLACE FUNCTION create_widgets_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS widgets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id),
    type text NOT NULL,
    config jsonb,
    position int,
    created_at timestamp with time zone DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_widgets_user_id ON widgets(user_id);
  COMMENT ON TABLE widgets IS 'Stores widget configuration for each user.';
  COMMENT ON COLUMN widgets.type IS 'Widget type (todo, pomodoro, etc.)';
  COMMENT ON COLUMN widgets.config IS 'Widget-specific configuration in JSON.';
END;
$$; 