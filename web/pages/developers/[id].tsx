import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';

import { API_URL } from '../../lib/api';

export async function getServerSideProps() {
  return { props: {} };
}

interface Developer {
  id: string;
  name: string;
  avatar_url?: string;
  profile_slug?: string;
  bio?: string;
  website?: string;
  twitter?: string;
  github?: string;
  is_verified: boolean;
  is_developer: boolean;
  is_pro: boolean;
}

interface Listing {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  price_cents: number;
  is_verified: boolean;
  download_count: number;
  quality_score?: number;
}

const GRADE_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  A: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  B: { color: 'text-terra-700',   bg: 'bg-terra-50',   border: 'border-terra-200'   },
  C: { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  D: { color: 'text-ink-500',     bg: 'bg-cream-100',  border: 'border-cream-200'   },
};
function gradeFromScore(score: number) {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

interface Stats {
  total_listings: number;
  total_sales: number;
  average_rating: number;
  total_reviews: number;
}

const CATEGORY_STYLES: Record<string, { label: string; bg: string; text: string; border: string; icon: string }> = {
  persona:    { label: 'AI Persona',  bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',  icon: '🧠' },
  skill:      { label: 'Agent Skill', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: '⚡' },
  mcp_server: { label: 'MCP Server',  bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  icon: '🔌' },
  bundle:     { label: 'Bundle',      bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  icon: '📦' },
};

function ListingCard({ listing }: { listing: Listing }) {
  const style = CATEGORY_STYLES[listing.category] ?? CATEGORY_STYLES.bundle;
  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="group card p-5 hover:shadow-md transition-all flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
          {style.icon} {style.label}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {listing.quality_score !== undefined && listing.quality_score > 0 && (() => {
            const g = gradeFromScore(listing.quality_score);
            const gs = GRADE_STYLES[g];
            return (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${gs.bg} ${gs.color} ${gs.border}`}
                title={`Quality score: ${listing.quality_score}/100`}>
                {g}
              </span>
            );
          })()}
          {listing.is_verified && (
            <svg className="w-4 h-4 text-terra-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-ink-900 group-hover:text-terra-600 transition-colors line-clamp-1">{listing.name}</h3>
        {listing.description && (
          <p className="text-ink-500 text-sm mt-1 line-clamp-2">{listing.description}</p>
        )}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold text-ink-900">${(listing.price_cents / 100).toFixed(2)}</span>
        {listing.download_count > 0 && (
          <span className="text-ink-400">{listing.download_count} installs</span>
        )}
      </div>
    </Link>
  );
}

export default function DeveloperProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [collections, setCollections] = useState<{ slug: string; name: string; description?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) fetchAll(id as string);
  }, [id]);

  const fetchAll = async (identifier: string) => {
    try {
      const [devRes, listingsRes, statsRes, collectionsRes] = await Promise.all([
        fetch(`${API_URL}/developers/${identifier}`),
        fetch(`${API_URL}/developers/${identifier}/listings`),
        fetch(`${API_URL}/developers/${identifier}/stats`),
        fetch(`${API_URL}/developers/${identifier}/collections`),
      ]);
      if (!devRes.ok) throw new Error('Developer not found');
      const [devData, listingsData, statsData, collectionsData] = await Promise.all([
        devRes.json(),
        listingsRes.ok ? listingsRes.json() : [],
        statsRes.ok ? statsRes.json() : null,
        collectionsRes.ok ? collectionsRes.json() : [],
      ]);
      setDeveloper(devData);
      setListings(listingsData);
      setStats(statsData);
      setCollections(collectionsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-terra-500" />
        </div>
      </div>
    );
  }

  if (error || !developer) {
    return (
      <div className="min-h-screen bg-cream-100">
        <Navbar />
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <h1 className="heading-serif text-2xl text-ink-900 mb-4">Developer not found</h1>
          <Link href="/listings" className="text-terra-600 hover:underline">Browse listings →</Link>
        </div>
      </div>
    );
  }

  const avatarSrc = developer.avatar_url
    ? developer.avatar_url.startsWith('/avatars/')
      ? `${API_URL}${developer.avatar_url}`
      : developer.avatar_url
    : null;

  const grouped = {
    persona: listings.filter(l => l.category === 'persona'),
    skill: listings.filter(l => l.category === 'skill'),
    mcp_server: listings.filter(l => l.category === 'mcp_server'),
    bundle: listings.filter(l => l.category === 'bundle'),
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>{developer.name} | Agent Resources</title>
        <meta name="description" content={developer.bio || `${developer.name}'s agent resources on Agent Resources marketplace.`} />
      </Head>

      <Navbar />

      <main className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="card p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              {avatarSrc ? (
                <img src={avatarSrc} alt={developer.name} className="w-24 h-24 rounded-2xl object-cover flex-shrink-0 border border-cream-200" />
              ) : (
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #3549D4, #6470FA)' }}>
                  {developer.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="heading-serif text-2xl text-ink-900">{developer.name}</h1>
                  {developer.is_verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-terra-50 text-terra-700 border border-terra-200">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                  {developer.is_pro && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full text-white"
                      style={{ background: 'linear-gradient(135deg, #3549D4, #6470FA)' }}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Pro
                    </span>
                  )}
                </div>

                {developer.bio && <p className="text-ink-600 mb-3 leading-relaxed">{developer.bio}</p>}

                {/* Social links */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {developer.website && (
                    <a href={developer.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-terra-600 hover:underline">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      Website
                    </a>
                  )}
                  {developer.github && (
                    <a href={`https://github.com/${developer.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-ink-600 hover:text-ink-900">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                      {developer.github}
                    </a>
                  )}
                  {developer.twitter && (
                    <a href={`https://x.com/${developer.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-ink-600 hover:text-ink-900">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                      @{developer.twitter}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Stats strip */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-cream-200">
                {[
                  { label: 'Listings', value: stats.total_listings },
                  { label: 'Sales', value: stats.total_sales },
                  { label: 'Avg Rating', value: stats.average_rating > 0 ? `${stats.average_rating.toFixed(1)} ★` : '—' },
                  { label: 'Reviews', value: stats.total_reviews },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-cream-200/60 rounded-xl p-4 text-center">
                    <p className="text-xl font-bold text-ink-900">{value}</p>
                    <p className="text-xs text-ink-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Collections */}
          {collections.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-ink-900 mb-4">Collections</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {collections.map(c => (
                  <Link
                    key={c.slug}
                    href={`/collections/${c.slug}`}
                    className="group card p-5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-ink-400 group-hover:text-terra-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="text-xs font-medium text-ink-400 uppercase tracking-wider">Collection</span>
                    </div>
                    <h3 className="font-semibold text-ink-900 group-hover:text-terra-600 transition-colors line-clamp-1">{c.name}</h3>
                    {c.description && <p className="text-ink-500 text-sm mt-1 line-clamp-2">{c.description}</p>}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Listings by category */}
          {listings.length === 0 ? (
            <div className="text-center py-12 text-ink-500">No published listings yet.</div>
          ) : (
            Object.entries(grouped).map(([cat, items]) =>
              items.length === 0 ? null : (
                <section key={cat} className="mb-10">
                  <h2 className="text-lg font-semibold text-ink-900 mb-4">
                    {CATEGORY_STYLES[cat]?.icon} {CATEGORY_STYLES[cat]?.label}s
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items.map(listing => <ListingCard key={listing.id} listing={listing} />)}
                  </div>
                </section>
              )
            )
          )}
        </div>
      </main>
    </div>
  );
}
