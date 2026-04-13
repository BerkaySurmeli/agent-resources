import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Logo from '../components/Logo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

export default function SuccessPage() {
  const router = useRouter();
  const { session_id } = router.query;
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session_id) {
      verifyPurchase();
    }
  }, [session_id]);

  const verifyPurchase = async () => {
    try {
      const res = await fetch(`${API_URL}/payments/session/${session_id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          // Fetch details for each purchased item
          const items = await Promise.all(
            data.items.map(async (slug: string) => {
              const listingRes = await fetch(`${API_URL}/listings/public?slug=${slug}`);
              if (listingRes.ok) {
                const listings = await listingRes.json();
                return listings.find((l: any) => l.slug === slug);
              }
              return null;
            })
          );
          setPurchases(items.filter(Boolean));
        }
      }
    } catch (err) {
      setError('Failed to verify purchase');
    } finally {
      setLoading(false);
    }
  };

  const downloadSkill = async (slug: string) => {
    try {
      const token = localStorage.getItem('ar-token');
      const res = await fetch(`${API_URL}/listings/${slug}/download-skill`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${slug}-skill.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      alert('Download failed');
    }
  };

  const deployToOpenClaw = async (slugs: string[]) => {
    try {
      const token = localStorage.getItem('ar-token');
      const res = await fetch(`${API_URL}/onboarding/generate-complete-package`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listing_slugs: slugs,
          include_openclaw: true
        })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'openclaw-complete-setup.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      alert('Failed to generate package');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Head>
        <title>Purchase Successful | Agent Resources</title>
      </Head>

      <nav className="fixed top-0 inset-x-0 bg-slate-900/80 backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo variant="full" size="md" className="text-white" />
          </Link>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Verifying your purchase...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
            <Link href="/" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
              Return home
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold mb-4">Welcome to the Future!</h1>
            <p className="text-xl text-slate-400 mb-8">
              Your AI team is ready. Let's get them deployed.
            </p>

            {purchases.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-semibold mb-6">Your Purchases</h2>
                <div className="space-y-4 mb-8">
                  {purchases.map((purchase) => (
                    <div key={purchase.slug} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                      <div className="text-left">
                        <h3 className="font-semibold">{purchase.name}</h3>
                        <p className="text-sm text-slate-400">{purchase.category}</p>
                      </div>
                      <button
                        onClick={() => downloadSkill(purchase.slug)}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-8">
                  <h3 className="text-xl font-semibold mb-4">Quick Start: Deploy Everything</h3>
                  <p className="text-slate-400 mb-6">
                    Download OpenClaw + all your agents pre-configured. One command setup.
                  </p>
                  <button
                    onClick={() => deployToOpenClaw(purchases.map((p: any) => p.slug))}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-medium text-lg transition-colors inline-flex items-center gap-3"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Deploy to OpenClaw
                  </button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">1</span>
                </div>
                <h3 className="font-semibold mb-2">Download</h3>
                <p className="text-sm text-slate-400">
                  Get your complete package with OpenClaw and all agents.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">2</span>
                </div>
                <h3 className="font-semibold mb-2">Run Setup</h3>
                <p className="text-sm text-slate-400">
                  Execute ./setup.sh (Mac/Linux) or setup.ps1 (Windows)
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">3</span>
                </div>
                <h3 className="font-semibold mb-2">Start Using</h3>
                <p className="text-sm text-slate-400">
                  Run 'openclaw' and your AI team is ready to work.
                </p>
              </div>
            </div>

            <div className="mt-12">
              <Link href="/browse" className="text-slate-400 hover:text-white transition-colors">
                Browse more agents →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
