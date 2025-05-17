-- Migration: Guitar Practice Scheduling, Goals, and Reminders

-- 1. Practice Routines
CREATE TABLE IF NOT EXISTS practice_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Practice Routine Items
CREATE TABLE IF NOT EXISTS practice_routine_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid REFERENCES practice_routines(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  technique_id uuid REFERENCES techniques(id) ON DELETE SET NULL,
  song_id uuid REFERENCES songs(id) ON DELETE SET NULL,
  duration_minutes int NOT NULL CHECK (duration_minutes > 0),
  "order" int NOT NULL DEFAULT 0,
  notes text
);

-- 3. Practice Goals
CREATE TYPE practice_goal_type AS ENUM ('daily', 'weekly');
CREATE TABLE IF NOT EXISTS practice_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type practice_goal_type NOT NULL,
  minutes int NOT NULL CHECK (minutes > 0),
  active boolean NOT NULL DEFAULT true,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Practice Reminders
CREATE TYPE reminder_method AS ENUM ('email', 'push', 'in-app');
CREATE TABLE IF NOT EXISTS practice_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id uuid REFERENCES practice_routines(id) ON DELETE SET NULL,
  reminder_time time NOT NULL,
  days_of_week int[] NOT NULL,
  method reminder_method NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_updated_at_practice_routines
BEFORE UPDATE ON practice_routines
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER set_updated_at_practice_goals
BEFORE UPDATE ON practice_goals
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER set_updated_at_practice_reminders
BEFORE UPDATE ON practice_reminders
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. RLS Policy Placeholders
ALTER TABLE practice_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_routine_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_reminders ENABLE ROW LEVEL SECURITY;
-- Add RLS policies for user_id ownership as in previous migrations 

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_practice_routines_user_id ON practice_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_routine_items_routine_id ON practice_routine_items(routine_id);
CREATE INDEX IF NOT EXISTS idx_practice_routine_items_technique_id ON practice_routine_items(technique_id);
CREATE INDEX IF NOT EXISTS idx_practice_routine_items_song_id ON practice_routine_items(song_id);
CREATE INDEX IF NOT EXISTS idx_practice_goals_user_id ON practice_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_reminders_user_id ON practice_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_reminders_routine_id ON practice_reminders(routine_id);

-- 8. RLS Policies (user_id ownership)
-- Practice Routines
CREATE POLICY "Allow user access to own practice routines" ON practice_routines
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Practice Routine Items (access via parent routine)
CREATE POLICY "Allow user access to routine items via parent routine" ON practice_routine_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM practice_routines r WHERE r.id = routine_id AND r.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM practice_routines r WHERE r.id = routine_id AND r.user_id = auth.uid())
  );

-- Practice Goals
CREATE POLICY "Allow user access to own practice goals" ON practice_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Practice Reminders
CREATE POLICY "Allow user access to own practice reminders" ON practice_reminders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); 