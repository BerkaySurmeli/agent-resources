import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import { API_URL } from '../lib/api';

export default function Success() {
  const router = useRouter();
  const { session_id } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchaseData, setPurchaseData] = useState<any>(null);

  useEffect(() => {
    if (session_id && typeof session_id === 'string') {
      verifyPurchase(session_id);
    }
  }, [session_id]);

  const verifyPurchase = async (sid: string) => {
    try {
      const response = await fetch(`${API_URL}/payments/session/${sid}`);
      const data = await response.json();
      
      if (response.ok) {
        setPurchaseData(data);
      } else {
        setError(data.detail || 'Failed to verify purchase');
      }
    } catch (err) {
      setError('Failed to verify purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <Head>
        <title>Payment Successful | Agent Resources</title>
      </Head>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-2xl mx-auto text-center">
          {loading ? (
            <div className="py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Verifying your purchase...</p>
            </div>
          ) : error ? (
            <div className="py-12">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">Something went wrong</h1>
              <p className="text-gray-400 mb-6">{error}</p>
              <Link href="/listings" className="text-blue-400 hover:text-blue-300">
                Browse more listings →
              </Link>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h1 className="text-3xl font-semibold text-white mb-4">Payment Successful!</h1>
              <p className="text-gray-400 mb-8">
                Thank you for your purchase. A confirmation email has been sent to {purchaseData?.customer_email}.
              </p>

              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-8">
                <h2 className="font-semibold text-white mb-4">Order Details</h2>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between text-gray-400">
                    <span>Status</span>
                    <span className="text-green-400 capitalize">{purchaseData?.status}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Items</span>
                    <span className="text-white">{purchaseData?.transactions?.length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/settings?tab=purchases"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  View My Purchases
                </Link>
                <Link
                  href="/listings"
                  className="bg-gray-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  Browse More
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
