-- ============================================================
-- User Preferences: push notifications + data privacy
-- ============================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS data_privacy_accepted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS data_privacy_accepted_at TIMESTAMPTZ;
