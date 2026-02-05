'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type {
  Workspace,
  Listing,
  KBDocument,
  Thread,
  Message,
  AIDraft,
  WorkspaceSettings
} from '@/types/database.types';
import PropertiesTab from './components/PropertiesTab';
import InboxTab from './components/InboxTab';
import KnowledgeTab from './components/KnowledgeTab';
import SettingsTab from './components/SettingsTab';

type TabType = 'listings' | 'inbox' | 'knowledge' | 'settings';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('listings');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);

  // Listings state
  const [listings, setListings] = useState<Listing[]>([]);

  // Workspace state
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [editWorkspaceName, setEditWorkspaceName] = useState('');

  // Knowledge Base state
  const [kbDocuments, setKbDocuments] = useState<KBDocument[]>([]);
  const [showCreateKB, setShowCreateKB] = useState(false);
  const [editingKBId, setEditingKBId] = useState<string | null>(null);
  const [kbFormData, setKbFormData] = useState({
    title: '',
    content: '',
    scope_type: 'workspace' as 'workspace' | 'property',
    scope_id: '',
  });

  // Inbox state
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [drafts, setDrafts] = useState<AIDraft[]>([]);

  // Settings state
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [escalationKeywords, setEscalationKeywords] = useState<string>('');
  const [autoEscalate, setAutoEscalate] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      loadListings(selectedWorkspace.id);
      loadKBDocuments(selectedWorkspace.id);
      loadThreads(selectedWorkspace.id);
      loadSettings(selectedWorkspace.id);
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id);
      loadDrafts(selectedThread.id);
    }
  }, [selectedThread]);

  const loadWorkspaces = async () => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWorkspaces(data || []);
      if (data && data.length > 0) {
        setSelectedWorkspace(data[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadListings = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (err: any) {
      console.error('Error loading listings:', err);
    }
  };

  const loadKBDocuments = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('kb_documents')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKbDocuments(data || []);
    } catch (err: any) {
      console.error('Error loading KB documents:', err);
    }
  };

  const loadThreads = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setThreads(data || []);
    } catch (err: any) {
      console.error('Error loading threads:', err);
    }
  };

  const loadMessages = async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('message_ts', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      console.error('Error loading messages:', err);
    }
  };

  const loadDrafts = async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_drafts')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setDrafts(data || []);
    } catch (err: any) {
      console.error('Error loading drafts:', err);
    }
  };

  const loadSettings = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('workspace_settings')
        .select('*')
        .eq('workspace_id', workspaceId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setEscalationKeywords(data.escalation_keywords.join(', '));
        setAutoEscalate(data.auto_escalate);
      } else {
        setSettings(null);
        setEscalationKeywords(
          'refund, compensation, discount, injury, safety, police, legal, lawsuit, chargeback'
        );
        setAutoEscalate(true);
      }
    } catch (err: any) {
      console.error('Error loading settings:', err);
    }
  };

  // Workspace functions
  const createWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name: workspaceName,
          owner_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setWorkspaces([data, ...workspaces]);
      setSelectedWorkspace(data);
      setWorkspaceName('');
      setShowCreateWorkspace(false);
      setSuccess('Workspace created');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startEditWorkspace = (workspace: Workspace) => {
    setEditingWorkspaceId(workspace.id);
    setEditWorkspaceName(workspace.name);
  };

  const updateWorkspace = async (e: React.FormEvent, workspaceId: string) => {
    e.preventDefault();
    setError(null);

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .update({ name: editWorkspaceName })
        .eq('id', workspaceId)
        .select()
        .single();

      if (error) throw error;

      setWorkspaces(workspaces.map((w) => (w.id === workspaceId ? data : w)));
      if (selectedWorkspace?.id === workspaceId) {
        setSelectedWorkspace(data);
      }
      setEditingWorkspaceId(null);
      setSuccess('Workspace updated');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteWorkspace = async (workspaceId: string, workspaceName: string) => {
    if (!window.confirm(`Delete "${workspaceName}"? All data will be lost.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);

      if (error) throw error;

      setWorkspaces(workspaces.filter((w) => w.id !== workspaceId));
      if (selectedWorkspace?.id === workspaceId) {
        setSelectedWorkspace(workspaces.find((w) => w.id !== workspaceId) || null);
      }
      setEditingWorkspaceId(null);
      setSuccess('Workspace deleted');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // KB functions
  const handleKBSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedWorkspace) return;

    try {
      const payload: any = {
        workspace_id: selectedWorkspace.id,
        title: kbFormData.title,
        content: kbFormData.content,
        scope_type: kbFormData.scope_type,
        scope_id: kbFormData.scope_type === 'property' ? kbFormData.scope_id : null,
      };

      if (editingKBId) {
        const { error } = await supabase.from('kb_documents').update(payload).eq('id', editingKBId);
        if (error) throw error;
        setSuccess('Document updated');
      } else {
        const { error } = await supabase.from('kb_documents').insert(payload);
        if (error) throw error;
        setSuccess('Document created');
      }

      setKbFormData({ title: '', content: '', scope_type: 'workspace', scope_id: '' });
      setShowCreateKB(false);
      setEditingKBId(null);
      loadKBDocuments(selectedWorkspace.id);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteKBDocument = async (id: string) => {
    if (!window.confirm('Delete this document?')) return;

    try {
      const { error } = await supabase.from('kb_documents').delete().eq('id', id);
      if (error) throw error;

      if (selectedWorkspace) loadKBDocuments(selectedWorkspace.id);
      setSuccess('Document deleted');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Settings functions
  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedWorkspace) return;

    try {
      const keywordsArray = escalationKeywords.split(',').map((k) => k.trim()).filter((k) => k.length > 0);
      const payload = {
        workspace_id: selectedWorkspace.id,
        escalation_keywords: keywordsArray,
        auto_escalate: autoEscalate,
      };

      if (settings) {
        const { error } = await supabase.from('workspace_settings').update(payload).eq('workspace_id', selectedWorkspace.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('workspace_settings').insert(payload);
        if (error) throw error;
      }

      setSuccess('Settings saved');
      setTimeout(() => setSuccess(null), 3000);
      loadSettings(selectedWorkspace.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getInboundEmail = () => {
    if (!selectedWorkspace) return '';
    return `inbound+${selectedWorkspace.id}@hostops.ai`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-center h-20">
            <h1 className="text-2xl font-semibold text-gray-900">HostOps.ai</h1>
            <button onClick={handleSignOut} className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Workspace Selector */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-semibold text-gray-900">Workspaces</h2>
            {!showCreateWorkspace && !editingWorkspaceId && (
              <button onClick={() => setShowCreateWorkspace(true)} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                Create workspace
              </button>
            )}
          </div>

          {showCreateWorkspace && (
            <form onSubmit={createWorkspace} className="mb-8 pb-8 border-b border-gray-200">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Workspace name"
                  required
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                />
                <button type="submit" className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">Create</button>
                <button type="button" onClick={() => { setShowCreateWorkspace(false); setWorkspaceName(''); }} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
              </div>
            </form>
          )}

          {workspaces.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">No workspaces yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className={`p-6 rounded-lg border cursor-pointer transition-all ${
                    selectedWorkspace?.id === workspace.id
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {editingWorkspaceId === workspace.id ? (
                    <form onSubmit={(e) => updateWorkspace(e, workspace.id)} className="space-y-3">
                      <input
                        type="text"
                        value={editWorkspaceName}
                        onChange={(e) => setEditWorkspaceName(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm">Save</button>
                        <button type="button" onClick={() => setEditingWorkspaceId(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">Cancel</button>
                      </div>
                      <button type="button" onClick={() => deleteWorkspace(workspace.id, workspace.name)} className="w-full px-4 py-2 text-sm text-red-600 hover:text-red-700 underline">Delete workspace</button>
                    </form>
                  ) : (
                    <div onClick={() => setSelectedWorkspace(workspace)}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{workspace.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{new Date(workspace.created_at).toLocaleDateString()}</p>
                        </div>
                        {selectedWorkspace?.id === workspace.id && (
                          <button
                            onClick={(e) => { e.stopPropagation(); startEditWorkspace(workspace); }}
                            className="text-sm text-gray-700 hover:text-gray-900 underline"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        {selectedWorkspace && (
          <>
            <div className="border-b border-gray-200 mb-12">
              <nav className="flex gap-8">
                {[
                  { id: 'listings', label: 'Properties', count: listings.length },
                  { id: 'inbox', label: 'Inbox', count: threads.length },
                  { id: 'knowledge', label: 'Knowledge', count: kbDocuments.filter(doc => doc.scope_type === 'workspace').length },
                  { id: 'settings', label: 'Settings', count: null },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as TabType); setSelectedThread(null); }}
                    className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== null && tab.count > 0 && (
                      <span className="ml-2 text-gray-400">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === 'listings' && (
                <PropertiesTab
                  listings={listings}
                  kbDocuments={kbDocuments}
                  onListingsChange={() => selectedWorkspace && loadListings(selectedWorkspace.id)}
                  onKBDocumentsChange={() => selectedWorkspace && loadKBDocuments(selectedWorkspace.id)}
                  setError={setError}
                  setSuccess={setSuccess}
                  setShowCreateKB={setShowCreateKB}
                  setEditingKBId={setEditingKBId}
                  setKbFormData={setKbFormData}
                />
              )}

              {activeTab === 'inbox' && (
                <InboxTab
                  threads={threads}
                  selectedThread={selectedThread}
                  messages={messages}
                  drafts={drafts}
                  listings={listings}
                  workspaceId={selectedWorkspace.id}
                  inboundEmail={getInboundEmail()}
                  setSelectedThread={setSelectedThread}
                  onThreadsChange={() => selectedWorkspace && loadThreads(selectedWorkspace.id)}
                  onMessagesChange={() => selectedThread && loadMessages(selectedThread.id)}
                  onDraftsChange={() => selectedThread && loadDrafts(selectedThread.id)}
                  setError={setError}
                  setSuccess={setSuccess}
                />
              )}

              {activeTab === 'knowledge' && (
                <KnowledgeTab
                  kbDocuments={kbDocuments}
                  showCreateKB={showCreateKB}
                  editingKBId={editingKBId}
                  kbFormData={kbFormData}
                  setShowCreateKB={setShowCreateKB}
                  setEditingKBId={setEditingKBId}
                  setKbFormData={setKbFormData}
                  handleKBSubmit={handleKBSubmit}
                  deleteKBDocument={deleteKBDocument}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsTab
                  escalationKeywords={escalationKeywords}
                  autoEscalate={autoEscalate}
                  setEscalationKeywords={setEscalationKeywords}
                  setAutoEscalate={setAutoEscalate}
                  saveSettings={saveSettings}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
