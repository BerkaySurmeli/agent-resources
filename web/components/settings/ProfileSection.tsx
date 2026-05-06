import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { API_URL } from '../../lib/api';

export default function ProfileSection() {
  const { user, updateProfile, refreshUser } = useAuth();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [github, setGithub] = useState('');
  const [profileSlug, setProfileSlug] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setWebsite(user.website || '');
      setTwitter(user.twitter || '');
      setGithub(user.github || '');
      setProfileSlug(user.profileSlug || '');
    }
  }, [user]);

  if (!user) return null;

  const handleSlugChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, '');
    setProfileSlug(clean);
    setSlugAvailable(null);
    if (slugTimer.current) clearTimeout(slugTimer.current);
    if (clean && clean !== user.profileSlug) {
      setSlugChecking(true);
      slugTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(`${API_URL}/developers/${clean}`);
          setSlugAvailable(res.status === 404);
        } catch {
          setSlugAvailable(null);
        } finally {
          setSlugChecking(false);
        }
      }, 500);
    } else {
      setSlugChecking(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await updateProfile({ name, bio, website, twitter, github, profileSlug });
      setMessage({ text: 'Profile saved successfully.', ok: true });
      setIsEditing(false);
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to save profile.', ok: false });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName(user.name || '');
    setBio(user.bio || '');
    setWebsite(user.website || '');
    setTwitter(user.twitter || '');
    setGithub(user.github || '');
    setProfileSlug(user.profileSlug || '');
    setMessage(null);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('ar-token');
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_URL}/auth/profile/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }
      await refreshUser();
      setMessage({ text: 'Avatar updated.', ok: true });
    } catch (err: any) {
      setMessage({ text: err.message || 'Avatar upload failed.', ok: false });
    } finally {
      setAvatarLoading(false);
      e.target.value = '';
    }
  };

  const avatarSrc = user.avatarUrl
    ? user.avatarUrl.startsWith('/avatars/')
      ? `${API_URL}${user.avatarUrl}`
      : user.avatarUrl
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading-serif text-2xl text-ink-900 mb-1">Profile</h2>
        <p className="text-ink-500 text-sm">Your public developer identity.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm ${message.ok ? 'bg-green-100 border border-green-200 text-green-700' : 'bg-red-100 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="card p-6 space-y-6">

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {avatarLoading ? (
              <div className="w-20 h-20 rounded-full bg-cream-200 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-terra-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : avatarSrc ? (
              <img src={avatarSrc} alt={user.name} className="w-20 h-20 rounded-full object-cover border-2 border-cream-200" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                style={{ background: 'linear-gradient(135deg, #3549D4, #6470FA)' }}>
                {user.initials}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white hover:opacity-90 border-2 border-cream-100 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #3549D4, #6470FA)' }}
              title="Change avatar"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
          <div>
            <p className="font-semibold text-ink-900">{user.name}</p>
            <p className="text-ink-500 text-sm">{user.email}</p>
            {user.profileSlug && (
              <Link href={`/developers/${user.profileSlug}`} className="text-terra-600 text-sm hover:underline mt-1 block">
                shopagentresources.com/developers/{user.profileSlug}
              </Link>
            )}
          </div>
        </div>

        {/* Fields */}
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Display Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={100}
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-cream-300 text-ink-900 placeholder-ink-400 focus:outline-none focus:border-terra-500 focus:ring-2 focus:ring-terra-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Bio <span className="text-ink-400 font-normal">(max 500 chars)</span></label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-cream-300 text-ink-900 placeholder-ink-400 focus:outline-none focus:border-terra-500 focus:ring-2 focus:ring-terra-500/20 resize-none"
                placeholder="Tell buyers about yourself..."
              />
              <p className="text-ink-400 text-xs mt-1 text-right">{bio.length}/500</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Profile URL</label>
              <div className="flex items-center gap-2">
                <span className="text-ink-400 text-sm whitespace-nowrap">/developers/</span>
                <div className="relative flex-1">
                  <input
                    value={profileSlug}
                    onChange={e => handleSlugChange(e.target.value)}
                    maxLength={60}
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-cream-300 text-ink-900 placeholder-ink-400 focus:outline-none focus:border-terra-500 focus:ring-2 focus:ring-terra-500/20"
                    placeholder="your-slug"
                  />
                  {slugChecking && <span className="absolute right-3 top-3 text-ink-400 text-xs">checking…</span>}
                  {!slugChecking && slugAvailable === true && profileSlug !== user.profileSlug && (
                    <span className="absolute right-3 top-3 text-green-600 text-xs">Available</span>
                  )}
                  {!slugChecking && slugAvailable === false && (
                    <span className="absolute right-3 top-3 text-red-600 text-xs">Taken</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Website</label>
                <input
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  type="url"
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-lg bg-white border border-cream-300 text-ink-900 placeholder-ink-400 focus:outline-none focus:border-terra-500 focus:ring-2 focus:ring-terra-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">GitHub</label>
                <input
                  value={github}
                  onChange={e => setGithub(e.target.value)}
                  placeholder="username"
                  className="w-full px-4 py-2.5 rounded-lg bg-white border border-cream-300 text-ink-900 placeholder-ink-400 focus:outline-none focus:border-terra-500 focus:ring-2 focus:ring-terra-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">X / Twitter</label>
                <input
                  value={twitter}
                  onChange={e => setTwitter(e.target.value)}
                  placeholder="handle"
                  className="w-full px-4 py-2.5 rounded-lg bg-white border border-cream-300 text-ink-900 placeholder-ink-400 focus:outline-none focus:border-terra-500 focus:ring-2 focus:ring-terra-500/20"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={loading || slugAvailable === false}
                className="flex-1 btn-primary justify-center disabled:opacity-50"
              >
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                className="btn-secondary px-5"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {user.bio && <p className="text-ink-600 text-sm leading-relaxed">{user.bio}</p>}
            <div className="flex flex-wrap gap-4 text-sm">
              {user.website && (
                <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-terra-600 hover:underline">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  Website
                </a>
              )}
              {user.github && (
                <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-ink-600 hover:text-ink-900">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                  {user.github}
                </a>
              )}
              {user.twitter && (
                <a href={`https://x.com/${user.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-ink-600 hover:text-ink-900">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  @{user.twitter}
                </a>
              )}
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary w-full mt-2 justify-center"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
