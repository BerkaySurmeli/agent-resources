import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

const categories = [
  { id: 'personas', name: 'AI Personas', description: 'Complete AI workers ready to deploy' },
  { id: 'skills', name: 'Agent Skills', description: 'Training and workflows for specific tasks' },
  { id: 'mcps', name: 'MCP Servers', description: 'Infrastructure for agent capabilities' },
];

const tags = [
  'Executive', 'Finance', 'Growth', 'HR', 'Legal', 'Marketing', 
  'Ops', 'Personal', 'Product', 'Productivity', 'Research', 'Sales', 'Support'
];

const listings = [
  {
    slug: 'claudia-project-manager',
    name: 'Project Manager',
    category: 'personas',
    price: 49,
    description: 'AI project orchestrator that delegates tasks, tracks progress, and ensures deliverables.',
    tags: ['Executive', 'Product', 'Ops', 'Productivity'],
    verified: true
  },
  {
    slug: 'chen-developer',
    name: 'Software Engineer',
    category: 'personas', 
    price: 59,
    description: 'Full-stack developer that writes production-ready code across any stack.',
    tags: ['Product', 'Ops', 'Research'],
    verified: true
  },
  {
    slug: 'adrian-ux-designer',
    name: 'UX Designer',
    category: 'personas',
    price: 49,
    description: 'Design partner that creates interfaces, writes copy, and crafts user experiences.',
    tags: ['Product', 'Marketing', 'Growth'],
    verified: true
  },
  {
    slug: 'financial-analyst-skill',
    name: 'Financial Analysis',
    category: 'skills',
    price: 29,
    description: 'Analyze financial data, create reports, and provide investment insights.',
    tags: ['Finance', 'Research', 'Executive']
  },
  {
    slug: 'content-marketing-skill',
    name: 'Content Marketing',
    category: 'skills',
    price: 25,
    description: 'Create blog posts, social media content, and marketing copy.',
    tags: ['Marketing', 'Growth', 'Productivity']
  },
  {
    slug: 'slack-mcp',
    name: 'Slack Integration',
    category: 'mcps',
    price: 19,
    description: 'Send messages, manage channels, and automate Slack workflows.',
    tags: ['Ops', 'Productivity', 'Support']
  },
  {
    slug: 'sheets-mcp',
    name: 'Google Sheets',
    category: 'mcps',
    price: 15,
    description: 'Read, write, and manipulate Google Sheets data programmatically.',
    tags: ['Finance', 'Ops', 'Research', 'Productivity']
  }
];

type SortOption = 'price-low' | 'price-high' | 'name' | 'verified';

export default function Browse() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('price-low');

  const filteredListings = listings.filter(listing => {
    if (selectedCategory && listing.category !== selectedCategory) return false;
    if (selectedTags.length > 0 && !selectedTags.some(tag => listing.tags.includes(tag))) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'verified':
        return (b.verified ? 1 : 0) - (a.verified ? 1 : 0);
      default:
        return 0;
    }
  });

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
          <Link href="/" className="text-slate-600 hover:text-slate-900">Home</Link>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-semibold text-slate-900 mb-8">Browse Listings</h1>

          {/* Categories */}
          <div className="flex gap-4 mb-8 flex-wrap">
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

          {/* Tags */}
          <div className="mb-8">
            <p className="text-sm text-slate-500 mb-3">Filter by tag:</p>
            <div className="flex gap-2 flex-wrap">
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
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

          {/* Results count and sort */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-500">{filteredListings.length} listings</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A-Z</option>
                <option value="verified">Verified First</option>
              </select>
            </div>
          </div>

          {/* Listings grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map(listing => (
              <Link 
                key={listing.slug} 
                href={`/listings/${listing.slug}`}
                className="block border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {categories.find(c => c.id === listing.category)?.name}
                  </span>
                  {listing.verified && (
                    <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L14.5 8.5L21 9.5L16 14L17.5 20.5L12 17.5L6.5 20.5L8 14L3 9.5L9.5 8.5L12 2Z" />
                      </svg>
                      AR
                    </div>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{listing.name}</h3>
                <p className="text-slate-600 text-sm mb-4">{listing.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {listing.tags.map(tag => (
                    <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-slate-900">${listing.price}</span>
                  <span className="text-blue-600 text-sm">View details →</span>
                </div>
              </Link>
            ))}
          </div>

          {filteredListings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No listings match your filters.</p>
              <button 
                onClick={() => { setSelectedCategory(null); setSelectedTags([]); }}
                className="text-blue-600 hover:underline mt-2"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
