import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Logo from '../components/Logo';

// Force dynamic rendering to ensure client-side JavaScript runs
export const dynamic = 'force-dynamic';

export default function Login() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setError('');
    setLoading(true);

    try {
      await login(email, password);
      const redirect = typeof router.query.redirect === 'string' ? router.query.redirect : '/';
      await router.push(redirect);
    } catch (err: any) {
      setError(err.message || t.login.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
      <Head>
        <title>{t.auth.signIn} | Agent Resources</title>
      </Head>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <Logo variant="icon" size="xl" />
          </Link>
          <h1 className="text-2xl font-semibold text-ink-900">{t.login.title}</h1>
          <p className="text-ink-500 mt-2">{t.login.subtitle}</p>
        </div>

        <div className="bg-white rounded-2xl border border-cream-300 shadow-warm p-8">
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
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                {t.login.password}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-50"
            >
              {loading ? t.login.signingIn : t.login.signIn}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-ink-500">
              {t.login.noAccount}{' '}
              <Link href="/signup" className="text-terra-600 hover:text-terra-700 font-medium">
                {t.login.signUp}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
