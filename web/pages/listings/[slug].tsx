import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

interface Seller {
  id: string;
  name: string;
  avatar_url?: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  user_name: string;
  created_at: string;
  is_verified_purchase: boolean;
}

interface ListingDetail {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price_cents: number;
  tags: string[];
  file_count: number;
  file_size_bytes: number;
  created_at: string;
  scan_results?: any;
  seller?: Seller;
  is_verified?: boolean;
}

const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    'persona': 'AI Persona',
    'skill': 'Agent Skill',
    'mcp_server': 'MCP Server',
  };
  return names[category] || category;
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'persona': return 'bg-blue-100 text-blue-700';
    case 'skill': return 'bg-purple-100 text-purple-700';
    case 'mcp_server': return 'bg-green-100 text-green-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

export default function ListingDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const { addToCart } = useCart();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState({ average: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchListing();
      fetchReviews();
    }
  }, [slug]);

  const fetchListing = async () => {
    try {
      const res = await fetch(`${API_URL}/listings/public?slug=${slug}`);
      if (!res.ok) {
        throw new Error('Listing not found');
      }
      const data = await res.json();
      const found = data.find((l: ListingDetail) => l.slug === slug);
      if (!found) {
        throw new Error('Listing not found');
      }
      setListing(found);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/listings/${slug}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
        if (data.length > 0) {
          const avg = data.reduce((sum: number, r: Review) => sum + r.rating, 0) / data.length;
          setReviewStats({ average: avg, total: data.length });
        }
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  const submitReview = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('ar-token');
      const res = await fetch(`${API_URL}/listings/${slug}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newReview)
      });

      if (res.ok) {
        setShowReviewForm(false);
        setNewReview({ rating: 5, comment: '' });
        fetchReviews();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to submit review');
      }
    } catch (err) {
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Listing not found</h1>
          <Link href="/listings" className="text-blue-600 hover:underline">
            Browse all listings
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{listing.name} | Agent Resources</title>
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AR</span>
            </div>
            <span className="font-semibold text-slate-900">Agent Resources</span>
          </Link>
          <Link href="/listings" className="text-slate-600 hover:text-slate-900">← Back to listings</Link>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Left Column */}
            <div>
              {/* Category Badge */}
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mb-4 ${getCategoryColor(listing.category)}`}>
                {getCategoryName(listing.category)}
              </span>
              
              <h1 className="text-4xl font-semibold text-slate-900 mb-4">{listing.name}</h1>
              <p className="text-slate-600 mb-6">{listing.description}</p>
              
              {/* Developer Info */}
              <div className="flex items-center gap-3 mb-8 p-4 bg-slate-50 rounded-xl">
                {listing.seller?.avatar_url ? (
                  <img 
                    src={listing.seller.avatar_url} 
                    alt={listing.seller.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {listing.seller?.name?.charAt(0).toUpperCase() || 'D'}
                  </div>
                )}
                <div>
                  <p className="font-medium text-slate-900">{listing.seller?.name || 'Developer'}</p>
                  {listing.is_verified && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Verified</span>
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* File Info */}
              <div className="flex items-center gap-6 text-slate-500 mb-8">
                <span className="flex items-center gap-1.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {listing.file_count} files
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                  {formatFileSize(listing.file_size_bytes)}
                </span>
              </div>

              {/* Tags */}
              {listing.tags && listing.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-slate-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-sm rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Info */}
              {listing.scan_results?.virustotal?.status === 'clean' && (
                <div className="mb-8 p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-2 text-green-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="font-medium">Security Verified</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Scanned by VirusTotal - No threats detected
                  </p>
                </div>
              )}

              {/* Reviews Section */}
              <div className="border-t border-slate-200 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Reviews</h2>
                    {reviewStats.total > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-5 h-5 ${i < Math.round(reviewStats.average) ? 'text-yellow-400' : 'text-slate-200'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-slate-600">{reviewStats.average.toFixed(1)} out of 5</span>
                        <span className="text-slate-400">({reviewStats.total} reviews)</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Write a Review
                  </button>
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <div className="bg-slate-50 rounded-xl p-6 mb-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Write a Review</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setNewReview({ ...newReview, rating: star })}
                              className="p-1"
                            >
                              <svg
                                className={`w-8 h-8 ${star <= newReview.rating ? 'text-yellow-400' : 'text-slate-200'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Review</label>
                        <textarea
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                          placeholder="Share your experience with this product..."
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={submitReview}
                          disabled={submitting || !newReview.comment.trim()}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                          {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                        <button
                          onClick={() => setShowReviewForm(false)}
                          className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <p className="text-slate-500">No reviews yet. Be the first to review!</p>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="border-b border-slate-100 pb-4 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{review.user_name}</span>
                            {review.is_verified_purchase && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-slate-400">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-slate-200'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <p className="text-slate-700">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Pricing */}
            <div className="md:sticky md:top-24 h-fit">
              <div className="bg-slate-50 rounded-2xl p-8">
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-4xl font-bold text-slate-900">{formatPrice(listing.price_cents)}</span>
                </div>

                <button
                  onClick={() => {
                    addToCart({
                      slug: listing.slug,
                      name: listing.name,
                      price: Math.round(listing.price_cents) / 100,
                      category: listing.category
                    });
                    router.push('/cart');
                  }}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors mb-4"
                >
                  Buy Now
                </button>

                <p className="text-sm text-slate-500 text-center">
                  One-time purchase. Yours forever.
                </p>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-3">What's included:</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Complete source files
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      One-click OpenClaw setup
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Lifetime updates
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
