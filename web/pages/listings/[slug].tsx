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
  seller: Seller;
  is_verified: boolean;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'persona': return 'bg-blue-500/20 text-blue-400';
    case 'skill': return 'bg-purple-500/20 text-purple-400';
    case 'mcp_server': return 'bg-green-500/20 text-green-400';
    default: return 'bg-gray-700 text-gray-300';
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

const getScanStatusColor = (status?: string) => {
  switch (status) {
    case 'clean': return 'bg-green-500/20 text-green-400';
    case 'scanning': return 'bg-yellow-500/20 text-yellow-400';
    case 'pending': return 'bg-gray-500/20 text-gray-400';
    case 'infected': return 'bg-red-500/20 text-red-400';
    case 'failed': return 'bg-red-500/20 text-red-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

const formatPrice = (cents: number) => {
  return `$${(cents / 100).toFixed(2)}`;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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

  const isInCart = (slug: string) => {
    return cartItems.some(item => item.slug === slug);
  };

  const isAvailableForPurchase = (listing: Listing) => {
    return listing.virus_scan_status === 'clean' && listing.status === 'approved';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-4">Listing Not Found</h1>
          <p className="text-gray-400 mb-8">The listing you're looking for doesn't exist or has been removed.</p>
          <Link href="/listings" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Browse Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Head>
        <title>{listing.name} | Agent Resources</title>
        <meta name="description" content={listing.description} />
      </Head>

      <Navbar />

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/listings" className="hover:text-white transition-colors">
              Listings
            </Link>
            <span>/</span>
            <span className="text-white">{listing.name}</span>
          </div>

          {/* Main Content */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-8 border-b border-gray-700">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full ${getCategoryColor(listing.category)}`}>
                      {getCategoryName(listing.category)}
                    </span>
                    {listing.is_verified && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-green-500/20 text-green-400">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-4">{listing.name}</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">{listing.description}</p>
                </div>

                {/* Price & Actions */}
                <div className="text-right">
                  <p className="text-4xl font-bold text-white mb-4">{formatPrice(listing.price_cents)}</p>
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
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        isInCart(listing.slug)
                          ? 'bg-green-500/20 text-green-400 cursor-default'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isInCart(listing.slug) ? 'In Cart' : 'Add to Cart'}
                    </button>
                  ) : (
                    <span className={`inline-flex items-center gap-1 text-sm font-medium px-4 py-2 rounded-lg ${getScanStatusColor(listing.virus_scan_status)}`}>
                      {listing.virus_scan_status === 'scanning' ? 'Scan in Progress' : 'Not Available'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Seller Info */}
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4">Seller</h2>
                  <div className="flex items-center gap-3">
                    {listing.seller?.avatar_url ? (
                      <img
                        src={listing.seller.avatar_url}
                        alt={listing.seller.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold">
                        {listing.seller?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white">{listing.seller?.name || 'Anonymous'}</p>
                      <p className="text-sm text-gray-400">Developer</p>
                    </div>
                  </div>
                </div>

                {/* File Info */}
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4">Package Details</h2>
                  <div className="space-y-2 text-gray-400">
                    <p>{listing.file_count} files</p>
                    <p>{formatFileSize(listing.file_size_bytes)}</p>
                    <p className={`inline-flex items-center gap-1 text-sm ${getScanStatusColor(listing.virus_scan_status)}`}>
                      Scan: {listing.virus_scan_status || 'pending'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {listing.tags && listing.tags.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-700">
                  <h2 className="text-lg font-semibold text-white mb-4">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map((tag, i) => (
                      <span key={i} className="text-sm text-gray-300 bg-gray-700/50 px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Link href="/listings" className="text-gray-400 hover:text-white transition-colors">
              ← Back to Listings
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
