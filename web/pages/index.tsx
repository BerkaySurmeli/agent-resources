import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

// Simple icon components
const Icon = ({ name, className }: { name: string; className?: string }) => {
  const icons: Record<string, JSX.Element> = {
    code: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    users: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    robot: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
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
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-lg">AR</span>
    </div>
    <span className="font-semibold text-slate-900">Agent Resources</span>
  </div>
);

export default function Home() {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/waitlist/?email=${encodeURIComponent(email)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div className="min-h-screen bg-white">
      <Head>
        <title>Agent Resources | The Marketplace for AI Agents</title>
        <meta name="description" content="Buy and sell MCP Servers, Agent Skills, and AI Personas." />
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-8">
            <Link href="/blog" className="text-slate-600 hover:text-slate-900 transition-colors">Blog</Link>
            <button 
              onClick={() => setShowWaitlist(true)}
              className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Join Waitlist
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              Zero commission for 500 listings
            </span>
          </FadeIn>
          
          <FadeIn delay={100}>
            <h1 className="text-5xl md:text-6xl font-semibold text-slate-900 tracking-tight mb-6">
              The marketplace for
              <br />
              <span className="text-blue-600">AI agents</span>
            </h1>
          </FadeIn>
          
          <FadeIn delay={200}>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Buy and sell MCP Servers, Agent Skills, and AI Personas.
            </p>
          </FadeIn>
          
          <FadeIn delay={300}>
            <button 
              onClick={() => setShowWaitlist(true)}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-700 transition-all hover:scale-105"
            >
              Join the Waitlist
            </button>
          </FadeIn>
        </div>
      </section>

      {/* Blog Preview */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-semibold text-slate-900 mb-2">Building in Public</h2>
                <p className="text-slate-600">Follow our journey as we build the marketplace for AI agents.</p>
              </div>
              <Link href="/blog" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
                View all posts
                <Icon name="arrowRight" className="w-4 h-4" />
              </Link>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-1 gap-8 max-w-2xl">
            <FadeIn delay={100}>
              <Link href="/blog/hello-world" className="group block">
                <article className="border border-slate-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all h-full">
                  <span className="text-sm text-slate-500">March 27, 2026</span>
                  <h3 className="text-lg font-semibold text-slate-900 mt-2 mb-3 group-hover:text-blue-600 transition-colors">
                    Hello World: We're Live
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Agent Resources is officially a real thing. Here's why we're building this and what's coming.
                  </p>
                </article>
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Logo />
          <div className="flex items-center gap-6 text-slate-600">
            <Link href="/blog" className="hover:text-slate-900 transition-colors">Blog</Link>
            <a href="https://twitter.com" className="hover:text-slate-900 transition-colors">Twitter</a>
            <a href="https://github.com/BerkaySurmeli/agent-resources" className="hover:text-slate-900 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>

      {/* Waitlist Modal */}
      {showWaitlist && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            {!submitted ? (
              <>
                <h3 className="text-2xl font-semibold text-slate-900 mb-2">Join the Waitlist</h3>
                <p className="text-slate-600 mb-6">
                  Be among the first 500 listings — free forever, no commission ever. We'll notify you when we launch.
                </p>
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
