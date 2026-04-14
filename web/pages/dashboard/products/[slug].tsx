import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Logo from '../../../components/Logo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agent-resources-api-dev-production.up.railway.app';

// Disable static generation
export async function getServerSideProps() {
  return { props: {} };
}

interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price_cents: number;
  category_tags: string[];
  status?: string;
  is_active: boolean;
  is_verified: boolean;
  download_count: number;
  created_at: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  user_name: string;
  created_at: string;
  is_verified_purchase: boolean;
}

interface ProductStats {
  total_reviews: number;
  average_rating: number;
  total_sales: number;
  total_revenue_cents: number;
}

const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    'persona': 'AI Persona',
    'skill': 'Agent Skill',
    'mcp_server': 'MCP Server',
  };
  return names[category] || category;
};

export default function ManageProduct() {
  const router = useRouter();
  const { slug } = router.query;
  const { user } = useAuth();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price_cents: 0
  });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    if (slug && user) {
      fetchProductData();
    }
  }, [slug, user]);

  const fetchProductData = async () => {
    try {
      const token = localStorage.getItem('ar-token');

      // Fetch all user listings and find the one with matching slug
      const listingsRes = await fetch(`${API_URL}/listings/my-listings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!listingsRes.ok) {
        throw new Error('Failed to fetch listings');
      }

      const listings = await listingsRes.json();
      const listing = listings.find((l: any) => l.slug === slug);

      if (!listing) {
        throw new Error('Listing not found');
      }

      setProduct(listing);
      setEditForm({
        name: listing.name,
        description: listing.description,
        price_cents: listing.price_cents
      });

      // Fetch reviews (using product_id if available)
      if (listing.product_id) {
        const reviewsRes = await fetch(`${API_URL}/products/${slug}/reviews`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData);
        }

        // Fetch stats
        const statsRes = await fetch(`${API_URL}/products/${slug}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('ar-token');
      const res = await fetch(`${API_URL}/products/${slug}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        const updated = await res.json();
        setProduct(updated);
        setIsEditing(false);
      } else {
        throw new Error('Failed to update product');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('ar-token');
      // Use listing ID for deletion
      const listingId = product?.id;
      if (!listingId) {
        throw new Error('Listing ID not found');
      }
      const res = await fetch(`${API_URL}/listings/my-listings/${listingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to delete listing');
      }
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    setTogglingStatus(true);
    try {
      const token = localStorage.getItem('ar-token');
      const res = await fetch(`${API_URL}/products/${slug}/toggle-status`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const updated = await res.json();
        setProduct(updated);
      } else {
        throw new Error('Failed to toggle status');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTogglingStatus(false);
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Please sign in to manage your product</p>
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Sign in →
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Product not found</h1>
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isScanning = product.status === 'scanning' || product.status === 'pending_scan';
  const isApproved = product.status === 'approved';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Head>
        <title>Manage {product.name} | Agent Resources</title>
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <Logo variant="full" size="md" textClassName="text-white group-hover:text-blue-400 transition-colors" />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">← Back to Dashboard</Link>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold text-white">Manage Product</h1>
              {product.is_verified && (
                <span className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
              {isScanning && (
                <span className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium animate-pulse">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Scanning...
                </span>
              )}
            </div>
            <p className="text-slate-400">Edit details, view metrics, and manage reviews</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Column - Product Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Product Info Card */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Product Details</h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Price (cents)</label>
                      <input
                        type="number"
                        value={editForm.price_cents}
                        onChange={(e) => setEditForm({...editForm, price_cents: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      />
                      <p className="text-sm text-slate-400 mt-1">Current: {formatPrice(editForm.price_cents)}</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-500 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditForm({
                            name: product.name,
                            description: product.description,
                            price_cents: product.price_cents
                          });
                        }}
                        className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-400">Name</p>
                      <p className="font-medium text-white">{product.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Description</p>
                      <p className="text-slate-300">{product.description}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Category</p>
                      <p className="font-medium text-white">{getCategoryName(product.category)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Price</p>
                      <p className="font-medium text-white">{formatPrice(product.price_cents)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Tags</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {product.category_tags?.map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-white/10 text-slate-300 text-sm rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Status</p>
                      <p className="font-medium">
                        {product.is_active ? (
                          <span className="text-green-400">Active</span>
                        ) : (
                          <span className="text-red-400">Inactive</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reviews Section */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Reviews ({reviews.length})
                </h2>
                {reviews.length === 0 ? (
                  <p className="text-slate-500">No reviews yet</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-white/10 pb-4 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{review.user_name}</span>
                            {review.is_verified_purchase && (
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-slate-600'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-300">{review.comment}</p>
                        <p className="text-sm text-slate-500 mt-2">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Stats */}
            <div className="space-y-6">
              {stats && (
                <>
                  <div className="bg-white/5 rounded-xl p-6">
                    <p className="text-sm text-slate-400 mb-1">Total Sales</p>
                    <p className="text-3xl font-bold text-white">{stats.total_sales}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6">
                    <p className="text-sm text-slate-400 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-400">{formatPrice(stats.total_revenue_cents)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6">
                    <p className="text-sm text-slate-400 mb-1">Downloads</p>
                    <p className="text-3xl font-bold text-blue-400">{product.download_count}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6">
                    <p className="text-sm text-slate-400 mb-1">Average Rating</p>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-bold text-yellow-400">{stats.average_rating.toFixed(1)}</p>
                      <span className="text-slate-500">/ 5</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{stats.total_reviews} reviews</p>
                  </div>
                </>
              )}

              {/* Public View Link - Only show for approved listings */}
              {isApproved && (
                <Link
                  href={`/listings/${product.slug}`}
                  className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl font-medium hover:bg-blue-500 transition-colors"
                >
                  View Public Page
                </Link>
              )}

              {/* Pause/Resume Button - Only show for approved listings */}
              {isApproved && (
                <button
                  onClick={handleToggleStatus}
                  disabled={togglingStatus}
                  className={`block w-full text-center py-3 rounded-xl font-medium transition-colors ${
                    product.is_active
                      ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {togglingStatus ? 'Updating...' : product.is_active ? 'Pause Listing' : 'Resume Listing'}
                </button>
              )}

              {/* Delete Button */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="block w-full bg-red-500/20 text-red-400 text-center py-3 rounded-xl font-medium hover:bg-red-500/30 transition-colors"
              >
                Delete Listing
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md mx-4">
            <h2 className="text-xl font-semibold text-white mb-4">Delete Listing?</h2>
            <p className="text-slate-400 mb-6">
              This will permanently delete <strong className="text-white">{product.name}</strong>. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
