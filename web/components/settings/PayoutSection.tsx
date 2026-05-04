import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

export default function PayoutSection() {
  const { user } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('ar-token');
      if (!token) return;

      const response = await fetch(`${API_URL}/payments/connect/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch {
      // status remains null; UI handles the missing state
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError('');

    try {
      const token = localStorage.getItem('ar-token');
      if (!token) {
        setError('Please sign in first');
        return;
      }

      const response = await fetch(`${API_URL}/payments/connect/onboard`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to start onboarding');
      }

      // Redirect to Stripe onboarding
      if (data.onboarding_url) {
        window.location.href = data.onboarding_url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect Stripe account');
    } finally {
      setConnecting(false);
    }
  };

  const handleRefresh = async () => {
    setConnecting(true);
    setError('');

    try {
      const token = localStorage.getItem('ar-token');
      if (!token) return;

      const response = await fetch(`${API_URL}/payments/connect/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to refresh onboarding');
      }

      if (data.onboarding_url) {
        window.location.href = data.onboarding_url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to refresh onboarding');
    } finally {
      setConnecting(false);
    }
  };

  if (!user?.isDeveloper) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-white mb-4">Payout Settings</h2>
        <p className="text-gray-400">
          You need to become a developer to receive payouts. Visit your dashboard to get started.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stripe Connect Status */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-white mb-6">Payout Settings</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {!status?.connected ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Connect Your Bank Account</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              To receive payouts from your sales, you need to connect a Stripe account. 
              This is where your earnings will be deposited.
            </p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {connecting ? 'Connecting...' : 'Connect Stripe Account'}
            </button>
          </div>
        ) : status.status === 'active' ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Account Connected</h3>
            <p className="text-gray-400 mb-4">
              Your Stripe account is connected and ready to receive payouts.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span className="text-green-400">Active</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Complete Setup</h3>
            <p className="text-gray-400 mb-6">
              Please complete your Stripe account setup to start receiving payouts.
            </p>
            <button
              onClick={handleRefresh}
              disabled={connecting}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {connecting ? 'Loading...' : 'Complete Setup'}
            </button>
          </div>
        )}
      </div>

      {/* Payout Schedule Info */}
      {status?.connected && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
          <h3 className="text-lg font-semibold text-white mb-4">Payout Schedule</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Weekly Payouts</p>
                <p className="text-gray-400 text-sm">Every Monday</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Platform Fee</p>
                <p className="text-gray-400 text-sm">10% per sale</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
