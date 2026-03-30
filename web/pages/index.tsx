import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

// Simple icon components
const Icon = ({ name, className }: { name: string; className?: string }) => {
  const icons: Record<string, JSX.Element> = {
    arrowRight: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    ),
    check: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    ),
  };
  return icons[name] || null;
};

// Fade in animation component
const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return (
    <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {children}
    </div>
  );
};

// AR Logo component
const Logo = ({ className = '' }: { className?: string }) => (
  <div className={`flex items-center gap-3 ${className}`} aria-label="Agent Resources Home">
    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center" aria-hidden="true">
      <span className="text-white font-bold text-lg">AR</span>
    </div>
    <span className="font-semibold text-slate-900">Agent Resources</span>
  </div>
);

export default function Home() {
  const { t } = useLanguage();
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToCart } = useCart();

  const handleBuyNow = (slug: string, name: string, price: number, category: string) => {
    addToCart({ slug, name, price, category });
    window.location.href = '/cart';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/waitlist/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSubmitted(true);
        setEmail('');
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Head>
        <title>Agent Resources | Beyond Human Resources</title>
        <meta name="description" content="Equipping the Agentic Workforce. Trade MCP Servers, Skills, and Personas." />
        <meta name="keywords" content="AI agents, MCP servers, agent skills, AI personas, OpenClaw, marketplace, AI tools" />
        <link rel="canonical" href="https://shopagentresources.com" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Agent Resources | Beyond Human Resources" />
        <meta property="og:description" content="Equipping the Agentic Workforce. Trade MCP Servers, Skills, and Personas." />
        <meta property="og:url" content="https://shopagentresources.com" />
        <meta property="og:site_name" content="Agent Resources" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Agent Resources | Beyond Human Resources" />
        <meta name="twitter:description" content="Equipping the Agentic Workforce. Trade MCP Servers, Skills, and Personas." />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Agent Resources",
              "url": "https://shopagentresources.com",
              "description": "Beyond Human Resources. Equipping the Agentic Workforce. Trade MCP Servers, Skills, and Personas.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://shopagentresources.com/browse?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </Head>


      {/* Hero */}
      <main className="pt-32 pb-20 px-6" role="main">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn delay={100}>
            <h1 className="text-5xl md:text-6xl font-semibold text-slate-900 tracking-tight mb-6">
              Beyond Human
              <br />
              <span className="text-blue-600">Resources</span>
            </h1>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="text-xl text-slate-600 mb-4 max-w-2xl mx-auto leading-relaxed">
              {t.home.heroSubtitle}
            </p>
          </FadeIn>

          <FadeIn delay={250}>
            <p className="text-lg text-blue-600 font-medium mb-10 max-w-2xl mx-auto">
              {t.home.heroDescription}
            </p>
          </FadeIn>

          <FadeIn delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/wizard"
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-700 transition-all hover:scale-105 inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {t.nav.buildTeam}
              </Link>
              <Link
                href="/listings"
                className="bg-slate-100 text-slate-700 px-8 py-4 rounded-xl font-medium hover:bg-slate-200 transition-colors inline-flex items-center justify-center gap-2"
              >
                {t.home.browseListings}
                <Icon name="arrowRight" className="w-4 h-4" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </main>

      {/* Featured Products */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl font-semibold text-slate-900 mb-12 text-center">{t.home.featuredAgents}</h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Claudia Card */}
            <FadeIn delay={100}>
              <Link href="/listings/claudia-project-manager" className="block bg-white border border-slate-200 rounded-2xl p-8 hover:border-blue-300 hover:shadow-lg transition-all h-full relative group">
                {/* Icon */}
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center mb-6 shadow-lg" aria-hidden="true">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-1">AI Project Manager</h3>
                <p className="text-blue-600 font-medium mb-1">Claudia</p>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-4">Persona</p>
                <p className="text-slate-600 text-sm mb-6">Your AI project orchestrator. Delegates tasks, tracks progress, and ensures nothing falls through the cracks.</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-slate-900">$49</span>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBuyNow('claudia-project-manager', 'Claudia - AI Project Manager', 49, 'personas');
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Buy Now
                  </button>
                </div>
              </Link>
            </FadeIn>

            {/* Chen Card */}
            <FadeIn delay={200}>
              <Link href="/listings/chen-developer" className="block bg-white border border-slate-200 rounded-2xl p-8 hover:border-blue-300 hover:shadow-lg transition-all h-full relative group">
                <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center mb-6 shadow-lg" aria-hidden="true">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-1">AI Developer</h3>
                <p className="text-blue-600 font-medium mb-1">Chen</p>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-4">Persona</p>
                <p className="text-slate-600 text-sm mb-6">Your AI software engineer. Writes clean, efficient code across any stack.</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-slate-900">$59</span>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBuyNow('chen-developer', 'Chen - AI Developer', 59, 'personas');
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Buy Now
                  </button>
                </div>
              </Link>
            </FadeIn>

            {/* Adrian Card */}
            <FadeIn delay={300}>
              <Link href="/listings/adrian-ux-designer" className="block bg-white border border-slate-200 rounded-2xl p-8 hover:border-blue-300 hover:shadow-lg transition-all h-full relative group">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center mb-6 shadow-lg" aria-hidden="true">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-1">AI UX Designer</h3>
                <p className="text-blue-600 font-medium mb-1">Adrian</p>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-4">Persona</p>
                <p className="text-slate-600 text-sm mb-6">Your AI design partner. Creates interfaces, writes copy, and crafts user experiences.</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-slate-900">$49</span>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBuyNow('adrian-ux-designer', 'Adrian - AI UX Designer', 49, 'personas');
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Buy Now
                  </button>
                </div>
              </Link>
            </FadeIn>
          </div>

          {/* Dream Team Bundle */}
          <FadeIn delay={400}>
            <div className="mt-12 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-blue-400 text-sm font-medium mb-1">Agent Resources</div>
                    <h3 className="text-2xl font-semibold mb-2">Dream Team Bundle</h3>
                    <p className="text-slate-400">Get all three personas. Complete AI team for your projects.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-3xl font-bold">$99</span>
                    <span className="text-slate-500 line-through ml-2">$157</span>
                  </div>
                  <Link 
                    href="/listings/dream-team-bundle" 
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    View Bundle
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200 mt-auto" role="contentinfo">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" aria-label="Agent Resources Home">
            <Logo />
          </Link>
          <div className="flex items-center gap-6 text-slate-600">
            <Link href="/blog" className="hover:text-slate-900 transition-colors">Blog</Link>
            <a href="https://twitter.com" className="hover:text-slate-900 transition-colors" aria-label="Follow us on Twitter">Twitter</a>
            
          </div>
        </div>
      </footer>

      {/* Waitlist Modal */}
      {showWaitlist && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="waitlist-title"
        >
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            {!submitted ? (
              <>
                <h3 id="waitlist-title" className="text-2xl font-semibold text-slate-900 mb-2">Join the Waitlist</h3>
                <p className="text-slate-600 mb-6">Join our marketplace for AI agents. List your personas, skills, and MCP servers.</p>
                {error && (
                  <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowWaitlist(false)}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Joining...' : 'Join Waitlist'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="check" className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">You're on the list!</h3>
                <p className="text-slate-600 mb-6">We'll email you when Agent Resources launches.</p>
                <button
                  onClick={() => {
                    setShowWaitlist(false);
                    setSubmitted(false);
                  }}
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  Got it
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
