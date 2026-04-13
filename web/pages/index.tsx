import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import UserMenu from '../components/UserMenu';
import LanguageSwitcher from '../components/LanguageSwitcher';

// Server-side data fetching for waitlist count
export async function getServerSideProps() {
  try {
    const res = await fetch('https://agent-resources-api-dev-production.up.railway.app/waitlist/count/');
    const data = await res.json();
    return {
      props: {
        initialSpotsRemaining: Math.max(0, 50 - data.count),
      },
    };
  } catch (error) {
    return {
      props: {
        initialSpotsRemaining: 50,
      },
    };
  }
}

const API_URL = 'https://agent-resources-api-dev-production.up.railway.app';

export default function LandingPage({ initialSpotsRemaining }: { initialSpotsRemaining: number }) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isRTL = language === 'ar';
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [spotsRemaining, setSpotsRemaining] = useState<number>(initialSpotsRemaining);

  // Refresh spots remaining on client side
  useEffect(() => {
    fetch(`${API_URL}/waitlist/count/`)
      .then(res => res.json())
      .then(data => {
        const remaining = Math.max(0, 50 - data.count);
        setSpotsRemaining(remaining);
      })
      .catch(() => {
        // Keep server-fetched value on error
        console.error('Failed to fetch waitlist count');
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage(lt.errorMessage);
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
        setMessage(lt.successMessage);
        setEmail('');
        const countRes = await fetch(`${API_URL}/waitlist/count/`);
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
    tagline: 'Reimagining Human Resources',
    incentive: '🎉 First 50 developers get $20 when they make their first sale!',
    spotsRemaining: 'spots remaining',
    allSpotsFilled: "🎉 We've filled all 50 spots! But you can still sign up to be the first to know when we're live.",
    emailPlaceholder: 'Enter your email',
    getAccess: 'Secure Your Spot',
    joining: 'Joining...',
    successMessage: "You're on the list! We'll notify you when we're live.",
    errorMessage: 'Something went wrong. Please try again.',
    comingSoon: 'Coming Soon',
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
        <link rel="alternate" hrefLang="zh" href="https://shopagentresources.com?lang=zh" />
        <link rel="alternate" hrefLang="ar" href="https://shopagentresources.com?lang=ar" />
        <link rel="alternate" hrefLang="ja" href="https://shopagentresources.com?lang=ja" />
        <link rel="alternate" hrefLang="de" href="https://shopagentresources.com?lang=de" />
        <link rel="alternate" hrefLang="ko" href="https://shopagentresources.com?lang=ko" />
        <link rel="alternate" hrefLang="tr" href="https://shopagentresources.com?lang=tr" />
        <link rel="alternate" hrefLang="x-default" href="https://shopagentresources.com" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        {/* Navigation - Full Marketplace Nav */}
        <nav className="fixed top-0 inset-x-0 bg-slate-900/80 backdrop-blur-md border-b border-white/10 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <Logo variant="full" size="md" className="text-white" />
            </Link>

            {/* Main Navigation */}
            <div className="hidden md:flex items-center gap-1">
              <Link href="/browse" className="px-4 py-2 text-slate-300 hover:text-white transition-colors">
                {t.nav?.listings || 'Listings'}
              </Link>
              <Link href="/wizard" className="px-4 py-2 text-blue-400 hover:text-blue-300 transition-colors font-medium">
                {t.nav?.buildTeam || 'Build Your Team'}
              </Link>
              <Link href="/blog" className="px-4 py-2 text-slate-300 hover:text-white transition-colors">
                Blog
              </Link>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {user ? (
                <UserMenu />
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/cart" className="relative text-slate-400 hover:text-white p-2 transition-colors" title={t.nav?.cart || 'Cart'}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </Link>
                  <Link href="/login" className="text-slate-400 hover:text-white hidden sm:block text-sm transition-colors">
                    {t.nav?.signIn || 'Sign In'}
                  </Link>
                  <Link href="/signup" className="bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 px-4 rounded-lg font-medium transition-colors">
                    {t.nav?.signUp || 'Sign Up'}
                  </Link>
                </div>
              )}
              <LanguageSwitcher />
            </div>

            {/* Mobile Menu */}
            <div className="flex md:hidden items-center gap-2">
              <Link href="/cart" className="text-slate-400 hover:text-white p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </Link>
              <Link href="/wizard" className="text-blue-400 hover:text-blue-300 p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </Link>
              {user ? (
                <UserMenu />
              ) : (
                <Link href="/login" className="text-slate-400 hover:text-white p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 lg:pt-40 lg:pb-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-10">
              {lt.title}<br /><span className="text-blue-400">{lt.titleHighlight}</span>
            </h1>
            
            {/* Animated Tagline */}
            <p className="text-2xl md:text-3xl font-bold mb-20 max-w-xl mx-auto gradient-flow-text">
              {lt.tagline?.replace(/\.$/, '')}
            </p>

            {/* Email Signup */}
            <div className="max-w-2xl mx-auto mb-4 px-4">
              {/* Developer Incentive */}
              <p className="text-lg text-amber-400 font-medium mb-4 text-center">
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
            {spotsRemaining > 0 ? (
              <p className="text-lg font-medium text-white mb-20">
                {spotsRemaining} / 50 {lt.spotsRemaining}
              </p>
            ) : (
              <p className="text-lg font-medium text-emerald-400 mb-20 max-w-xl mx-auto">
                {lt.allSpotsFilled}
              </p>
            )}

            {/* Features Section */}
            <div className="mt-24 pt-16 border-t border-white/10">
              <p className="text-center text-2xl md:text-3xl font-bold text-white mb-12 max-w-3xl mx-auto leading-relaxed">
                {lt.subtitle}
              </p>
              <div className="grid md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto">
                <div className="p-8 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">{lt.features?.personas?.title || 'AI Personas'}</h3>
                  <p className="text-slate-400">{lt.features?.personas?.description || 'Pre-configured agent personalities with SOUL.md, tools, and behavior patterns.'}</p>
                </div>
                <div className="p-8 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="text-xl font-semibold mb-3 text-purple-400">{lt.features?.skills?.title || 'Skills'}</h3>
                  <p className="text-slate-400">{lt.features?.skills?.description || 'Reusable capabilities for agents — from web scraping to API integrations.'}</p>
                </div>
                <div className="p-8 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="text-xl font-semibold mb-3 text-green-400">{lt.features?.mcp?.title || 'MCP Servers'}</h3>
                  <p className="text-slate-400">{lt.features?.mcp?.description || 'Model Context Protocol servers for extending agent capabilities.'}</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer - Full Marketplace Footer */}
        <footer className="border-t border-white/10 py-8 relative">
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Logo variant="icon" size="sm" />
                <span className="font-semibold text-white">Agent Resources</span>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <Link href="/blog" className="text-slate-400 hover:text-white transition-colors">
                  {t.footer?.blog || 'Blog'}
                </Link>
                <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">
                  {t.footer?.terms || 'Terms'}
                </Link>
                <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">
                  {t.footer?.contact || 'Contact'}
                </Link>
              </div>

              <p className="text-sm text-slate-500">
                © 2026 Agent Resources
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
