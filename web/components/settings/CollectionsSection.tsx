import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../lib/api';

interface CollectionSummary {
  id: string;
  slug: string;
  name: string;
  description?: string;
  is_public: boolean;
  item_count: number;
  updated_at: string;
}

interface ProductOption {
  slug: string;
  name: string;
  category: string;
}

type View = 'list' | 'new' | 'edit';

function token() {
  return typeof window !== 'undefined' ? localStorage.getItem('ar-token') : null;
}

export default function CollectionsSection() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [editing, setEditing] = useState<CollectionSummary | null>(null);

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPublic, setFormPublic] = useState(true);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [myProducts, setMyProducts] = useState<ProductOption[]>([]);
  const [addingSlug, setAddingSlug] = useState('');
  const [addingNote, setAddingNote] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [collectionDetail, setCollectionDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { fetchCollections(); }, []);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/collections/mine/list`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) setCollections(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProducts = async () => {
    if (myProducts.length) return;
    const res = await fetch(`${API_URL}/listings/my-listings`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      const data = await res.json();
      setMyProducts(data.filter((l: any) => l.status === 'approved').map((l: any) => ({
        slug: l.slug, name: l.name, category: l.category,
      })));
    }
  };

  const fetchDetail = async (slug: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_URL}/collections/${slug}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) setCollectionDetail(await res.json());
    } finally {
      setDetailLoading(false);
    }
  };

  const openNew = () => {
    setEditing(null);
    setFormName(''); setFormDesc(''); setFormPublic(true); setFormError('');
    setView('new');
  };

  const openEdit = (c: CollectionSummary) => {
    setEditing(c);
    setFormName(c.name); setFormDesc(c.description || ''); setFormPublic(c.is_public); setFormError('');
    setView('edit');
  };

  const handleSubmit = async () => {
    if (!formName.trim()) { setFormError('Name is required'); return; }
    setFormSaving(true); setFormError('');
    try {
      const method = view === 'new' ? 'POST' : 'PUT';
      const url = view === 'new'
        ? `${API_URL}/collections`
        : `${API_URL}/collections/${editing!.slug}`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ name: formName, description: formDesc || null, is_public: formPublic }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save');
      }
      await fetchCollections();
      setView('list');
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (c: CollectionSummary) => {
    if (!confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    const res = await fetch(`${API_URL}/collections/${c.slug}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (!res.ok) { alert('Failed to delete collection. Please try again.'); return; }
    setCollections(prev => prev.filter(x => x.id !== c.id));
    if (expandedSlug === c.slug) setExpandedSlug(null);
  };

  const toggleExpand = async (slug: string) => {
    if (expandedSlug === slug) { setExpandedSlug(null); return; }
    setExpandedSlug(slug);
    setCollectionDetail(null);
    await Promise.all([fetchMyProducts(), fetchDetail(slug)]);
  };

  const handleAddItem = async (collSlug: string) => {
    if (!addingSlug) return;
    setAddLoading(true);
    try {
      const res = await fetch(`${API_URL}/collections/${collSlug}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ product_slug: addingSlug, note: addingNote || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to add');
      }
      setAddingSlug(''); setAddingNote('');
      await Promise.all([fetchCollections(), fetchDetail(collSlug)]);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveItem = async (collSlug: string, itemId: string) => {
    const res = await fetch(`${API_URL}/collections/${collSlug}/items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (!res.ok) { alert('Failed to remove item. Please try again.'); return; }
    await Promise.all([fetchCollections(), fetchDetail(collSlug)]);
  };

  if (!user) return null;

  // ── form view ──
  if (view === 'new' || view === 'edit') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('list')} className="text-ink-400 hover:text-ink-900 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="heading-serif text-2xl text-ink-900">{view === 'new' ? 'New Collection' : 'Edit Collection'}</h2>
        </div>

        {formError && (
          <div className="p-4 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">{formError}</div>
        )}

        <div className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Name</label>
            <input
              value={formName}
              onChange={e => setFormName(e.target.value)}
              maxLength={120}
              placeholder="e.g. My AI Writing Stack"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">
              Description <span className="text-ink-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="What makes these listings work well together?"
              className="input resize-none"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setFormPublic(!formPublic)}
              className={`w-10 h-6 rounded-full transition-colors ${formPublic ? 'bg-terra-500' : 'bg-cream-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${formPublic ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-ink-700">Public — visible to everyone</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={formSaving}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {formSaving ? 'Saving…' : view === 'new' ? 'Create Collection' : 'Save Changes'}
            </button>
            <button onClick={() => setView('list')} className="btn-secondary px-5">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── list view ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-serif text-2xl text-ink-900 mb-1">Collections</h2>
          <p className="text-ink-500 text-sm">Curate groups of listings that work well together.</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2 !py-2 !px-4 !text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Collection
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-terra-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : collections.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-ink-500 mb-4">No collections yet. Create your first one to group related listings.</p>
          <button onClick={openNew} className="text-terra-600 hover:underline text-sm">Create a collection →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {collections.map(c => (
            <div key={c.id} className="card overflow-hidden">
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/collections/${c.slug}`} target="_blank" className="font-semibold text-ink-900 hover:text-terra-600 transition-colors truncate">
                      {c.name}
                    </Link>
                    {!c.is_public && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cream-200 text-ink-500">Private</span>
                    )}
                    <span className="text-xs text-ink-400">{c.item_count} listing{c.item_count !== 1 ? 's' : ''}</span>
                  </div>
                  {c.description && <p className="text-ink-500 text-sm mt-1 line-clamp-1">{c.description}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleExpand(c.slug)}
                    className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-cream-200 transition-colors"
                    title="Manage listings"
                  >
                    <svg className={`w-4 h-4 transition-transform ${expandedSlug === c.slug ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-cream-200 transition-colors" title="Edit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(c)} className="p-1.5 rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expanded item management */}
              {expandedSlug === c.slug && (
                <div className="border-t border-cream-200 p-5 space-y-4 bg-cream-100/50">
                  {detailLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-terra-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : collectionDetail?.items?.length > 0 ? (
                    <div className="space-y-2">
                      {collectionDetail.items.map((item: any) => (
                        <div key={item.id} className="flex items-start justify-between gap-3 p-3 bg-white rounded-lg border border-cream-200">
                          <div className="flex-1 min-w-0">
                            <Link href={`/listings/${item.product.slug}`} className="text-sm font-medium text-ink-900 hover:text-terra-600 transition-colors truncate block">
                              {item.product.name}
                            </Link>
                            {item.note && <p className="text-xs text-ink-400 italic mt-0.5">"{item.note}"</p>}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(c.slug, item.id)}
                            className="text-ink-400 hover:text-red-600 transition-colors flex-shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-ink-500">No listings added yet.</p>
                  )}

                  {/* Add listing */}
                  <div className="pt-2 border-t border-cream-200">
                    <p className="text-xs font-medium text-ink-400 uppercase tracking-wider mb-2">Add a listing</p>
                    {myProducts.length === 0 ? (
                      <p className="text-sm text-ink-500">No approved listings to add.</p>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={addingSlug}
                          onChange={e => setAddingSlug(e.target.value)}
                          className="input flex-1 text-sm"
                        >
                          <option value="">Select a listing…</option>
                          {myProducts
                            .filter(p => !collectionDetail?.items?.some((i: any) => i.product.slug === p.slug))
                            .map(p => (
                              <option key={p.slug} value={p.slug}>{p.name}</option>
                            ))}
                        </select>
                        <input
                          value={addingNote}
                          onChange={e => setAddingNote(e.target.value)}
                          maxLength={280}
                          placeholder="Why it works well… (optional)"
                          className="input flex-1 text-sm"
                        />
                        <button
                          onClick={() => handleAddItem(c.slug)}
                          disabled={!addingSlug || addLoading}
                          className="btn-primary !py-2 !px-4 !text-sm disabled:opacity-50 whitespace-nowrap"
                        >
                          {addLoading ? 'Adding…' : 'Add'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
