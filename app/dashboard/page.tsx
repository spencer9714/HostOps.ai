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

type TabType = 'listings' | 'inbox' | 'knowledge' | 'settings';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('listings');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);

  // Listings state
  const [listings, setListings] = useState<Listing[]>([]);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [editListingData, setEditListingData] = useState({
    airbnb_id: '',
    title: '',
    description: '',
  });

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
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [newMessageRole, setNewMessageRole] = useState<'guest' | 'host'>('guest');
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState<string | null>(null);
  const [threadFormData, setThreadFormData] = useState({
    subject: '',
    guest_email: '',
    guest_name: '',
    property_id: '',
    initial_message: '',
  });

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

  // Listing functions
  const startEditListing = (listing: Listing) => {
    setEditingListingId(listing.id);
    setEditListingData({
      airbnb_id: listing.airbnb_id,
      title: listing.title,
      description: listing.description || '',
    });
  };

  const updateListing = async (e: React.FormEvent, listingId: string) => {
    e.preventDefault();
    setError(null);

    try {
      const { data, error } = await supabase
        .from('listings')
        .update({
          airbnb_id: editListingData.airbnb_id,
          title: editListingData.title,
          description: editListingData.description,
        })
        .eq('id', listingId)
        .select()
        .single();

      if (error) throw error;

      setListings(listings.map((l) => (l.id === listingId ? data : l)));
      setEditingListingId(null);
      setSuccess('Listing updated');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteListing = async (listingId: string, listingTitle: string) => {
    if (!window.confirm(`Delete "${listingTitle}"?`)) return;

    try {
      const { error } = await supabase.from('listings').delete().eq('id', listingId);
      if (error) throw error;

      setListings(listings.filter((l) => l.id !== listingId));
      setSuccess('Listing deleted');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Thread functions
  const createThread = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedWorkspace) return;

    try {
      const { data: thread, error: threadError } = await supabase
        .from('threads')
        .insert({
          workspace_id: selectedWorkspace.id,
          source: 'manual',
          subject: threadFormData.subject,
          guest_email: threadFormData.guest_email,
          guest_name: threadFormData.guest_name,
          property_id: threadFormData.property_id || null,
          status: 'active',
        })
        .select()
        .single();

      if (threadError || !thread) throw threadError;

      if (threadFormData.initial_message) {
        await supabase.from('messages').insert({
          thread_id: thread.id,
          role: 'guest',
          body: threadFormData.initial_message,
          source: 'manual',
        });
      }

      setThreadFormData({
        subject: '',
        guest_email: '',
        guest_name: '',
        property_id: '',
        initial_message: '',
      });
      setShowCreateThread(false);
      loadThreads(selectedWorkspace.id);
      setSelectedThread(thread);
      setSuccess('Thread created');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newMessage.trim() || !selectedThread) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          thread_id: selectedThread.id,
          role: newMessageRole,
          body: newMessage,
          source: 'manual',
        })
        .select()
        .single();

      if (error) throw error;

      setMessages([...messages, data]);
      setNewMessage('');
      setSuccess('Message added');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const generateDraft = async () => {
    if (!selectedThread) return;

    setGeneratingDraft(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: selectedThread.id }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to generate draft');

      loadDrafts(selectedThread.id);
      setSuccess('Draft generated');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingDraft(false);
    }
  };

  const copyDraft = (draftText: string, draftId: string) => {
    navigator.clipboard.writeText(draftText);
    setCopiedDraft(draftId);
    setTimeout(() => setCopiedDraft(null), 2000);
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
              {/* Listings Tab */}
              {activeTab === 'listings' && (
                <div>
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-semibold text-gray-900">Properties</h3>
                    <button onClick={() => router.push('/import')} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                      Add listing
                    </button>
                  </div>
                  {listings.length === 0 ? (
                    <div className="text-center py-20">
                      <p className="text-gray-500">No properties yet</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {listings.map((listing) => {
                        const propertyKBDocs = kbDocuments.filter(doc => doc.scope_type === 'property' && doc.scope_id === listing.id);
                        return (
                          <div key={listing.id} className="pb-8 border-b border-gray-200 last:border-b-0">
                            {editingListingId === listing.id ? (
                              <form onSubmit={(e) => updateListing(e, listing.id)} className="space-y-6">
                                <div>
                                  <label className="block text-sm font-medium text-gray-900 mb-2">Airbnb ID</label>
                                  <input
                                    type="text"
                                    value={editListingData.airbnb_id}
                                    onChange={(e) => setEditListingData({ ...editListingData, airbnb_id: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
                                  <input
                                    type="text"
                                    value={editListingData.title}
                                    onChange={(e) => setEditListingData({ ...editListingData, title: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                                  <textarea
                                    value={editListingData.description}
                                    onChange={(e) => setEditListingData({ ...editListingData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                                  />
                                </div>
                                <div className="flex gap-3">
                                  <button type="submit" className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm">Save</button>
                                  <button type="button" onClick={() => setEditingListingId(null)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">Cancel</button>
                                  <button type="button" onClick={() => deleteListing(listing.id, listing.title)} className="ml-auto text-sm text-red-600 hover:text-red-700 underline">Delete</button>
                                </div>
                              </form>
                            ) : (
                              <div>
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-semibold text-lg text-gray-900">{listing.title}</h4>
                                    <p className="text-sm text-gray-500 mt-1">ID: {listing.airbnb_id}</p>
                                  </div>
                                  <button onClick={() => startEditListing(listing)} className="text-sm text-gray-700 hover:text-gray-900 underline">
                                    Edit
                                  </button>
                                </div>
                                {listing.description && (
                                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{listing.description}</p>
                                )}

                                {/* Property Knowledge Base */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                  <div className="flex justify-between items-center mb-4">
                                    <h5 className="text-sm font-medium text-gray-900">Property Knowledge</h5>
                                    <button
                                      onClick={() => {
                                        setKbFormData({ title: '', content: '', scope_type: 'property', scope_id: listing.id });
                                        setShowCreateKB(true);
                                      }}
                                      className="text-sm text-gray-700 hover:text-gray-900 underline"
                                    >
                                      Add
                                    </button>
                                  </div>
                                  {propertyKBDocs.length === 0 ? (
                                    <p className="text-sm text-gray-500">No knowledge documents yet</p>
                                  ) : (
                                    <div className="space-y-3">
                                      {propertyKBDocs.map((doc) => (
                                        <div key={doc.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                          <div className="flex justify-between items-start mb-2">
                                            <h6 className="font-medium text-sm text-gray-900">{doc.title}</h6>
                                            <div className="flex gap-2">
                                              <button
                                                onClick={() => {
                                                  setEditingKBId(doc.id);
                                                  setKbFormData({ title: doc.title, content: doc.content, scope_type: doc.scope_type, scope_id: doc.scope_id || '' });
                                                  setShowCreateKB(true);
                                                }}
                                                className="text-xs text-gray-700 hover:text-gray-900 underline"
                                              >
                                                Edit
                                              </button>
                                              <button
                                                onClick={() => deleteKBDocument(doc.id)}
                                                className="text-xs text-red-600 hover:text-red-700 underline"
                                              >
                                                Delete
                                              </button>
                                            </div>
                                          </div>
                                          <p className="text-xs text-gray-600 whitespace-pre-wrap">{doc.content}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Inbox Tab */}
              {activeTab === 'inbox' && (
                <div className="grid grid-cols-3 gap-8">
                  {/* Thread List */}
                  <div className="col-span-1">
                    <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-xs font-medium text-gray-700 mb-2">Inbound email</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={getInboundEmail()}
                          readOnly
                          className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white font-mono"
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(getInboundEmail())}
                          className="px-3 py-2 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-base font-semibold text-gray-900">Conversations</h3>
                      <button
                        onClick={() => setShowCreateThread(true)}
                        className="text-sm text-gray-700 hover:text-gray-900 underline"
                      >
                        New
                      </button>
                    </div>

                    {showCreateThread && (
                      <form onSubmit={createThread} className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                        <input
                          type="text"
                          value={threadFormData.subject}
                          onChange={(e) => setThreadFormData({ ...threadFormData, subject: e.target.value })}
                          placeholder="Subject"
                          required
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                        />
                        <input
                          type="email"
                          value={threadFormData.guest_email}
                          onChange={(e) => setThreadFormData({ ...threadFormData, guest_email: e.target.value })}
                          placeholder="Guest email"
                          required
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                        />
                        <input
                          type="text"
                          value={threadFormData.guest_name}
                          onChange={(e) => setThreadFormData({ ...threadFormData, guest_name: e.target.value })}
                          placeholder="Guest name (optional)"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                        />
                        <select
                          value={threadFormData.property_id}
                          onChange={(e) => setThreadFormData({ ...threadFormData, property_id: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                        >
                          <option value="">No property</option>
                          {listings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
                        </select>
                        <textarea
                          value={threadFormData.initial_message}
                          onChange={(e) => setThreadFormData({ ...threadFormData, initial_message: e.target.value })}
                          placeholder="Initial message (optional)"
                          rows={3}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                        />
                        <div className="flex gap-2">
                          <button type="submit" className="flex-1 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">Create</button>
                          <button type="button" onClick={() => setShowCreateThread(false)} className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-1 max-h-[500px] overflow-y-auto">
                      {threads.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-sm text-gray-500">No conversations yet</p>
                        </div>
                      ) : (
                        threads.map((thread) => (
                          <div
                            key={thread.id}
                            onClick={() => setSelectedThread(thread)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedThread?.id === thread.id
                                ? 'bg-gray-100'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <h4 className="font-medium text-sm truncate text-gray-900 mb-1">{thread.subject || 'No subject'}</h4>
                            <p className="text-xs text-gray-500 truncate">{thread.guest_email}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Thread Detail */}
                  {selectedThread ? (
                    <>
                      <div className="col-span-1">
                        <div className="mb-6 pb-6 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedThread.subject || 'No subject'}</h3>
                          <p className="text-sm text-gray-500">{selectedThread.guest_name || 'Guest'} · {selectedThread.guest_email}</p>
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto mb-6">
                          {messages.length === 0 ? (
                            <div className="text-center py-12">
                              <p className="text-sm text-gray-500">No messages yet</p>
                            </div>
                          ) : (
                            messages.map((msg) => (
                              <div key={msg.id} className="pb-4 border-b border-gray-200 last:border-b-0">
                                <div className="flex justify-between mb-2">
                                  <span className="font-medium text-xs text-gray-700">
                                    {msg.role === 'guest' ? 'Guest' : 'Host'}
                                  </span>
                                  <span className="text-xs text-gray-500">{new Date(msg.message_ts).toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                              </div>
                            ))
                          )}
                        </div>

                        <form onSubmit={addMessage} className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <select
                            value={newMessageRole}
                            onChange={(e) => setNewMessageRole(e.target.value as 'guest' | 'host')}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                          >
                            <option value="guest">Guest</option>
                            <option value="host">Host</option>
                          </select>
                          <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            rows={4}
                            placeholder="Type message..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                          />
                          <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="w-full px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                          >
                            Add message
                          </button>
                        </form>
                      </div>

                      <div className="col-span-1">
                        <div className="mb-6">
                          <h3 className="text-base font-semibold text-gray-900 mb-4">AI Assistant</h3>
                          <button
                            onClick={generateDraft}
                            disabled={generatingDraft || messages.length === 0}
                            className="w-full px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                          >
                            {generatingDraft ? 'Generating...' : 'Generate reply'}
                          </button>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                          {drafts.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-sm text-gray-500">No drafts yet</p>
                            </div>
                          ) : (
                            drafts.map((draft) => (
                              <div
                                key={draft.id}
                                className={`p-4 rounded-lg border ${
                                  draft.escalated
                                    ? 'border-red-200 bg-red-50'
                                    : 'border-gray-200 bg-gray-50'
                                }`}
                              >
                                {draft.escalated && (
                                  <div className="mb-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                                    <p className="text-xs font-medium text-red-900">Escalation required</p>
                                    {draft.escalation_reason && (
                                      <p className="text-xs text-red-800 mt-1">{draft.escalation_reason}</p>
                                    )}
                                  </div>
                                )}
                                <p className="text-sm whitespace-pre-wrap mb-3 leading-relaxed text-gray-900">{draft.draft_text}</p>
                                <div className="flex justify-between items-center text-xs text-gray-500 mb-3 pb-3 border-b border-gray-200">
                                  <span>Confidence: {(draft.confidence * 100).toFixed(0)}%</span>
                                  <span>{new Date(draft.created_at).toLocaleTimeString()}</span>
                                </div>
                                <button
                                  onClick={() => copyDraft(draft.draft_text, draft.id)}
                                  className={`w-full px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                                    copiedDraft === draft.id
                                      ? 'bg-gray-900 text-white'
                                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {copiedDraft === draft.id ? 'Copied!' : 'Copy'}
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 flex flex-col items-center justify-center text-gray-500 py-20">
                      <p className="text-gray-500">Select a conversation to view details</p>
                    </div>
                  )}
                </div>
              )}

              {/* Knowledge Tab - Workspace Level Only */}
              {activeTab === 'knowledge' && (
                <div>
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900">Knowledge Base</h3>
                      <p className="text-sm text-gray-500 mt-1">Workspace-level knowledge shared across all properties</p>
                    </div>
                    {!showCreateKB && (
                      <button
                        onClick={() => {
                          setKbFormData({ title: '', content: '', scope_type: 'workspace', scope_id: '' });
                          setShowCreateKB(true);
                        }}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                      >
                        Add document
                      </button>
                    )}
                  </div>

                  {showCreateKB && kbFormData.scope_type === 'workspace' && (
                    <form onSubmit={handleKBSubmit} className="mb-8 pb-8 border-b border-gray-200 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
                        <input
                          type="text"
                          value={kbFormData.title}
                          onChange={(e) => setKbFormData({ ...kbFormData, title: e.target.value })}
                          required
                          placeholder="WiFi Info, House Rules, General FAQs..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Content</label>
                        <textarea
                          value={kbFormData.content}
                          onChange={(e) => setKbFormData({ ...kbFormData, content: e.target.value })}
                          required
                          rows={8}
                          placeholder="Enter detailed information..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm">
                          {editingKBId ? 'Update' : 'Create'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowCreateKB(false); setEditingKBId(null); setKbFormData({ title: '', content: '', scope_type: 'workspace', scope_id: '' }); }}
                          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {showCreateKB && kbFormData.scope_type === 'property' && (
                    <form onSubmit={handleKBSubmit} className="mb-8 pb-8 border-b border-gray-200 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
                        <input
                          type="text"
                          value={kbFormData.title}
                          onChange={(e) => setKbFormData({ ...kbFormData, title: e.target.value })}
                          required
                          placeholder="Parking Info, Access Codes, Check-in..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Content</label>
                        <textarea
                          value={kbFormData.content}
                          onChange={(e) => setKbFormData({ ...kbFormData, content: e.target.value })}
                          required
                          rows={8}
                          placeholder="Enter property-specific information..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm">
                          {editingKBId ? 'Update' : 'Create'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowCreateKB(false); setEditingKBId(null); setKbFormData({ title: '', content: '', scope_type: 'workspace', scope_id: '' }); }}
                          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {kbDocuments.filter(doc => doc.scope_type === 'workspace').length === 0 ? (
                    <div className="text-center py-20">
                      <p className="text-gray-500">No workspace knowledge yet</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {kbDocuments.filter(doc => doc.scope_type === 'workspace').map((doc) => (
                        <div key={doc.id} className="pb-6 border-b border-gray-200 last:border-b-0">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-lg text-gray-900">{doc.title}</h4>
                              <p className="text-sm text-gray-500 mt-1">{new Date(doc.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={() => { setEditingKBId(doc.id); setKbFormData({ title: doc.title, content: doc.content, scope_type: doc.scope_type, scope_id: doc.scope_id || '' }); setShowCreateKB(true); }}
                                className="text-sm text-gray-700 hover:text-gray-900 underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteKBDocument(doc.id)}
                                className="text-sm text-red-600 hover:text-red-700 underline"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{doc.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-8">Settings</h3>
                  <form onSubmit={saveSettings} className="space-y-8">
                    <div className="pb-8 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Auto-escalate sensitive messages</h4>
                          <p className="text-sm text-gray-500 mt-1">Flag messages containing escalation keywords</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={autoEscalate} onChange={(e) => setAutoEscalate(e.target.checked)} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                        </label>
                      </div>
                    </div>
                    <div className="pb-8 border-b border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <label className="block text-base font-medium text-gray-900">Escalation keywords</label>
                          <p className="text-sm text-gray-500 mt-1">Comma-separated keywords</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEscalationKeywords('refund, compensation, discount, injury, safety, police, legal, lawsuit, chargeback')}
                          className="text-sm text-gray-700 hover:text-gray-900 underline"
                        >
                          Reset
                        </button>
                      </div>
                      <textarea
                        value={escalationKeywords}
                        onChange={(e) => setEscalationKeywords(e.target.value)}
                        rows={4}
                        placeholder="refund, compensation, discount..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {escalationKeywords.split(',').filter((k) => k.trim()).length} keywords
                      </p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <h4 className="font-medium text-gray-900 mb-3">How it works</h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li>• AI analyzes messages for escalation keywords</li>
                        <li>• Flagged messages show a warning banner</li>
                        <li>• AI generates drafts but you must review before sending</li>
                        <li>• All drafts are copy-paste only</li>
                      </ul>
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                    >
                      Save settings
                    </button>
                  </form>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
