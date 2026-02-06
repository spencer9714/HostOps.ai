'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Listing, KBDocument } from '@/types/database.types';
import { createClient } from '@/lib/supabase/client';

interface PropertiesTabProps {
  listings: Listing[];
  kbDocuments: KBDocument[];
  onListingsChange: () => void;
  onKBDocumentsChange: () => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  setShowCreateKB: (show: boolean) => void;
  setEditingKBId: (id: string | null) => void;
  setKbFormData: (data: any) => void;
}

export default function PropertiesTab({
  listings,
  kbDocuments,
  onListingsChange,
  onKBDocumentsChange,
  setError,
  setSuccess,
}: PropertiesTabProps) {
  const router = useRouter();
  const supabase = createClient();
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [editListingData, setEditListingData] = useState({
    airbnb_id: '',
    title: '',
    description: '',
    photo_url: '',
    workspace_id: '',
  });
  const [showKBSection, setShowKBSection] = useState(true);

  // Local KB form state
  const [showKBForm, setShowKBForm] = useState(false);
  const [editingKBId, setEditingKBId] = useState<string | null>(null);
  const [kbFormData, setKbFormData] = useState({ title: '', content: '' });
  const [kbLoading, setKbLoading] = useState(false);

  const startEditListing = (listing: Listing) => {
    setEditingListingId(listing.id);
    setEditListingData({
      airbnb_id: listing.airbnb_id,
      title: listing.title,
      description: listing.description || '',
      photo_url: listing.photo_url || '',
      workspace_id: listing.workspace_id,
    });
    setShowKBSection(true);
    setShowKBForm(false);
    setEditingKBId(null);
  };

  const updateListing = async (e: React.FormEvent, listingId: string) => {
    e.preventDefault();
    setError(null);

    try {
      const { error } = await supabase
        .from('listings')
        .update({
          airbnb_id: editListingData.airbnb_id,
          title: editListingData.title,
          description: editListingData.description,
          photo_url: editListingData.photo_url || null,
        })
        .eq('id', listingId);

      if (error) throw error;

      setEditingListingId(null);
      setSuccess('Listing updated');
      setTimeout(() => setSuccess(null), 3000);
      onListingsChange();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteListing = async (listingId: string, listingTitle: string) => {
    if (!window.confirm(`Delete "${listingTitle}"?`)) return;

    try {
      const { error } = await supabase.from('listings').delete().eq('id', listingId);
      if (error) throw error;

      setSuccess('Listing deleted');
      setTimeout(() => setSuccess(null), 3000);
      onListingsChange();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleKBSubmit = async (propertyId: string, workspaceId: string) => {
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
        setSuccess('Knowledge document updated');
      } else {
        // Create new
        const { error } = await supabase.from('kb_documents').insert({
          workspace_id: workspaceId,
          scope_type: 'property',
          scope_id: propertyId,
          title: kbFormData.title,
          content: kbFormData.content,
        });

        if (error) throw error;
        setSuccess('Knowledge document added');
      }

      setKbFormData({ title: '', content: '' });
      setShowKBForm(false);
      setEditingKBId(null);
      setTimeout(() => setSuccess(null), 3000);
      onKBDocumentsChange();
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

  const deleteKBDocument = async (id: string) => {
    if (!window.confirm('Delete this document?')) return;

    try {
      const { error } = await supabase.from('kb_documents').delete().eq('id', id);
      if (error) throw error;

      setSuccess('Document deleted');
      setTimeout(() => setSuccess(null), 3000);
      onKBDocumentsChange();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-semibold text-gray-900">Properties</h3>
        <button
          onClick={() => router.push('/import')}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
        >
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
            const propertyKBDocs = kbDocuments.filter(
              (doc) => doc.scope_type === 'property' && doc.scope_id === listing.id
            );
            return (
              <div key={listing.id} className="pb-8 border-b border-gray-200 last:border-b-0">
                {editingListingId === listing.id ? (
                  <form onSubmit={(e) => updateListing(e, listing.id)} className="space-y-6">
                    {/* Photo Preview - Square Aspect Ratio */}
                    {editListingData.photo_url && (
                      <div className="w-full aspect-square max-h-96 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                        <img
                          src={editListingData.photo_url}
                          alt={editListingData.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x800?text=Invalid+Image+URL';
                          }}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Airbnb ID
                        </label>
                        <input
                          type="text"
                          value={editListingData.airbnb_id}
                          onChange={(e) =>
                            setEditListingData({ ...editListingData, airbnb_id: e.target.value })
                          }
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Photo URL
                        </label>
                        <input
                          type="url"
                          value={editListingData.photo_url}
                          onChange={(e) =>
                            setEditListingData({ ...editListingData, photo_url: e.target.value })
                          }
                          placeholder="https://example.com/photo.jpg"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
                      <input
                        type="text"
                        value={editListingData.title}
                        onChange={(e) =>
                          setEditListingData({ ...editListingData, title: e.target.value })
                        }
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Description
                      </label>
                      <textarea
                        value={editListingData.description}
                        onChange={(e) =>
                          setEditListingData({ ...editListingData, description: e.target.value })
                        }
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                      />
                    </div>

                    {/* Property Knowledge Section - Inside Edit Form */}
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowKBSection(!showKBSection)}
                        className="w-full px-4 py-3 bg-gray-50 flex justify-between items-center hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          Property Knowledge ({propertyKBDocs.length})
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-600 transition-transform ${
                            showKBSection ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showKBSection && (
                        <div className="p-4 space-y-3">
                          {!showKBForm && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowKBForm(true);
                                setEditingKBId(null);
                                setKbFormData({ title: '', content: '' });
                              }}
                              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                              + Add Knowledge Document
                            </button>
                          )}

                          {showKBForm && (
                            <div className="p-4 bg-white border border-gray-300 rounded-lg space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-900 mb-1">
                                  Title
                                </label>
                                <input
                                  type="text"
                                  value={kbFormData.title}
                                  onChange={(e) => setKbFormData({ ...kbFormData, title: e.target.value })}
                                  placeholder="e.g., WiFi Password"
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-900 mb-1">
                                  Content
                                </label>
                                <textarea
                                  value={kbFormData.content}
                                  onChange={(e) => setKbFormData({ ...kbFormData, content: e.target.value })}
                                  placeholder="Enter the knowledge content..."
                                  rows={4}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (kbFormData.title && kbFormData.content) {
                                      handleKBSubmit(listing.id, listing.workspace_id);
                                    } else {
                                      setError('Please fill in both title and content');
                                      setTimeout(() => setError(null), 3000);
                                    }
                                  }}
                                  disabled={kbLoading}
                                  className="flex-1 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
                                >
                                  {kbLoading ? 'Saving...' : editingKBId ? 'Update' : 'Add'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowKBForm(false);
                                    setEditingKBId(null);
                                    setKbFormData({ title: '', content: '' });
                                  }}
                                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {propertyKBDocs.length === 0 && !showKBForm ? (
                            <p className="text-sm text-gray-500 text-center py-4">No knowledge documents yet</p>
                          ) : (
                            <div className="space-y-2">
                              {propertyKBDocs.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="p-3 bg-white rounded-lg border border-gray-200"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h6 className="font-medium text-sm text-gray-900">{doc.title}</h6>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleEditKB(doc)}
                                        className="text-xs text-gray-700 hover:text-gray-900 underline"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteKBDocument(doc.id)}
                                        className="text-xs text-red-600 hover:text-red-700 underline"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-600 whitespace-pre-wrap line-clamp-2">
                                    {doc.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingListingId(null);
                          setShowKBForm(false);
                          setEditingKBId(null);
                        }}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteListing(listing.id, listing.title)}
                        className="ml-auto text-sm text-red-600 hover:text-red-700 underline"
                      >
                        Delete Property
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    {/* Photo Display - Square/Airbnb Style */}
                    {listing.photo_url && (
                      <div className="w-full aspect-square max-h-80 rounded-xl overflow-hidden bg-gray-100 mb-4 border border-gray-200 shadow-sm">
                        <img
                          src={listing.photo_url}
                          alt={listing.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg text-gray-900">{listing.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">ID: {listing.airbnb_id}</p>
                      </div>
                      <button
                        onClick={() => startEditListing(listing)}
                        className="text-sm text-gray-700 hover:text-gray-900 underline"
                      >
                        Edit
                      </button>
                    </div>
                    {listing.description && (
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {listing.description}
                      </p>
                    )}

                    {/* Property Knowledge Count Badge */}
                    {propertyKBDocs.length > 0 && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-700">
                          {propertyKBDocs.length} knowledge {propertyKBDocs.length === 1 ? 'document' : 'documents'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
