import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

interface Purchase {
  id: string;
  product_name: string;
  product_slug: string;
  amount_cents: number;
  status: string;
  created_at: string;
  seller_name: string;
}

export default function PurchasesSection() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

      const response = await fetch(`${API_URL}/auth/purchases`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPurchases(data);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">{t.settings.purchaseHistory}</h2>
        <p className="text-gray-400">{t.settings.purchaseSubtitle}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
          <p className="text-red-400">{error}</p>
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
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.settings.seller}</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.settings.date}</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.settings.price}</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.settings.status}</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-3">{t.settings.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-700/30">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{purchase.product_name}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {purchase.seller_name}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatDate(purchase.created_at)}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatPrice(purchase.amount_cents)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        purchase.status === 'completed' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {purchase.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/products/${purchase.product_slug}`}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        {t.settings.view}
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
