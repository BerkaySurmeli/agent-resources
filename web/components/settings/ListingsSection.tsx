import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Link from 'next/link';
import { API_URL } from '../../lib/api';

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
  pending_payment: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  pending_scan: 'bg-blue-50 text-blue-700 border border-blue-200',
  scanning: 'bg-purple-50 text-purple-700 border border-purple-200',
  approved: 'bg-green-50 text-green-700 border border-green-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
  payment_failed: 'bg-red-50 text-red-700 border border-red-200',
};

const scanStatusColors: Record<string, string> = {
  pending: 'bg-cream-200 text-ink-500',
  scanning: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  clean: 'bg-green-50 text-green-700 border border-green-200',
  infected: 'bg-red-50 text-red-700 border border-red-200',
  failed: 'bg-red-50 text-red-700 border border-red-200',
};

const translationStatusColors: Record<string, string> = {
  pending: 'bg-cream-200 text-ink-500',
  translating: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  completed: 'bg-green-50 text-green-700 border border-green-200',
  failed: 'bg-red-50 text-red-700 border border-red-200',
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
          <h2 className="heading-serif text-2xl text-ink-900 mb-2">{t.settings.myListings}</h2>
          <p className="text-ink-500">{t.settings.listingsSubtitle}</p>
        </div>

        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-cream-200 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-ink-900 mb-2">{t.settings.becomeDeveloper}</h3>
          <p className="text-ink-500 mb-6 max-w-md mx-auto">
            {t.settings.developerDesc}
          </p>
          <Link href="/sell" className="btn-primary inline-flex items-center gap-2">
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
          <h2 className="heading-serif text-2xl text-ink-900 mb-2">{t.settings.myListings}</h2>
          <p className="text-ink-500">{t.settings.listingsSubtitle}</p>
        </div>
        <Link href="/sell" className="btn-primary inline-flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t.settings.newListing}
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terra-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-cream-200 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-ink-900 mb-2">{t.settings.noListings}</h3>
          <p className="text-ink-500 mb-6 max-w-md mx-auto">
            {t.settings.listingsSubtitle}
          </p>
          <Link href="/sell" className="btn-primary inline-flex items-center gap-2">
            {t.settings.createListing}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-200/50">
                <tr>
                  <th className="text-left text-xs font-medium text-ink-400 uppercase px-6 py-3">{t.settings.listing}</th>
                  <th className="text-left text-xs font-medium text-ink-400 uppercase px-6 py-3">{t.settings.category}</th>
                  <th className="text-left text-xs font-medium text-ink-400 uppercase px-6 py-3">{t.settings.price}</th>
                  <th className="text-left text-xs font-medium text-ink-400 uppercase px-6 py-3">{t.settings.status}</th>
                  <th className="text-left text-xs font-medium text-ink-400 uppercase px-6 py-3">{t.settings.translationStatus}</th>
                  <th className="text-left text-xs font-medium text-ink-400 uppercase px-6 py-3">{t.settings.virusScanStatus}</th>
                  <th className="text-left text-xs font-medium text-ink-400 uppercase px-6 py-3">{t.settings.created}</th>
                  <th className="text-left text-xs font-medium text-ink-400 uppercase px-6 py-3">{t.settings.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-cream-200/40 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-ink-900">{listing.name}</p>
                        <p className="text-sm text-ink-400">{listing.file_count} {t.settings.files}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-ink-600 capitalize">
                      {listing.category}
                    </td>
                    <td className="px-6 py-4 text-ink-600">
                      {formatPrice(listing.price_cents)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[listing.status] || 'bg-cream-200 text-ink-500'}`}>
                        {listing.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${translationStatusColors[listing.translation_status || 'pending'] || 'bg-cream-200 text-ink-500'}`}>
                        {getTranslationStatusLabel(listing.translation_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${scanStatusColors[listing.virus_scan_status || 'pending'] || 'bg-cream-200 text-ink-500'}`}>
                        {getScanStatusLabel(listing.virus_scan_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-ink-500">
                      {formatDate(listing.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/listings/${listing.slug}`}
                        className="text-terra-600 hover:text-terra-700 text-sm font-medium"
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
