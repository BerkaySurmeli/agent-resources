import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import Navbar from '../../components/Navbar';
import { API_URL } from '../../lib/api';

interface Seller {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
}

interface Listing {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price_cents: number;
  tags: string[];
  file_count: number;
  file_size_bytes: number;
  scan_results: any;
  virus_scan_status: string;
  translation_status: string;
  status: string;
  created_at: string;
  updated_at: string;
  seller: Seller;
  is_verified: boolean;
  download_count?: number;
  version?: string;
  review_count?: number;
  average_rating?: number;
  claudia_review?: {
    rating: number;
    comment: string;
    reviewed_at: string;
  };
}

const getCategoryColors = (category: string) => {
  switch (category) {
    case 'persona': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'skill': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'mcp_server': return 'bg-green-50 text-green-700 border-green-200';
    default: return 'bg-cream-200 text-ink-600 border-cream-300';
  }
};

const getCategoryName = (category: string) => {
  switch (category) {
    case 'persona': return 'AI Persona';
    case 'skill': return 'Agent Skill';
    case 'mcp_server': return 'MCP Server';
    default: return category;
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'persona':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'skill':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'mcp_server':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      );
    default:
      return null;
  }
};

const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const renderStars = (rating: number) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        className={`w-4 h-4 ${star <= rating ? 'text-amber-500' : 'text-cream-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export default function ListingDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const { t } = useLanguage();
  const { addToCart, items: cartItems } = useCart();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) {
      fetchListing();
    }
  }, [slug]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/listings/${slug}`);
      if (!response.ok) {
        throw new Error('Listing not found');
      }
      const data = await response.json();
      setListing(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const isInCart = (slug: string) => cartItems.some(item => item.slug === slug);

  const isAvailableForPurchase = (listing: Listing) => {
    const isClean = listing.virus_scan_status === 'clean';
    const isApproved = listing.status === 'approved' || listing.status === 'published';
    return isClean && isApproved;
  };

  const getAvailabilityMessage = (listing: Listing) => {
    if (listing.virus_scan_status === 'scanning') return 'Security Scan in Progress';
    if (listing.virus_scan_status !== 'clean') return 'Security Check Required';
    if (listing.status === 'pending' || listing.status === 'waiting_for_approval') return 'Waiting for Approval';
    return 'Not Available';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terra-500"></div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-cream-100">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="heading-serif text-2xl text-ink-900 mb-4">Listing Not Found</h1>
          <p className="text-ink-500 mb-8">The listing you're looking for doesn't exist or has been removed.</p>
          <Link href="/listings" className="btn-primary">
            Browse Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>{listing.name} | Agent Resources</title>
        <meta name="description" content={listing.description} />
      </Head>

      <Navbar />

      <main className="pt-20 pb-16">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <nav className="flex items-center gap-2 text-sm text-ink-400">
            <Link href="/" className="hover:text-ink-700 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/listings" className="hover:text-ink-700 transition-colors">Listings</Link>
            <span>/</span>
            <span className="text-ink-700 truncate max-w-xs">{listing.name}</span>
          </nav>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-5">
              {/* Hero Card */}
              <div className="card overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-cream-200">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`badge border ${getCategoryColors(listing.category)}`}>
                        {getCategoryIcon(listing.category)}
                        {getCategoryName(listing.category)}
                      </span>
                      {listing.is_verified && (
                        <span className="badge bg-green-50 text-green-700 border border-green-200">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
                    <span className="text-ink-400 text-sm">Listed {formatDate(listing.created_at)}</span>
                  </div>
                </div>

                <div className="p-6">
                  <h1 className="heading-serif text-3xl sm:text-4xl text-ink-900 mb-4">{listing.name}</h1>
                  <p className="text-ink-600 text-lg leading-relaxed whitespace-pre-wrap">{listing.description}</p>
                </div>

                <div className="px-6 py-4 bg-cream-200/40 border-t border-cream-200">
                  <div className="flex items-center gap-6 text-sm flex-wrap">
                    {listing.version && (
                      <div className="flex items-center gap-2 text-ink-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span>v{listing.version}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-ink-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{listing.file_count} files</span>
                    </div>
                    <div className="flex items-center gap-2 text-ink-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                      <span>{formatFileSize(listing.file_size_bytes)}</span>
                    </div>
                    {listing.download_count !== undefined && listing.download_count > 0 && (
                      <div className="flex items-center gap-2 text-ink-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>{listing.download_count} installs</span>
                      </div>
                    )}
                    {listing.review_count !== undefined && listing.review_count > 0 && (
                      <div className="flex items-center gap-2 text-ink-500">
                        {renderStars(listing.average_rating || 0)}
                        <span>({listing.review_count} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-ink-900 mb-2">Security Verified</h2>
                    {listing.virus_scan_status === 'clean' ? (
                      <div className="flex items-center gap-3">
                        <span className="badge bg-green-50 text-green-700 border border-green-200">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          VirusTotal Clean
                        </span>
                        <span className="text-ink-400 text-sm">No malware or threats detected</span>
                      </div>
                    ) : listing.virus_scan_status === 'scanning' ? (
                      <div className="flex items-center gap-2 text-amber-700">
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">Security scan in progress...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-ink-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-sm">Security verification pending</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tags */}
              {listing.tags && listing.tags.length > 0 && (
                <div className="card p-6">
                  <h2 className="text-base font-semibold text-ink-900 mb-4">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map((tag, i) => (
                      <span key={i} className="badge bg-cream-200 text-ink-600 border-cream-300 hover:bg-cream-300 transition-colors cursor-pointer">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Claudia's Take */}
              {listing.claudia_review && (
                <div className="card p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg"
                      style={{ background: 'linear-gradient(135deg, #CC5132, #DF6B50)' }}>
                      C
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-semibold text-ink-900 mb-2">Claudia's Take</h2>
                      <div className="flex items-center gap-2 mb-3">
                        {renderStars(listing.claudia_review.rating)}
                        <span className="text-ink-400 text-sm">
                          Reviewed {formatDate(listing.claudia_review.reviewed_at)}
                        </span>
                      </div>
                      <p className="text-ink-600 italic">"{listing.claudia_review.comment}"</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-5 lg:relative">
              {/* Price Card */}
              <div className="card p-6 lg:sticky lg:top-24">
                <div className="text-center mb-6">
                  <p className="text-4xl sm:text-5xl font-bold text-ink-900 mb-1">{formatPrice(listing.price_cents)}</p>
                  <p className="text-ink-400 text-sm">One-time purchase</p>
                </div>

                {isAvailableForPurchase(listing) ? (
                  <button
                    onClick={() => addToCart({
                      id: listing.id,
                      slug: listing.slug,
                      name: listing.name,
                      price: listing.price_cents / 100,
                      category: listing.category
                    })}
                    disabled={isInCart(listing.slug)}
                    className={`w-full py-3.5 rounded-xl font-semibold text-base transition-all ${
                      isInCart(listing.slug)
                        ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
                        : 'btn-primary !py-3.5 !text-base w-full justify-center'
                    }`}
                  >
                    {isInCart(listing.slug) ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Added to Cart
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Add to Cart
                      </span>
                    )}
                  </button>
                ) : (
                  <div className="w-full py-3.5 rounded-xl font-medium text-base bg-cream-200 text-ink-400 border border-cream-300 text-center">
                    {getAvailabilityMessage(listing)}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-cream-200 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-ink-500">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-ink-500">
                    <svg className="w-4 h-4 text-terra-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Instant download</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-ink-500">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>24/7 support</span>
                  </div>
                </div>
              </div>

              {/* Seller Card */}
              <div className="card p-6">
                <h3 className="text-xs font-medium text-ink-400 uppercase tracking-wider mb-4">Developer</h3>
                <Link
                  href={`/developers/${listing.seller?.id}`}
                  className="flex items-center gap-4 group"
                >
                  {listing.seller?.avatar_url ? (
                    <img
                      src={listing.seller.avatar_url}
                      alt={listing.seller.name}
                      className="w-14 h-14 rounded-xl object-cover border border-cream-200 group-hover:border-terra-300 transition-colors"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 border border-cream-200 group-hover:border-terra-300 transition-colors"
                      style={{ background: 'linear-gradient(135deg, #CC5132, #DF6B50)' }}>
                      {listing.seller?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-ink-900 group-hover:text-terra-600 transition-colors">{listing.seller?.name || 'Anonymous'}</p>
                    <p className="text-sm text-ink-400">{listing.seller?.bio || 'Agent Developer'}</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
