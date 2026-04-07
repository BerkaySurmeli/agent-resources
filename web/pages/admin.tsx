import Head from 'next/head';
import { useState, useEffect } from 'react';

const API_URL = 'https://api.shopagentresources.com';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

interface WaitlistEntry {
  email: string;
  created_at: string;
  source: string;
}

interface Metrics {
  requests: number;
  bandwidth: number;
  views: number;
  visits: number;
}

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password protection - you should change this
    if (password === 'admin2026') {
      setAuthenticated(true);
      fetchData();
    } else {
      alert('Invalid password');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch waitlist
      const waitlistRes = await fetch(`${API_URL}/waitlist`);
      if (waitlistRes.ok) {
        const data = await waitlistRes.json();
        setWaitlist(data.entries || []);
      }

      // Fetch Cloudflare metrics
      const metricsRes = await fetch(`${API_URL}/admin/metrics`);
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-lg border border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-4">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white mb-4"
          />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <Head>
        <title>Admin Dashboard - Agent Resources</title>
      </Head>

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-slate-400 text-sm mb-2">Total Requests</h3>
            <p className="text-3xl font-bold">{metrics?.requests?.toLocaleString() || '-'}</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-slate-400 text-sm mb-2">Bandwidth</h3>
            <p className="text-3xl font-bold">{metrics?.bandwidth ? `${(metrics.bandwidth / 1e9).toFixed(2)} GB` : '-'}</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-slate-400 text-sm mb-2">Page Views</h3>
            <p className="text-3xl font-bold">{metrics?.views?.toLocaleString() || '-'}</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-slate-400 text-sm mb-2">Unique Visits</h3>
            <p className="text-3xl font-bold">{metrics?.visits?.toLocaleString() || '-'}</p>
          </div>
        </div>

        {/* Waitlist */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-semibold">Waitlist Signups ({waitlist.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Source</th>
                </tr>
              </thead>
              <tbody>
                {waitlist.map((entry, i) => (
                  <tr key={i} className="border-b border-slate-700">
                    <td className="p-4">{entry.email}</td>
                    <td className="p-4">{new Date(entry.created_at).toLocaleDateString()}</td>
                    <td className="p-4">{entry.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Disable static generation
export async function getServerSideProps() {
  return { props: {} };
}
