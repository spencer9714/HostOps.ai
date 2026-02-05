'use client';

import { useState } from 'react';
import type { Thread, Message, AIDraft, Listing } from '@/types/database.types';
import { createClient } from '@/lib/supabase/client';

interface InboxTabProps {
  threads: Thread[];
  selectedThread: Thread | null;
  messages: Message[];
  drafts: AIDraft[];
  listings: Listing[];
  workspaceId: string;
  inboundEmail: string;
  setSelectedThread: (thread: Thread | null) => void;
  onThreadsChange: () => void;
  onMessagesChange: () => void;
  onDraftsChange: () => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
}

export default function InboxTab({
  threads,
  selectedThread,
  messages,
  drafts,
  listings,
  workspaceId,
  inboundEmail,
  setSelectedThread,
  onThreadsChange,
  onMessagesChange,
  onDraftsChange,
  setError,
  setSuccess,
}: InboxTabProps) {
  const supabase = createClient();
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

  const createThread = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const { data: thread, error: threadError } = await supabase
        .from('threads')
        .insert({
          workspace_id: workspaceId,
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
      onThreadsChange();
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
      const { error } = await supabase
        .from('messages')
        .insert({
          thread_id: selectedThread.id,
          role: newMessageRole,
          body: newMessage,
          source: 'manual',
        });

      if (error) throw error;

      setNewMessage('');
      setSuccess('Message added');
      setTimeout(() => setSuccess(null), 2000);
      onMessagesChange();
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

      onDraftsChange();
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

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Thread List */}
      <div className="col-span-1">
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs font-medium text-gray-700 mb-2">Inbound email</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={inboundEmail}
              readOnly
              className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white font-mono"
            />
            <button
              onClick={() => navigator.clipboard.writeText(inboundEmail)}
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
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
            <textarea
              value={threadFormData.initial_message}
              onChange={(e) => setThreadFormData({ ...threadFormData, initial_message: e.target.value })}
              placeholder="Initial message (optional)"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateThread(false)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
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
                  selectedThread?.id === thread.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                <h4 className="font-medium text-sm truncate text-gray-900 mb-1">
                  {thread.subject || 'No subject'}
                </h4>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedThread.subject || 'No subject'}
              </h3>
              <p className="text-sm text-gray-500">
                {selectedThread.guest_name || 'Guest'} · {selectedThread.guest_email}
              </p>
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
                      <span className="text-xs text-gray-500">
                        {new Date(msg.message_ts).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {msg.body}
                    </p>
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
                      draft.escalated ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
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
                    <p className="text-sm whitespace-pre-wrap mb-3 leading-relaxed text-gray-900">
                      {draft.draft_text}
                    </p>
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
  );
}
