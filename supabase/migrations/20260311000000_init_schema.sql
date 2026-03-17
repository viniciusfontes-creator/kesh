-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ============================================================
-- Transacoes
-- ============================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT CHECK (tipo IN ('entrada', 'saida')) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  fonte TEXT DEFAULT 'chat',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_transactions_user_date ON transactions (user_id, data DESC);
CREATE INDEX idx_transactions_user_tipo ON transactions (user_id, tipo);
CREATE INDEX idx_transactions_user_categoria ON transactions (user_id, categoria);

-- ============================================================
-- Categorias personalizadas
-- ============================================================
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('entrada', 'saida')),
  cor TEXT,
  icone TEXT
);

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categorias"
  ON categorias FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categorias"
  ON categorias FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categorias"
  ON categorias FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own categorias"
  ON categorias FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_categorias_user ON categorias (user_id);

-- ============================================================
-- Metas financeiras
-- ============================================================
CREATE TABLE metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  categoria TEXT,
  valor_limite DECIMAL(10,2),
  periodo TEXT CHECK (periodo IN ('mensal', 'semanal', 'anual')),
  ativo BOOLEAN DEFAULT true
);

ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metas"
  ON metas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own metas"
  ON metas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own metas"
  ON metas FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own metas"
  ON metas FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_metas_user_ativo ON metas (user_id, ativo);

-- ============================================================
-- Historico de conversas (memoria do agente)
-- ============================================================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat_messages"
  ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat_messages"
  ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat_messages"
  ON chat_messages FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_chat_messages_user_created ON chat_messages (user_id, created_at DESC);
