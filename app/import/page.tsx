'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Workspace, KBDocument } from '@/types/database.types';

type Step = 'listing' | 'knowledge';

export default function ImportPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [airbnbId, setAirbnbId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Multi-step flow
  const [currentStep, setCurrentStep] = useState<Step>('listing');
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [createdListingTitle, setCreatedListingTitle] = useState('');

  // Knowledge base state
  const [kbDocuments, setKbDocuments] = useState<KBDocument[]>([]);
  const [showKBForm, setShowKBForm] = useState(false);
  const [kbFormData, setKbFormData] = useState({ title: '', content: '' });
  const [kbLoading, setKbLoading] = useState(false);
  const [editingKBId, setEditingKBId] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (createdListingId) {
      loadKBDocuments();
    }
  }, [createdListingId]);

  const loadWorkspaces = async () => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWorkspaces(data || []);
      if (data && data.length > 0) {
        setSelectedWorkspaceId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadKBDocuments = async () => {
    if (!createdListingId) return;

    try {
      const { data, error } = await supabase
        .from('kb_documents')
        .select('*')
        .eq('scope_type', 'property')
        .eq('scope_id', createdListingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKbDocuments(data || []);
    } catch (err: any) {
      console.error('Error loading KB documents:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!selectedWorkspaceId) {
        throw new Error('Please select a workspace');
      }

      const { data, error } = await supabase
        .from('listings')
        .insert({
          workspace_id: selectedWorkspaceId,
          airbnb_id: airbnbId,
          title,
          description,
          photo_url: photoUrl || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Move to knowledge step
      setCreatedListingId(data.id);
      setCreatedListingTitle(title);
      setCurrentStep('knowledge');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKBSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setKbLoading(true);
    setError(null);

    try {
      if (editingKBId) {
        // Update existing
        const { error } = await supabase
          .from('kb_documents')
          .update({
            title: kbFormData.title,
            content: kbFormData.content,
          })
          .eq('id', editingKBId);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase.from('kb_documents').insert({
          workspace_id: selectedWorkspaceId,
          scope_type: 'property',
          scope_id: createdListingId,
          title: kbFormData.title,
          content: kbFormData.content,
        });

        if (error) throw error;
      }

      setKbFormData({ title: '', content: '' });
      setShowKBForm(false);
      setEditingKBId(null);
      loadKBDocuments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setKbLoading(false);
    }
  };

  const handleEditKB = (doc: KBDocument) => {
    setEditingKBId(doc.id);
    setKbFormData({ title: doc.title, content: doc.content });
    setShowKBForm(true);
  };

  const handleDeleteKB = async (id: string) => {
    if (!window.confirm('Delete this knowledge document?')) return;

    try {
      const { error } = await supabase.from('kb_documents').delete().eq('id', id);
      if (error) throw error;
      loadKBDocuments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFinish = () => {
    router.push('/dashboard');
  };

  if (workspaces.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold">AriaHost</h1>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-sm text-gray-700 hover:text-gray-900"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              You need to create a workspace first before importing listings.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">AriaHost</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center ${currentStep === 'listing' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'listing' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {currentStep === 'listing' ? '1' : '✓'}
              </div>
              <span className="ml-2 text-sm font-medium">Listing Details</span>
            </div>
            <div className={`h-px w-16 ${currentStep === 'knowledge' ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center ${currentStep === 'knowledge' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'knowledge' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Property Knowledge</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {error && (
            <div className="mb-4 text-red-600 text-sm bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {currentStep === 'listing' ? (
            <>
              <h2 className="text-2xl font-bold mb-6">Import Listing</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="workspace" className="block text-sm font-medium text-gray-700">
                    Workspace
                  </label>
                  <select
                    id="workspace"
                    value={selectedWorkspaceId}
                    onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {workspaces.map((workspace) => (
                      <option key={workspace.id} value={workspace.id}>
                        {workspace.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="airbnbId" className="block text-sm font-medium text-gray-700">
                    Airbnb Listing ID
                  </label>
                  <input
                    id="airbnbId"
                    type="text"
                    required
                    value={airbnbId}
                    onChange={(e) => setAirbnbId(e.target.value)}
                    placeholder="e.g., 12345678"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Beautiful Downtown Apartment"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Cozy 2-bedroom apartment in the heart of downtown..."
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="photoUrl" className="block text-sm font-medium text-gray-700">
                    Photo URL (optional)
                  </label>
                  <input
                    id="photoUrl"
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Add a link to your property photo (from Airbnb or any image URL)
                  </p>
                  {photoUrl && (
                    <div className="mt-3 w-full aspect-square max-h-64 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                      <img
                        src={photoUrl}
                        alt="Property preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x800?text=Invalid+Image+URL';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Continue to Knowledge Base'}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Property Knowledge</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Add knowledge documents for <span className="font-medium">{createdListingTitle}</span>
                </p>
              </div>

              {!showKBForm && (
                <button
                  onClick={() => setShowKBForm(true)}
                  className="w-full mb-6 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-700 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  + Add Knowledge Document
                </button>
              )}

              {showKBForm && (
                <form onSubmit={handleKBSubmit} className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
                  <div>
                    <label htmlFor="kbTitle" className="block text-sm font-medium text-gray-900 mb-2">
                      Title
                    </label>
                    <input
                      id="kbTitle"
                      type="text"
                      value={kbFormData.title}
                      onChange={(e) => setKbFormData({ ...kbFormData, title: e.target.value })}
                      placeholder="e.g., WiFi Password, Check-in Instructions"
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="kbContent" className="block text-sm font-medium text-gray-900 mb-2">
                      Content
                    </label>
                    <textarea
                      id="kbContent"
                      value={kbFormData.content}
                      onChange={(e) => setKbFormData({ ...kbFormData, content: e.target.value })}
                      placeholder="Enter the knowledge content here..."
                      rows={6}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={kbLoading}
                      className="flex-1 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
                    >
                      {kbLoading ? 'Saving...' : editingKBId ? 'Update' : 'Add Document'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowKBForm(false);
                        setEditingKBId(null);
                        setKbFormData({ title: '', content: '' });
                      }}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {kbDocuments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">No knowledge documents yet</p>
                  <p className="text-xs text-gray-400 mt-1">Add documents like WiFi info, house rules, or check-in instructions</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {kbDocuments.map((doc) => (
                    <div key={doc.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm text-gray-900">{doc.title}</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditKB(doc)}
                            className="text-xs text-gray-700 hover:text-gray-900 underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteKB(doc.id)}
                            className="text-xs text-red-600 hover:text-red-700 underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 whitespace-pre-wrap line-clamp-3">{doc.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={handleFinish}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  Finish & Go to Dashboard
                </button>
                {kbDocuments.length === 0 && (
                  <button
                    onClick={handleFinish}
                    className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 underline"
                  >
                    Skip for now
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
