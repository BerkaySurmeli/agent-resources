import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from 'next/router';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agent-resources-api-dev-production.up.railway.app';

export default function AccountSection() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (!user) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (newPassword.length < 6) {
      setPasswordError(t.auth.passwordMinLength);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t.signup.passwordsMismatch);
      return;
    }

    setPasswordLoading(true);

    try {
      const token = localStorage.getItem('ar-token');
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage(t.settings.updatePassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.detail || t.common.error);
      }
    } catch (err: any) {
      setPasswordError(err.message || t.common.error);
    } finally {
      setPasswordLoading(false);
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
        logout();
        router.push('/');
      } else {
        const data = await res.json();
        setDeleteError(data.detail || t.common.error);
      }
    } catch (err: any) {
      setDeleteError(err.message || t.common.error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">{t.settings.accountSettings}</h2>
        <p className="text-gray-400">{t.settings.accountSubtitle}</p>
      </div>

      {/* Account Info */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t.settings.accountInfo}</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-700/50">
            <div>
              <label className="text-sm text-gray-500">{t.auth.name}</label>
              <p className="font-medium text-white">{user.name}</p>
            </div>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-700/50">
            <div>
              <label className="text-sm text-gray-500">{t.auth.email}</label>
              <p className="font-medium text-white">{user.email}</p>
            </div>
            <span className={`text-sm px-2 py-1 rounded-full ${user.isVerified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {user.isVerified ? t.settings.verified : t.settings.unverified}
            </span>
          </div>
          <div className="flex justify-between items-center py-3">
            <div>
              <label className="text-sm text-gray-500">{t.dashboard.becomeDeveloper}</label>
              <p className="font-medium text-white">{user.isDeveloper ? t.settings.developer : t.settings.becomeDeveloper}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t.settings.changePassword}</h3>
        
        {passwordError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4">
            {passwordError}
          </div>
        )}

        {passwordMessage && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg mb-4">
            {passwordMessage}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t.settings.currentPassword}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder={t.settings.currentPassword}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t.settings.newPassword}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder={t.auth.passwordMinLength}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t.settings.confirmPassword}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder={t.settings.confirmPassword}
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {passwordLoading ? t.common.loading : t.settings.updatePassword}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-400">{t.settings.dangerZone}</h3>
            <p className="text-sm text-gray-400">{t.settings.deleteConfirm}</p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">{t.settings.deleteAccount}</p>
              <p className="text-sm text-gray-400">{t.settings.deleteConfirm}</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600/20 text-red-400 border border-red-600/30 px-4 py-2 rounded-lg font-medium hover:bg-red-600/30 transition-colors"
            >
              {t.settings.delete}
            </button>
          </div>
        ) : (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-red-400 mb-2">{t.settings.deleteAccount}</h4>
            <p className="text-red-300/80 text-sm mb-4">
              This will permanently delete your profile, listings, and all data. Type <strong>DELETE</strong> to confirm.
            </p>

            {deleteError && (
              <div className="bg-red-500/20 text-red-400 px-3 py-2 rounded mb-4 text-sm">
                {deleteError}
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
                {deleting ? t.common.loading : t.settings.deleteAccount}
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
                {t.settings.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
