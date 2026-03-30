import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

export default function Settings() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const token = localStorage.getItem('ar-token');
      const res = await fetch(`${API_URL}/auth/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setSuccess('Account deleted successfully');
        logout();
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.detail || 'Failed to delete account');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Please sign in to view settings</p>
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Settings | Agent Resources</title>
      </Head>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900">Settings</h1>
            <p className="text-slate-600">Manage your account settings</p>
          </div>

          {/* Account Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Account Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-500">Name</label>
                <p className="font-medium text-slate-900">{user.name}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Email</label>
                <p className="font-medium text-slate-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Account Type</label>
                <p className="font-medium text-slate-900">
                  {user.isDeveloper ? 'Developer' : 'Buyer'}
                </p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Email Verified</label>
                <p className={`font-medium ${user.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                  {user.isVerified ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white border border-red-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
            
            {!showDeleteConfirm ? (
              <div>
                <p className="text-slate-600 mb-4">
                  Once you delete your account, there is no going back. This will permanently delete:
                </p>
                <ul className="list-disc list-inside text-slate-600 mb-6 space-y-1">
                  <li>Your profile and all personal data</li>
                  <li>All your listings and products</li>
                  <li>Your reviews and ratings</li>
                  <li>Purchase history (anonymized for records)</li>
                </ul>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            ) : (
              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">Confirm Account Deletion</h3>
                <p className="text-red-700 text-sm mb-4">
                  This action cannot be undone. Type <strong>DELETE</strong> to confirm.
                </p>
                
                {error && (
                  <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="bg-green-100 text-green-700 px-3 py-2 rounded mb-4 text-sm">
                    {success}
                  </div>
                )}
                
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="w-full px-3 py-2 border border-red-300 rounded-lg mb-4 focus:outline-none focus:border-red-500"
                />
                
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Permanently Delete Account'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                      setError('');
                    }}
                    disabled={deleting}
                    className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
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
