import Head from 'next/head';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import CartIcon from '../components/CartIcon';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

const categories = [
  { 
    id: 'personas', 
    name: 'AI Personas', 
    description: 'Complete AI workers ready to deploy',
    icon: (props: any) => (
      <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: 'bg-blue-100 text-blue-700'
  },
  { 
    id: 'skills', 
    name: 'Agent Skills', 
    description: 'Training and workflows for specific tasks',
    icon: (props: any) => (
      <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: 'bg-purple-100 text-purple-700'
  },
  { 
    id: 'mcps', 
    name: 'MCP Servers', 
    description: 'Infrastructure for agent capabilities',
    icon: (props: any) => (
      <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
    color: 'bg-green-100 text-green-700'
  },
];

const tags = [
  'Executive', 'Finance', 'Growth', 'HR', 'Legal', 'Marketing', 
  'Ops', 'Personal', 'Product', 'Productivity', 'Research', 'Sales', 'Support'
];

const creators = [
  { id: 'agent-resources', name: 'Agent Resources', avatar: 'AR', verified: true },
  { id: 'berkay', name: 'Berkay', avatar: 'B', verified: true },
];

const listings = [
  {
    slug: 'claudia-project-manager',
    name: 'Project Manager',
    category: 'personas',
    price: 49,
    description: 'AI project orchestrator that delegates tasks, tracks progress, and ensures deliverables.',
    tags: ['Executive', 'Product', 'Ops', 'Productivity'],
    verified: true,
    creator: creators[0],
    downloads: 234,
    rating: 4.9,
    trending: true
  },
  {
    slug: 'chen-developer',
    name: 'Software Engineer',
    category: 'personas', 
    price: 59,
    description: 'Full-stack developer that writes production-ready code across any stack.',
    tags: ['Product', 'Ops', 'Research'],
    verified: true,
    creator: creators[0],
    downloads: 189,
    rating: 4.8,
    trending: true
  },
  {
    slug: 'adrian-ux-designer',
    name: 'UX Designer',
    category: 'personas',
    price: 49,
    description: 'Design partner that creates interfaces, writes copy, and crafts user experiences.',
    tags: ['Product', 'Marketing', 'Growth'],
    verified: true,
    creator: creators[0],
    downloads: 156,
    rating: 4.7,
    trending: false
  },
  {
    slug: 'financial-analyst-skill',
    name: 'Financial Analysis',
    category: 'skills',
    price: 29,
    description: 'Analyze financial data, create reports, and provide investment insights.',
    tags: ['Finance', 'Research', 'Executive'],
    verified: true,
    creator: creators[0],
    downloads: 98,
    rating: 4.6,
    trending: false
  },
  {
    slug: 'content-marketing-skill',
    name: 'Content Marketing',
    category: 'skills',
    price: 25,
    description: 'Create blog posts, social media content, and marketing copy.',
    tags: ['Marketing', 'Growth', 'Productivity'],
    verified: true,
    creator: creators[1],
    downloads: 145,
    rating: 4.8,
    trending: true
  },
  {
    slug: 'slack-mcp',
    name: 'Slack Integration',
    category: 'mcps',
    price: 19,
    description: 'Send messages, manage channels, and automate Slack workflows.',
    tags: ['Ops', 'Productivity', 'Support'],
    verified: true,
    creator: creators[0],
    downloads: 312,
    rating: 4.9,
    trending: true
  },
  {
    slug: 'sheets-mcp',
    name: 'Google Sheets',
    category: 'mcps',
    price: 15,
    description: 'Read, write, and manipulate Google Sheets data programmatically.',
    tags: ['Finance', 'Ops', 'Research', 'Productivity'],
    verified: true,
    creator: creators[0],
    downloads: 267,
    rating: 4.7,
    trending: false
  }
];

type SortOption = 'popular' | 'newest' | 'price-low' | 'price-high' | 'rating';

export default function Browse() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { addToCart, items: cartItems } = useCart();

  const toggleFavorite = (slug: string) => {
    setFavorites(prev => 
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const isInCart = (slug: string) => cartItems.some(item => item.slug === slug);

  const filteredListings = useMemo(() => {
    let result = listings.filter(listing => {
      if (selectedCategory && listing.category !== selectedCategory) return false;
      if (selectedTags.length > 0 && !selectedTags.some(tag => listing.tags.includes(tag))) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          listing.name.toLowerCase().includes(query) ||
          listing.description.toLowerCase().includes(query) ||
          listing.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      return true;
    });

    return result.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.downloads - a.downloads;
        case 'newest':
          return b.slug.localeCompare(a.slug);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });
  }, [selectedCategory, selectedTags, sortBy, searchQuery]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Browse | Agent Resources</title>
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
            {favorites.length > 0 && (
              <Link href="/favorites" className="text-slate-600 hover:text-slate-900 relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {favorites.length}
                </span>
              </Link>
            )}
            <Link href="/" className="text-slate-600 hover:text-slate-900">Home</Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900 mb-2">Find your next AI operator</h1>
            <p className="text-slate-600">Hire AI personas, skills, and tools for your OpenClaw environment</p>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, description, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-lg"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === null 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === cat.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Tags */}
          <div className="mb-6">
            <div className="flex gap-2 flex-wrap">
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Results bar */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-500">{filteredListings.length} operators found</p>
            <div className="flex items-center gap-4">
              {/* View toggle */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="rating">Highest Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Listings grid */}
          <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredListings.map(listing => (
              <div 
                key={listing.slug}
                className={`border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all ${
                  viewMode === 'list' ? 'flex gap-6 items-start' : ''
                }`}
              >
                {/* Card content */}
                <div className="flex-1">
                  {/* Category Icon */}
                  {(() => {
                    const cat = categories.find(c => c.id === listing.category);
                    const Icon = cat?.icon;
                    return Icon ? (
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${cat.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    ) : null;
                  })()}
                  
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      listing.category === 'personas' ? 'bg-blue-100 text-blue-700' :
                      listing.category === 'skills' ? 'bg-purple-100 text-purple-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {categories.find(c => c.id === listing.category)?.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {listing.trending && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                          🔥 Trending
                        </span>
                      )}
                      {listing.verified && (
                        <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full border-2 border-white shadow-md">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Title & description */}
                  <Link href={`/listings/${listing.slug}`}>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 hover:text-blue-600">{listing.name}</h3>
                  </Link>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">{listing.description}</p>
                  
                  {/* Creator */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-medium">
                      {listing.creator.avatar}
                    </div>
                    <span className="text-sm text-slate-600">{listing.creator.name}</span>
                    {listing.creator.verified && (
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {listing.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                    {listing.tags.length > 3 && (
                      <span className="text-xs text-slate-400">+{listing.tags.length - 3}</span>
                    )}
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {listing.downloads}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {listing.rating}
                    </span>
                  </div>
                  
                  {/* Price & actions */}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-slate-900">${listing.price}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFavorite(listing.slug)}
                        className={`p-2 rounded-lg transition-colors ${
                          favorites.includes(listing.slug)
                            ? 'bg-red-50 text-red-500'
                            : 'bg-slate-100 text-slate-400 hover:text-red-500'
                        }`}
                        aria-label={favorites.includes(listing.slug) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <svg className="w-5 h-5" fill={favorites.includes(listing.slug) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
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
                      <Link 
                        href={`/listings/${listing.slug}?buy=now`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Buy Now
                      </Link>
                      <Link 
                        href={`/listings/${listing.slug}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredListings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No operators match your search.</p>
              <button 
                onClick={() => { setSelectedCategory(null); setSelectedTags([]); setSearchQuery(''); }}
                className="text-blue-600 hover:underline mt-2"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
