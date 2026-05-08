import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { API_URL } from '../../lib/api';

interface NotificationPrefs {
  email_marketing: boolean;
  email_purchases: boolean;
  email_reviews: boolean;
  email_listings: boolean;
  email_security: boolean;
}

export default function NotificationsSection() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    email_marketing: true,
    email_purchases: true,
    email_reviews: true,
    email_listings: true,
    email_security: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ar-token');
      if (!token) return;

      const response = await fetch(`${API_URL}/auth/notification-preferences`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPrefs(data);
      }
    } catch {
      // prefs stay at defaults
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationPrefs) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);

    setSaving(true);
    setMessage('');

    try {
      const token = localStorage.getItem('ar-token');
      const response = await fetch(`${API_URL}/auth/notification-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPrefs)
      });

      if (response.ok) {
        setMessage(t.common.save);
        setTimeout(() => setMessage(''), 2000);
      } else {
        setMessage(t.common.error);
        setPrefs(prefs);
      }
    } catch (err) {
      setMessage(t.common.error);
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const notificationOptions = [
    {
      key: 'email_purchases' as const,
      title: t.settings.purchaseNotifications,
      description: t.settings.purchaseNotificationsDesc,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      key: 'email_reviews' as const,
      title: t.settings.reviewNotifications,
      description: t.settings.reviewNotificationsDesc,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    },
    {
      key: 'email_listings' as const,
      title: t.settings.listingNotifications,
      description: t.settings.listingNotificationsDesc,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      key: 'email_security' as const,
      title: t.settings.securityAlerts,
      description: t.settings.securityAlertsDesc,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      key: 'email_marketing' as const,
      title: t.settings.marketingEmails,
      description: t.settings.marketingEmailsDesc,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading-serif text-2xl text-ink-900 mb-2">{t.settings.notificationPrefs}</h2>
        <p className="text-ink-500">{t.settings.notificationsSubtitle}</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm ${message === t.common.save ? 'bg-green-100 border border-green-200 text-green-700' : 'bg-red-100 border border-red-200 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="card overflow-hidden">
        {notificationOptions.map((option, index) => (
          <div
            key={option.key}
            className={`flex items-center justify-between p-6 ${index !== notificationOptions.length - 1 ? 'border-b border-cream-200' : ''}`}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cream-200 rounded-lg flex items-center justify-center text-ink-500">
                {option.icon}
              </div>
              <div>
                <h3 className="font-medium text-ink-900">{option.title}</h3>
                <p className="text-sm text-ink-500">{option.description}</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle(option.key)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-terra-500 focus:ring-offset-2 focus:ring-offset-white ${
                prefs[option.key] ? 'bg-terra-500' : 'bg-cream-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                  prefs[option.key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-terra-50 border border-terra-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-terra-100 rounded-lg flex items-center justify-center text-terra-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-ink-900 mb-1">{t.settings.emailNotifications}</h3>
            <p className="text-sm text-ink-500">
              {t.settings.emailNotificationsDesc} <strong className="text-ink-900">{user.email}</strong>.
              {t.settings.important}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
