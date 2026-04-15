import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/verify-email?token=${token}`);
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
        
        // Update localStorage to mark user as verified
        // This ensures the verification banner disappears immediately
        if (typeof window !== 'undefined') {
          try {
            const savedUser = localStorage.getItem('ar-user');
            if (savedUser) {
              const userData = JSON.parse(savedUser);
              userData.isVerified = true;
              localStorage.setItem('ar-user', JSON.stringify(userData));
            }
          } catch (e) {
            console.error('Failed to update localStorage:', e);
          }
        }
      } else {
        setStatus('error');
        setMessage(data.detail || 'Verification failed');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-6">
      <Head>
        <title>Verify Email | Agent Resources</title>
      </Head>

      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-semibold text-white mb-2">Verifying your email...</h1>
            <p className="text-gray-400">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">Email Verified!</h1>
            <p className="text-gray-400 mb-6">{message}</p>
            <Link
              href="/login"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">Verification Failed</h1>
            <p className="text-gray-400 mb-6">{message}</p>
            <Link
              href="/"
              className="inline-block bg-gray-800 text-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700"
            >
              Go Home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
