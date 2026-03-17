-- ============================================================
-- Recurrence support for Transactions
-- ============================================================
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS frequency TEXT CHECK (frequency IN ('semanal', 'mensal', 'anual')) DEFAULT 'mensal';

-- Index for recurring transactions
CREATE INDEX IF NOT EXISTS idx_transactions_recurring ON transactions (user_id, is_recurring) WHERE is_recurring = TRUE;
