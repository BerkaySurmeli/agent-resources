import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

// Mock data for now - will come from API later
const mockListings = [
  {
    id: '1',
    name: 'AI Project Manager',
    price: 49,
    status: 'active',
    clicks: 234,
    sales: 12,
    revenue: 588,
    reviews: 3,
    rating: 4.8,
  },
  {
    id: '2', 
    name: 'AI Developer',
    price: 59,
    status: 'active',
    clicks: 189,
    sales: 8,
    revenue: 472,
    reviews: 2,
    rating: 5.0,
  },
];

const mockStats = {
  totalRevenue: 1060,
  totalSales: 20,
  totalClicks: 423,
  totalReviews: 5,
  avgRating: 4.9,
};

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Please sign in to view your dashboard</p>
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Developer Dashboard | Agent Resources</title>
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AR</span>
            </div>
            <span className="font-semibold text-slate-900">Agent Resources</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/listings" className="text-slate-600 hover:text-slate-900">Browse</Link>
            <Link href="/sell" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
              + New Listing
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900">Your Dashboard</h1>
            <p className="text-slate-600">Manage your listings and track sales</p>
          </div>

          {/* Empty State - Show when user has no listings */}
          {mockListings.length === 0 && (
            <div className="bg-slate-50 rounded-2xl p-12 text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Start Selling</h2>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Create your first listing and reach thousands of AI agent users. 
                First 500 listings pay zero commission.
              </p>
              <Link 
                href="/sell" 
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Listing
              </Link>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-50 rounded-xl p-6">
              <p className="text-sm text-slate-500 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-slate-900">${mockStats.totalRevenue}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <p className="text-sm text-slate-500 mb-1">Total Sales</p>
              <p className="text-3xl font-bold text-slate-900">{mockStats.totalSales}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <p className="text-sm text-slate-500 mb-1">Total Clicks</p>
              <p className="text-3xl font-bold text-slate-900">{mockStats.totalClicks}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <p className="text-sm text-slate-500 mb-1">Avg Rating</p>
              <p className="text-3xl font-bold text-slate-900">{mockStats.avgRating} ★</p>
            </div>
          </div>

          {/* Listings Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Your Listings</h2>
              <Link href="/sell" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                + Add new
              </Link>
            </div>
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Listing</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Price</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Clicks</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Sales</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Revenue</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Reviews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {mockListings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <Link href={`/listings/${listing.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                        {listing.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600">${listing.price}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {listing.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{listing.clicks}</td>
                    <td className="px-6 py-4 text-slate-600">{listing.sales}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">${listing.revenue}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {listing.rating} ({listing.reviews})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
