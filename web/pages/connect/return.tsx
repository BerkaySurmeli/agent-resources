import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { API_URL } from '../../lib/api';

export async function getServerSideProps() {
  return { props: {} };
}

type Status = 'loading' | 'success' | 'pending' | 'error';

export default function ConnectReturn() {
  const router = useRouter();
  const { account_id } = router.query;
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady || !account_id) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('ar-token') : null;
    if (!token) {
      router.replace('/login');
      return;
    }

    fetch(`${API_URL}/payments/connect/return?account_id=${account_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d.detail || 'Setup failed')))
      .then(data => {
        setStatus(data.account_status === 'active' ? 'success' : 'pending');
      })
      .catch(err => {
        setError(typeof err === 'string' ? err : 'Something went wrong. Please try again.');
        setStatus('error');
      });
  }, [router.isReady, account_id]);

  return (
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>Stripe Setup | Agent Resources</title>
      </Head>
      <Navbar />
      <main className="pt-24 pb-12 px-6 flex items-center justify-center min-h-[70vh]">
        <div className="max-w-md w-full text-center">
          {status === 'loading' && (
            <div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terra-500 mx-auto mb-4" />
              <p className="text-ink-500">Confirming your Stripe setup...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="card p-10">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="heading-serif text-2xl text-ink-900 mb-3">Stripe Connected!</h1>
              <p className="text-ink-500 mb-8">
                Your account is active and ready to receive payouts. Sales will be paid out weekly every Monday.
              </p>
              <Link href="/settings?tab=payouts" className="btn-primary inline-flex justify-center">
                Go to Payout Settings
              </Link>
            </div>
          )}

          {status === 'pending' && (
            <div className="card p-10">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="heading-serif text-2xl text-ink-900 mb-3">Setup Incomplete</h1>
              <p className="text-ink-500 mb-8">
                Your Stripe account setup isn't finished yet. Please complete the remaining steps to start receiving payouts.
              </p>
              <Link href="/settings?tab=payouts" className="btn-primary inline-flex justify-center">
                Complete Setup
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="card p-10">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="heading-serif text-2xl text-ink-900 mb-3">Something Went Wrong</h1>
              <p className="text-ink-500 mb-8">{error}</p>
              <Link href="/settings?tab=payouts" className="btn-primary inline-flex justify-center">
                Back to Payout Settings
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
