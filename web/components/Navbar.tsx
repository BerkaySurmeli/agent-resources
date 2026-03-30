import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import UserMenu from './UserMenu';
import GlobalSearch from './GlobalSearch';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">AR</span>
          </div>
          <span className="font-semibold text-slate-900 hidden sm:block">Agent Resources</span>
        </Link>

        {/* Search - Desktop */}
        <div className="hidden lg:block flex-1 max-w-md mx-8">
          <GlobalSearch />
        </div>

        {/* Main Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/listings" className="text-slate-600 hover:text-slate-900 transition-colors">
            {t.nav.listings}
          </Link>
          <Link href="/wizard" className="text-blue-600 hover:text-blue-700 transition-colors font-medium whitespace-nowrap">
            {t.nav.buildTeam}
          </Link>
          <Link href="/blog" className="text-slate-600 hover:text-slate-900 transition-colors">
            {t.nav.blog}
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link href="/cart" className="relative text-slate-600 hover:text-slate-900" title={t.nav.cart}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </Link>

          {user ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-slate-600 hover:text-slate-900 hidden sm:block">
                {t.nav.signIn}
              </Link>
              <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                {t.nav.signUp}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-4">
          <Link href="/cart" className="relative text-slate-600 hover:text-slate-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </Link>
          <Link href="/wizard" className="text-blue-600 hover:text-blue-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </Link>
          <Link href="/listings" className="text-slate-600 hover:text-slate-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Link>
          {user ? (
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          ) : (
            <Link href="/login" className="text-slate-600 hover:text-slate-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
