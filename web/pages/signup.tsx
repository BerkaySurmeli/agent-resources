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

    try {
      await signup(email, password, name);
      // Show verification message instead of redirecting immediately
      setShowVerificationMessage(true);
    } catch (err: any) {
      const msg = err.message || t.signup.serverError;
      // Clean up common error messages
      if (msg.includes('Email already registered')) {
        setError(t.signup.emailRegistered);
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <Head>
          <title>{t.signup.verifyTitle} | Agent Resources</title>
        </Head>

        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-4">{t.signup.verifyTitle}</h1>
            <p className="text-slate-600 mb-6">
              {t.signup.verifyMessage.replace('{email}', email)}
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-yellow-800">
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
                className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200 transition-colors"
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
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
          <h1 className="text-2xl font-semibold text-slate-900">{t.signup.title}</h1>
          <p className="text-slate-600 mt-2">{t.signup.subtitle}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.signup.fullName}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.signup.email}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.signup.password}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="••••••••"
              />
              <p className="text-xs text-slate-500 mt-1">{t.signup.passwordMinLength}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.signup.confirmPassword}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? t.signup.creatingAccount : t.signup.createAccount}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              {t.signup.hasAccount}{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                {t.signup.signIn}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
