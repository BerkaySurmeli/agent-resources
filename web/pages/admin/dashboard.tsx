import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useRouter } from 'next/router';
import Logo from '../../components/Logo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

interface CloudflareMetrics {
  requests: number;
  bandwidth: number;
  pageviews: number;
  threats: number;
  uniqueVisitors: number;
  period: string;
  lastUpdated: string;
}

interface DashboardStats {
  totalUsers: number;
  totalDevelopers: number;
  totalAdmins: number;
  totalListings: number;
  totalSales: number;
  totalRevenue: number;
  platformProfit: number;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  isDeveloper: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface AdminData {
  id: string;
  email: string;
  name: string | null;
  isMasterAdmin: boolean;
  createdAt: string;
}

interface ListingData {
  id: string;
  name: string;
  developer: string;
  price: number;
  sales: number;
  revenue: number;
  profit: number;
  reviews: number;
  rating: number;
  status: string;
}

interface DeveloperData {
  id: string;
  name: string;
  email: string;
  listings: number;
  totalSales: number;
  revenue: number;
}

interface SaleData {
  id: string;
  item: string;
  buyer: string;
  amount: number;
  commission: number;
  date: string;
}

interface WaitlistEntry {
  email: string;
  created_at: string;
  source: string;
  developer_code: string;
}

export default function AdminDashboard() {
  const { admin, isLoading: authLoading, logout } = useAdminAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDevelopers: 0,
    totalAdmins: 0,
    totalListings: 0,
    totalSales: 0,
    totalRevenue: 0,
    platformProfit: 0,
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [listings, setListings] = useState<ListingData[]>([]);
  const [developers, setDevelopers] = useState<DeveloperData[]>([]);
  const [sales, setSales] = useState<SaleData[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [metrics, setMetrics] = useState<CloudflareMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Get admin token from localStorage
  const getAdminToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('ar-admin-token');
  };

  // Check auth and fetch data
  useEffect(() => {
    if (!authLoading) {
      if (!admin) {
        router.push('/admin/login');
        return;
      }
      fetchAllData();
    }
  }, [admin, authLoading, router]);

  const fetchAllData = async () => {
    setLoading(true);
    const token = getAdminToken();
    
    try {
      // Fetch dashboard stats
      const statsRes = await fetch(`${API_URL}/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }
      
      // Fetch users
      const usersRes = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
      
      // Fetch admins
      const adminsRes = await fetch(`${API_URL}/admin/admins`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (adminsRes.ok) {
        const adminsData = await adminsRes.json();
        setAdmins(adminsData.admins || []);
      }
      
      // Fetch listings
      const listingsRes = await fetch(`${API_URL}/admin/listings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (listingsRes.ok) {
        const listingsData = await listingsRes.json();
        setListings(listingsData);
      }
      
      // Fetch developers
      const devsRes = await fetch(`${API_URL}/admin/developers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (devsRes.ok) {
        const devsData = await devsRes.json();
        setDevelopers(devsData);
      }
      
      // Fetch sales
      const salesRes = await fetch(`${API_URL}/admin/sales`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setSales(salesData);
      }

      // Fetch waitlist
      const waitlistRes = await fetch(`${API_URL}/admin/waitlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (waitlistRes.ok) {
        const waitlistData = await waitlistRes.json();
        setWaitlist(waitlistData.entries || []);
      }

      // Fetch Cloudflare metrics
      await fetchCloudflareMetrics();
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCloudflareMetrics = async () => {
    setMetricsLoading(true);
    const token = getAdminToken();
    
    try {
      const res = await fetch(`${API_URL}/admin/metrics/cloudflare`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to fetch Cloudflare metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    const token = getAdminToken();
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        // Refresh users list
        const usersRes = await fetch(`${API_URL}/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
        }
      } else {
        const error = await res.json();
        alert(error.detail || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      return;
    }

    const token = getAdminToken();
    try {
      const res = await fetch(`${API_URL}/admin/admins/${adminId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        // Refresh admins list
        const adminsRes = await fetch(`${API_URL}/admin/admins`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (adminsRes.ok) {
          const adminsData = await adminsRes.json();
          setAdmins(adminsData.admins || []);
        }
      } else {
        const error = await res.json();
        alert(error.detail || 'Failed to delete admin');
      }
    } catch (err) {
      console.error('Failed to delete admin:', err);
      alert('Failed to delete admin');
    }
  };

  const handleApproveListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to approve this listing?')) {
      return;
    }

    const token = getAdminToken();
    try {
      const res = await fetch(`${API_URL}/admin/listings/${listingId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        // Refresh listings list
        const listingsRes = await fetch(`${API_URL}/admin/listings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (listingsRes.ok) {
          const listingsData = await listingsRes.json();
          setListings(listingsData);
        }
        alert('Listing approved successfully');
      } else {
        const error = await res.json();
        alert(error.detail || 'Failed to approve listing');
      }
    } catch (err) {
      console.error('Failed to approve listing:', err);
      alert('Failed to approve listing');
    }
  };

  const handleRejectListing = async (listingId: string) => {
    const reason = prompt('Please enter a reason for rejection:');
    if (!reason) return;

    const token = getAdminToken();
    try {
      const res = await fetch(`${API_URL}/admin/listings/${listingId}/reject`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (res.ok) {
        // Refresh listings list
        const listingsRes = await fetch(`${API_URL}/admin/listings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (listingsRes.ok) {
          const listingsData = await listingsRes.json();
          setListings(listingsData);
        }
        alert('Listing rejected');
      } else {
        const error = await res.json();
        alert(error.detail || 'Failed to reject listing');
      }
    } catch (err) {
      console.error('Failed to reject listing:', err);
      alert('Failed to reject listing');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!admin) {
    return null;
  }

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'admins', label: 'Admins', icon: '🔐' },
    { id: 'developers', label: 'Developers', icon: '💻' },
    { id: 'listings', label: 'Listings', icon: '📋' },
    { id: 'sales', label: 'Sales', icon: '💰' },
    { id: 'waitlist', label: 'Waitlist', icon: '📝' },
    { id: 'metrics', label: 'Website Metrics', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Head>
        <title>Admin Dashboard | Agent Resources</title>
      </Head>

      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <Logo variant="icon" size="md" />
                <span className="font-semibold text-slate-900">Admin Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-600">{admin.email}</span>
              <Link href="/" className="text-slate-600 hover:text-slate-900">Back to Site</Link>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Side Menu */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900">Menu</h2>
              </div>
              <nav className="p-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="w-full mt-4 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Data
                </>
              )}
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <StatCard title="Total Users" value={stats.totalUsers} icon="👥" color="blue" />
                  <StatCard title="Developers" value={stats.totalDevelopers} icon="💻" color="green" />
                  <StatCard title="Admins" value={stats.totalAdmins} icon="🔐" color="purple" />
                  <StatCard title="Active Listings" value={stats.totalListings} icon="📋" color="purple" />
                  <StatCard title="Total Sales" value={stats.totalSales} icon="🛒" color="yellow" />
                  <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon="💰" color="emerald" />
                  <StatCard title="Platform Profit (10%)" value={formatCurrency(stats.platformProfit)} icon="📈" color="emerald" isProfit />
                </div>

                {/* Recent Sales Table */}
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
                        {sales.slice(0, 10).map((sale) => (
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

            {/* Users Section */}
            {activeSection === 'users' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Regular Users ({users.length})</h2>
                <DataTable
                  headers={['Name', 'Email', 'Type', 'Verified', 'Joined', 'Actions']}
                  rows={users.map(u => {
                    // Check if this user is also an admin
                    const isAdmin = admins.some(a => a.email === u.email);
                    return [
                      u.name,
                      u.email,
                      isAdmin ? '👑 Admin' : (u.isDeveloper ? 'Developer' : 'Buyer'),
                      u.isVerified ? '✅' : '❌',
                      new Date(u.createdAt).toLocaleDateString(),
                      isAdmin ? (
                        <span key={u.id} className="text-slate-400 text-sm">Protected</span>
                      ) : (
                        <button
                          key={u.id}
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      )
                    ];
                  })}
                />
              </div>
            )}

            {/* Admins Section */}
            {activeSection === 'admins' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Admin Users ({admins.length})</h2>
                <DataTable
                  headers={['Name', 'Email', 'Master Admin', 'Joined', 'Actions']}
                  rows={admins.map(a => [
                    a.name || '-',
                    a.email,
                    a.isMasterAdmin ? '⭐ Yes' : 'No',
                    new Date(a.createdAt).toLocaleDateString(),
                    a.isMasterAdmin ? (
                      <span className="text-slate-400 text-sm">Protected</span>
                    ) : (
                      <button
                        key={a.id}
                        onClick={() => handleDeleteAdmin(a.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    )
                  ])}
                />
              </div>
            )}

            {/* Developers Section */}
            {activeSection === 'developers' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Developers ({developers.length})</h2>
                <DataTable
                  headers={['Name', 'Email', 'Listings', 'Total Sales', 'Revenue']}
                  rows={developers.map(d => [
                    d.name,
                    d.email,
                    d.listings,
                    d.totalSales,
                    formatCurrency(d.revenue)
                  ])}
                />
              </div>
            )}

            {/* Listings Section */}
            {activeSection === 'listings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Listings ({listings.length})</h2>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Developer</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Price</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {listings.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-900">{l.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{l.developer}</td>
                          <td className="px-4 py-3 text-sm text-slate-900">{formatCurrency(l.price)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              l.status === 'approved' || l.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : l.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : l.status === 'pending_scan' || l.status === 'scanning'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {l.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <a
                                href={`https://shopagentresources.com/listings/${l.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                View
                              </a>
                              {(l.status === 'pending_scan' || l.status === 'scanning' || l.status === 'pending_approval') && (
                                <>
                                  <button
                                    onClick={() => handleApproveListing(l.id)}
                                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectListing(l.id)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sales Section */}
            {activeSection === 'sales' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">All Sales ({sales.length})</h2>
                <DataTable
                  headers={['Item', 'Buyer', 'Amount', 'Commission', 'Date']}
                  rows={sales.map(s => [
                    s.item,
                    s.buyer,
                    formatCurrency(s.amount),
                    formatCurrency(s.commission),
                    s.date
                  ])}
                />
              </div>
            )}

            {/* Metrics Section */}
            {activeSection === 'waitlist' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">Waitlist ({waitlist.length})</h2>
                  <div className="text-sm text-slate-600">
                    {Math.max(0, 50 - waitlist.length)} spots remaining
                  </div>
                </div>

                {waitlist.length > 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Email</th>
                          <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Developer Code</th>
                          <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Source</th>
                          <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {waitlist.map((entry, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-sm text-slate-900">{entry.email}</td>
                            <td className="px-6 py-4 text-sm font-mono text-slate-600">{entry.developer_code || '-'}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{entry.source}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <p className="text-slate-500">No waitlist entries yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'metrics' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">Website Metrics (Cloudflare)</h2>
                  <button
                    onClick={fetchCloudflareMetrics}
                    disabled={metricsLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {metricsLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh Metrics
                      </>
                    )}
                  </button>
                </div>

                {metrics ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <StatCard title="Total Requests" value={formatNumber(metrics.requests)} icon="🌐" color="blue" />
                      <StatCard title="Page Views" value={formatNumber(metrics.pageviews)} icon="👁️" color="green" />
                      <StatCard title="Unique Visitors" value={formatNumber(metrics.uniqueVisitors)} icon="🎯" color="purple" />
                      <StatCard title="Bandwidth Used" value={formatBytes(metrics.bandwidth)} icon="📊" color="yellow" />
                      <StatCard title="Threats Blocked" value={formatNumber(metrics.threats)} icon="🛡️" color="red" />
                      <StatCard title="Period" value={metrics.period} icon="📅" color="emerald" />
                    </div>
                    <p className="text-sm text-slate-500">
                      Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
                    </p>
                  </>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <p className="text-slate-500">No metrics available. Click refresh to fetch data.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
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
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className={`text-3xl font-bold ${isProfit ? 'text-emerald-600' : 'text-slate-900'}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

// Data Table Component
function DataTable({ headers, rows }: { 
  headers: string[]; 
  rows: (string | number | JSX.Element)[][];
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                {row.map((cell, j) => (
                  <td key={j} className={`px-6 py-4 whitespace-nowrap ${j === 0 ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
