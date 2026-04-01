import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Signup() {
  const router = useRouter();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t.signup.passwordsMismatch);
      return;
    }

    if (password.length < 8) {
      setError(t.signup.passwordTooShort);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signup(email, password, name);
      // Show verification message instead of redirecting immediately
      setShowVerificationMessage(true);
    } catch (err: any) {
      const msg = err.message || t.signup.serverError;
      // Clean up common error messages
      if (msg.includes('Email already registered')) {
        setError(t.signup.emailRegistered);
      } else if (msg.includes('timed out')) {
        setError('Request timed out. The server may be busy. Please try again.');
      } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (msg.includes('Server error')) {
        setError(t.signup.serverError);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (showVerificationMessage) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
        <Head>
          <title>{t.signup.verifyTitle} | Agent Resources</title>
        </Head>

        <div className="w-full max-w-md">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-white mb-4">{t.signup.verifyTitle}</h1>
            <p className="text-gray-400 mb-6">
              {t.signup.verifyMessage.replace('{email}', email)}
            </p>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-yellow-400">
                <strong>{t.common.important || 'Important:'}</strong> {t.signup.verifyImportant}
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                {t.signup.goToLogin}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-800 text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors border border-gray-700"
              >
                {t.signup.verifiedRefresh}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6 py-12">
      <Head>
        <title>{t.auth.signUp} | Agent Resources</title>
      </Head>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">AR</span>
            </div>
          </Link>
          <h1 className="text-2xl font-semibold text-white">{t.signup.title}</h1>
          <p className="text-gray-400 mt-2">{t.signup.subtitle}</p>
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t.signup.fullName}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t.signup.email}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t.signup.password}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">{t.signup.passwordMinLength}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t.signup.confirmPassword}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t.signup.creatingAccount}
                </span>
              ) : (
                t.signup.createAccount
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {t.signup.hasAccount}{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                {t.signup.signIn}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
