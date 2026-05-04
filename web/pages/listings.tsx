import Head from 'next/head';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';

import { API_URL } from '../lib/api';

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'persona': return 'bg-blue-500/20 text-blue-400';
    case 'skill': return 'bg-purple-500/20 text-purple-400';
    case 'mcp_server': return 'bg-green-500/20 text-green-400';
    default: return 'bg-gray-700 text-gray-300';
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case 'mcp_server':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      );
    default: return null;
  }
};

const getCategoryName = (category: string, categories: {id: string, name: string}[]) => {
  const cat = categories.find(c => c.id === category);
  return cat?.name || category;
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
  status?: string;
  created_at: string;
  seller?: Seller;
  is_verified?: boolean;
  virus_scan_status?: string;
  translation_status?: string;
}

export default function Listings() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, items: cartItems } = useCart();

  const categories = [
    { id: 'all', name: t.listings.allCategories },
    { id: 'persona', name: t.listings.personas },
    { id: 'skill', name: t.listings.skills },
    { id: 'mcp_server', name: t.listings.mcpServers },
  ];

  const sortOptions = [
    { id: 'newest', label: t.listings.newest },
    { id: 'price-low', label: t.listings.priceLow },
    { id: 'price-high', label: t.listings.priceHigh },
  ];

  useEffect(() => {
    fetchListings();
  }, [language]);

  const fetchListings = async () => {
    try {
      const res = await fetch(`${API_URL}/listings/public?lang=${language}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const isInCart = (slug: string) => cartItems.some(item => item.slug === slug);

  const isAvailableForPurchase = (listing: Listing) => {
    // Only allow purchase if virus scan is clean
    return listing.virus_scan_status === 'clean';
  };

  const filteredListings = useMemo(() => {
    let result = listings.filter(listing => {
      if (selectedCategory !== 'all' && listing.category !== selectedCategory) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          listing.name.toLowerCase().includes(query) ||
          listing.description.toLowerCase().includes(query)
        );
      }
      return true;
    });

    return result.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'price-low': return a.price_cents - b.price_cents;
        case 'price-high': return b.price_cents - a.price_cents;
        default: return 0;
      }
    });
  }, [searchQuery, selectedCategory, sortBy, listings]);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getScanStatusLabel = (status?: string) => {
    if (!status) return t.settings?.scanPending || 'Pending';
    switch (status) {
      case 'pending': return t.settings?.scanPending || 'Pending';
      case 'scanning': return t.settings?.scanScanning || 'Scanning';
      case 'clean': return t.settings?.scanClean || 'Clean';
      case 'infected': return t.settings?.scanInfected || 'Infected';
      case 'failed': return t.settings?.scanFailed || 'Failed';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Head>
        <title>Browse Listings | Agent Resources</title>
        <meta name="description" content="Browse AI personas, skills, and MCP servers for your OpenClaw environment" />
      </Head>

      <Navbar />

      <main className="pt-20 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2">{t.listings.title}</h1>
            <p className="text-gray-400">{t.listings.subtitle}</p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={t.listings.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-lg"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Categories */}
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === cat.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-sm focus:outline-none focus:border-blue-500"
            >
              {sortOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Results count */}
          <p className="text-gray-500 mb-6">{filteredListings.length} {t.listings.listingsFound}</p>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Listings Grid */}
          {!loading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map(listing => (
                <div
                  key={listing.slug}
                  className="group block bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg transition-all duration-300"
                >
                  {/* Card Header with Avatar */}
                  <div className="relative h-28 bg-gradient-to-br from-gray-800 to-gray-900 p-5">
                    <div className="flex items-center gap-3">
                      {/* Avatar - use seller avatar if available, otherwise generate from name */}
                      {listing.seller?.avatar_url ? (
                        <img 
                          src={listing.seller.avatar_url} 
                          alt={listing.seller.name}
                          className="w-14 h-14 rounded-xl object-cover shadow-lg"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg text-white text-xl font-bold">
                          {listing.seller?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {/* Listing Name */}
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                          {listing.name}
                        </h3>
                        {/* Developer Name */}
                        <p className="text-sm text-gray-400 truncate">{listing.seller?.name || 'Unknown'}</p>
                      </div>
                      {(listing.status === 'scanning' || listing.status === 'pending_scan') && (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 animate-pulse flex-shrink-0">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Scanning
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    {/* Description */}
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{listing.description}</p>

                    {/* Tags & Category Row */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${getCategoryColor(listing.category)}`}>
                        {getCategoryIcon(listing.category)}
                        {getCategoryName(listing.category, categories)}
                      </span>
                      {listing.tags?.slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                      {listing.tags && listing.tags.length > 2 && (
                        <span className="text-xs text-gray-500">+{listing.tags.length - 2}</span>
                      )}
                    </div>

                    {/* Price & Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                      <span className="text-xl font-bold text-white">{formatPrice(listing.price_cents)}</span>
                      <div className="flex items-center gap-2">
                        {isAvailableForPurchase(listing) ? (
                          <>
                            <button
                              onClick={() => addToCart({
                                id: listing.id,
                                slug: listing.slug,
                                name: listing.name,
                                price: Math.round(listing.price_cents) / 100,
                                category: listing.category
                              })}
                              disabled={isInCart(listing.slug)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isInCart(listing.slug)
                                  ? 'bg-green-500/20 text-green-400 cursor-default'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              {isInCart(listing.slug) ? t.listings.inCart : t.listings.addToCart}
                            </button>
                            <Link
                              href={`/listings/${listing.slug}`}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                              {t.listings.view}
                            </Link>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                              {listing.virus_scan_status === 'scanning' 
                                ? (t.settings?.scanInProgress || 'Scan in progress')
                                : (t.settings?.itemNotAvailable || 'Not available')}
                            </span>
                            <Link
                              href={`/listings/${listing.slug}`}
                              className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                            >
                              {t.listings.view}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredListings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">{t.listings.noListingsFound}</p>
              <button 
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                className="text-blue-400 hover:underline mt-2"
              >
                {t.listings.clearFilters}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
