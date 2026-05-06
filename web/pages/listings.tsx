import Head from 'next/head';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';

import { API_URL } from '../lib/api';

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'persona': return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'skill': return 'bg-purple-50 text-purple-700 border border-purple-200';
    case 'mcp_server': return 'bg-green-50 text-green-700 border border-green-200';
    default: return 'bg-cream-200 text-ink-600';
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
    case 'clean': return 'bg-green-50 text-green-700 border border-green-200';
    case 'scanning': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
    case 'pending': return 'bg-cream-200 text-ink-500';
    case 'infected': return 'bg-red-50 text-red-700 border border-red-200';
    case 'failed': return 'bg-red-50 text-red-700 border border-red-200';
    default: return 'bg-cream-200 text-ink-500';
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
  quality_score?: number;
}

function qualityGrade(score: number): { grade: string; color: string; bg: string; border: string } {
  if (score >= 80) return { grade: 'A', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  if (score >= 60) return { grade: 'B', color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200'    };
  if (score >= 40) return { grade: 'C', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200'   };
  return             { grade: 'D', color: 'text-ink-500',    bg: 'bg-cream-100',  border: 'border-cream-200'   };
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

  const categoryColors: Record<string, string> = {
    persona:    'bg-blue-50 text-blue-700 border-blue-200',
    skill:      'bg-purple-50 text-purple-700 border-purple-200',
    mcp_server: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>Browse Listings | Agent Resources</title>
        <meta name="description" content="Browse AI personas, skills, and MCP servers for autonomous agents." />
      </Head>

      <Navbar />

      <main className="pt-10 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="heading-serif text-4xl text-ink-900 mb-2">{t.listings.title}</h1>
            <p className="text-ink-500">{t.listings.subtitle}</p>
          </div>

          {/* Search + Filters row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={t.listings.searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="input sm:w-44"
            >
              {sortOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap mb-6">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-terra-500 text-white border-terra-500'
                    : 'bg-white text-ink-600 border-cream-300 hover:border-terra-300 hover:text-terra-600'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Results count */}
          <p className="text-ink-400 text-sm mb-6">{filteredListings.length} {t.listings.listingsFound}</p>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-terra-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Listings grid */}
          {!loading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredListings.map(listing => (
                <div key={listing.slug} className="card card-hover flex flex-col overflow-hidden group">
                  {/* Card top — avatar + name */}
                  <div className="p-5 pb-4 border-b border-cream-200">
                    <div className="flex items-center gap-3">
                      {listing.seller?.avatar_url ? (
                        <img
                          src={listing.seller.avatar_url}
                          alt={listing.seller.name}
                          className="w-12 h-12 rounded-xl object-cover border border-cream-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #3549D4, #6470FA)' }}>
                          {listing.seller?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-ink-900 truncate group-hover:text-terra-600 transition-colors">
                          {listing.name}
                        </h3>
                        <p className="text-xs text-ink-400 truncate">{listing.seller?.name || 'Anonymous'}</p>
                      </div>
                      {listing.quality_score !== undefined && listing.quality_score > 0 && (() => {
                        const q = qualityGrade(listing.quality_score);
                        return (
                          <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${q.bg} ${q.color} ${q.border}`}
                            title={`Quality score: ${listing.quality_score}/100`}>
                            {q.grade}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-ink-500 text-sm leading-relaxed line-clamp-2 mb-4">{listing.description}</p>

                    {/* Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-5">
                      <span className={`badge border ${categoryColors[listing.category] || 'bg-warm-100 text-warm-700 border-warm-200'}`}>
                        {getCategoryIcon(listing.category)}
                        {getCategoryName(listing.category, categories)}
                      </span>
                      {listing.tags?.slice(0, 2).map((tag, i) => (
                        <span key={i} className="badge bg-cream-200 text-ink-500 border-cream-300">{tag}</span>
                      ))}
                      {listing.tags && listing.tags.length > 2 && (
                        <span className="text-xs text-ink-400">+{listing.tags.length - 2}</span>
                      )}
                    </div>

                    {/* Price + actions — pinned to bottom */}
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-cream-200">
                      <span className="text-lg font-bold text-ink-900">{formatPrice(listing.price_cents)}</span>
                      <div className="flex items-center gap-2">
                        {isAvailableForPurchase(listing) ? (
                          <>
                            <button
                              onClick={() => addToCart({
                                id: listing.id,
                                slug: listing.slug,
                                name: listing.name,
                                price: Math.round(listing.price_cents) / 100,
                                category: listing.category,
                              })}
                              disabled={isInCart(listing.slug)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                                isInCart(listing.slug)
                                  ? 'bg-green-50 text-green-700 border-green-200 cursor-default'
                                  : 'btn-primary !py-1.5 !px-3 !text-sm !shadow-none'
                              }`}
                            >
                              {isInCart(listing.slug) ? '✓ In Cart' : t.listings.addToCart}
                            </button>
                            <Link href={`/listings/${listing.slug}`} className="btn-secondary !py-1.5 !px-3 !text-sm">
                              {t.listings.view}
                            </Link>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                              {listing.virus_scan_status === 'scanning' ? 'Scanning…' : 'Unavailable'}
                            </span>
                            <Link href={`/listings/${listing.slug}`} className="btn-secondary !py-1.5 !px-3 !text-sm">
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
            <div className="text-center py-16">
              <p className="text-ink-400 mb-3">{t.listings.noListingsFound}</p>
              <button
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                className="text-terra-600 hover:text-terra-700 text-sm font-medium"
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
