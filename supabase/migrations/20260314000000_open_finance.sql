-- ============================================================
-- Open Finance (Pluggy) Support
-- ============================================================

-- ============================================================
-- Pluggy Items (Conexões com instituições financeiras)
-- ============================================================
CREATE TABLE IF NOT EXISTS pluggy_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pluggy_item_id TEXT UNIQUE NOT NULL,
  connector_id INTEGER NOT NULL,
  connector_name TEXT NOT NULL,
  status TEXT CHECK (status IN (
    'UPDATING', 'LOGIN_ERROR', 'WAITING_USER_INPUT',
    'OUTDATED', 'UPDATED', 'CREATED'
  )) NOT NULL DEFAULT 'CREATED',
  execution_status TEXT,
  client_user_id TEXT,
  consent_expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  next_auto_sync_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pluggy_items ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pluggy_items' AND policyname = 'Users can view own pluggy_items') THEN
    CREATE POLICY "Users can view own pluggy_items" ON pluggy_items FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pluggy_items' AND policyname = 'Users can insert own pluggy_items') THEN
    CREATE POLICY "Users can insert own pluggy_items" ON pluggy_items FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pluggy_items' AND policyname = 'Users can update own pluggy_items') THEN
    CREATE POLICY "Users can update own pluggy_items" ON pluggy_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pluggy_items' AND policyname = 'Users can delete own pluggy_items') THEN
    CREATE POLICY "Users can delete own pluggy_items" ON pluggy_items FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pluggy_items_user ON pluggy_items (user_id);
CREATE INDEX IF NOT EXISTS idx_pluggy_items_pluggy_id ON pluggy_items (pluggy_item_id);
CREATE INDEX IF NOT EXISTS idx_pluggy_items_status ON pluggy_items (user_id, status);

-- ============================================================
-- Pluggy Accounts (Contas das instituições via Open Finance)
-- ============================================================
CREATE TABLE IF NOT EXISTS pluggy_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pluggy_item_id TEXT REFERENCES pluggy_items(pluggy_item_id) ON DELETE CASCADE NOT NULL,
  pluggy_account_id TEXT UNIQUE NOT NULL,
  tipo TEXT CHECK (tipo IN ('BANK', 'CREDIT')) NOT NULL,
  subtipo TEXT,
  nome TEXT NOT NULL,
  numero TEXT,
  agencia TEXT,
  saldo DECIMAL(14,2) DEFAULT 0,
  currency_code TEXT DEFAULT 'BRL',
  bank_data JSONB,
  credit_data JSONB,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pluggy_accounts ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pluggy_accounts' AND policyname = 'Users can view own pluggy_accounts') THEN
    CREATE POLICY "Users can view own pluggy_accounts" ON pluggy_accounts FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pluggy_accounts' AND policyname = 'Users can insert own pluggy_accounts') THEN
    CREATE POLICY "Users can insert own pluggy_accounts" ON pluggy_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pluggy_accounts' AND policyname = 'Users can update own pluggy_accounts') THEN
    CREATE POLICY "Users can update own pluggy_accounts" ON pluggy_accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pluggy_accounts' AND policyname = 'Users can delete own pluggy_accounts') THEN
    CREATE POLICY "Users can delete own pluggy_accounts" ON pluggy_accounts FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pluggy_accounts_user ON pluggy_accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_pluggy_accounts_item ON pluggy_accounts (pluggy_item_id);
CREATE INDEX IF NOT EXISTS idx_pluggy_accounts_pluggy_id ON pluggy_accounts (pluggy_account_id);

-- ============================================================
-- Pluggy Transactions (Transações via Open Finance)
-- ============================================================
CREATE TABLE IF NOT EXISTS pluggy_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pluggy_account_id TEXT REFERENCES pluggy_accounts(pluggy_account_id) ON DELETE CASCADE NOT NULL,
  pluggy_transaction_id TEXT UNIQUE NOT NULL,
  tipo TEXT CHECK (tipo IN ('DEBIT', 'CREDIT')) NOT NULL,
  valor DECIMAL(14,2) NOT NULL,
  descricao TEXT NOT NULL,
  descricao_raw TEXT,
  data DATE NOT NULL,
  status TEXT CHECK (status IN ('PENDING', 'POSTED')) NOT NULL DEFAULT 'POSTED',
  categoria TEXT,
  category_id TEXT,
  currency_code TEXT DEFAULT 'BRL',
  operation_type TEXT,
  payment_data JSONB,
  credit_card_metadata JSONB,
  merchant JSONB,
  provider_code TEXT,
  balance_after DECIMAL(14,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pluggy_transactions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pluggy_transactions' AND policyname = 'Users can view own pluggy_transactions') THEN
    CREATE POLICY "Users can view own pluggy_transactions" ON pluggy_transactions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pluggy_transactions' AND policyname = 'Users can insert own pluggy_transactions') THEN
    CREATE POLICY "Users can insert own pluggy_transactions" ON pluggy_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pluggy_transactions' AND policyname = 'Users can update own pluggy_transactions') THEN
    CREATE POLICY "Users can update own pluggy_transactions" ON pluggy_transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pluggy_transactions' AND policyname = 'Users can delete own pluggy_transactions') THEN
    CREATE POLICY "Users can delete own pluggy_transactions" ON pluggy_transactions FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pluggy_transactions_user ON pluggy_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_pluggy_transactions_account ON pluggy_transactions (pluggy_account_id);
CREATE INDEX IF NOT EXISTS idx_pluggy_transactions_pluggy_id ON pluggy_transactions (pluggy_transaction_id);
CREATE INDEX IF NOT EXISTS idx_pluggy_transactions_date ON pluggy_transactions (user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_pluggy_transactions_tipo ON pluggy_transactions (user_id, tipo);
CREATE INDEX IF NOT EXISTS idx_pluggy_transactions_categoria ON pluggy_transactions (user_id, categoria);

-- ============================================================
-- Webhook Events Log (Auditoria de eventos Pluggy)
-- ============================================================
CREATE TABLE IF NOT EXISTS pluggy_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  event_id TEXT UNIQUE NOT NULL,
  item_id TEXT,
  triggered_by TEXT,
  client_user_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook events don't need RLS - accessed only via service role
CREATE INDEX IF NOT EXISTS idx_webhook_events_event ON pluggy_webhook_events (event);
CREATE INDEX IF NOT EXISTS idx_webhook_events_item ON pluggy_webhook_events (item_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON pluggy_webhook_events (processed) WHERE processed = FALSE;

-- ============================================================
-- Vínculo entre contas manuais e contas do Open Finance
-- ============================================================
ALTER TABLE contas ADD COLUMN IF NOT EXISTS pluggy_account_id TEXT REFERENCES pluggy_accounts(pluggy_account_id) ON DELETE SET NULL;

-- Vínculo entre transações manuais e transações do Open Finance
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS pluggy_transaction_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'pluggy', 'chat'));
