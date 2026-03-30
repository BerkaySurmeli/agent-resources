import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

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
  pending_payment: 'bg-yellow-100 text-yellow-800',
  pending_scan: 'bg-blue-100 text-blue-800',
  scanning: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  payment_failed: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending_payment: 'Payment Required',
  pending_scan: 'Awaiting Scan',
  scanning: 'Scanning...',
  approved: 'Published',
  rejected: 'Rejected',
  payment_failed: 'Payment Failed',
};

const translationStatusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  translating: 'bg-blue-100 text-blue-700 animate-pulse',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const translationStatusLabels: Record<string, string> = {
  pending: 'Translation Pending',
  translating: 'Translating...',
  completed: 'Translated',
  failed: 'Translation Failed',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Please sign in to view your dashboard</p>
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Your Dashboard | Agent Resources</title>
      </Head>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Email Verification Banner */}
          {user && !user.isVerified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-medium text-yellow-800">Please verify your email</p>
                  <p className="text-sm text-yellow-700">You must verify your email before creating listings or making purchases.</p>
                </div>
              </div>
              <Link
                href="/verify-email"
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors whitespace-nowrap"
              >
                Verify Email
              </Link>
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900">Developer Dashboard</h1>
            <p className="text-slate-600">Manage your listings and track sales</p>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-50 rounded-xl p-6">
                <p className="text-sm text-slate-500 mb-1">Total Listings</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total_listings}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6">
                <p className="text-sm text-slate-500 mb-1">Published</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved_listings}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6">
                <p className="text-sm text-slate-500 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending_listings}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6">
                <p className="text-sm text-slate-500 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-slate-900">{formatPrice(stats.total_revenue_cents)}</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {listings.length === 0 && !loading && (
            <div className="bg-slate-50 rounded-2xl p-12 text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Start Selling</h2>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Create your first listing and reach thousands of AI agent users. 
                Start selling your AI agents today.
              </p>
              <Link 
                href="/sell" 
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Listing
              </Link>
            </div>
          )}

          {/* Listings Table */}
          {listings.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Your Listings</h2>
                <Link href="/sell" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  + Add new
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Listing</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Price</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Files</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Created</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {listings.map((listing) => (
                      <tr key={listing.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900">{listing.name}</p>
                            <p className="text-sm text-slate-500 capitalize">{listing.category}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {formatPrice(listing.price_cents)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[listing.status] || 'bg-slate-100 text-slate-800'}`}>
                              {statusLabels[listing.status] || listing.status}
                            </span>
                            {listing.status === 'approved' && listing.translation_status && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${translationStatusColors[listing.translation_status] || 'bg-gray-100 text-gray-600'}`}>
                                {translationStatusLabels[listing.translation_status] || listing.translation_status}
                              </span>
                            )}
                          </div>
                          {listing.status === 'rejected' && listing.rejection_reason && (
                            <p className="text-xs text-red-600 mt-1">{listing.rejection_reason}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {listing.file_count} files • {formatFileSize(listing.file_size_bytes)}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {new Date(listing.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {listing.status === 'pending_payment' && (
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                              Pay Fee
                            </button>
                          )}
                          {['approved', 'pending_scan', 'scanning', 'rejected'].includes(listing.status) && (
                            <Link
                              href={`/dashboard/products/${listing.slug}`}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              Manage
                            </Link>
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
