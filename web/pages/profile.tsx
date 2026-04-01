import Head from 'next/head';
import Link from 'next/link';
import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          <p className="text-gray-400 mb-4">Please sign in to view your profile</p>
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setLoading(true);
    await updateProfile({ name, avatar });
    setIsEditing(false);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
        <title>Profile | Agent Resources</title>
      </Head>

      <main className="pt-8 pb-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-semibold text-white mb-8">Your Profile</h1>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 mb-6">
            {/* Avatar */}
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={user.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-700"
                  />
                ) : (
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {user.initials}
                  </div>
                )}
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 border-2 border-gray-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{user.name}</h2>
                <p className="text-gray-400">{user.email}</p>
                {user.isDeveloper && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                      Developer
                    </span>
                    {user.isVerified && (
                      <span className="text-sm bg-green-500/20 text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Edit Form */}
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setName(user.name);
                      setAvatar(user.avatar || '');
                    }}
                    className="px-6 py-3 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full bg-gray-800 text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700"
              >
                Edit Profile
              </button>
            )}

            {/* Actions */}
            <div className="mt-8 pt-8 border-t border-gray-700 space-y-3">
              <Link
                href="/sell"
                className="block w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
              >
                List an item
              </Link>
              <button
                onClick={logout}
                className="w-full bg-gray-800 text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Account Management Section */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Account Management</h2>
            
            {/* Account Info */}
            <div className="space-y-4 mb-8">
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

            {/* Danger Zone */}
            <div className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
              
              {!showDeleteConfirm ? (
                <div>
                  <p className="text-gray-400 mb-4">
                    Once you delete your account, there is no going back. This will permanently delete:
                  </p>
                  <ul className="list-disc list-inside text-gray-400 mb-6 space-y-1">
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
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-red-400 mb-2">Confirm Account Deletion</h4>
                  <p className="text-red-300 text-sm mb-4">
                    This action cannot be undone. Type <strong>DELETE</strong> to confirm.
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
                      {deleting ? 'Deleting...' : 'Permanently Delete Account'}
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
        </div>
      </main>
    </div>
  );
}
