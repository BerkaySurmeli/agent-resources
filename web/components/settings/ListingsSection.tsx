import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

interface Listing {
  id: string;
  slug: string;
  name: string;
  category: string;
  price_cents: number;
  status: string;
  created_at: string;
  file_count: number;
  translation_status?: string;
  virus_scan_status?: string;
}

const statusColors: Record<string, string> = {
  pending_payment: 'bg-yellow-500/20 text-yellow-400',
  pending_scan: 'bg-blue-500/20 text-blue-400',
  scanning: 'bg-purple-500/20 text-purple-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  payment_failed: 'bg-red-500/20 text-red-400',
};

const scanStatusColors: Record<string, string> = {
  pending: 'bg-gray-500/20 text-gray-400',
  scanning: 'bg-yellow-500/20 text-yellow-400',
  clean: 'bg-green-500/20 text-green-400',
  infected: 'bg-red-500/20 text-red-400',
  failed: 'bg-red-500/20 text-red-400',
};

const translationStatusColors: Record<string, string> = {
  pending: 'bg-gray-500/20 text-gray-400',
  translating: 'bg-yellow-500/20 text-yellow-400',
  completed: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
};

export default function ListingsSection() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const token = localStorage.getItem('ar-token');
      if (!token) {
        setError(t.settings.pleaseSignIn);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/listings/my-listings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setListings(data);
      } else {
        setError(t.common.error);
      }
    } catch (err) {
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getScanStatusLabel = (status?: string) => {
    if (!status) return t.settings.scanPending;
    switch (status) {
      case 'pending': return t.settings.scanPending;
      case 'scanning': return t.settings.scanScanning;
      case 'clean': return t.settings.scanClean;
      case 'infected': return t.settings.scanInfected;
      case 'failed': return t.settings.scanFailed;
      default: return status;
    }
  };

  const getTranslationStatusLabel = (status?: string) => {
    if (!status) return t.settings.translationPending;
    switch (status) {
      case 'pending': return t.settings.translationPending;
      case 'translating': return t.settings.translationInProgress;
      case 'completed': return t.settings.translationCompleted;
      case 'failed': return t.settings.translationFailed;
      default: return status;
    }
  };

  if (!user?.isDeveloper) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2">{t.settings.myListings}</h2>
          <p className="text-gray-400">{t.settings.listingsSubtitle}</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-700/50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">{t.settings.becomeDeveloper}</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {t.settings.developerDesc}
          </p>
          <Link
            href="/sell"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            {t.settings.startSelling}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2">{t.settings.myListings}</h2>
          <p className="text-gray-400">{t.settings.listingsSubtitle}</p>
        </div>
        <Link
          href="/sell"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t.settings.newListing}
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-700/50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">{t.settings.noListings}</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {t.settings.listingsSubtitle}
          </p>
          <Link
            href="/sell"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            {t.settings.createListing}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.settings.listing}</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.settings.category}</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.settings.price}</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.settings.status}</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.settings.translationStatus}</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.settings.virusScanStatus}</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.settings.created}</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.settings.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-700/30">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{listing.name}</p>
                        <p className="text-sm text-gray-400">{listing.file_count} {t.settings.files}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 capitalize">
                      {listing.category}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatPrice(listing.price_cents)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[listing.status] || 'bg-gray-500/20 text-gray-400'}`}>
                        {listing.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${translationStatusColors[listing.translation_status || 'pending'] || 'bg-gray-500/20 text-gray-400'}`}>
                        {getTranslationStatusLabel(listing.translation_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${scanStatusColors[listing.virus_scan_status || 'pending'] || 'bg-gray-500/20 text-gray-400'}`}>
                        {getScanStatusLabel(listing.virus_scan_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatDate(listing.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/products/${listing.slug}`}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        {t.settings.manage}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
