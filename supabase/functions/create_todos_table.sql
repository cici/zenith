CREATE OR REPLACE FUNCTION create_todos_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS todos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id),
    title text NOT NULL,
    description text,
    due_date date,
    priority int,
    completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
  CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
  COMMENT ON TABLE todos IS 'To-Do items for each user.';
  COMMENT ON COLUMN todos.priority IS '1=high, 2=medium, 3=low.';
END;
$$; 