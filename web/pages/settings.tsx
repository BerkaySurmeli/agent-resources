import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Please sign in to view settings</p>
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Sign in →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-6">
      <Head>
        <title>Settings | Agent Resources</title>
      </Head>

      <main className="pt-8 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white">Settings</h1>
            <p className="text-gray-400">Manage your account settings</p>
          </div>

          {/* Account Info */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Name</label>
                <p className="font-medium text-white">{user.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="font-medium text-white">{user.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email Verified</label>
                <p className={`font-medium ${user.isVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                  {user.isVerified ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Management Link */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Account Management</h2>
            <p className="text-gray-400 mb-4">
              Manage your profile, update your information, or delete your account.
            </p>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Profile
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
