-- ===========================
-- DROP TABLES (for migration re-runs)
-- ===========================
DROP TABLE IF EXISTS widgets CASCADE;
DROP TABLE IF EXISTS dashboards CASCADE;

-- ===========================
-- DASHBOARDS TABLE
-- ===========================
CREATE TABLE dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  layout_configuration JSONB
  -- Add more fields as needed
  --CONSTRAINT dashboards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

COMMENT ON TABLE dashboards IS 'Stores user dashboards with layout and metadata.';
COMMENT ON COLUMN dashboards.id IS 'Primary key for the dashboard.';
COMMENT ON COLUMN dashboards.user_id IS 'User who owns this dashboard.';
COMMENT ON COLUMN dashboards.name IS 'Dashboard name.';
COMMENT ON COLUMN dashboards.created_at IS 'Creation timestamp.';
COMMENT ON COLUMN dashboards.updated_at IS 'Last update timestamp.';
COMMENT ON COLUMN dashboards.layout_configuration IS 'JSON layout/grid configuration.';

CREATE INDEX idx_dashboards_user_id ON dashboards(user_id);

-- ===========================
-- WIDGETS TABLE
-- ===========================
CREATE TABLE widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users, -- Optional: for widget-level ownership
  type TEXT NOT NULL,
  config JSONB,
  position INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  -- CONSTRAINT widgets_dashboard_id_fkey FOREIGN KEY (dashboard_id) REFERENCES dashboards(id)
);

COMMENT ON TABLE widgets IS 'Stores widget configuration for each dashboard.';
COMMENT ON COLUMN widgets.id IS 'Primary key for the widget.';
COMMENT ON COLUMN widgets.dashboard_id IS 'Foreign key referencing the dashboard this widget belongs to.';
COMMENT ON COLUMN widgets.user_id IS 'User who owns this widget (optional, for extra security).';
COMMENT ON COLUMN widgets.type IS 'Widget type (todo, weather, etc).';
COMMENT ON COLUMN widgets.config IS 'Widget-specific configuration in JSON.';
COMMENT ON COLUMN widgets.position IS 'Position/order of the widget in the dashboard.';
COMMENT ON COLUMN widgets.created_at IS 'Creation timestamp.';
COMMENT ON COLUMN widgets.updated_at IS 'Last update timestamp.';

CREATE INDEX idx_widgets_dashboard_id ON widgets(dashboard_id);
CREATE INDEX idx_widgets_user_id ON widgets(user_id);

-- ===========================
-- ENABLE ROW LEVEL SECURITY
-- ===========================
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;

-- ===========================
-- POLICIES FOR DASHBOARDS
-- ===========================
-- Allow users to select (read) their own dashboards
CREATE POLICY "Allow users to read their dashboards"
  ON dashboards FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert dashboards for themselves
CREATE POLICY "Allow users to insert their dashboards"
  ON dashboards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own dashboards
CREATE POLICY "Allow users to update their dashboards"
  ON dashboards FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own dashboards
CREATE POLICY "Allow users to delete their dashboards"
  ON dashboards FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================
-- POLICIES FOR WIDGETS
-- ===========================
-- Allow users to select widgets in their dashboards
CREATE POLICY "Allow users to read widgets in their dashboards"
  ON widgets FOR SELECT
  USING (
    dashboard_id IN (SELECT id FROM dashboards WHERE user_id = auth.uid())
  );

-- Allow users to insert widgets into their dashboards
CREATE POLICY "Allow users to insert widgets in their dashboards"
  ON widgets FOR INSERT
  WITH CHECK (
    dashboard_id IN (SELECT id FROM dashboards WHERE user_id = auth.uid())
  );

-- Allow users to update widgets in their dashboards
CREATE POLICY "Allow users to update widgets in their dashboards"
  ON widgets FOR UPDATE
  USING (
    dashboard_id IN (SELECT id FROM dashboards WHERE user_id = auth.uid())
  );

-- Allow users to delete widgets in their dashboards
CREATE POLICY "Allow users to delete widgets in their dashboards"
  ON widgets FOR DELETE
  USING (
    dashboard_id IN (SELECT id FROM dashboards WHERE user_id = auth.uid())
  );

-- ===========================
-- END OF MIGRATION
-- =========================== 