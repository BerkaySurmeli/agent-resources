import Head from 'next/head';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'persona': return 'bg-blue-100 text-blue-700';
    case 'skill': return 'bg-purple-100 text-purple-700';
    case 'mcp_server': return 'bg-green-100 text-green-700';
    default: return 'bg-slate-100 text-slate-700';
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
  created_at: string;
  seller?: Seller;
  is_verified?: boolean;
}

export default function Listings() {
  const { t } = useLanguage();
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
  }, []);

  const fetchListings = async () => {
    try {
      const res = await fetch(`${API_URL}/listings/public`);
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      }
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const isInCart = (slug: string) => cartItems.some(item => item.slug === slug);

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

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Browse Listings | Agent Resources</title>
        <meta name="description" content="Browse AI personas, skills, and MCP servers for your OpenClaw environment" />
      </Head>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900 mb-2">{t.listings.title}</h1>
            <p className="text-slate-600">{t.listings.subtitle}</p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={t.listings.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-lg"
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
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
            >
              {sortOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Results count */}
          <p className="text-slate-500 mb-6">{filteredListings.length} {t.listings.listingsFound}</p>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Listings Grid */}
          {!loading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map(listing => (
                <Link
                  key={listing.slug}
                  href={`/listings/${listing.slug}`}
                  className="group block bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-xl transition-all duration-300"
                >
                  {/* Card Header with Avatar */}
                  <div className="relative h-32 bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        {/* Persona Avatar */}
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg text-white text-2xl font-bold">
                          {listing.seller?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          {/* Persona Name */}
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {listing.seller?.name || 'Unknown'}
                          </h3>
                          {/* Category */}
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${getCategoryColor(listing.category)}`}>
                            {getCategoryIcon(listing.category)}
                            {getCategoryName(listing.category, categories)}
                          </span>
                        </div>
                      </div>
                      {listing.is_verified && (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    {/* Description */}
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">{listing.description}</p>

                    {/* Developer Info */}
                    {listing.seller && (
                      <div className="flex items-center gap-2 mb-4 text-sm">
                        <span className="text-slate-400">by</span>
                        <span className="text-slate-600 font-medium">{listing.seller.name}</span>
                      </div>
                    )}

                    {/* Price & Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="text-2xl font-bold text-slate-900">{formatPrice(listing.price_cents)}</span>
                      <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                        <button
                          onClick={() => addToCart({
                            slug: listing.slug,
                            name: listing.name,
                            price: Math.round(listing.price_cents) / 100,
                            category: listing.category
                          })}
                          disabled={isInCart(listing.slug)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isInCart(listing.slug)
                              ? 'bg-green-100 text-green-700 cursor-default'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isInCart(listing.slug) ? 'In Cart' : 'Add to Cart'}
                        </button>
                        <span className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium group-hover:bg-blue-700 transition-colors">
                          View
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && filteredListings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No listings found matching your search.</p>
              <button 
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                className="text-blue-600 hover:underline mt-2"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
