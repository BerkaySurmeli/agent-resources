import Head from 'next/head';
import { useState, useEffect } from 'react';

// Default translations (English)
const defaultTranslations = {
  landing: {
    title: 'The Marketplace for',
    titleHighlight: 'AI Agents',
    subtitle: 'Buy, sell, and discover AI personas, skills, and MCP servers. Reimagining Human Resources.',
    incentive: '🎉 First 50 developers get $20 when they make their first sale!',
    spotsRemaining: 'spots remaining',
    spotsClaimed: 'All spots claimed! Join the waitlist for early access.',
    emailPlaceholder: 'Enter your email',
    getAccess: 'Secure Your Spot',
    joining: 'Joining...',
    successMessage: 'Thanks! Check your email for your developer code.',
    errorMessage: 'Something went wrong. Please try again.',
    footer: '© 2026 Agent Resources. Built for the agent economy.'
  }
};

export default function LandingPage() {
  // Hardcoded languages with flags
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  ];
  
  // Try to use language context, fallback to defaults
  let t = defaultTranslations;
  let language = 'en';
  let setLanguage = (lang: string) => {};
  
  try {
    const langContext = require('../context/LanguageContext');
    if (langContext.useLanguage) {
      const ctx = langContext.useLanguage();
      t = ctx.t || defaultTranslations;
      language = ctx.language || 'en';
      setLanguage = ctx.setLanguage || ((lang: string) => {});
    }
  } catch (e) {
    // Context not available, use defaults
  }
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
    getAccess: 'Secure Your Spot',
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
                <span className="text-sm text-slate-400">Coming Soon</span>
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
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              {lt.title}
              <br />
              <span className="text-blue-400">{lt.titleHighlight}</span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-xl mx-auto">
              {lt.subtitle}
            </p>

            {/* Developer Incentive */}
            <p className="text-lg text-amber-400 font-medium mb-6">
              {lt.incentive}
            </p>

            {/* Email Signup */}
            <div className="max-w-md mx-auto mb-4">
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={lt.emailPlaceholder}
                  className="flex-1 px-5 py-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={status === 'loading'}
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors whitespace-nowrap"
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

            {/* Spots Counter */}
            {spotsRemaining !== null && spotsRemaining > 0 && (
              <p className="text-lg font-medium text-white mb-12">
                {spotsRemaining}/50 {lt.spotsRemaining}
              </p>
            )}

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto">
              <div className="p-8 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-xl font-semibold mb-3 text-blue-400">AI Personas</h3>
                <p className="text-slate-400">Pre-configured agent personalities with SOUL.md, tools, and behavior patterns.</p>
              </div>
              <div className="p-8 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-xl font-semibold mb-3 text-purple-400">Skills</h3>
                <p className="text-slate-400">Reusable capabilities for agents — from web scraping to API integrations.</p>
              </div>
              <div className="p-8 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-xl font-semibold mb-3 text-green-400">MCP Servers</h3>
                <p className="text-slate-400">Model Context Protocol servers for extending agent capabilities.</p>
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
