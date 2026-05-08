import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from 'next/router';
import { API_URL } from '../../lib/api';

export default function AccountSection() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (!user) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (newPassword.length < 8) {
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
        headers: { 'Authorization': `Bearer ${token}` }
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
        <h2 className="heading-serif text-2xl text-ink-900 mb-2">{t.settings.accountSettings}</h2>
        <p className="text-ink-500">{t.settings.accountSubtitle}</p>
      </div>

      {/* Account Info */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-ink-900 mb-4">{t.settings.accountInfo}</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-cream-200">
            <div>
              <label className="text-sm text-ink-400">{t.auth.name}</label>
              <p className="font-medium text-ink-900">{user.name}</p>
            </div>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-cream-200">
            <div>
              <label className="text-sm text-ink-400">{t.auth.email}</label>
              <p className="font-medium text-ink-900">{user.email}</p>
            </div>
            <span className={`text-sm px-2 py-1 rounded-full ${user.isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {user.isVerified ? t.settings.verified : t.settings.unverified}
            </span>
          </div>
          <div className="flex justify-between items-center py-3">
            <div>
              <label className="text-sm text-ink-400">API access</label>
              <p className="font-medium text-ink-900">
                {user.isVerified ? 'Enabled — create API keys to let agents authenticate' : 'Verify your email to unlock API keys'}
              </p>
            </div>
            {user.isVerified && (
              <a href="/dashboard/api-keys" className="text-sm text-brand hover:text-brand/80 font-medium whitespace-nowrap">
                Manage keys →
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-ink-900 mb-4">{t.settings.changePassword}</h3>

        {passwordError && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {passwordError}
          </div>
        )}

        {passwordMessage && (
          <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {passwordMessage}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              {t.settings.currentPassword}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-white border border-cream-300 text-ink-900 placeholder-ink-400 focus:outline-none focus:border-terra-500 focus:ring-2 focus:ring-terra-500/20"
              placeholder={t.settings.currentPassword}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              {t.settings.newPassword}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-lg bg-white border border-cream-300 text-ink-900 placeholder-ink-400 focus:outline-none focus:border-terra-500 focus:ring-2 focus:ring-terra-500/20"
              placeholder={t.auth.passwordMinLength}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              {t.settings.confirmPassword}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-white border border-cream-300 text-ink-900 placeholder-ink-400 focus:outline-none focus:border-terra-500 focus:ring-2 focus:ring-terra-500/20"
              placeholder={t.settings.confirmPassword}
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="btn-primary w-full justify-center disabled:opacity-50"
          >
            {passwordLoading ? t.common.loading : t.settings.updatePassword}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-700">{t.settings.dangerZone}</h3>
            <p className="text-sm text-ink-500">{t.settings.deleteConfirm}</p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-ink-900">{t.settings.deleteAccount}</p>
              <p className="text-sm text-ink-500">{t.settings.deleteConfirm}</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors"
            >
              {t.settings.delete}
            </button>
          </div>
        ) : (
          <div className="bg-red-100 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-700 mb-2">{t.settings.deleteAccount}</h4>
            <p className="text-red-600 text-sm mb-4">
              This will permanently delete your profile, listings, and all data. Type <strong>DELETE</strong> to confirm.
            </p>

            {deleteError && (
              <div className="bg-red-200 text-red-800 px-3 py-2 rounded mb-4 text-sm">
                {deleteError}
              </div>
            )}

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-3 py-2 bg-white border border-red-300 rounded-lg mb-4 text-ink-900 placeholder-ink-400 focus:outline-none focus:border-red-500"
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
                className="btn-secondary px-4"
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
