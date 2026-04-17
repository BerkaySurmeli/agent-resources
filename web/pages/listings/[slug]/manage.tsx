import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import Navbar from '../../../components/Navbar';
import { API_URL } from '../../../lib/api';

interface Listing {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price_cents: number;
  status: string;
  virus_scan_status: string;
  scan_progress: number;
  translation_status: string;
  translation_progress: number;
  file_count: number;
  file_size_bytes: number;
  created_at: string;
  updated_at: string;
  rejection_reason: string | null;
}

export default function ManageListing() {
  const router = useRouter();
  const { slug } = router.query;
  const { user } = useAuth();
  const { t } = useLanguage();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (slug && user) {
      fetchListing();
    }
  }, [slug, user]);

  const fetchListing = async () => {
    try {
      const token = localStorage.getItem('ar-token');
      if (!token) {
        setError('Please sign in to manage this listing');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/listings/my-listings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch listing');
      }

      const listings = await response.json();
      const found = listings.find((l: Listing) => l.slug === slug);
      
      if (!found) {
        setError('Listing not found or you do not have permission to manage it');
      } else {
        setListing(found);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!listing) return;
    
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('ar-token');
      const response = await fetch(`${API_URL}/listings/${listing.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete listing');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete listing');
      setIsDeleting(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
            <p className="text-gray-400 mb-4">Listing not found</p>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Head>
        <title>Manage {listing.name} | Agent Resources</title>
      </Head>

      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-white">Manage Listing</span>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{listing.name}</h1>
              <p className="text-gray-400 capitalize">{listing.category}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{formatPrice(listing.price_cents)}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                listing.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                listing.status === 'scanning' ? 'bg-purple-500/20 text-purple-400' :
                listing.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {listing.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Scan Status */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Security Scan</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status</span>
                <span className={`text-sm ${
                  listing.virus_scan_status === 'clean' ? 'text-green-400' :
                  listing.virus_scan_status === 'infected' ? 'text-red-400' :
                  listing.virus_scan_status === 'scanning' ? 'text-purple-400' :
                  'text-yellow-400'
                }`}>
                  {listing.virus_scan_status || 'pending'}
                </span>
              </div>
              {listing.virus_scan_status === 'scanning' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-purple-400">{listing.scan_progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${listing.scan_progress || 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Translation Status */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Translation</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status</span>
                <span className={`text-sm ${
                  listing.translation_status === 'completed' ? 'text-green-400' :
                  listing.translation_status === 'translating' ? 'text-blue-400' :
                  listing.translation_status === 'failed' ? 'text-red-400' :
                  'text-gray-400'
                }`}>
                  {listing.translation_status || 'pending'}
                </span>
              </div>
              {listing.translation_status === 'translating' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-blue-400">{listing.translation_progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${listing.translation_progress || 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* File Info */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Files</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">File Count</p>
              <p className="text-xl font-semibold">{listing.file_count}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Size</p>
              <p className="text-xl font-semibold">{formatFileSize(listing.file_size_bytes)}</p>
            </div>
          </div>
        </div>

        {/* Rejection Reason */}
        {listing.status === 'rejected' && listing.rejection_reason && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-red-400 mb-2">Rejection Reason</h2>
            <p className="text-red-300">{listing.rejection_reason}</p>
          </div>
        )}

        {/* Actions */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/listings/${listing.slug}`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              View Public Page
            </Link>
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 bg-red-600/20 text-red-400 border border-red-600/50 px-4 py-2 rounded-lg font-medium hover:bg-red-600/30 transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Listing'}
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">Delete Listing?</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete &quot;{listing.name}&quot;? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
