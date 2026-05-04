import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { API_URL } from '../lib/api';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/waitlist/count/`)
      .then(r => r.json())
      .then(d => setSpotsRemaining(Math.max(0, 50 - d.count)))
      .catch(() => setSpotsRemaining(50));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch(`${API_URL}/waitlist/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        setMessage("You're on the list. We'll be in touch.");
        setEmail('');
        const count = await fetch(`${API_URL}/waitlist/count/`).then(r => r.json());
        setSpotsRemaining(Math.max(0, 50 - count.count));
      } else {
        throw new Error();
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <Head>
        <title>Agent Resources — Marketplace for AI Agents, MCP Servers & Skills</title>
        <meta name="description" content="The marketplace for AI agents, MCP servers, and agent skills. Buy, sell, and discover tools for autonomous agents." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://shopagentresources.com" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Agent Resources — Marketplace for AI Agents" />
        <meta property="og:description" content="The marketplace for AI agents, MCP servers, and agent skills." />
        <meta property="og:image" content="https://shopagentresources.com/og-image.png" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:image" content="https://shopagentresources.com/og-image.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-cream-100">
        <Navbar />

        {/* ── Hero ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 text-sm font-medium text-terra-600 bg-terra-50 border border-terra-200 rounded-full px-4 py-1.5 mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-terra-500 animate-pulse" />
            Early access — first 50 developer spots
          </div>

          {/* Headline — editorial serif */}
          <h1 className="heading-serif text-5xl md:text-7xl text-ink-900 mb-6 text-balance">
            The marketplace<br />
            <span className="italic text-terra-500">for AI agents</span>
          </h1>

          <p className="text-lg md:text-xl text-ink-500 max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
            Buy, sell, and deploy AI personas, skills, and MCP servers.
            Everything your agents need, built and vetted by the community.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <Link href="/listings" className="btn-primary text-base px-8 py-3.5">
              Browse the Marketplace
            </Link>
            <Link href="/sell" className="btn-secondary text-base px-8 py-3.5">
              Start selling →
            </Link>
          </div>

          {/* Waitlist */}
          <div className="max-w-md mx-auto">
            {spotsRemaining !== null && (
              <p className="text-sm text-ink-400 mb-3">
                {spotsRemaining > 0
                  ? <><span className="font-semibold text-ink-700">{spotsRemaining} of 50</span> early developer spots remaining — first sale earns a $20 bonus</>
                  : 'All 50 early spots are claimed. Join the waitlist below.'}
              </p>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={status === 'loading' || status === 'success'}
                className="input flex-1"
              />
              <button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className="btn-secondary whitespace-nowrap disabled:opacity-50"
              >
                {status === 'loading' ? 'Joining…' : status === 'success' ? 'Joined ✓' : 'Join waitlist'}
              </button>
            </form>
            {status === 'success' && <p className="mt-2.5 text-sm text-green-700">{message}</p>}
            {status === 'error'   && <p className="mt-2.5 text-sm text-terra-600">{message}</p>}
          </div>
        </section>

        {/* ── Feature cards ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: (
                  <svg className="w-5 h-5 text-terra-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
                title: 'AI Personas',
                body: 'Pre-configured agent personalities with role definitions, tools, and behavior patterns. Drop one in and have an expert immediately ready to work.',
              },
              {
                icon: (
                  <svg className="w-5 h-5 text-terra-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                title: 'Agent Skills',
                body: 'Reusable capabilities that extend what your agents can do — from deep web research to API integrations and multi-step workflows.',
              },
              {
                icon: (
                  <svg className="w-5 h-5 text-terra-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                ),
                title: 'MCP Servers',
                body: 'Model Context Protocol servers that connect your agents to external systems, databases, and tools through a standard interface.',
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="card card-hover p-7">
                <div className="w-9 h-9 bg-terra-50 border border-terra-100 rounded-xl flex items-center justify-center mb-5">
                  {icon}
                </div>
                <h3 className="heading-serif text-xl text-ink-900 mb-3">{title}</h3>
                <p className="text-ink-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trust strip ── */}
        <section className="border-t border-cream-300 bg-cream-200/50">
          <div className="max-w-5xl mx-auto px-4 py-8 flex flex-wrap items-center justify-center gap-8 text-ink-400 text-sm">
            {[
              { icon: '🛡️', text: 'VirusTotal scanned' },
              { icon: '🔒', text: 'Stripe-secured payments' },
              { icon: '⚡', text: 'Instant download' },
              { icon: '✓', text: 'Human-reviewed listings' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-cream-300 bg-cream-100 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-ink-400">© 2026 Agent Resources. Built for the agent economy.</p>
            <div className="flex items-center gap-6 text-sm text-ink-400">
              {[
                ['/listings', 'Listings'],
                ['/sell', 'Sell'],
                ['/blog', 'Blog'],
                ['/terms', 'Terms'],
                ['/contact', 'Contact'],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="hover:text-ink-700 transition-colors">{label}</Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
