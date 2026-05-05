import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { API_URL } from '../lib/api';

export async function getServerSideProps() {
  return { props: {} };
}

interface ListingAnalytics {
  slug: string;
  name: string;
  category: string;
  price_cents: number;
  views: number;
  sales: number;
  revenue_cents: number;
  conversion_rate: number;
  avg_rating: number;
  review_count: number;
  download_count: number;
}

interface Totals {
  views: number;
  sales: number;
  revenue_cents: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  persona: 'AI Persona',
  skill: 'Agent Skill',
  mcp_server: 'MCP Server',
  bundle: 'Bundle',
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ConversionBar({ rate }: { rate: number }) {
  const clamped = Math.min(rate, 100);
  const color = clamped >= 5 ? 'bg-green-500' : clamped >= 2 ? 'bg-amber-400' : 'bg-slate-300';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-600 w-10 text-right">{rate.toFixed(1)}%</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<ListingAnalytics[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<keyof ListingAnalytics>('revenue_cents');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('ar-token') : null;
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_URL}/analytics/seller`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load analytics');
      const data = await res.json();
      setListings(data.listings);
      setTotals(data.totals);
    } catch (err) {
      console.error('[Analytics] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const sorted = [...listings].sort((a, b) => {
    const av = a[sortKey] as number;
    const bv = b[sortKey] as number;
    return bv - av;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-cream-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>Analytics | Agent Resources</title>
      </Head>

      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
              <p className="text-slate-500 text-sm mt-0.5">Performance across all your published listings</p>
            </div>
            <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
          </div>

          {/* Totals */}
          {totals && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Views" value={totals.views.toLocaleString()} />
              <StatCard label="Total Sales" value={totals.sales.toLocaleString()} />
              <StatCard
                label="Total Revenue"
                value={`$${(totals.revenue_cents / 100).toFixed(2)}`}
              />
              <StatCard
                label="Avg Conversion"
                value={totals.views > 0 ? `${((totals.sales / totals.views) * 100).toFixed(1)}%` : '—'}
                sub="sales ÷ views"
              />
            </div>
          )}

          {/* Per-listing table */}
          {listings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <p className="text-slate-500 mb-3">No published listings yet.</p>
              <Link href="/sell" className="text-blue-600 hover:underline text-sm">Submit your first listing →</Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-slate-600">Sort by:</span>
                {([
                  ['revenue_cents', 'Revenue'],
                  ['views', 'Views'],
                  ['sales', 'Sales'],
                  ['conversion_rate', 'Conversion'],
                  ['avg_rating', 'Rating'],
                ] as [keyof ListingAnalytics, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSortKey(key)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      sortKey === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="divide-y divide-slate-100">
                {sorted.map(l => (
                  <div key={l.slug} className="px-6 py-5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/listings/${l.slug}`}
                          className="font-semibold text-slate-900 hover:text-blue-600 transition-colors truncate block"
                        >
                          {l.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">{CATEGORY_LABELS[l.category] ?? l.category}</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-xs font-medium text-slate-600">${(l.price_cents / 100).toFixed(2)}</span>
                          {l.review_count > 0 && (
                            <>
                              <span className="text-slate-200">·</span>
                              <RatingStars rating={l.avg_rating} />
                              <span className="text-xs text-slate-400">{l.avg_rating.toFixed(1)} ({l.review_count})</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-slate-900">${(l.revenue_cents / 100).toFixed(2)}</p>
                        <p className="text-xs text-slate-400">{l.sales} sale{l.sales !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Views</p>
                        <p className="font-semibold text-slate-800">{l.views.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Downloads</p>
                        <p className="font-semibold text-slate-800">{l.download_count.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Conversion</p>
                        <ConversionBar rate={l.conversion_rate} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
