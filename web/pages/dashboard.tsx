import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

interface Listing {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price_cents: number;
  status: string;
  file_count: number;
  file_size_bytes: number;
  created_at: string;
  updated_at: string;
  scan_results: any;
  rejection_reason: string | null;
  product_id: string | null;
  translation_status?: string;
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
  pending_payment: 'bg-yellow-500/20 text-yellow-400',
  pending_scan: 'bg-blue-500/20 text-blue-400',
  scanning: 'bg-purple-500/20 text-purple-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  payment_failed: 'bg-red-500/20 text-red-400',
};



const translationStatusColors: Record<string, string> = {
  pending: 'bg-gray-500/20 text-gray-400',
  translating: 'bg-blue-500/20 text-blue-400 animate-pulse',
  completed: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
};

const translationStatusLabels: Record<string, string> = {
  pending: 'Translation Pending',
  translating: 'Translating...',
  completed: 'Translated',
  failed: 'Translation Failed',
};

export default function Dashboard() {
  const { user } = useAuth();
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
    }
  }, [user]);

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
      const token = localStorage.getItem('ar-token');
      if (!token) {
        setError('Please sign in to view your dashboard');
        setLoading(false);
        return;
      }
      
      // Fetch listings
      const listingsRes = await fetch(`${API_URL}/listings/my-listings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (listingsRes.ok) {
        const listingsData = await listingsRes.json();
        setListings(listingsData);
      } else {
        const errorData = await listingsRes.json().catch(() => ({}));
        console.error('Listings fetch error:', errorData);
      }
      
      // Fetch stats
      const statsRes = await fetch(`${API_URL}/listings/dashboard-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        const errorData = await statsRes.json().catch(() => ({}));
        console.error('Stats fetch error:', errorData);
      }
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError(`Failed to load dashboard data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">{t.dashboard.signInToView}</p>
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            {t.dashboard.signIn} →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-6">
      <Head>
        <title>Your Dashboard | Agent Resources</title>
      </Head>

      <main className="pt-8 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Email Verification Banner */}
          {user && !user.isVerified && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-medium text-yellow-400">{t.dashboard.pleaseVerifyEmail}</p>
                    <p className="text-sm text-yellow-400/80">{t.dashboard.verifyEmailDesc}</p>
                  </div>
                </div>
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? t.common.loading : t.dashboard.verifyEmail}
                </button>
              </div>
              {verificationMessage && (
                <p className={`mt-3 text-sm ${verificationMessage.includes('Verification email sent') ? 'text-green-400' : 'text-red-400'}`}>
                  {verificationMessage}
                </p>
              )}
            </div>
          )}

          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white">{t.dashboard.developerDashboard}</h1>
              <p className="text-gray-400">{t.dashboard.manageListings}</p>
            </div>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                <p className="text-sm text-gray-400 mb-1">{t.dashboard.totalListings}</p>
                <p className="text-3xl font-bold text-white">{stats.total_listings}</p>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                <p className="text-sm text-gray-400 mb-1">{t.dashboard.published}</p>
                <p className="text-3xl font-bold text-green-400">{stats.approved_listings}</p>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                <p className="text-sm text-gray-400 mb-1">{t.dashboard.pending}</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.pending_listings}</p>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                <p className="text-sm text-gray-400 mb-1">{t.dashboard.totalRevenue}</p>
                <p className="text-3xl font-bold text-white">{formatPrice(stats.total_revenue_cents)}</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {listings.length === 0 && !loading && (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-12 text-center mb-8">
              <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">{t.dashboard.startSelling}</h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {t.dashboard.startSellingDesc}
              </p>
              <Link 
                href="/sell" 
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
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
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">{t.dashboard.yourListings}</h2>
                <Link href="/sell" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                  {t.dashboard.addNew}
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.dashboard.listing}</th>
                      <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.dashboard.price}</th>
                      <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.dashboard.status}</th>
                      <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.dashboard.files}</th>
                      <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.dashboard.created}</th>
                      <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.dashboard.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {listings.map((listing) => (
                      <tr key={listing.id} className="hover:bg-gray-700/30">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-white">{listing.name}</p>
                            <p className="text-sm text-gray-400 capitalize">{listing.category}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {formatPrice(listing.price_cents)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[listing.status] || 'bg-gray-500/20 text-gray-400'}`}>
                              {(t.common as Record<string, string>)[`status${listing.status.replace(/_/g, '').replace(/\b\w/g, l => l.toUpperCase())}`] || listing.status}
                            </span>
                            {listing.status === 'approved' && listing.translation_status && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${translationStatusColors[listing.translation_status] || 'bg-gray-500/20 text-gray-400'}`}>
                                {translationStatusLabels[listing.translation_status] || listing.translation_status}
                              </span>
                            )}
                          </div>
                          {listing.status === 'rejected' && listing.rejection_reason && (
                            <p className="text-xs text-red-400 mt-1">{listing.rejection_reason}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {listing.file_count} {t.dashboard.files.toLowerCase()} • {formatFileSize(listing.file_size_bytes)}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {new Date(listing.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {listing.status === 'pending_payment' && (
                            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                              {t.dashboard.payFee}
                            </button>
                          )}
                          {['approved', 'scanning', 'rejected'].includes(listing.status) && (
                            <Link
                              href={`/dashboard/products/${listing.slug}`}
                              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                            >
                              {t.dashboard.manage}
                            </Link>
                          )}
                          {listing.status === 'pending_scan' && (
                            <span className="text-gray-500 text-sm">{t.common.statusPendingScan}</span>
                          )}
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
