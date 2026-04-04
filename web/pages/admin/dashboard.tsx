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
    platformProfit: 1176.38, // 15% commission
  },
  recentUsers: [
    { id: '1', email: 'user1@example.com', name: 'John Doe', isDeveloper: true, createdAt: '2026-04-01' },
    { id: '2', email: 'user2@example.com', name: 'Jane Smith', isDeveloper: false, createdAt: '2026-04-02' },
    { id: '3', email: 'user3@example.com', name: 'Bob Wilson', isDeveloper: true, createdAt: '2026-04-03' },
  ],
  listings: [
    { 
      id: '1', 
      name: 'AI Project Manager', 
      developer: 'Claudia', 
      price: 49, 
      sales: 23, 
      revenue: 1127, 
      profit: 169.05,
      reviews: 8,
      rating: 4.8,
      status: 'active'
    },
    { 
      id: '2', 
      name: 'AI Developer', 
      developer: 'Chen', 
      price: 59, 
      sales: 19, 
      revenue: 1121, 
      profit: 168.15,
      reviews: 6,
      rating: 4.9,
      status: 'active'
    },
    { 
      id: '3', 
      name: 'AI UX Designer', 
      developer: 'Adrian', 
      price: 49, 
      sales: 31, 
      revenue: 1519, 
      profit: 227.85,
      reviews: 12,
      rating: 4.7,
      status: 'active'
    },
    { 
      id: '4', 
      name: 'Dream Team Bundle', 
      developer: 'Agent Resources', 
      price: 99, 
      sales: 45, 
      revenue: 4455, 
      profit: 668.25,
      reviews: 15,
      rating: 4.9,
      status: 'active'
    },
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
  const [data, setData] = useState(mockData);
  const [loading, setLoading] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.email !== ADMIN_EMAIL) {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth
  if (isLoading || !user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/admin/dashboard`);
        if (response.ok) {
          const dashboardData = await response.json();
          // Merge with mock data structure for now
          setData(prev => ({
            ...prev,
            stats: dashboardData.stats || prev.stats,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Head>
        <title>Admin Dashboard | Agent Resources</title>
      </Head>

      {/* Navigation */}
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
              <Link href="/" className="text-slate-600 hover:text-slate-900">
                Back to Site
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 rounded-xl bg-slate-200 p-1 mb-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'users', label: 'Users' },
            { id: 'developers', label: 'Developers' },
            { id: 'listings', label: 'Listings' },
            { id: 'sales', label: 'Sales' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors
                ${activeTab === tab.id 
                  ? 'bg-white text-blue-600 shadow' 
                  : 'text-slate-600 hover:bg-white/[0.5] hover:text-slate-800'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Users</p>
                    <p className="text-3xl font-bold text-slate-900">{data.stats.totalUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Developers</p>
                    <p className="text-3xl font-bold text-slate-900">{data.stats.totalDevelopers}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Active Listings</p>
                    <p className="text-3xl font-bold text-slate-900">{data.stats.totalListings}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Sales</p>
                    <p className="text-3xl font-bold text-slate-900">{data.stats.totalSales}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.stats.totalRevenue)}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Platform Profit (15%)</p>
                    <p className="text-3xl font-bold text-emerald-600">{formatCurrency(data.stats.platformProfit)}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Sales */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Recent Sales</h3>
              </div>
              <div className="overflow-x-auto">
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
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">All Users</h3>
              <span className="text-sm text-slate-500">{data.stats.totalUsers} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.recentUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 text-slate-900">{user.name}</td>
                      <td className="px-6 py-4 text-slate-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isDeveloper ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {user.isDeveloper ? 'Developer' : 'Buyer'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{user.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === 'listings' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">All Listings</h3>
              <span className="text-sm text-slate-500">{data.stats.totalListings} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Developer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Sales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Profit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Reviews</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.listings.map((listing) => (
                    <tr key={listing.id}>
                      <td className="px-6 py-4 text-slate-900">{listing.name}</td>
                      <td className="px-6 py-4 text-slate-600">{listing.developer}</td>
                      <td className="px-6 py-4 text-slate-900">{formatCurrency(listing.price)}</td>
                      <td className="px-6 py-4 text-slate-900">{listing.sales}</td>
                      <td className="px-6 py-4 text-slate-900">{formatCurrency(listing.revenue)}</td>
                      <td className="px-6 py-4 text-emerald-600">{formatCurrency(listing.profit)}</td>
                      <td className="px-6 py-4 text-slate-600">{listing.reviews}</td>
                      <td className="px-6 py-4 text-slate-600">{listing.rating} ★</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Developers Tab */}
        {activeTab === 'developers' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Developers</h3>
              <span className="text-sm text-slate-500">{data.stats.totalDevelopers} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Listings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total Sales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.developers.map((dev) => (
                    <tr key={dev.id}>
                      <td className="px-6 py-4 text-slate-900">{dev.name}</td>
                      <td className="px-6 py-4 text-slate-600">{dev.email}</td>
                      <td className="px-6 py-4 text-slate-900">{dev.listings}</td>
                      <td className="px-6 py-4 text-slate-900">{dev.totalSales}</td>
                      <td className="px-6 py-4 text-slate-900">{formatCurrency(dev.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">All Sales</h3>
            </div>
            <div className="overflow-x-auto">
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
      </div>
    </div>
  );
}
