import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

const products = [
  {
    slug: 'claudia-project-manager',
    name: 'Claudia',
    subtitle: 'AI Project Manager',
    price: 49,
    description: 'Your AI project orchestrator. Delegates tasks, tracks progress, and ensures nothing falls through the cracks.',
    features: ['Project planning', 'Agent delegation', 'Progress tracking', 'Quality assurance'],
    color: 'bg-blue-600'
  },
  {
    slug: 'chen-developer',
    name: 'Chen',
    subtitle: 'AI Developer',
    price: 59,
    description: 'Your AI software engineer. Writes clean, efficient code across any stack.',
    features: ['Full-stack development', 'Code review', 'Architecture', 'Debugging'],
    color: 'bg-slate-900'
  },
  {
    slug: 'adrian-ux-designer',
    name: 'Adrian',
    subtitle: 'AI UX Designer',
    price: 49,
    description: 'Your AI design partner. Creates interfaces, writes copy, and crafts user experiences.',
    features: ['Interface design', 'Copywriting', 'User flows', 'Landing pages'],
    color: 'bg-purple-600'
  }
];

const bundle = {
  slug: 'dream-team-bundle',
  name: 'Dream Team Bundle',
  subtitle: 'All Three Personas',
  price: 99,
  originalPrice: 157,
  description: 'Get Claudia, Chen, and Adrian. The complete AI team for your projects.',
  features: ['All three personas', 'Seamless integration', 'Complete workflow', '37% discount'],
  color: 'bg-gradient-to-r from-blue-600 via-purple-600 to-slate-900'
};

export default function Products() {
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [showEmailModal, setShowEmailModal] = useState<string | null>(null);

  const handlePurchase = async (productSlug: string) => {
    if (!email) {
      setShowEmailModal(productSlug);
      return;
    }
    
    setLoading(productSlug);
    
    try {
      const response = await fetch(`${API_URL}/payments/create-checkout-session?product_slug=${productSlug}&email=${encodeURIComponent(email)}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Products | Agent Resources</title>
        <meta name="description" content="AI personas for your OpenClaw environment. Claudia, Chen, and Adrian." />
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
          <Link href="/" className="text-slate-600 hover:text-slate-900">Home</Link>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-16 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-4">
          AI Personas for OpenClaw
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Download and deploy these personas in your OpenClaw environment. One-time purchase, yours forever.
        </p>
      </section>

      {/* Products */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {products.map((product) => (
              <div key={product.slug} className="border border-slate-200 rounded-2xl p-8 hover:border-blue-300 hover:shadow-lg transition-all">
                <div className={`w-14 h-14 ${product.color} rounded-xl flex items-center justify-center mb-6`}>
                  <span className="text-white font-bold text-xl">{product.name[0]}</span>
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">{product.name}</h2>
                <p className="text-blue-600 font-medium mb-4">{product.subtitle}</p>
                <p className="text-slate-600 mb-6">{product.description}</p>
                
                <ul className="space-y-2 mb-8">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-slate-900">${product.price}</span>
                  <button
                    onClick={() => handlePurchase(product.slug)}
                    disabled={loading === product.slug}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading === product.slug ? 'Loading...' : 'Buy Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bundle */}
          <div className="bg-slate-900 rounded-2xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-semibold mb-2">{bundle.name}</h2>
                <p className="text-blue-400 font-medium mb-4">{bundle.subtitle}</p>
                <p className="text-slate-400 mb-6">{bundle.description}</p>
                
                <ul className="space-y-3 mb-8">
                  {bundle.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold">${bundle.price}</span>
                  <span className="text-xl text-slate-500 line-through">${bundle.originalPrice}</span>
                  <span className="bg-green-500 text-white text-sm px-3 py-1 rounded-full">Save ${bundle.originalPrice - bundle.price}</span>
                </div>
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => handlePurchase(bundle.slug)}
                  disabled={loading === bundle.slug}
                  className="w-full bg-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 text-lg"
                >
                  {loading === bundle.slug ? 'Loading...' : 'Get the Bundle'}
                </button>
                <p className="text-slate-500 mt-4 text-sm">One-time purchase. Yours forever.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Enter your email</h3>
            <p className="text-slate-600 mb-6">We'll send your purchase receipt and download instructions here.</p>
            
            <div className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEmailModal(null)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowEmailModal(null);
                    handlePurchase(showEmailModal);
                  }}
                  disabled={!email}
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200 mt-12">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AR</span>
            </div>
            <span className="font-semibold text-slate-900">Agent Resources</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 Agent Resources</p>
        </div>
      </footer>
    </div>
  );
}
