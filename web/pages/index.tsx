import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// Simple icon components
const Icon = ({ name, className }: { name: string; className?: string }) => {
  const icons: Record<string, JSX.Element> = {
    shield: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    bolt: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    beaker: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Store email for waitlist
    setSubmitted(true);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Agent Resources | The Marketplace for AI Agents</title>
        <meta name="description" content="Buy and sell MCP Servers, Agent Skills, and AI Personas. Verified, tested, and ready to deploy." />
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
              First 500 developers list free forever
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

          <FadeIn delay={400}>
            
          </FadeIn>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          
        </div>
      </section>

      {/* Product Tiers */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-semibold text-slate-900 mb-4">What You'll Find Here</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Three types of products for building and extending AI agents.
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            <FadeIn delay={100}>
              <div className="border border-slate-200 rounded-2xl p-8 hover:border-blue-300 transition-colors">
                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center mb-6">
                  <Icon name="code" className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">MCP Servers</h3>
                <p className="text-slate-600 mb-4">
                  Infrastructure that lets agents talk to external systems. QuickBooks, Slack, Google Sheets, databases.
                </p>
                <span className="text-sm text-slate-500">For developers & power users</span>
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="border border-slate-200 rounded-2xl p-8 hover:border-blue-300 transition-colors">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                  <Icon name="robot" className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Agent Skills</h3>
                <p className="text-slate-600 mb-4">
                  Training manuals and workflows. The prompts, logic, and knowledge an agent needs for specific tasks.
                </p>
                <span className="text-sm text-slate-500">For business users</span>
              </div>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="border border-slate-200 rounded-2xl p-8 hover:border-blue-300 transition-colors">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mb-6">
                  <Icon name="users" className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Personas</h3>
                <p className="text-slate-600 mb-4">
                  Complete digital workers. Pre-configured agents with skills, personality, and knowledge base included.
                </p>
                <span className="text-sm text-slate-500">For beginners</span>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* For Developers */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <div>
                <h2 className="text-3xl font-semibold mb-6">Built for Developers</h2>
                <p className="text-slate-400 mb-8 text-lg">
                  Create MCP Servers, Agent Skills, and Personas. Sell them to thousands of users.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <Icon name="check" className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>First 500 developers: <strong className="text-white">Free listing forever</strong></span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Icon name="check" className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>Only 15% commission (free items = 0%)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Icon name="check" className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>Automatic testing & verification</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Icon name="check" className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>Stripe Connect for easy payouts</span>
                  </li>
                </ul>
                <button 
                  onClick={() => setShowWaitlist(true)}
                  className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Join the Waitlist
                </button>
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="bg-slate-800 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-slate-400">Commission</span>
                  <span className="text-3xl font-bold text-blue-400">15%</span>
                </div>
                <div className="h-px bg-slate-700 mb-6" />
                <div className="flex items-center justify-between mb-6">
                  <span className="text-slate-400">Free Items</span>
                  <span className="text-3xl font-bold text-green-400">0%</span>
                </div>
                <div className="h-px bg-slate-700 mb-6" />
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">First 500 Devs</span>
                  <span className="text-lg font-semibold text-white">Free Forever</span>
                </div>
              </div>
            </FadeIn>
          </div>
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
                  Be among the first 500 developers to list for free. We'll notify you when we launch.
                </p>
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
                      className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                    >
                      Join Waitlist
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
