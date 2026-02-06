export interface Profile {
  user_id: string;
  full_name: string | null;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  owner_user_id: string;
  created_at: string;
}

export interface Listing {
  id: string;
  workspace_id: string;
  airbnb_id: string;
  title: string;
  description: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface CreateWorkspaceInput {
  name: string;
}

export interface CreateListingInput {
  workspace_id: string;
  airbnb_id: string;
  title: string;
  description?: string;
  photo_url?: string;
}

// =============================================
// Phase 1.5: Knowledge Base (RAG)
// =============================================
export interface KBDocument {
  id: string;
  workspace_id: string;
  scope_type: 'workspace' | 'property';
  scope_id: string | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface KBChunk {
  id: string;
  document_id: string;
  chunk_text: string;
  chunk_index: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CreateKBDocumentInput {
  workspace_id: string;
  scope_type: 'workspace' | 'property';
  scope_id?: string | null;
  title: string;
  content: string;
}

// =============================================
// Phase 1.5: Inbox (Threads & Messages)
// =============================================
export interface Thread {
  id: string;
  workspace_id: string;
  property_id: string | null;
  source: 'manual' | 'email';
  subject: string | null;
  guest_email: string | null;
  guest_name: string | null;
  status: 'active' | 'archived';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  role: 'guest' | 'host';
  body: string;
  source: string;
  message_ts: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CreateThreadInput {
  workspace_id: string;
  property_id?: string | null;
  source: 'manual' | 'email';
  subject?: string;
  guest_email?: string;
  guest_name?: string;
}

export interface CreateMessageInput {
  thread_id: string;
  role: 'guest' | 'host';
  body: string;
  source?: string;
}

// =============================================
// Phase 1.5: AI Drafts
// =============================================
export interface AIDraft {
  id: string;
  thread_id: string;
  draft_text: string;
  confidence: number;
  escalated: boolean;
  escalation_reason: string | null;
  sources_used: string[];
  model_used: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface GenerateDraftInput {
  thread_id: string;
}

export interface GenerateDraftOutput {
  draft_text: string;
  confidence: number;
  escalated: boolean;
  escalation_reason: string | null;
  sources_used: string[];
}

// =============================================
// Phase 1.5: Workspace Settings
// =============================================
export interface WorkspaceSettings {
  workspace_id: string;
  escalation_keywords: string[];
  auto_escalate: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}
