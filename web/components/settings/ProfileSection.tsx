import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agent-resources-api-dev-production.up.railway.app';

export default function ProfileSection() {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // For now, just update the local profile
      // In production, this would call a PUT /auth/profile endpoint
      await updateProfile({ name, avatar });
      setMessage(t.common.save);
      setIsEditing(false);
    } catch (err) {
      setMessage(t.common.error);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">{t.settings.profileSettings}</h2>
        <p className="text-gray-400">{t.settings.profileSubtitle}</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message === t.common.save ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {message}
        </div>
      )}

      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
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
            <h3 className="text-xl font-semibold text-white">{user.name}</h3>
            <p className="text-gray-400">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              {user.isDeveloper && (
                <span className="text-sm bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                  {t.settings.developer}
                </span>
              )}
              {user.isVerified ? (
                <span className="text-sm bg-green-500/20 text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {t.settings.verified}
                </span>
              ) : (
                <span className="text-sm bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                  {t.settings.unverified}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t.settings.displayName}
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
                {loading ? t.common.loading : t.settings.saveChanges}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setName(user.name);
                  setAvatar(user.avatar || '');
                }}
                className="px-6 py-3 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
              >
                {t.settings.cancel}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full bg-gray-800 text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700"
          >
            {t.settings.editProfile}
          </button>
        )}
      </div>
    </div>
  );
}
