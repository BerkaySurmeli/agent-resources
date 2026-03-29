import Head from 'next/head';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import CartIcon from '../components/CartIcon';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

const categories = [
  { id: 'all', name: 'All Listings' },
  { id: 'personas', name: 'AI Personas' },
  { id: 'skills', name: 'Agent Skills' },
  { id: 'mcps', name: 'MCP Servers' },
];

const sortOptions = [
  { id: 'popular', label: 'Most Popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'rating', label: 'Highest Rated' },
];

const listings = [
  {
    slug: 'claudia-project-manager',
    name: 'Project Manager',
    category: 'personas',
    price: 49,
    description: 'AI project orchestrator that delegates tasks, tracks progress, and ensures deliverables.',
    developer: { name: 'Claudia', initials: 'C', verified: true },
    rating: 4.9,
    reviews: 234,
    downloads: 1234,
  },
  {
    slug: 'chen-developer',
    name: 'Software Engineer',
    category: 'personas', 
    price: 59,
    description: 'Full-stack developer that writes production-ready code across any stack.',
    developer: { name: 'Chen', initials: 'C', verified: true },
    rating: 4.8,
    reviews: 189,
    downloads: 987,
  },
  {
    slug: 'adrian-ux-designer',
    name: 'UX Designer',
    category: 'personas',
    price: 49,
    description: 'Design partner that creates interfaces, writes copy, and crafts user experiences.',
    developer: { name: 'Adrian', initials: 'A', verified: true },
    rating: 4.7,
    reviews: 156,
    downloads: 756,
  },
  {
    slug: 'financial-analyst-skill',
    name: 'Financial Analysis',
    category: 'skills',
    price: 29,
    description: 'Analyze financial data, create reports, and provide investment insights.',
    developer: { name: 'Andrew', initials: 'A', verified: true },
    rating: 4.6,
    reviews: 98,
    downloads: 432,
  },
  {
    slug: 'content-marketing-skill',
    name: 'Content Marketing',
    category: 'skills',
    price: 25,
    description: 'Create blog posts, social media content, and marketing copy.',
    developer: { name: 'Maya', initials: 'M', verified: true },
    rating: 4.8,
    reviews: 145,
    downloads: 678,
  },
  {
    slug: 'slack-mcp',
    name: 'Slack Integration',
    category: 'mcps',
    price: 19,
    description: 'Send messages, manage channels, and automate Slack workflows.',
    developer: { name: 'Agent Resources', initials: 'AR', verified: true },
    rating: 4.9,
    reviews: 312,
    downloads: 2341,
  },
  {
    slug: 'sheets-mcp',
    name: 'Google Sheets',
    category: 'mcps',
    price: 15,
    description: 'Read, write, and manipulate Google Sheets data programmatically.',
    developer: { name: 'Agent Resources', initials: 'AR', verified: true },
    rating: 4.7,
    reviews: 267,
    downloads: 1876,
  },
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'personas': return 'bg-blue-100 text-blue-700';
    case 'skills': return 'bg-purple-100 text-purple-700';
    case 'mcps': return 'bg-green-100 text-green-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'personas':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'skills':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case 'mcps':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      );
    default: return null;
  }
};

export default function Listings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const { addToCart, items: cartItems } = useCart();

  const isInCart = (slug: string) => cartItems.some(item => item.slug === slug);

  const filteredListings = useMemo(() => {
    let result = listings.filter(listing => {
      if (selectedCategory !== 'all' && listing.category !== selectedCategory) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          listing.name.toLowerCase().includes(query) ||
          listing.description.toLowerCase().includes(query) ||
          listing.developer.name.toLowerCase().includes(query)
        );
      }
      return true;
    });

    return result.sort((a, b) => {
      switch (sortBy) {
        case 'popular': return b.downloads - a.downloads;
        case 'newest': return b.slug.localeCompare(a.slug);
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        default: return 0;
      }
    });
  }, [searchQuery, selectedCategory, sortBy]);

  const handleBuyNow = (listing: typeof listings[0]) => {
    // Add to cart and redirect to checkout
    addToCart({
      slug: listing.slug,
      name: listing.name,
      price: listing.price,
      category: listing.category
    });
    window.location.href = '/cart';
  };

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
              placeholder="Search listings, developers..."
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

          {/* Listings Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map(listing => (
              <div key={listing.slug} className="border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all">
                {/* Category Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${getCategoryColor(listing.category)}`}>
                    {getCategoryIcon(listing.category)}
                    {categories.find(c => c.id === listing.category)?.name}
                  </span>
                </div>

                {/* Title & Description */}
                <Link href={`/listings/${listing.slug}`}>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2 hover:text-blue-600">{listing.name}</h3>
                </Link>
                <p className="text-slate-600 text-sm mb-4">{listing.description}</p>

                {/* Developer */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {listing.developer.initials}
                  </div>
                  <span className="text-sm text-slate-700 font-medium">{listing.developer.name}</span>
                  {listing.developer.verified && (
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {listing.rating} ({listing.reviews})
                  </span>
                  <span>{listing.downloads.toLocaleString()} downloads</span>
                </div>

                {/* Price & Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-2xl font-bold text-slate-900">${listing.price}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addToCart({
                        slug: listing.slug,
                        name: listing.name,
                        price: listing.price,
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
                    <button
                      onClick={() => handleBuyNow(listing)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredListings.length === 0 && (
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
