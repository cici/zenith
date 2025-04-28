CREATE OR REPLACE FUNCTION create_books_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS books (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id),
    title text NOT NULL,
    author text,
    total_pages int,
    current_page int,
    started_at date,
    finished_at date,
    created_at timestamp with time zone DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
  COMMENT ON TABLE books IS 'Books being read/tracked by users.';
END;
$$; 