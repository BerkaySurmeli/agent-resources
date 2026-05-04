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
  pending_scan: 'bg-blue-50 text-blue-700 border border-blue-200',
  scanning: 'bg-purple-50 text-purple-700 border border-purple-200',
  approved: 'bg-green-50 text-green-700 border border-green-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
  payment_failed: 'bg-red-50 text-red-700 border border-red-200',
};

const statusLabels: Record<string, string> = {
  pending_payment: 'Awaiting Payment',
  pending_scan: 'In Review',
  scanning: 'Security Scan',
  approved: 'Live',
  rejected: 'Rejected',
  payment_failed: 'Payment Failed',
};

const translationStatusColors: Record<string, string> = {
  pending: 'bg-cream-200 text-ink-500',
  translating: 'bg-blue-50 text-blue-700 animate-pulse',
  completed: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
};

const translationStatusLabels: Record<string, string> = {
  pending: 'Translation Pending',
  translating: 'Translating...',
  completed: 'Translated',
  failed: 'Translation Failed',
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
      if (!token) {
        setVerificationMessage('Please sign in to resend verification email');
        return;
      }

      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setVerificationMessage('Verification email sent! Please check your inbox and spam folder.');
      } else {
        const data = await response.json().catch(() => ({}));
        setVerificationMessage(data.detail || 'Failed to send verification email');
      }
    } catch (err) {
      setVerificationMessage('Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ar-token');
      if (!token) {
        setError('Please sign in to view your dashboard');
        setLoading(false);
        return;
      }

      const listingsRes = await fetch(`${API_URL}/listings/my-listings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (listingsRes.ok) {
        const listingsData = await listingsRes.json();
        setListings(listingsData);
      } else if (listingsRes.status === 401) {
        setError('Your session has expired. Please log in again.');
        setLoading(false);
        return;
      } else {
        setError('Failed to load your listings. Please refresh the page.');
      }

      const statsRes = await fetch(`${API_URL}/listings/dashboard-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        await statsRes.json().catch(() => ({}));
      }
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
      const res = await fetch(`${API_URL}/listings/${listingId}/pay-fee`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDashboardData();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || 'Failed to process listing fee');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process listing fee');
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-terra-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-500 mb-4">{t.dashboard.signInToView}</p>
          <Link href="/login" className="text-terra-600 hover:text-terra-700 font-medium">
            {t.dashboard.signIn} →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>Your Dashboard | Agent Resources</title>
      </Head>

      <Navbar />

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Email Verification Banner */}
          {user && !user.isVerified && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-medium text-amber-800">{t.dashboard.pleaseVerifyEmail}</p>
                    <p className="text-sm text-amber-700">{t.dashboard.verifyEmailDesc}</p>
                  </div>
                </div>
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? t.common.loading : t.dashboard.verifyEmail}
                </button>
              </div>
              {verificationMessage && (
                <p className={`mt-3 text-sm ${verificationMessage.includes('Verification email sent') ? 'text-green-700' : 'text-red-600'}`}>
                  {verificationMessage}
                </p>
              )}
            </div>
          )}

          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="heading-serif text-3xl text-ink-900">{t.dashboard.developerDashboard}</h1>
              <p className="text-ink-500 mt-1">{t.dashboard.manageListings}</p>
            </div>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="card p-6">
                <p className="text-sm text-ink-500 mb-1">{t.dashboard.totalListings}</p>
                <p className="text-3xl font-bold text-ink-900">{stats.total_listings}</p>
              </div>
              <div className="card p-6">
                <p className="text-sm text-ink-500 mb-1">{t.dashboard.published}</p>
                <p className="text-3xl font-bold text-green-700">{stats.approved_listings}</p>
              </div>
              <div className="card p-6">
                <p className="text-sm text-ink-500 mb-1">{t.dashboard.pending}</p>
                <p className="text-3xl font-bold text-amber-600">{stats.pending_listings}</p>
              </div>
              <div className="card p-6">
                <p className="text-sm text-ink-500 mb-1">{t.dashboard.totalRevenue}</p>
                {stats.total_revenue_cents > 0 ? (
                  <p className="text-3xl font-bold text-green-700">{formatPrice(stats.total_revenue_cents)}</p>
                ) : (
                  <p className="text-base text-ink-400 mt-1">Your first sale is one listing away</p>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {listings.length === 0 && !loading && (
            <div className="card p-12 text-center mb-8">
              <div className="w-16 h-16 bg-terra-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-terra-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-ink-900 mb-2">{t.dashboard.startSelling}</h2>
              <p className="text-ink-500 mb-6 max-w-md mx-auto">
                {t.dashboard.startSellingDesc}
              </p>
              <Link
                href="/sell"
                className="btn-primary inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t.dashboard.createFirstListing}
              </Link>
            </div>
          )}

          {/* Listings Table */}
          {listings.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-cream-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink-900">{t.dashboard.yourListings}</h2>
                <Link href="/sell" className="text-terra-600 hover:text-terra-700 text-sm font-medium">
                  {t.dashboard.addNew}
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-cream-200/50">
                    <tr>
                      <th className="text-left text-xs font-medium text-ink-400 uppercase px-6 py-3">{t.dashboard.listing}</th>
                      <th className="text-left text-xs font-medium text-ink-400 uppercase px-6 py-3">{t.dashboard.price}</th>
                      <th className="text-left text-xs font-medium text-ink-400 uppercase px-6 py-3">{t.dashboard.status}</th>
                      <th className="text-left text-xs font-medium text-ink-400 uppercase px-6 py-3">{t.dashboard.files}</th>
                      <th className="text-left text-xs font-medium text-ink-400 uppercase px-6 py-3">{t.dashboard.created}</th>
                      <th className="text-left text-xs font-medium text-ink-400 uppercase px-6 py-3">{t.dashboard.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200">
                    {listings.map((listing) => (
                      <tr key={listing.id} className="hover:bg-cream-200/40 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-ink-900">{listing.name}</p>
                            <p className="text-sm text-ink-400 capitalize">{listing.category}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-ink-600">
                          {formatPrice(listing.price_cents)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[listing.status] || 'bg-cream-200 text-ink-500 border border-cream-300'}`}>
                              {statusLabels[listing.status] || listing.status}
                            </span>

                            {listing.virus_scan_status === 'scanning' && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-amber-700">Scanning...</span>
                                  <span className="text-amber-700">{listing.scan_progress || 0}%</span>
                                </div>
                                <div className="w-full bg-cream-200 rounded-full h-1.5">
                                  <div
                                    className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${listing.scan_progress || 0}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {listing.translation_status === 'translating' && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-blue-700">Translating...</span>
                                  <span className="text-blue-700">{listing.translation_progress || 0}%</span>
                                </div>
                                <div className="w-full bg-cream-200 rounded-full h-1.5">
                                  <div
                                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${listing.translation_progress || 0}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {listing.status === 'approved' && listing.translation_status === 'completed' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                ✓ Translated
                              </span>
                            )}
                          </div>

                          {listing.status === 'rejected' && listing.rejection_reason && (
                            <p className="text-xs text-red-600 mt-1">{listing.rejection_reason}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-ink-600">
                          {listing.file_count} {t.dashboard.files.toLowerCase()} • {formatFileSize(listing.file_size_bytes)}
                        </td>
                        <td className="px-6 py-4 text-ink-500">
                          {new Date(listing.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/listings/${listing.slug}`}
                              className="text-terra-600 hover:text-terra-700 text-sm font-medium"
                            >
                              {t.dashboard.view}
                            </Link>
                            <Link
                              href={`/dashboard/products/${listing.slug}`}
                              className="text-ink-400 hover:text-ink-900 text-sm font-medium"
                            >
                              Manage
                            </Link>
                            {listing.status === 'pending_payment' && (
                              <button
                                onClick={() => handlePayFee(listing.id)}
                                className="text-terra-600 hover:text-terra-700 text-sm font-medium"
                              >
                                {t.dashboard.payFee}
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

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terra-500"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-700 mb-4">{error}</p>
              {error.includes('session has expired') && (
                <Link
                  href="/login"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Log In Again
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
