import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LandingPage() {
  const { t, language, setLanguage, languages } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetch('https://api.shopagentresources.com/waitlist/count/')
      .then(res => res.json())
      .then(data => {
        const remaining = Math.max(0, 50 - data.count);
        setSpotsRemaining(remaining);
      })
      .catch(() => setSpotsRemaining(50));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage(t.landing?.errorMessage || 'Please enter a valid email address');
      return;
    }

    setStatus('loading');
    try {
      const response = await fetch('https://api.shopagentresources.com/waitlist/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage(t.landing?.successMessage || 'Thanks! Check your email for your developer code.');
        setEmail('');
        const countRes = await fetch('https://api.shopagentresources.com/waitlist/count/');
        const data = await countRes.json();
        setSpotsRemaining(Math.max(0, 50 - data.count));
      } else {
        throw new Error('Failed to join waitlist');
      }
    } catch (error) {
      setStatus('error');
      setMessage(t.landing?.errorMessage || 'Something went wrong. Please try again.');
    }
  };

  const lt = t.landing || {
    title: 'The Marketplace for',
    titleHighlight: 'AI Agents',
    subtitle: 'Buy, sell, and discover AI personas, skills, and MCP servers. Reimagining Human Resources.',
    incentive: '🎉 First 50 developers get $20 when they make their first sale!',
    spotsRemaining: 'spots remaining',
    spotsClaimed: 'All spots claimed! Join the waitlist for early access.',
    emailPlaceholder: 'Enter your email',
    getAccess: 'Get Early Access',
    joining: 'Joining...',
    successMessage: 'Thanks! Check your email for your developer code.',
    errorMessage: 'Something went wrong. Please try again.',
    features: {
      personas: { title: 'AI Personas', description: 'Pre-configured agent personalities with SOUL.md, tools, and behavior patterns.' },
      skills: { title: 'Skills', description: 'Reusable capabilities for agents — from web scraping to API integrations.' },
      mcp: { title: 'MCP Servers', description: 'Model Context Protocol servers for extending agent capabilities.' }
    },
    footer: '© 2026 Agent Resources. Built for the agent economy.'
  };

  return (
    <>
      <Head>
        <title>Agent Resources - Marketplace for AI Agents</title>
        <meta name="description" content="The marketplace for AI agents, skills, and MCP servers. Buy, sell, and discover tools for autonomous agents." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        {/* Navigation */}
        <nav className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">AR</span>
                </div>
                <span className="font-semibold text-white">Agent Resources</span>
              </div>
              <div className="flex items-center gap-6">
                <a href="/blog" className="text-sm text-slate-400 hover:text-white transition-colors">Blog</a>
                {/* Language Selector */}
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 text-white text-sm rounded px-2 py-1"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-slate-400">Coming Soon</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
              {lt.title}
              <br />
              <span className="text-blue-400">{lt.titleHighlight}</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              {lt.subtitle}
            </p>

            {/* Developer Incentive */}
            <div className="mb-6">
              <p className="text-lg text-amber-400 font-medium">
                {lt.incentive}
              </p>
              {spotsRemaining !== null && spotsRemaining > 0 && (
                <p className="text-2xl font-bold text-white mt-2">
                  {spotsRemaining}/50 {lt.spotsRemaining}
                </p>
              )}
              {spotsRemaining === 0 && (
                <p className="text-lg text-slate-400 mt-2">
                  {lt.spotsClaimed}
                </p>
              )}
            </div>

            {/* Email Signup */}
            <div className="max-w-md mx-auto mb-16">
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={lt.emailPlaceholder}
                  className="flex-1 px-5 py-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={status === 'loading'}
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                >
                  {status === 'loading' ? lt.joining : lt.getAccess}
                </button>
              </form>
              
              {status === 'success' && (
                <p className="mt-4 text-green-400 text-sm">{message}</p>
              )}
              {status === 'error' && (
                <p className="mt-4 text-red-400 text-sm">{message}</p>
              )}
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">{lt.features.personas.title}</h3>
                <p className="text-slate-400">{lt.features.personas.description}</p>
              </div>

              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">{lt.features.skills.title}</h3>
                <p className="text-slate-400">{lt.features.skills.description}</p>
              </div>

              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">{lt.features.mcp.title}</h3>
                <p className="text-slate-400">{lt.features.mcp.description}</p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400 text-sm">
            <p>{lt.footer}</p>
          </div>
        </footer>
      </div>
    </>
  );
}
