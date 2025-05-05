-- Add tags column to todos table
ALTER TABLE IF EXISTS todos 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];

-- Add comment to the tags column
COMMENT ON COLUMN todos.tags IS 'Array of tags or categories for the todo item.'; 