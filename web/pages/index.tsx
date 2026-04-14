import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';

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
        setMessage(lt.successMessage);
        setEmail('');
        const countRes = await fetch('https://api.shopagentresources.com/waitlist/count/');
        const data = await countRes.json();
        setSpotsRemaining(Math.max(0, 50 - data.count));
      } else {
        throw new Error('Failed to join waitlist');
      }
    } catch (error) {
      setStatus('error');
      setMessage(lt.errorMessage);
    }
  };

  const lt = t.landing || {
    title: 'The Marketplace for',
    titleHighlight: 'AI Agents',
    subtitle: 'Buy, sell, and discover AI personas, skills, and MCP servers.',
    tagline: 'Reimagining Human Resources.',
    incentive: '🎉 First 50 developers get $20 when they make their first sale!',
    spotsRemaining: 'spots remaining',
    spotsClaimed: 'All spots claimed! Join the waitlist for early access.',
    allSpotsFilled: "🎉 We've filled all 50 spots! But you can still sign up to be the first to know when we're live.",
    emailPlaceholder: 'Enter your email',
    getAccess: 'Secure Your Spot',
    joining: 'Joining...',
    successMessage: "You're on the list! We'll notify you when we're live.",
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
        {/* Primary Meta Tags */}
        <title>Agent Resources | Marketplace for AI Agents, MCP Servers & Skills</title>
        <meta name="description" content="The marketplace for AI agents, MCP servers, and agent skills. Buy, sell, and discover tools for autonomous agents. First 50 developers get $20 after their first sale." />
        <meta name="keywords" content="AI agents, MCP servers, agent skills, marketplace, buy AI agents, sell AI agents, SOUL.md, OpenClaw, autonomous agents, AI personas" />
        <meta name="author" content="Agent Resources" />
        <meta name="robots" content="index, follow" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://shopagentresources.com" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://shopagentresources.com" />
        <meta property="og:title" content="Agent Resources | Marketplace for AI Agents, MCP Servers & Skills" />
        <meta property="og:description" content="The marketplace for AI agents, MCP servers, and agent skills. Buy, sell, and discover tools for autonomous agents. First 50 developers get $20 after their first sale." />
        <meta property="og:image" content="https://shopagentresources.com/og-image.png" />
        <meta property="og:site_name" content="Agent Resources" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://shopagentresources.com" />
        <meta property="twitter:title" content="Agent Resources | Marketplace for AI Agents, MCP Servers & Skills" />
        <meta property="twitter:description" content="The marketplace for AI agents, MCP servers, and agent skills. Buy, sell, and discover tools for autonomous agents." />
        <meta property="twitter:image" content="https://shopagentresources.com/og-image.png" />
        <meta property="twitter:creator" content="@ClaudiaAR_CEO" />
        
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        
        {/* Alternate Languages */}
        <link rel="alternate" hrefLang="en" href="https://shopagentresources.com" />
        <link rel="alternate" hrefLang="es" href="https://shopagentresources.com?lang=es" />
        <link rel="alternate" hrefLang="fr" href="https://shopagentresources.com?lang=fr" />
        <link rel="alternate" hrefLang="de" href="https://shopagentresources.com?lang=de" />
        <link rel="alternate" hrefLang="it" href="https://shopagentresources.com?lang=it" />
        <link rel="alternate" hrefLang="pt" href="https://shopagentresources.com?lang=pt" />
        <link rel="alternate" hrefLang="tr" href="https://shopagentresources.com?lang=tr" />
        <link rel="alternate" hrefLang="zh" href="https://shopagentresources.com?lang=zh" />
        <link rel="alternate" hrefLang="x-default" href="https://shopagentresources.com" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        {/* Navigation */}
        <Navbar />

        {/* Hero Section */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 lg:pt-28 lg:pb-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              {lt.title}<br /><span className="text-blue-400">{lt.titleHighlight}</span>
            </h1>
            
            {/* Animated Tagline - gradient flowing through text */}
            <p className="text-2xl md:text-3xl font-bold mb-6 max-w-xl mx-auto gradient-flow-text">
              {lt.tagline?.replace(/\.$/, '')}
            </p>

            {/* Email Signup */}
            <div className="max-w-2xl mx-auto mb-4 px-4">

              {/* Developer Incentive - centered, closer to input */}
              <p className="text-base text-amber-400 font-medium mb-3 text-center">
                {lt.incentive}
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={lt.emailPlaceholder}
                  className="flex-[2] px-5 py-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={status === 'loading'}
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-6 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors whitespace-nowrap"
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

            {/* Spots Counter or Waitlist Message */}
            {spotsRemaining !== null && spotsRemaining > 0 ? (
              <p className="text-base font-medium text-white mb-2">
                {spotsRemaining} / 50 {lt.spotsRemaining}
              </p>
            ) : spotsRemaining === 0 ? (
              <p className="text-base font-medium text-emerald-400 mb-2 max-w-xl mx-auto">
                {lt.allSpotsFilled}
              </p>
            ) : null}

            {/* Features Section */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="text-center text-xl md:text-2xl font-bold text-white mb-8 max-w-3xl mx-auto leading-relaxed">
                {lt.subtitle}
              </p>
              <div className="grid md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">{lt.features?.personas?.title || 'AI Personas'}</h3>
                  <p className="text-slate-400">{lt.features?.personas?.description || 'Pre-configured agent personalities with SOUL.md, tools, and behavior patterns.'}</p>
                </div>
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="text-xl font-semibold mb-3 text-purple-400">{lt.features?.skills?.title || 'Skills'}</h3>
                  <p className="text-slate-400">{lt.features?.skills?.description || 'Reusable capabilities for agents — from web scraping to API integrations.'}</p>
                </div>
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="text-xl font-semibold mb-3 text-green-400">{lt.features?.mcp?.title || 'MCP Servers'}</h3>
                  <p className="text-slate-400">{lt.features?.mcp?.description || 'Model Context Protocol servers for extending agent capabilities.'}</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400 text-sm">
            <p>{lt.footer}</p>
          </div>
        </footer>
      </div>
    </>
  );
}
