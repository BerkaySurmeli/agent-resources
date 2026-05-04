import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import { API_URL } from '../lib/api';

export default function LandingPage() {
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/waitlist/count/`)
      .then(res => res.json())
      .then(data => setSpotsRemaining(Math.max(0, 50 - data.count)))
      .catch(() => setSpotsRemaining(50));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }
    setStatus('loading');
    try {
      const response = await fetch(`${API_URL}/waitlist/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        setStatus('success');
        setMessage("You're on the list! We'll notify you when we go live.");
        setEmail('');
        const countRes = await fetch(`${API_URL}/waitlist/count/`);
        const data = await countRes.json();
        setSpotsRemaining(Math.max(0, 50 - data.count));
      } else {
        throw new Error('Failed');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <Head>
        <title>Agent Resources | Marketplace for AI Agents, MCP Servers & Skills</title>
        <meta name="description" content="The marketplace for AI agents, MCP servers, and agent skills. Buy, sell, and discover tools for autonomous agents. First 50 developers get $20 after their first sale." />
        <meta name="keywords" content="AI agents, MCP servers, agent skills, marketplace, buy AI agents, sell AI agents, SOUL.md, autonomous agents, AI personas" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://shopagentresources.com" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://shopagentresources.com" />
        <meta property="og:title" content="Agent Resources | Marketplace for AI Agents, MCP Servers & Skills" />
        <meta property="og:description" content="The marketplace for AI agents, MCP servers, and agent skills." />
        <meta property="og:image" content="https://shopagentresources.com/og-image.png" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Agent Resources | Marketplace for AI Agents, MCP Servers & Skills" />
        <meta property="twitter:image" content="https://shopagentresources.com/og-image.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-slate-900 text-white">
        <Navbar />

        {/* Hero */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-400 font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Now in early access
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
              The Marketplace for<br />
              <span className="text-blue-400">AI Agents</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 mb-4 max-w-2xl mx-auto leading-relaxed">
              Buy, sell, and deploy AI personas, skills, and MCP servers — built for the agent economy.
            </p>

            {/* Dual CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/listings"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors text-lg shadow-lg shadow-blue-600/20"
              >
                Browse Listings
              </Link>
              <Link
                href="/sell"
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-colors text-lg"
              >
                Start Selling →
              </Link>
            </div>

            {/* Developer incentive banner */}
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-3 text-amber-400 text-sm font-medium mb-4">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              First 50 developers get $20 when they make their first sale
            </div>

            {/* Waitlist form */}
            <div className="max-w-xl mx-auto">
              {spotsRemaining !== null && spotsRemaining > 0 && (
                <p className="text-slate-400 text-sm mb-3">
                  <span className="text-white font-semibold">{spotsRemaining}</span> of 50 early developer spots remaining
                </p>
              )}
              {spotsRemaining === 0 && (
                <p className="text-slate-400 text-sm mb-3">
                  All 50 spots claimed — join the waitlist below to be notified when we launch
                </p>
              )}
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={status === 'loading' || status === 'success'}
                />
                <button
                  type="submit"
                  disabled={status === 'loading' || status === 'success'}
                  className="px-6 py-3.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors whitespace-nowrap text-slate-200"
                >
                  {status === 'loading' ? 'Joining...' : status === 'success' ? 'You\'re in!' : 'Join Waitlist'}
                </button>
              </form>
              {status === 'success' && <p className="mt-3 text-green-400 text-sm">{message}</p>}
              {status === 'error' && <p className="mt-3 text-red-400 text-sm">{message}</p>}
            </div>
          </div>

          {/* Feature cards */}
          <div className="mt-24 grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/30 transition-colors">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Personas</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Pre-configured agent personalities with role definitions, tools, and behavior patterns. Drop one in and have an expert ready to work.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/30 transition-colors">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Agent Skills</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Reusable capabilities that extend what your agents can do — from web research to API integrations and custom workflows.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-green-500/30 transition-colors">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">MCP Servers</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Model Context Protocol servers that connect agents to external systems, databases, and tools with a standard interface.</p>
            </div>
          </div>

          {/* Trust row */}
          <div className="mt-16 pt-10 border-t border-slate-800 flex flex-wrap items-center justify-center gap-8 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              VirusTotal scanned
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Stripe-secured payments
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Instant download
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Human-reviewed listings
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <p className="text-slate-500 text-sm">© 2026 Agent Resources. Built for the agent economy.</p>
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <Link href="/listings" className="hover:text-white transition-colors">Listings</Link>
                <Link href="/sell" className="hover:text-white transition-colors">Sell</Link>
                <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
