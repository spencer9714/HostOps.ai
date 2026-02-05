-- Phase 1.5: AI Reply System with RAG + Inbox
-- Adds Knowledge Base, Inbox (threads/messages), and AI drafts

-- =============================================
-- KNOWLEDGE BASE - RAG Documents
-- =============================================
CREATE TABLE kb_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('workspace', 'property')),
  scope_id UUID NULL REFERENCES listings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_scope CHECK (
    (scope_type = 'workspace' AND scope_id IS NULL) OR
    (scope_type = 'property' AND scope_id IS NOT NULL)
  )
);

CREATE INDEX kb_documents_workspace_id_idx ON kb_documents(workspace_id);
CREATE INDEX kb_documents_scope_idx ON kb_documents(scope_type, scope_id);

-- RLS for kb_documents
ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view KB in their workspaces"
  ON kb_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = kb_documents.workspace_id
      AND workspaces.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create KB in their workspaces"
  ON kb_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = kb_documents.workspace_id
      AND workspaces.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update KB in their workspaces"
  ON kb_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = kb_documents.workspace_id
      AND workspaces.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete KB in their workspaces"
  ON kb_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = kb_documents.workspace_id
      AND workspaces.owner_user_id = auth.uid()
    )
  );

-- =============================================
-- KB CHUNKS - For RAG retrieval
-- =============================================
CREATE TABLE kb_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  -- embedding vector(1536) NULL, -- Optional: for pgvector later
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX kb_chunks_document_id_idx ON kb_chunks(document_id);
CREATE INDEX kb_chunks_text_search_idx ON kb_chunks USING gin(to_tsvector('english', chunk_text));

-- RLS for kb_chunks
ALTER TABLE kb_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chunks via their KB documents"
  ON kb_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM kb_documents
      JOIN workspaces ON workspaces.id = kb_documents.workspace_id
      WHERE kb_documents.id = kb_chunks.document_id
      AND workspaces.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chunks via their KB documents"
  ON kb_chunks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kb_documents
      JOIN workspaces ON workspaces.id = kb_documents.workspace_id
      WHERE kb_documents.id = kb_chunks.document_id
      AND workspaces.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete chunks via their KB documents"
  ON kb_chunks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM kb_documents
      JOIN workspaces ON workspaces.id = kb_documents.workspace_id
      WHERE kb_documents.id = kb_chunks.document_id
      AND workspaces.owner_user_id = auth.uid()
    )
  );

-- =============================================
-- THREADS - Conversation threads
-- =============================================
CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id UUID NULL REFERENCES listings(id) ON DELETE SET NULL,
  source TEXT NOT NULL CHECK (source IN ('manual', 'email')),
  subject TEXT,
  guest_email TEXT,
  guest_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX threads_workspace_id_idx ON threads(workspace_id);
CREATE INDEX threads_property_id_idx ON threads(property_id);
CREATE INDEX threads_status_idx ON threads(status);

-- RLS for threads
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view threads in their workspaces"
  ON threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = threads.workspace_id
      AND workspaces.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create threads in their workspaces"
  ON threads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = threads.workspace_id
      AND workspaces.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update threads in their workspaces"
  ON threads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = threads.workspace_id
      AND workspaces.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete threads in their workspaces"
  ON threads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = threads.workspace_id
      AND workspaces.owner_user_id = auth.uid()
    )
  );

-- =============================================
-- MESSAGES - Individual messages in threads
-- =============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('guest', 'host')),
  body TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  message_ts TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX messages_thread_id_idx ON messages(thread_id);
CREATE INDEX messages_message_ts_idx ON messages(message_ts);

-- RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages via their threads"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM threads
      JOIN workspaces ON workspaces.id = threads.workspace_id
      WHERE threads.id = messages.thread_id
      AND workspaces.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages via their threads"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM threads
      JOIN workspaces ON workspaces.id = threads.workspace_id
      WHERE threads.id = messages.thread_id
      AND workspaces.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages via their threads"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM threads
      JOIN workspaces ON workspaces.id = threads.workspace_id
      WHERE threads.id = messages.thread_id
      AND workspaces.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages via their threads"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM threads
      JOIN workspaces ON workspaces.id = threads.workspace_id
      WHERE threads.id = messages.thread_id
      AND workspaces.owner_user_id = auth.uid()
    )
  );

-- =============================================
-- AI DRAFTS - Generated reply drafts
-- =============================================
CREATE TABLE ai_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  draft_text TEXT NOT NULL,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  escalated BOOLEAN DEFAULT false,
  escalation_reason TEXT,
  sources_used JSONB DEFAULT '[]',
  model_used TEXT DEFAULT 'gemini-pro',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ai_drafts_thread_id_idx ON ai_drafts(thread_id);
CREATE INDEX ai_drafts_escalated_idx ON ai_drafts(escalated);

-- RLS for ai_drafts
ALTER TABLE ai_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view drafts via their threads"
  ON ai_drafts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM threads
      JOIN workspaces ON workspaces.id = threads.workspace_id
      WHERE threads.id = ai_drafts.thread_id
      AND workspaces.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create drafts via their threads"
  ON ai_drafts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM threads
      JOIN workspaces ON workspaces.id = threads.workspace_id
      WHERE threads.id = ai_drafts.thread_id
      AND workspaces.owner_user_id = auth.uid()
    )
  );

-- =============================================
-- WORKSPACE SETTINGS - Store escalation rules
-- =============================================
CREATE TABLE workspace_settings (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  escalation_keywords TEXT[] DEFAULT ARRAY['refund', 'compensation', 'discount', 'injury', 'safety', 'police', 'legal', 'lawsuit', 'chargeback'],
  auto_escalate BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for workspace_settings
ALTER TABLE workspace_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their workspace settings"
  ON workspace_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = workspace_settings.workspace_id
      AND workspaces.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their workspace settings"
  ON workspace_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = workspace_settings.workspace_id
      AND workspaces.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their workspace settings"
  ON workspace_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = workspace_settings.workspace_id
      AND workspaces.owner_user_id = auth.uid()
    )
  );

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_kb_documents_updated_at BEFORE UPDATE ON kb_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_settings_updated_at BEFORE UPDATE ON workspace_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
