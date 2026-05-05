import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Logo from '../components/Logo';
import { API_URL } from '../lib/api';

export default function ResetPassword() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (router.isReady) {
      const t = router.query.token as string | undefined;
      if (t) setToken(t);
    }
  }, [router.isReady, router.query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Missing reset token. Please use the link from your email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to reset password');
      }
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
      <Head>
        <title>Set New Password | Agent Resources</title>
      </Head>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <Logo variant="icon" size="xl" />
          </Link>
          <h1 className="text-2xl font-semibold text-ink-900">Set a new password</h1>
          <p className="text-ink-500 mt-2">Choose something strong and memorable</p>
        </div>

        <div className="bg-white rounded-2xl border border-cream-300 shadow-warm p-8">
          {done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-ink-700 font-medium mb-2">Password updated</p>
              <p className="text-ink-500 text-sm mb-6">You can now sign in with your new password.</p>
              <Link href="/login" className="btn-primary">
                Sign in
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                  {error}
                </div>
              )}

              {!token && !error && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg mb-6 text-sm">
                  No reset token found. Please use the link from your email or{' '}
                  <Link href="/forgot-password" className="underline">request a new one</Link>.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    New password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="••••••••"
                    autoFocus
                  />
                  <p className="text-xs text-ink-400 mt-1">At least 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="input"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="btn-primary w-full justify-center disabled:opacity-50"
                >
                  {loading ? 'Updating…' : 'Set new password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
