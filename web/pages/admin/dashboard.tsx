import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

// Admin email - only this user can access the dashboard
const ADMIN_EMAIL = 'berkay@shopagentresources.com';

// Mock data for now - will connect to API later
const mockData = {
  stats: {
    totalUsers: 45,
    totalDevelopers: 12,
    totalListings: 28,
    totalSales: 156,
    totalRevenue: 7842.50,
    platformProfit: 1176.38,
  },
  recentUsers: [
    { id: '1', email: 'user1@example.com', name: 'John Doe', isDeveloper: true, createdAt: '2026-04-01' },
    { id: '2', email: 'user2@example.com', name: 'Jane Smith', isDeveloper: false, createdAt: '2026-04-02' },
    { id: '3', email: 'user3@example.com', name: 'Bob Wilson', isDeveloper: true, createdAt: '2026-04-03' },
  ],
  listings: [
    { id: '1', name: 'AI Project Manager', developer: 'Claudia', price: 49, sales: 23, revenue: 1127, profit: 169.05, reviews: 8, rating: 4.8, status: 'active' },
    { id: '2', name: 'AI Developer', developer: 'Chen', price: 59, sales: 19, revenue: 1121, profit: 168.15, reviews: 6, rating: 4.9, status: 'active' },
    { id: '3', name: 'AI UX Designer', developer: 'Adrian', price: 49, sales: 31, revenue: 1519, profit: 227.85, reviews: 12, rating: 4.7, status: 'active' },
    { id: '4', name: 'Dream Team Bundle', developer: 'Agent Resources', price: 99, sales: 45, revenue: 4455, profit: 668.25, reviews: 15, rating: 4.9, status: 'active' },
  ],
  developers: [
    { id: '1', name: 'Claudia', email: 'claudia@shopagentresources.com', listings: 1, totalSales: 23, revenue: 1127 },
    { id: '2', name: 'Chen', email: 'chen@shopagentresources.com', listings: 1, totalSales: 19, revenue: 1121 },
    { id: '3', name: 'Adrian', email: 'adrian@shopagentresources.com', listings: 1, totalSales: 31, revenue: 1519 },
  ],
  recentSales: [
    { id: '1', item: 'AI Project Manager', buyer: 'user1@example.com', amount: 49, date: '2026-04-03', commission: 7.35 },
    { id: '2', item: 'Dream Team Bundle', buyer: 'user2@example.com', amount: 99, date: '2026-04-03', commission: 14.85 },
    { id: '3', item: 'AI Developer', buyer: 'user3@example.com', amount: 59, date: '2026-04-02', commission: 8.85 },
  ],
};

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({
    stats: { totalUsers: 0, totalDevelopers: 0, totalListings: 0, totalSales: 0, totalRevenue: 0, platformProfit: 0 },
    recentUsers: [],
    listings: [],
    developers: [],
    recentSales: [],
  });
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check auth and fetch data
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (user.email !== ADMIN_EMAIL) {
        router.push('/');
        return;
      }
      setIsAuthorized(true);
      
      // Fetch real data
      const fetchData = async () => {
        setLoading(true);
        try {
          // Fetch dashboard stats
          const statsRes = await fetch(`${API_URL}/admin/dashboard`);
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setData(prev => ({ ...prev, stats: statsData.stats }));
          }
          
          // Fetch users
          const usersRes = await fetch(`${API_URL}/admin/users`);
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            setData(prev => ({ ...prev, recentUsers: usersData.slice(0, 10) }));
          }
          
          // Fetch listings
          const listingsRes = await fetch(`${API_URL}/admin/listings`);
          if (listingsRes.ok) {
            const listingsData = await listingsRes.json();
            setData(prev => ({ ...prev, listings: listingsData }));
          }
          
          // Fetch developers
          const devsRes = await fetch(`${API_URL}/admin/developers`);
          if (devsRes.ok) {
            const devsData = await devsRes.json();
            setData(prev => ({ ...prev, developers: devsData }));
          }
          
          // Fetch sales
          const salesRes = await fetch(`${API_URL}/admin/sales/recent?limit=20`);
          if (salesRes.ok) {
            const salesData = await salesRes.json();
            setData(prev => ({ ...prev, recentSales: salesData }));
          }
        } catch (err) {
          console.error('Failed to fetch dashboard data:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth
  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Head>
        <title>Admin Dashboard | Agent Resources</title>
      </Head>

      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">AR</span>
                </div>
                <span className="font-semibold text-slate-900">Admin Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-slate-600 hover:text-slate-900">Back to Site</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 rounded-xl bg-slate-200 p-1 mb-8">
          {['overview', 'users', 'developers', 'listings', 'sales'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${
                activeTab === tab ? 'bg-white text-blue-600 shadow' : 'text-slate-600 hover:bg-white/[0.5] hover:text-slate-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard title="Total Users" value={data.stats.totalUsers} icon="users" color="blue" />
              <StatCard title="Developers" value={data.stats.totalDevelopers} icon="code" color="green" />
              <StatCard title="Active Listings" value={data.stats.totalListings} icon="listings" color="purple" />
              <StatCard title="Total Sales" value={data.stats.totalSales} icon="sales" color="yellow" />
              <StatCard title="Total Revenue" value={formatCurrency(data.stats.totalRevenue)} icon="revenue" color="emerald" />
              <StatCard title="Platform Profit (15%)" value={formatCurrency(data.stats.platformProfit)} icon="profit" color="emerald" isProfit />
            </div>

            {/* Recent Sales */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Recent Sales</h3>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Buyer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.recentSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-6 py-4 text-slate-900">{sale.item}</td>
                      <td className="px-6 py-4 text-slate-600">{sale.buyer}</td>
                      <td className="px-6 py-4 text-slate-900">{formatCurrency(sale.amount)}</td>
                      <td className="px-6 py-4 text-emerald-600">{formatCurrency(sale.commission)}</td>
                      <td className="px-6 py-4 text-slate-600">{sale.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <DataTable 
            title="All Users" 
            count={data.stats.totalUsers}
            headers={['Name', 'Email', 'Type', 'Joined']}
            rows={data.recentUsers.map(u => [u.name, u.email, u.isDeveloper ? 'Developer' : 'Buyer', u.createdAt])}
          />
        )}

        {/* Listings Tab */}
        {activeTab === 'listings' && (
          <DataTable 
            title="All Listings" 
            count={data.stats.totalListings}
            headers={['Name', 'Developer', 'Price', 'Sales', 'Revenue', 'Profit', 'Reviews', 'Rating']}
            rows={data.listings.map(l => [
              l.name, l.developer, formatCurrency(l.price), l.sales, 
              formatCurrency(l.revenue), formatCurrency(l.profit), 
              l.reviews, `${l.rating} ★`
            ])}
          />
        )}

        {/* Developers Tab */}
        {activeTab === 'developers' && (
          <DataTable 
            title="Developers" 
            count={data.stats.totalDevelopers}
            headers={['Name', 'Email', 'Listings', 'Total Sales', 'Revenue']}
            rows={data.developers.map(d => [d.name, d.email, d.listings, d.totalSales, formatCurrency(d.revenue)])}
          />
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <DataTable 
            title="All Sales" 
            count={data.stats.totalSales}
            headers={['Item', 'Buyer', 'Amount', 'Commission', 'Date']}
            rows={data.recentSales.map(s => [
              s.item, s.buyer, formatCurrency(s.amount), formatCurrency(s.commission), s.date
            ])}
          />
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color, isProfit = false }: { 
  title: string; 
  value: string | number; 
  icon: string; 
  color: string;
  isProfit?: boolean;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className={`text-3xl font-bold ${isProfit ? 'text-emerald-600' : 'text-slate-900'}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <span className="text-xl">{icon === 'users' ? '👥' : icon === 'code' ? '💻' : icon === 'listings' ? '📋' : icon === 'sales' ? '🛒' : icon === 'revenue' ? '💰' : '📈'}</span>
        </div>
      </div>
    </div>
  );
}

// Data Table Component
function DataTable({ title, count, headers, rows }: { 
  title: string; 
  count: number; 
  headers: string[]; 
  rows: (string | number)[][];
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <span className="text-sm text-slate-500">{count} total</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className={`px-6 py-4 ${j === 0 ? 'text-slate-900' : 'text-slate-600'}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
