import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { API_URL } from '../lib/api';

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

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
          } catch {
            // non-critical; auth context re-fetches on next load
          }
        }
      } else {
        setStatus('error');
        const detail = data.detail || 'Verification failed';
        setMessage(detail);
        if (detail === 'Verification link expired') {
          setIsExpired(true);
        }
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  const handleResend = async () => {
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('ar-token') : null;
    if (!authToken) {
      setResendStatus('failed');
      return;
    }
    setResendStatus('sending');
    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setResendStatus(res.ok ? 'sent' : 'failed');
    } catch {
      setResendStatus('failed');
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
      <Head>
        <title>Verify Email | Agent Resources</title>
      </Head>

      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terra-500 mx-auto mb-4"></div>
            <h1 className="text-2xl font-semibold text-ink-900 mb-2">Verifying your email...</h1>
            <p className="text-ink-500">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-ink-900 mb-2">Email Verified!</h1>
            <p className="text-ink-500 mb-6">{message}</p>
            <Link href="/login" className="btn-primary inline-flex justify-center">
              Sign In
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
            <h1 className="text-2xl font-semibold text-ink-900 mb-2">Verification Failed</h1>
            <p className="text-ink-500 mb-6">{message}</p>
            {isExpired && (
              <div className="mb-4">
                {resendStatus === 'sent' ? (
                  <p className="text-green-700 text-sm">A new verification email has been sent. Please check your inbox.</p>
                ) : resendStatus === 'failed' ? (
                  <p className="text-red-600 text-sm">Could not resend. Please <Link href="/login" className="underline">log in</Link> and request a new link from your account settings.</p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={resendStatus === 'sending'}
                    className="btn-primary inline-flex justify-center disabled:opacity-50 mb-3"
                  >
                    {resendStatus === 'sending' ? 'Sending...' : 'Resend verification email'}
                  </button>
                )}
              </div>
            )}
            <Link href="/" className="btn-secondary inline-flex justify-center">
              Go Home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
