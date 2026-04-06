import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

export default function Account() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Please sign in to view your account</p>
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      const token = localStorage.getItem('ar-token');
      const res = await fetch(`${API_URL}/auth/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setDeleteSuccess('Account deleted successfully');
        logout();
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        const data = await res.json();
        setDeleteError(data.detail || 'Failed to delete account');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-6">
      <Head>
        <title>Account | Agent Resources</title>
      </Head>

      <main className="pt-8 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Back link */}
          <Link href="/profile" className="text-gray-400 hover:text-white flex items-center gap-2 mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Profile
          </Link>

          <h1 className="text-3xl font-semibold text-white mb-8">Account Management</h1>

          {/* Account Info Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-700/50">
                <div>
                  <label className="text-sm text-gray-500">Name</label>
                  <p className="font-medium text-white">{user.name}</p>
                </div>
                <Link href="/profile" className="text-blue-400 hover:text-blue-300 text-sm">
                  Edit
                </Link>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-700/50">
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium text-white">{user.email}</p>
                </div>
                <span className={`text-sm px-2 py-1 rounded-full ${user.isVerified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {user.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </div>

          {/* List an Item Button */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-6 text-center">
            <h2 className="text-lg font-semibold text-white mb-2">Ready to Sell?</h2>
            <p className="text-blue-100 mb-4">List your AI agent or tool on our marketplace</p>
            <Link
              href="/sell"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              List an Item
            </Link>
          </div>

          {/* Security Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Security</h2>
            <div className="space-y-3">
              <Link
                href="/settings"
                className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-white">Change Password</p>
                    <p className="text-sm text-gray-400">Update your password</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Danger Zone - Compact */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
                <p className="text-sm text-gray-400">Irreversible actions</p>
              </div>
            </div>

            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Delete Account</p>
                  <p className="text-sm text-gray-400">Permanently delete your account and all data</p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600/20 text-red-400 border border-red-600/30 px-4 py-2 rounded-lg font-medium hover:bg-red-600/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-red-400 mb-2">Confirm Account Deletion</h4>
                <p className="text-red-300/80 text-sm mb-4">
                  This will permanently delete your profile, listings, and all data. Type <strong>DELETE</strong> to confirm.
                </p>

                {deleteError && (
                  <div className="bg-red-500/20 text-red-400 px-3 py-2 rounded mb-4 text-sm">
                    {deleteError}
                  </div>
                )}

                {deleteSuccess && (
                  <div className="bg-green-500/20 text-green-400 px-3 py-2 rounded mb-4 text-sm">
                    {deleteSuccess}
                  </div>
                )}

                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="w-full px-3 py-2 bg-gray-900/50 border border-red-500/30 rounded-lg mb-4 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />

                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Permanently Delete'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                      setDeleteError('');
                    }}
                    disabled={deleting}
                    className="px-4 py-2 border border-gray-700 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
