import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import { API_URL } from '../lib/api';

interface Listing {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price_cents: number;
  version: string;
  status: string;
  file_count: number;
  file_size_bytes: number;
  created_at: string;
  updated_at: string;
  scan_results: any;
  rejection_reason: string | null;
  product_id: string | null;
  translation_status?: string;
  translation_progress?: number;
  virus_scan_status?: string;
  scan_progress?: number;
}

interface DashboardStats {
  total_listings: number;
  approved_listings: number;
  pending_listings: number;
  rejected_listings: number;
  total_revenue_cents: number;
  total_downloads: number;
}

const statusColors: Record<string, string> = {
  pending_payment: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  pending_scan:    'bg-blue-50 text-blue-700 border border-blue-200',
  scanning:        'bg-purple-50 text-purple-700 border border-purple-200',
  approved:        'bg-green-50 text-green-700 border border-green-200',
  rejected:        'bg-red-50 text-red-700 border border-red-200',
  payment_failed:  'bg-red-50 text-red-700 border border-red-200',
};

const statusLabels: Record<string, string> = {
  pending_payment: 'Awaiting Payment',
  pending_scan:    'In Review',
  scanning:        'Security Scan',
  approved:        'Live',
  rejected:        'Rejected',
  payment_failed:  'Payment Failed',
};

export default function Dashboard() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      refreshUser();
    }
  }, [user?.id]);

  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      setVerificationMessage('');
      const token = localStorage.getItem('ar-token');
      if (!token) { setVerificationMessage('Please sign in to resend verification email'); return; }
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setVerificationMessage('Verification email sent! Check your inbox and spam folder.');
      } else {
        const data = await response.json().catch(() => ({}));
        setVerificationMessage(data.detail || 'Failed to send verification email');
      }
    } catch {
      setVerificationMessage('Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ar-token');
      if (!token) { setError('Please sign in to view your dashboard'); setLoading(false); return; }

      const [listingsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/listings/my-listings`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/listings/dashboard-stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      if (listingsRes.status === 401) { setError('Your session has expired. Please log in again.'); setLoading(false); return; }
      if (listingsRes.ok) setListings(await listingsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch {
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayFee = async (listingId: string) => {
    const token = localStorage.getItem('ar-token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/listings/${listingId}/pay`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) fetchDashboardData();
      else { const data = await res.json().catch(() => ({})); setError(data.detail || 'Failed to process listing fee'); }
    } catch (err: any) {
      setError(err.message || 'Failed to process listing fee');
    }
  };

  const formatPrice  = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatSize   = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

  if (authLoading) return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-terra-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center">
      <div className="text-center">
        <p className="text-ink-500 mb-4">Sign in to view your dashboard.</p>
        <Link href="/login" className="text-terra-600 hover:text-terra-700 font-medium">Sign in →</Link>
      </div>
    </div>
  );

  const hasListings    = listings.length > 0;
  const hasRevenue     = (stats?.total_revenue_cents ?? 0) > 0;
  const isDeveloper    = user.isDeveloper;

  return (
    <div className="min-h-screen bg-cream-100">
      <Head><title>Dashboard | Agent Resources</title></Head>
      <Navbar />

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Email verification banner */}
          {!user.isVerified && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-medium text-amber-800">Verify your email to unlock API keys</p>
                    <p className="text-sm text-amber-700">Check your inbox for a verification link, then come back to create your first API key.</p>
                  </div>
                </div>
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  {isResending ? 'Sending…' : 'Resend email'}
                </button>
              </div>
              {verificationMessage && (
                <p className={`mt-3 text-sm ${verificationMessage.includes('sent') ? 'text-green-700' : 'text-red-600'}`}>
                  {verificationMessage}
                </p>
              )}
            </div>
          )}

          {/* Commission-free status banner (for developers) */}
          {user.isDeveloper && user.commissionFree && user.commissionFreeUntil && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-emerald-900 mb-1">🎉 You're keeping 100% of your sales</p>
                  <p className="text-sm text-emerald-800 leading-relaxed">
                    As an early developer, you pay <strong>zero commission</strong> until{' '}
                    <strong>{new Date(user.commissionFreeUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.
                    Every sale goes directly to your Stripe Connect account with no platform fees.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      {(() => {
                        const daysLeft = Math.ceil((new Date(user.commissionFreeUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        return `${daysLeft} days remaining in your commission-free window`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pro status banner (if applicable) */}
          {user.isDeveloper && user.isPro && !user.commissionFree && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-blue-900 mb-1">⚡ Pro Member — Zero Commission</p>
                  <p className="text-sm text-blue-800">
                    You're on the Pro plan ($19/mo). All your sales are commission-free — you keep 100% of every transaction.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="heading-serif text-3xl text-ink-900">
                Welcome{user.name ? `, ${user.name.split(' ')[0]}` : ''}
              </h1>
              <p className="text-ink-500 mt-1">
                {user.isVerified
                  ? 'Build, buy, and sell agent skills from one place.'
                  : 'Verify your email to get started with API keys.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/api-keys" className="flex items-center gap-2 text-sm font-medium text-brand hover:text-brand/80 bg-brand/5 hover:bg-brand/10 border border-brand/20 px-4 py-2 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                API Keys
              </Link>
              {isDeveloper && (
                <Link href="/analytics" className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analytics
                </Link>
              )}
            </div>
          </div>

          {/* Quick actions for non-developer verified users */}
          {user.isVerified && !isDeveloper && !loading && (
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <Link href="/dashboard/api-keys" className="card card-hover p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-ink-900">Create an API key</p>
                  <p className="text-sm text-ink-500 mt-0.5">Give your agent OAuth credentials to authenticate and shop the catalog.</p>
                </div>
              </Link>
              <Link href="/listings" className="card card-hover p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-terra-50 border border-terra-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-terra-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-ink-900">Browse the catalog</p>
                  <p className="text-sm text-ink-500 mt-0.5">Explore AI personas, agent skills, and MCP servers ready to install.</p>
                </div>
              </Link>
            </div>
          )}

          {/* Developer stats — only show if user has listings or revenue */}
          {isDeveloper && stats && (hasListings || hasRevenue) && (
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="card p-6">
                <p className="text-sm text-ink-500 mb-1">Total listings</p>
                <p className="text-3xl font-bold text-ink-900">{stats.total_listings}</p>
              </div>
              <div className="card p-6">
                <p className="text-sm text-ink-500 mb-1">Live</p>
                <p className="text-3xl font-bold text-green-700">{stats.approved_listings}</p>
              </div>
              <div className="card p-6">
                <p className="text-sm text-ink-500 mb-1">In review</p>
                <p className="text-3xl font-bold text-amber-600">{stats.pending_listings}</p>
              </div>
              <div className="card p-6">
                <p className="text-sm text-ink-500 mb-1">Revenue</p>
                {hasRevenue
                  ? <p className="text-3xl font-bold text-green-700">{formatPrice(stats.total_revenue_cents)}</p>
                  : <p className="text-sm text-ink-400 mt-2">First sale pending</p>
                }
              </div>
            </div>
          )}

          {/* Developer listings table */}
          {isDeveloper && hasListings && (
            <div className="card overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-cream-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink-900">Your listings</h2>
                <Link href="/sell" className="text-terra-600 hover:text-terra-700 text-sm font-medium">+ Add new</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-cream-200/50">
                    <tr>
                      <th className="text-left text-xs font-medium text-ink-400 uppercase px-6 py-3">Listing</th>
                      <th className="text-left text-xs font-medium text-ink-400 uppercase px-6 py-3">Price</th>
                      <th className="text-left text-xs font-medium text-ink-400 uppercase px-6 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-ink-400 uppercase px-6 py-3">Size</th>
                      <th className="text-left text-xs font-medium text-ink-400 uppercase px-6 py-3">Created</th>
                      <th className="text-left text-xs font-medium text-ink-400 uppercase px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200">
                    {listings.map(listing => (
                      <tr key={listing.id} className="hover:bg-cream-200/40 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-ink-900">{listing.name}</p>
                          <p className="text-sm text-ink-400 capitalize">{listing.category}</p>
                        </td>
                        <td className="px-6 py-4 text-ink-600">{formatPrice(listing.price_cents)}</td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[listing.status] || 'bg-cream-200 text-ink-500 border border-cream-300'}`}>
                              {statusLabels[listing.status] || listing.status}
                            </span>
                            {listing.virus_scan_status === 'scanning' && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-amber-700">Scanning…</span>
                                  <span className="text-amber-700">{listing.scan_progress || 0}%</span>
                                </div>
                                <div className="w-full bg-cream-200 rounded-full h-1.5">
                                  <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${listing.scan_progress || 0}%` }} />
                                </div>
                              </div>
                            )}
                            {listing.translation_status === 'translating' && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-blue-700">Translating…</span>
                                  <span className="text-blue-700">{listing.translation_progress || 0}%</span>
                                </div>
                                <div className="w-full bg-cream-200 rounded-full h-1.5">
                                  <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${listing.translation_progress || 0}%` }} />
                                </div>
                              </div>
                            )}
                          </div>
                          {listing.status === 'rejected' && listing.rejection_reason && (
                            <p className="text-xs text-red-600 mt-1">{listing.rejection_reason}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-ink-600 text-sm">{formatSize(listing.file_size_bytes)}</td>
                        <td className="px-6 py-4 text-ink-500 text-sm">{new Date(listing.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Link href={`/listings/${listing.slug}`} className="text-terra-600 hover:text-terra-700 text-sm font-medium">
                              View
                            </Link>
                            {listing.status === 'pending_payment' && (
                              <button onClick={() => handlePayFee(listing.id)} className="text-brand hover:text-brand/80 text-sm font-medium">
                                Pay fee
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Developer empty state */}
          {isDeveloper && !hasListings && !loading && (
            <div className="card p-12 text-center mb-8">
              <div className="w-16 h-16 bg-terra-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-terra-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-ink-900 mb-2">Submit your first listing</h2>
              <p className="text-ink-500 mb-6 max-w-md mx-auto">
                Publish an AI persona, agent skill, or MCP server. Reach every agent that uses this marketplace.
              </p>
              <Link href="/sell" className="btn-primary inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create a listing
              </Link>
            </div>
          )}

          {/* Sell CTA for non-developers */}
          {!isDeveloper && !loading && (
            <div className="card p-6 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold text-ink-900">Sell your own agent skills</p>
                <p className="text-sm text-ink-500 mt-0.5">Publish a persona, skill, or MCP server. Keep 90% of every sale.</p>
              </div>
              <Link href="/sell" className="btn-secondary text-sm px-5 py-2.5 whitespace-nowrap">
                Start selling →
              </Link>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terra-500" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-700 mb-4">{error}</p>
              {error.includes('session') && (
                <Link href="/login" className="btn-primary inline-flex items-center gap-2">Log in again</Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
