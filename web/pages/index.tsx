import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { API_URL } from '../lib/api';

const CODE_STEPS = [
  {
    label: '1. Get an OAuth token',
    lang: 'bash',
    code: `curl -X POST https://api.shopagentresources.com/oauth/token \\
  -d "grant_type=client_credentials" \\
  -d "client_id=YOUR_CLIENT_ID" \\
  -d "client_secret=YOUR_SECRET"`,
  },
  {
    label: '2. Discover skills via MCP',
    lang: 'json',
    code: `POST /mcp  Authorization: Bearer <token>

{
  "method": "tools/call",
  "params": {
    "name": "search_listings",
    "arguments": { "category": "mcp_server", "limit": 5 }
  }
}`,
  },
  {
    label: '3. Purchase & get install manifest',
    lang: 'json',
    code: `// purchase
{ "method": "tools/call", "params": {
    "name": "purchase_listing",
    "arguments": { "slug": "mcp-github", "idempotency_key": "uuid" }
}}

// then fetch the manifest
GET /v1/manifest/mcp-github
→ { "claude_desktop_config": { ... }, "signed": true }`,
  },
];

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/waitlist/count/`)
      .then(r => r.json())
      .then(d => setSpotsRemaining(Math.max(0, 50 - d.count)))
      .catch(() => setSpotsRemaining(50));
  }, []);

  // Auto-advance the code carousel
  useEffect(() => {
    const t = setInterval(() => setActiveStep(s => (s + 1) % CODE_STEPS.length), 3800);
    return () => clearInterval(t);
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
        <title>Agent Resources — The API marketplace for autonomous agents</title>
        <meta name="description" content="OAuth 2.1 + MCP marketplace. Your agents discover, purchase, and install AI personas, skills, and MCP servers autonomously — no human in the loop." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://shopagentresources.com" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Agent Resources — The API marketplace for autonomous agents" />
        <meta property="og:description" content="OAuth 2.1 + MCP. Your agents discover, purchase, and install skills autonomously." />
        <meta property="og:image" content="https://shopagentresources.com/og-image.png" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:image" content="https://shopagentresources.com/og-image.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-cream-100">
        <Navbar />

        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-dot-grid pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, transparent 40%, #F8F9FA 100%)' }} />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">

              {/* Left: copy */}
              <div>
                <div className="inline-flex items-center gap-2 text-sm font-medium text-terra-600 bg-terra-50 border border-terra-200 rounded-full px-4 py-1.5 mb-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-terra-500 animate-pulse" />
                  Agent-native API — OAuth 2.1 + MCP
                </div>

                <h1 className="heading-serif text-5xl md:text-6xl text-ink-900 mb-6 leading-tight">
                  Your agents shop<br />
                  <span className="italic text-brand">for themselves</span>
                </h1>

                <p className="text-lg text-ink-500 mb-4 leading-relaxed">
                  A marketplace where AI agents autonomously discover, purchase, and install
                  skills — no human approval required for each transaction.
                </p>

                <ul className="space-y-2.5 mb-10">
                  {[
                    'OAuth 2.1 client credentials — agents authenticate headlessly',
                    'MCP HTTP transport — search and buy via JSON-RPC tool calls',
                    'Signed install manifests — verified, ready to inject into any agent',
                    'Webhook events — get notified on every purchase and listing update',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-ink-600">
                      <span className="mt-0.5 w-4 h-4 rounded-full bg-brand/10 border border-brand/20 flex-shrink-0 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-brand" viewBox="0 0 10 10" fill="currentColor">
                          <path d="M3.5 7.5L1 5l.7-.7L3.5 6.1 8.3 1.3 9 2l-5.5 5.5z" />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col sm:flex-row gap-3 mb-10">
                  <Link href="/signup" className="btn-primary text-base px-7 py-3.5 text-center">
                    Get your API key →
                  </Link>
                  <Link href="/listings" className="btn-secondary text-base px-7 py-3.5 text-center">
                    Browse the catalog
                  </Link>
                </div>

                {/* Waitlist */}
                <div className="max-w-sm">
                  {spotsRemaining !== null && (
                    <p className="text-sm text-ink-400 mb-2.5">
                      {spotsRemaining > 0
                        ? <><span className="font-semibold text-ink-700">{spotsRemaining} of 50</span> developer spots left — first sale earns a $20 bonus</>
                        : 'All 50 early spots are claimed.'}
                    </p>
                  )}
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      disabled={status === 'loading' || status === 'success'}
                      className="input flex-1 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={status === 'loading' || status === 'success'}
                      className="btn-secondary text-sm whitespace-nowrap disabled:opacity-50"
                    >
                      {status === 'loading' ? 'Joining…' : status === 'success' ? 'Joined ✓' : 'Join waitlist'}
                    </button>
                  </form>
                  {status === 'success' && <p className="mt-2 text-sm text-green-700">{message}</p>}
                  {status === 'error'   && <p className="mt-2 text-sm text-terra-600">{message}</p>}
                </div>
              </div>

              {/* Right: animated code steps */}
              <div className="hidden lg:block">
                <div className="rounded-2xl border border-cream-300 bg-ink-900 overflow-hidden shadow-2xl">
                  {/* Tab bar */}
                  <div className="flex gap-0 border-b border-white/10">
                    {CODE_STEPS.map((step, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveStep(i)}
                        className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                          i === activeStep
                            ? 'bg-white/10 text-white border-b-2 border-brand'
                            : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <div className="px-5 py-4 min-h-[220px]">
                    <p className="text-xs text-white/40 font-mono mb-3">{CODE_STEPS[activeStep].label}</p>
                    <pre className="text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">
                      {CODE_STEPS[activeStep].code}
                    </pre>
                  </div>

                  {/* Progress dots */}
                  <div className="flex justify-center gap-1.5 pb-4">
                    {CODE_STEPS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveStep(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === activeStep ? 'bg-brand w-4' : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Sub-caption below the code block */}
                <p className="text-xs text-ink-400 text-center mt-3">
                  Three API calls. Fully autonomous. Agent does it all.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="border-t border-cream-200 bg-cream-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-12">
              <h2 className="heading-serif text-3xl md:text-4xl text-ink-900 mb-4">
                Built for the <span className="italic text-brand">agentic era</span>
              </h2>
              <p className="text-ink-500 max-w-xl mx-auto">
                Traditional marketplaces require a human at every step. We removed that assumption.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: '01',
                  title: 'Human sets spending limits',
                  body: 'You create an OAuth client with a budget cap. Your agent operates within it — no per-purchase approval needed.',
                },
                {
                  step: '02',
                  title: 'Agent discovers and buys',
                  body: 'Via MCP tool calls, the agent searches the catalog, evaluates listings, and purchases what it needs from the agent wallet.',
                },
                {
                  step: '03',
                  title: 'Signed manifest, ready to use',
                  body: 'A cryptographically signed install manifest is returned. The agent injects it into its own configuration — no copy-paste.',
                },
              ].map(({ step, title, body }) => (
                <div key={step} className="card p-7 relative">
                  <span className="absolute top-5 right-6 text-3xl font-bold text-cream-300 select-none font-serif">{step}</span>
                  <h3 className="text-base font-semibold text-ink-900 mb-3 pr-10">{title}</h3>
                  <p className="text-ink-500 text-sm leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What's in the catalog ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="heading-serif text-3xl md:text-4xl text-ink-900 mb-4">Everything an agent needs</h2>
            <p className="text-ink-500 max-w-xl mx-auto">Three categories, all VirusTotal-scanned and human-reviewed before listing.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: (
                  <svg className="w-5 h-5 text-terra-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
                title: 'AI Personas',
                body: 'Pre-configured personalities with role definitions, tools, and behavior patterns. Drop one in and have a specialist immediately.',
                badge: 'system_prompt + injection_guide',
              },
              {
                icon: (
                  <svg className="w-5 h-5 text-terra-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                title: 'Agent Skills',
                body: 'Reusable capabilities — from web research to API integrations and multi-step workflows. Composable, versioned, and tested.',
                badge: 'tool_definition (Anthropic + OpenAI)',
              },
              {
                icon: (
                  <svg className="w-5 h-5 text-terra-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                ),
                title: 'MCP Servers',
                body: 'Ready-to-run MCP servers that connect your agents to GitHub, Slack, databases, and more. Manifest includes claude_desktop_config.',
                badge: 'claude_desktop_config + cursor_config',
              },
            ].map(({ icon, title, body, badge }) => (
              <div key={title} className="card card-hover p-7">
                <div className="w-9 h-9 bg-terra-50 border border-terra-100 rounded-xl flex items-center justify-center mb-5">
                  {icon}
                </div>
                <h3 className="text-base font-semibold text-ink-900 mb-2">{title}</h3>
                <p className="text-ink-500 text-sm leading-relaxed mb-4">{body}</p>
                <code className="text-xs bg-cream-200 text-ink-600 px-2 py-1 rounded font-mono">{badge}</code>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/listings" className="btn-secondary text-sm px-6 py-2.5">
              Browse the full catalog →
            </Link>
          </div>
        </section>

        {/* ── For developers: sell section ── */}
        <section className="border-t border-cream-200 bg-cream-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h2 className="heading-serif text-3xl md:text-4xl text-ink-900 mb-4">
              Build once. <span className="italic text-brand">Sell to every agent.</span>
            </h2>
            <p className="text-ink-500 max-w-2xl mx-auto mb-8">
              Your skill, persona, or MCP server becomes available to every agent that uses this marketplace.
              Webhook notifications tell you when it sells, gets installed, or receives an update request.
            </p>
            <div className="grid sm:grid-cols-3 gap-5 mb-10">
              {[
                { stat: '90%', label: 'payout to developers' },
                { stat: 'Free', label: 'first listing' },
                { stat: '$20', label: 'first-sale bonus for early devs' },
              ].map(({ stat, label }) => (
                <div key={label} className="card p-6 text-center">
                  <div className="text-3xl font-bold text-brand font-serif mb-1">{stat}</div>
                  <div className="text-sm text-ink-500">{label}</div>
                </div>
              ))}
            </div>
            <Link href="/sell" className="btn-primary text-base px-8 py-3.5">
              Start selling →
            </Link>
          </div>
        </section>

        {/* ── Trust strip ── */}
        <section className="border-t border-cream-200 bg-cream-200/40">
          <div className="max-w-5xl mx-auto px-4 py-8 flex flex-wrap items-center justify-center gap-8 text-ink-400 text-sm">
            {[
              { icon: '🛡️', text: 'VirusTotal scanned' },
              { icon: '🔒', text: 'Stripe-secured payments' },
              { icon: '🔑', text: 'OAuth 2.1 + ES256 signed manifests' },
              { icon: '⚡', text: 'MCP HTTP transport' },
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
        <footer className="border-t border-cream-200 bg-cream-100 py-10">
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
