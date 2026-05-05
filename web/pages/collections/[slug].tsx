import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { API_URL } from '../../lib/api';

export async function getServerSideProps() {
  return { props: {} };
}

interface Owner {
  id: string;
  name: string;
  profile_slug?: string;
  avatar_url?: string;
}

interface CollectionProduct {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  price_cents: number;
  is_verified: boolean;
  download_count: number;
}

interface CollectionItemData {
  id: string;
  position: number;
  note?: string;
  product: CollectionProduct;
}

interface CollectionData {
  id: string;
  slug: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  owner: Owner;
  items: CollectionItemData[];
}

const CATEGORY_STYLES: Record<string, { label: string; bg: string; text: string; border: string; icon: string }> = {
  persona:    { label: 'AI Persona',  bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',  icon: '🧠' },
  skill:      { label: 'Agent Skill', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: '⚡' },
  mcp_server: { label: 'MCP Server',  bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  icon: '🔌' },
  bundle:     { label: 'Bundle',      bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  icon: '📦' },
};

function ProductCard({ item }: { item: CollectionItemData }) {
  const style = CATEGORY_STYLES[item.product.category] ?? CATEGORY_STYLES.bundle;
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md hover:border-slate-300 transition-all">
      <Link href={`/listings/${item.product.slug}`} className="block p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
            {style.icon} {style.label}
          </span>
          {item.product.is_verified && (
            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <h3 className="font-semibold text-slate-900 line-clamp-1 mb-1">{item.product.name}</h3>
        {item.product.description && (
          <p className="text-slate-500 text-sm line-clamp-2">{item.product.description}</p>
        )}
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="font-bold text-slate-900">${(item.product.price_cents / 100).toFixed(2)}</span>
          {item.product.download_count > 0 && (
            <span className="text-slate-400">{item.product.download_count} installs</span>
          )}
        </div>
      </Link>
      {item.note && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
          <p className="text-xs text-slate-500 italic">"{item.note}"</p>
        </div>
      )}
    </div>
  );
}

export default function CollectionPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) fetch(`${API_URL}/collections/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(setCollection)
      .catch(() => setError('Collection not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    </div>
  );

  if (error || !collection) return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Collection not found</h1>
        <Link href="/listings" className="text-blue-600 hover:underline">Browse listings →</Link>
      </div>
    </div>
  );

  const ownerHref = `/developers/${collection.owner.profile_slug ?? collection.owner.id}`;

  return (
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>{collection.name} — Collection | Agent Resources</title>
        <meta name="description" content={collection.description || `A curated collection by ${collection.owner.name}`} />
      </Head>

      <Navbar />

      <main className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Collection</span>
                  <span className="text-slate-200">·</span>
                  <span className="text-xs text-slate-400">{collection.items.length} listing{collection.items.length !== 1 ? 's' : ''}</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{collection.name}</h1>
                {collection.description && (
                  <p className="text-slate-600 leading-relaxed">{collection.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-100">
              <Link href={ownerHref} className="flex items-center gap-3 group">
                {collection.owner.avatar_url ? (
                  <img src={collection.owner.avatar_url.startsWith('/avatars/') ? `${API_URL}${collection.owner.avatar_url}` : collection.owner.avatar_url}
                    alt={collection.owner.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #3549D4, #6470FA)' }}>
                    {collection.owner.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">
                  {collection.owner.name}
                </span>
              </Link>
            </div>
          </div>

          {/* Items */}
          {collection.items.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No listings in this collection yet.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {collection.items.map(item => <ProductCard key={item.id} item={item} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
