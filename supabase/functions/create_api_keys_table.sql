-- First create the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Then create the main function
CREATE OR REPLACE FUNCTION create_api_keys_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create API keys table for integrations
  CREATE TABLE IF NOT EXISTS api_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      integration_name TEXT NOT NULL,
      api_key TEXT NOT NULL,
      api_secret TEXT,
      additional_data JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      is_active BOOLEAN DEFAULT TRUE
  );

  -- Add indexes for faster lookups
  CREATE INDEX IF NOT EXISTS idx_api_keys_integration_name ON api_keys(integration_name);
  CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

  -- Add RLS (Row Level Security) policies
  ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

  -- Only allow authenticated users to read API keys
  CREATE POLICY "Allow authenticated users to read API keys" ON api_keys
  FOR SELECT USING (auth.role() = 'authenticated');

  -- Only allow administrators to manage API keys
  CREATE POLICY "Allow administrators to manage API keys" ON api_keys
  FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

  -- Create the trigger
  CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  -- Comments for documentation
  COMMENT ON TABLE api_keys IS 'Stores API keys for various third-party service integrations';
  COMMENT ON COLUMN api_keys.integration_name IS 'Name of the integration (e.g., MyFitnessPal, Strava)';
  COMMENT ON COLUMN api_keys.api_key IS 'Primary API key or access token';
  COMMENT ON COLUMN api_keys.api_secret IS 'API secret or refresh token if applicable';
  COMMENT ON COLUMN api_keys.additional_data IS 'Any additional configuration data in JSON format';
END;
$$; 