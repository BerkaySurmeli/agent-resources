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
      await router.push('/');
    } catch (err: any) {
      setError(err.message || t.login.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
      <Head>
        <title>{t.auth.signIn} | Agent Resources</title>
      </Head>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <Logo variant="icon" size="xl" />
          </Link>
          <h1 className="text-2xl font-semibold text-white">{t.login.title}</h1>
          <p className="text-gray-400 mt-2">{t.login.subtitle}</p>
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
                {t.login.email}
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
                {t.login.password}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? t.login.signingIn : t.login.signIn}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {t.login.noAccount}{' '}
              <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium">
                {t.login.signUp}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
