import Head from 'next/head';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import CartIcon from '../components/CartIcon';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

const categories = [
  { id: 'all', name: 'All Listings' },
  { id: 'persona', name: 'AI Personas' },
  { id: 'skill', name: 'Agent Skills' },
  { id: 'mcp_server', name: 'MCP Servers' },
];

const sortOptions = [
  { id: 'newest', label: 'Newest' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
];

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

const getCategoryName = (category: string) => {
  const cat = categories.find(c => c.id === category);
  return cat?.name || category;
};

interface Listing {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price_cents: number;
  tags: string[];
  created_at: string;
}

export default function Listings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, items: cartItems } = useCart();

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

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AR</span>
            </div>
            <span className="font-semibold text-slate-900">Agent Resources</span>
          </Link>
          <div className="flex items-center gap-6">
            <CartIcon />
            <Link href="/" className="text-slate-600 hover:text-slate-900">Home</Link>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900 mb-2">Browse Listings</h1>
            <p className="text-slate-600">Find AI personas, skills, and tools for your OpenClaw environment</p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search listings..."
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
          <p className="text-slate-500 mb-6">{filteredListings.length} listings found</p>

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
                <div key={listing.slug} className="border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all">
                  {/* Category Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${getCategoryColor(listing.category)}`}>
                      {getCategoryIcon(listing.category)}
                      {getCategoryName(listing.category)}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <Link href={`/listings/${listing.slug}`}>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 hover:text-blue-600">{listing.name}</h3>
                  </Link>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">{listing.description}</p>

                  {/* Price & Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-2xl font-bold text-slate-900">{formatPrice(listing.price_cents)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => addToCart({
                          slug: listing.slug,
                          name: listing.name,
                          price: listing.price_cents / 100,
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
                      <Link
                        href={`/listings/${listing.slug}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
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
