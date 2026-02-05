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
  setShowCreateKB,
  setEditingKBId,
  setKbFormData,
}: PropertiesTabProps) {
  const router = useRouter();
  const supabase = createClient();
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [editListingData, setEditListingData] = useState({
    airbnb_id: '',
    title: '',
    description: '',
  });

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
      const { error } = await supabase
        .from('listings')
        .update({
          airbnb_id: editListingData.airbnb_id,
          title: editListingData.title,
          description: editListingData.description,
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
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingListingId(null)}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteListing(listing.id, listing.title)}
                        className="ml-auto text-sm text-red-600 hover:text-red-700 underline"
                      >
                        Delete
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
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

                    {/* Property Knowledge Base */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="text-sm font-medium text-gray-900">Property Knowledge</h5>
                        <button
                          onClick={() => {
                            setKbFormData({
                              title: '',
                              content: '',
                              scope_type: 'property',
                              scope_id: listing.id,
                            });
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
                            <div
                              key={doc.id}
                              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h6 className="font-medium text-sm text-gray-900">{doc.title}</h6>
                                <div className="flex gap-2">
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
                              <p className="text-xs text-gray-600 whitespace-pre-wrap">
                                {doc.content}
                              </p>
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
  );
}
