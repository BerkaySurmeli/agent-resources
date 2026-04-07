import Head from 'next/head';
import { useState, useEffect } from 'react';

const API_URL = 'https://api.shopagentresources.com';

interface WaitlistEntry {
  email: string;
  created_at: string;
  source: string;
  developer_code: string;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '16384bEr32768!') {
      setAuthenticated(true);
      fetchData();
    } else {
      alert('Invalid password');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const waitlistRes = await fetch(`${API_URL}/waitlist/`);
      if (waitlistRes.ok) {
        const data = await waitlistRes.json();
        setWaitlist(data.entries || []);
      }

      const metricsRes = await fetch(`${API_URL}/admin/metrics/`);
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`Are you sure you want to delete ${email}?`)) return;
    
    try {
      const response = await fetch(`${API_URL}/waitlist/delete/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        setWaitlist(waitlist.filter(e => e.email !== email));
        setDeleteConfirm(null);
      } else {
        alert('Failed to delete');
      }
    } catch (error) {
      alert('Error deleting entry');
    }
  };

  // Find duplicates
  const emailCounts = waitlist.reduce((acc, entry) => {
    acc[entry.email] = (acc[entry.email] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const duplicates = Object.entries(emailCounts)
    .filter(([_, count]) => count > 1)
    .map(([email]) => email);

  const filteredWaitlist = waitlist.filter(entry => 
    entry.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button onClick={fetchData} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded">
            Refresh
          </button>
        </div>

        {/* Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-slate-400 text-sm mb-2">Total Signups</h3>
            <p className="text-3xl font-bold">{waitlist.length}</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-slate-400 text-sm mb-2">Spots Remaining</h3>
            <p className="text-3xl font-bold">{Math.max(0, 50 - waitlist.length)}</p>
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

        {/* Duplicates Warning */}
        {duplicates.length > 0 && (
          <div className="bg-amber-900/50 border border-amber-600 p-4 rounded-lg mb-6">
            <h3 className="text-amber-400 font-semibold mb-2">⚠️ Duplicate Emails Found</h3>
            <p className="text-amber-200">{duplicates.join(', ')}</p>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white"
          />
        </div>

        {/* Waitlist */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Waitlist Signups ({filteredWaitlist.length})</h2>
            {duplicates.length > 0 && (
              <span className="text-amber-400 text-sm">{duplicates.length} duplicates found</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Developer Code</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Source</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWaitlist.map((entry, i) => (
                  <tr key={i} className={`border-b border-slate-700 ${duplicates.includes(entry.email) ? 'bg-amber-900/20' : ''}`}>
                    <td className="p-4">{entry.email}</td>
                    <td className="p-4 font-mono text-sm">{entry.developer_code}</td>
                    <td className="p-4">{new Date(entry.created_at).toLocaleDateString()}</td>
                    <td className="p-4">{entry.source}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDelete(entry.email)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </td>
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

export async function getServerSideProps() {
  return { props: {} };
}
