import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import Logo from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agent-resources-api-dev-production.up.railway.app';

interface Listing {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  price_cents: number;
  seller: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  created_at: string;
  is_verified: boolean;
  virus_scan_status: string;
  translation_status: string;
}

const categories = [
  { id: 'persona', name: 'AI Personas', icon: '👤' },
  { id: 'skill', name: 'Agent Skills', icon: '⚡' },
  { id: 'mcp', name: 'MCP Servers', icon: '🔌' },
  { id: 'template', name: 'Templates', icon: '📄' },
  { id: 'workflow', name: 'Workflows', icon: '🔄' },
];

export default function Browse() {
  const { t } = useLanguage();
  const { addToCart, items: cartItems } = useCart();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  // Fetch listings from API
  useEffect(() => {
    fetchListings();
  }, [selectedCategory, sortBy]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      params.append('sort_by', sortBy === 'price-low' ? 'price_asc' : sortBy === 'price-high' ? 'price_desc' : sortBy);
      params.append('limit', '50');
      
      const res = await fetch(`${API_URL}/listings/public?${params}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      } else {
        console.error('Failed to fetch listings:', await res.text());
      }
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (slug: string) => {
    setFavorites(prev => 
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const isInCart = (slug: string) => cartItems.some(item => item.slug === slug);

  const filteredListings = useMemo(() => {
    let result = listings;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(listing => 
        listing.name.toLowerCase().includes(query) ||
        listing.description.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [listings, searchQuery]);

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Head>
        <title>Browse AI Agents & Skills | Agent Resources</title>
        <meta name="description" content="Browse AI personas, skills, and MCP servers for your team." />
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 bg-slate-900/80 backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <Logo variant="full" size="md" textClassName="text-white group-hover:text-blue-400 transition-colors" />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/cart" className="relative text-slate-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Browse AI Agents & Resources</h1>
          <p className="text-slate-400">Discover AI personas, skills, and MCP servers for your team.</p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative max-w-xl">
            <input
              type="text"
              placeholder="Search agents, skills, tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-11 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === cat.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading listings...</p>
          </div>
        )}

        {/* Listings Grid */}
        {!loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/50 transition-colors group">
                  {/* Card Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {categories.find(c => c.id === listing.category)?.icon || '📦'}
                        </span>
                        {listing.is_verified && (
                          <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleFavorite(listing.slug)}
                        className="text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <svg className={`w-6 h-6 ${favorites.includes(listing.slug) ? 'fill-red-500 text-red-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>

                    {/* Title & Description */}
                    <Link href={`/listings/${listing.slug}`} className="block group-hover:text-blue-400 transition-colors">
                      <h3 className="text-xl font-semibold mb-2">{listing.name}</h3>
                    </Link>
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">{listing.description}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {listing.tags?.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-xs bg-white/5 text-slate-300 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Seller */}
                    <div className="flex items-center gap-2 mb-4 text-sm text-slate-400">
                      <span>by {listing.seller?.name || 'Unknown'}</span>
                      {listing.virus_scan_status === 'clean' && (
                        <span className="text-green-400">✓ Scanned</span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div>
                        <span className="text-2xl font-bold text-white">{formatPrice(listing.price_cents)}</span>
                        {listing.price_cents > 0 && <span className="text-slate-400 text-sm ml-1">one-time</span>}
                      </div>
                      <button
                        onClick={() => addToCart({
                          slug: listing.slug,
                          name: listing.name,
                          price: listing.price_cents / 100,
                          category: listing.category
                        })}
                        disabled={isInCart(listing.slug)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          isInCart(listing.slug)
                            ? 'bg-green-600 text-white cursor-default'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                      >
                        {isInCart(listing.slug) ? 'In Cart' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredListings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-400 text-lg mb-4">No listings found</p>
                <p className="text-slate-500">Try adjusting your search or filters</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
