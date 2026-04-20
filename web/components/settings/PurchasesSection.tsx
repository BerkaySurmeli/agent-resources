import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

interface Purchase {
  transaction_id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  amount_paid_cents: number;
  purchased_at: string;
  download_available: boolean;
  file_name: string | null;
  file_size: string | null;
  download_url: string | null;
}

export default function PurchasesSection() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const token = localStorage.getItem('ar-token');
      if (!token) {
        setError(t.settings.pleaseSignIn);
        setLoading(false);
        return;
      }

      // Use the downloads endpoint which includes file info
      const response = await fetch(`${API_URL}/downloads/my-purchases`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPurchases(data.purchases || []);
      } else {
        // Fallback to auth/purchases endpoint
        const fallbackResponse = await fetch(`${API_URL}/auth/purchases`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          // Transform to match our interface
          setPurchases(fallbackData.map((p: any) => ({
            transaction_id: p.id,
            product_id: p.product?.id || '',
            product_name: p.product_name,
            product_slug: p.product_slug,
            amount_paid_cents: p.amount_cents,
            purchased_at: p.created_at,
            download_available: false,
            file_name: null,
            file_size: null,
            download_url: null
          })));
        } else {
          setError(t.common.error);
        }
      }
    } catch (err) {
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (productId: string, productName: string) => {
    setDownloading(productId);
    try {
      const token = localStorage.getItem('ar-token');
      if (!token) {
        setError('Please sign in to download');
        return;
      }

      const response = await fetch(`${API_URL}/downloads/purchases/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // Create a blob from the response and trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Try to get filename from Content-Disposition header or use product name
        const contentDisposition = response.headers.get('content-disposition');
        const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
        a.download = filenameMatch?.[1] || `${productName.replace(/\s+/g, '_')}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || 'Failed to download file');
      }
    } catch (err) {
      setError('Download failed. Please try again.');
    } finally {
      setDownloading(null);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">{t.settings.purchaseHistory}</h2>
        <p className="text-gray-400">{t.settings.purchaseSubtitle}</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-300 text-sm mt-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : purchases.length === 0 ? (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-700/50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">{t.settings.noPurchases}</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {t.settings.purchaseSubtitle}
          </p>
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            {t.settings.browseListings}
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
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.settings.product}</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.settings.date}</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.settings.price}</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">File</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.settings.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {purchases.map((purchase) => (
                  <tr key={purchase.transaction_id} className="hover:bg-gray-700/30">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{purchase.product_name}</p>
                      <Link 
                        href={`/products/${purchase.product_slug}`}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        View details →
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatDate(purchase.purchased_at)}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatPrice(purchase.amount_paid_cents)}
                    </td>
                    <td className="px-6 py-4">
                      {purchase.download_available ? (
                        <div className="text-sm">
                          <p className="text-green-400 font-medium">Available</p>
                          {purchase.file_name && (
                            <p className="text-gray-500 text-xs truncate max-w-[150px]">{purchase.file_name}</p>
                          )}
                          {purchase.file_size && (
                            <p className="text-gray-500 text-xs">{purchase.file_size}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-yellow-400 text-sm">Processing</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {purchase.download_available && purchase.product_id ? (
                        <button
                          onClick={() => handleDownload(purchase.product_id, purchase.product_name)}
                          disabled={downloading === purchase.product_id}
                          className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {downloading === purchase.product_id ? (
                            <>
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-gray-500 text-sm">—</span>
                      )}
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
