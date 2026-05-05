import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Logo from '../components/Logo';
import { API_URL } from '../lib/api';

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Something went wrong');
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
      <Head>
        <title>Reset Password | Agent Resources</title>
      </Head>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <Logo variant="icon" size="xl" />
          </Link>
          <h1 className="text-2xl font-semibold text-ink-900">Reset your password</h1>
          <p className="text-ink-500 mt-2">Enter your email and we'll send you a reset link</p>
        </div>

        <div className="bg-white rounded-2xl border border-cream-300 shadow-warm p-8">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-ink-700 font-medium mb-2">Check your inbox</p>
              <p className="text-ink-500 text-sm">
                If <strong>{email}</strong> is registered, you'll receive a reset link within a minute. The link expires in 1 hour.
              </p>
              <Link href="/login" className="mt-6 inline-block text-sm text-terra-600 hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    {t.login.email}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="you@example.com"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center disabled:opacity-50"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-ink-500 hover:text-ink-700">
                  ← Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
