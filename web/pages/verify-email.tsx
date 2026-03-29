import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/verify-email?token=${token}`);
        const data = await response.json();
        
        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.detail || 'Verification failed');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <Head>
        <title>Verify Email | Agent Resources</title>
      </Head>

      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">AR</span>
          </div>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">Verifying your email...</h1>
              <p className="text-slate-600">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">Email Verified!</h1>
              <p className="text-slate-600 mb-6">{message}</p>
              <Link 
                href="/login" 
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continue to Login
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">Verification Failed</h1>
              <p className="text-slate-600 mb-6">{message}</p>
              <Link 
                href="/" 
                className="inline-block bg-slate-100 text-slate-700 px-6 py-3 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                Go Home
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
