CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT DEFAULT 'Nova Conversa',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_sessions' AND policyname = 'Users can view their own sessions') THEN
    CREATE POLICY "Users can view their own sessions" ON chat_sessions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_sessions' AND policyname = 'Users can create their own sessions') THEN
    CREATE POLICY "Users can create their own sessions" ON chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_sessions' AND policyname = 'Users can update their own sessions') THEN
    CREATE POLICY "Users can update their own sessions" ON chat_sessions FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_sessions' AND policyname = 'Users can delete their own sessions') THEN
    CREATE POLICY "Users can delete their own sessions" ON chat_sessions FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Update RLS for chat_messages to include session check if needed
-- (The existing policy using auth.uid() = user_id is likely enough)

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
