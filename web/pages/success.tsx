import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../context/CartContext';

import { API_URL } from '../lib/api';

export async function getServerSideProps() {
  return { props: {} };
}

export default function Success() {
  const router = useRouter();
  const { session_id } = router.query;
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchaseData, setPurchaseData] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const MAX_RETRIES = 8;

  useEffect(() => {
    if (session_id && typeof session_id === 'string') {
      verifyPurchase(session_id);
    }
  }, [session_id]);

  useEffect(() => {
    if (purchaseData && purchaseData.status === 'paid') {
      clearCart();
      sessionStorage.removeItem('ar-pending-cart');
    }
  }, [purchaseData, clearCart]);

  const verifyPurchase = async (sid: string, attempt = 0) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('ar-token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(`${API_URL}/payments/session/${sid}`, { headers });
      const data = await response.json();

      if (response.ok) {
        // Only mark anonymous if no user_id returned AND the browser has no auth token
        const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('ar-token');
        if (data.customer_email && !data.user_id && !hasToken) {
          setIsAnonymous(true);
        }

        if (data.status === 'paid' && (!data.transactions || data.transactions.length === 0) && attempt < MAX_RETRIES) {
          setTimeout(() => {
            setRetryCount(attempt + 1);
            verifyPurchase(sid, attempt + 1);
          }, 2500);
          return;
        }

        // Even if transactions are still processing, show success if Stripe says paid
        setPurchaseData(data);
        setLoading(false);
      } else {
        if (attempt < MAX_RETRIES) {
          setTimeout(() => {
            setRetryCount(attempt + 1);
            verifyPurchase(sid, attempt + 1);
          }, 2000);
          return;
        }
        const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('ar-token');
        if (!hasToken) setIsAnonymous(true);
        setPurchaseData({ status: 'paid', customer_email: '', transactions: [] });
        setLoading(false);
      }
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount(attempt + 1);
          verifyPurchase(sid, attempt + 1);
        }, 2000);
        return;
      }
      const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('ar-token');
      if (!hasToken) setIsAnonymous(true);
      setPurchaseData({ status: 'paid', customer_email: '', transactions: [] });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>Payment Successful | Agent Resources</title>
      </Head>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-2xl mx-auto text-center">
          {loading ? (
            <div className="py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terra-500 mx-auto mb-4"></div>
              <p className="text-ink-500">Verifying your purchase...</p>
              {retryCount > 0 && (
                <p className="text-ink-400 text-sm mt-2">
                  Still processing{'.'.repeat(retryCount % 4)}
                </p>
              )}
            </div>
          ) : error ? (
            <div className="py-12">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="heading-serif text-2xl text-ink-900 mb-2">Payment Successful!</h1>
              <p className="text-ink-500 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/settings?tab=purchases&justPurchased=1" className="btn-primary">
                  View My Purchases
                </Link>
                <Link href="/listings" className="text-terra-600 hover:text-terra-700 font-medium">
                  Browse more listings →
                </Link>
              </div>

              {isAnonymous && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-700 text-sm">
                    <strong>Guest Purchase:</strong> Create an account with the same email to access your purchases anytime.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="heading-serif text-3xl text-ink-900 mb-4">Payment Successful!</h1>
              <p className="text-ink-500 mb-8">
                {isAnonymous
                  ? <>Your download link has been sent to <strong>{purchaseData?.customer_email}</strong>. Check your inbox — the link works forever.</>
                  : <>Thank you for your purchase. A confirmation email has been sent to {purchaseData?.customer_email}.</>
                }
              </p>

              <div className="card p-6 mb-8 text-left">
                <h2 className="font-semibold text-ink-900 mb-4">Order Details</h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-ink-500">
                    <span>Status</span>
                    <span className="text-green-700 font-medium capitalize">{purchaseData?.status}</span>
                  </div>
                  {(purchaseData?.transactions?.length ?? 0) > 0 ? (
                    <div className="flex justify-between text-ink-500">
                      <span>Items</span>
                      <span className="text-ink-900">{purchaseData.transactions.length}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-ink-500">
                      <span>Download</span>
                      <span className="text-amber-600 text-sm">Processing — check My Purchases in a moment</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isAnonymous ? (
                  <>
                    <Link href="/signup" className="btn-primary">
                      Create Account to Access Purchases
                    </Link>
                    <Link href="/listings" className="btn-secondary">
                      Browse More
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/settings?tab=purchases&justPurchased=1" className="btn-primary">
                      View My Purchases
                    </Link>
                    <Link href="/listings" className="btn-secondary">
                      Browse More
                    </Link>
                  </>
                )}
              </div>

              {isAnonymous && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
                  <p className="text-blue-800 text-sm font-medium mb-1">Want your purchases in one place?</p>
                  <p className="text-blue-700 text-sm mb-3">
                    Create a free account with <strong>{purchaseData?.customer_email}</strong> and all your purchases will appear automatically — no hunting through your inbox.
                  </p>
                  {purchaseData?.customer_email?.includes('@') && (
                    <Link
                      href={`/signup?email=${encodeURIComponent(purchaseData.customer_email)}`}
                      className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg inline-block transition-colors"
                    >
                      Create free account →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
