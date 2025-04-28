CREATE OR REPLACE FUNCTION create_subscriptions_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id),
    tier text NOT NULL,
    started_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
  COMMENT ON TABLE subscriptions IS 'Subscription tiers and status for users.';
  COMMENT ON COLUMN subscriptions.tier IS 'free, pro, premium, etc.';
END;
$$; 