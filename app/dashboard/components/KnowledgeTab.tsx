'use client';

import type { KBDocument } from '@/types/database.types';

interface KnowledgeTabProps {
  kbDocuments: KBDocument[];
  showCreateKB: boolean;
  editingKBId: string | null;
  kbFormData: {
    title: string;
    content: string;
    scope_type: 'workspace' | 'property';
    scope_id: string;
  };
  setShowCreateKB: (show: boolean) => void;
  setEditingKBId: (id: string | null) => void;
  setKbFormData: (data: any) => void;
  handleKBSubmit: (e: React.FormEvent) => void;
  deleteKBDocument: (id: string) => void;
}

export default function KnowledgeTab({
  kbDocuments,
  showCreateKB,
  editingKBId,
  kbFormData,
  setShowCreateKB,
  setEditingKBId,
  setKbFormData,
  handleKBSubmit,
  deleteKBDocument,
}: KnowledgeTabProps) {
  const workspaceKBDocs = kbDocuments.filter((doc) => doc.scope_type === 'workspace');

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900">Knowledge Base</h3>
          <p className="text-sm text-gray-500 mt-1">
            Workspace-level knowledge shared across all properties
          </p>
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
            <button
              type="submit"
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
            >
              {editingKBId ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateKB(false);
                setEditingKBId(null);
                setKbFormData({ title: '', content: '', scope_type: 'workspace', scope_id: '' });
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {workspaceKBDocs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500">No workspace knowledge yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {workspaceKBDocs.map((doc) => (
            <div key={doc.id} className="pb-6 border-b border-gray-200 last:border-b-0">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-lg text-gray-900">{doc.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setEditingKBId(doc.id);
                      setKbFormData({
                        title: doc.title,
                        content: doc.content,
                        scope_type: doc.scope_type,
                        scope_id: doc.scope_id || '',
                      });
                      setShowCreateKB(true);
                    }}
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
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {doc.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
