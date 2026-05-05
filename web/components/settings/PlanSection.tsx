import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://shopagentresources.com';

function token() {
  return typeof window !== 'undefined' ? localStorage.getItem('ar-token') : null;
}

interface PlanStatus {
  is_pro: boolean;
  subscription_status: string | null;
  current_period_end: string | null;
  commission_free: boolean;
  commission_free_until: string | null;
  commission_rate: number;
}

export default function PlanSection() {
  const { user, refreshUser } = useAuth();
  const [plan, setPlan] = useState<PlanStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [managing, setManaging] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchPlan(); }, []);

  const fetchPlan = async () => {
    try {
      const res = await fetch(`${API_URL}/payments/pro/status`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) setPlan(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/payments/pro/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          success_url: `${WEB_URL}/settings?tab=plan&upgraded=1`,
          cancel_url: `${WEB_URL}/settings?tab=plan`,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to start checkout');
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (e: any) {
      setError(e.message);
      setUpgrading(false);
    }
  };

  const handleManage = async () => {
    setManaging(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/payments/pro/portal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to open portal');
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (e: any) {
      setError(e.message);
      setManaging(false);
    }
  };

  if (!user) return null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-1">Plan</h2>
        <p className="text-gray-400 text-sm">Manage your subscription and commission rate.</p>
      </div>

      {error && (
        <div className="p-4 rounded-lg text-sm bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">

          {/* Current status card */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {plan?.is_pro ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Pro
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-gray-300 px-3 py-1 rounded-full bg-gray-700/50 border border-gray-600">
                      Free
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-white mt-2">
                  {plan?.commission_rate === 0 ? '0%' : `${plan?.commission_rate}%`}
                  <span className="text-sm font-normal text-gray-400 ml-2">commission per sale</span>
                </p>
                {plan?.is_pro && plan.current_period_end && (
                  <p className="text-xs text-gray-500 mt-1">Renews {formatDate(plan.current_period_end)}</p>
                )}
                {plan?.commission_free && plan.commission_free_until && !plan.is_pro && (
                  <p className="text-xs text-emerald-400 mt-1">
                    Launch bonus: 0% commission until {formatDate(plan.commission_free_until)}
                  </p>
                )}
              </div>

              <div>
                {plan?.is_pro ? (
                  <button
                    onClick={handleManage}
                    disabled={managing}
                    className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 text-sm font-medium hover:bg-gray-700/50 transition-colors disabled:opacity-50"
                  >
                    {managing ? 'Loading…' : 'Manage Subscription'}
                  </button>
                ) : (
                  <button
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
                  >
                    {upgrading ? 'Loading…' : 'Upgrade to Pro — $19/mo'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Plan comparison */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className={`rounded-2xl border p-5 ${!plan?.is_pro ? 'border-gray-600 bg-gray-800/50' : 'border-gray-700/30 bg-gray-800/20'}`}>
              <p className="font-semibold text-white mb-1">Free</p>
              <p className="text-3xl font-bold text-white mb-4">$0<span className="text-sm font-normal text-gray-400">/mo</span></p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited listings
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  10% platform commission
                </li>
              </ul>
            </div>

            <div className={`rounded-2xl border p-5 relative overflow-hidden ${plan?.is_pro ? 'border-blue-500/50 bg-blue-600/10' : 'border-gray-600 bg-gray-800/50'}`}>
              {plan?.is_pro && (
                <span className="absolute top-3 right-3 text-xs font-medium text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full">Current plan</span>
              )}
              <p className="font-semibold text-white mb-1">Pro</p>
              <p className="text-3xl font-bold text-white mb-4">$19<span className="text-sm font-normal text-gray-400">/mo</span></p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited listings
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <strong className="text-white">0% commission</strong> — keep every dollar
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Priority listing review
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Pro badge on your profile
                </li>
              </ul>
            </div>
          </div>

          {/* Launch incentive notice for eligible users */}
          {plan?.commission_free && !plan.is_pro && plan.commission_free_until && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-emerald-400">Launch bonus active</p>
                  <p className="text-xs text-emerald-400/70 mt-0.5">
                    You joined during our launch window. You'll keep 100% of every sale until {formatDate(plan.commission_free_until)}. After that, the 10% fee applies unless you're on Pro.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
