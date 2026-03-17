-- ============================================================
-- Contas (Wallets/Accounts)
-- ============================================================
CREATE TABLE IF NOT EXISTS contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('conta_corrente', 'investimento', 'poupanca', 'cartao_credito')) NOT NULL,
  saldo DECIMAL(10,2) DEFAULT 0,
  cor TEXT,
  icone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contas ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contas' AND policyname = 'Users can view own contas') THEN
    CREATE POLICY "Users can view own contas" ON contas FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contas' AND policyname = 'Users can insert own contas') THEN
    CREATE POLICY "Users can insert own contas" ON contas FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contas' AND policyname = 'Users can update own contas') THEN
    CREATE POLICY "Users can update own contas" ON contas FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contas' AND policyname = 'Users can delete own contas') THEN
    CREATE POLICY "Users can delete own contas" ON contas FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contas_user ON contas (user_id);

-- ============================================================
-- Update Transactions with advanced fields
-- ============================================================
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS conta_id UUID REFERENCES contas(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('pago', 'pendente')) DEFAULT 'pago';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS data_vencimento DATE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS parcela_atual INTEGER;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total_parcelas INTEGER;

-- Create index for pending transactions
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (user_id, status) WHERE status = 'pendente';
CREATE INDEX IF NOT EXISTS idx_transactions_vencimento ON transactions (user_id, data_vencimento) WHERE status = 'pendente';
