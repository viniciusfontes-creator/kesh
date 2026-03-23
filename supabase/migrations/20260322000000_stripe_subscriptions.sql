-- ============================================================
-- Stripe Integration: Subscriptions, Prices, Webhook Events
-- Migration created: 2026-03-22
-- ============================================================

-- ============================================================
-- 1. Add stripe_customer_id to user_profiles
-- ============================================================
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer
  ON user_profiles (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

COMMENT ON COLUMN user_profiles.stripe_customer_id IS 'Stripe Customer ID for payment processing';

-- ============================================================
-- 2. Prices table (mirrors Stripe Prices)
-- ============================================================
CREATE TABLE IF NOT EXISTS prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_price_id TEXT UNIQUE NOT NULL,
  stripe_product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  unit_amount INTEGER NOT NULL,          -- amount in centavos (1500 = R$15.00)
  currency TEXT NOT NULL DEFAULT 'brl',
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  interval_count INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prices are public read (all authenticated users can view active prices)
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prices' AND policyname = 'Anyone can view active prices') THEN
    CREATE POLICY "Anyone can view active prices" ON prices FOR SELECT USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_prices_active ON prices (active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_prices_stripe_id ON prices (stripe_price_id);

COMMENT ON TABLE prices IS 'Stripe pricing plans mirrored from Stripe Dashboard';

-- ============================================================
-- 3. Subscriptions table
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'active', 'past_due', 'canceled', 'incomplete',
    'incomplete_expired', 'trialing', 'unpaid', 'paused'
  )),
  price_id TEXT,
  plan_name TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can view own subscriptions') THEN
    CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions (user_id) WHERE status IN ('active', 'trialing');

COMMENT ON TABLE subscriptions IS 'User subscription records synced from Stripe webhooks';
COMMENT ON COLUMN subscriptions.status IS 'Stripe subscription status: active, past_due, canceled, etc.';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'If true, subscription will be canceled at period end';

-- ============================================================
-- 4. Stripe Webhook Events (idempotency log)
-- ============================================================
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS needed - service role only access (same pattern as pluggy_webhook_events)
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type ON stripe_webhook_events (type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed ON stripe_webhook_events (processed) WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id ON stripe_webhook_events (stripe_event_id);

COMMENT ON TABLE stripe_webhook_events IS 'Log of all Stripe webhook events for idempotency and debugging';

-- ============================================================
-- 5. Add free tier tracking columns to user_profiles
-- ============================================================
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS chat_interactions_count INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS transactions_count INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS accounts_count INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS quota_reset_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_user_profiles_quota_reset ON user_profiles (quota_reset_at);

COMMENT ON COLUMN user_profiles.chat_interactions_count IS 'Number of chat interactions this month (free tier: max 5)';
COMMENT ON COLUMN user_profiles.transactions_count IS 'Number of transactions this month (free tier: max 5)';
COMMENT ON COLUMN user_profiles.accounts_count IS 'Number of accounts created (free tier: max 1)';
COMMENT ON COLUMN user_profiles.quota_reset_at IS 'Timestamp when quota counters were last reset (monthly)';

-- ============================================================
-- 6. Function to reset quota monthly
-- ============================================================
CREATE OR REPLACE FUNCTION reset_user_quota(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET
    chat_interactions_count = 0,
    transactions_count = 0,
    quota_reset_at = NOW() + INTERVAL '1 month'
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reset_user_quota IS 'Reset user quota counters and set next reset date';

-- ============================================================
-- 7. Functions to increment quota counters
-- ============================================================
CREATE OR REPLACE FUNCTION increment_chat_quota(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET chat_interactions_count = chat_interactions_count + 1
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_transaction_quota(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET transactions_count = transactions_count + 1
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_account_quota(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET accounts_count = accounts_count + 1
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_chat_quota IS 'Increment chat interactions counter';
COMMENT ON FUNCTION increment_transaction_quota IS 'Increment transactions counter';
COMMENT ON FUNCTION increment_account_quota IS 'Increment accounts counter';
