import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import UserMenu from './UserMenu';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  return (
    <nav className="fixed top-0 inset-x-0 nav-blur z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-glow group-hover:shadow-glow-accent transition-shadow duration-300">
            <span className="text-white font-bold text-lg">AR</span>
          </div>
          <span className="font-semibold text-white hidden sm:block group-hover:text-primary-400 transition-colors">Agent Resources</span>
        </Link>

        {/* Main Navigation */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/listings" className="btn-ghost">
            {t.nav.listings || 'Listings'}
          </Link>
          <Link href="/wizard" className="text-accent-400 hover:text-accent-300 transition-colors font-medium px-4 py-2">
            {t.nav.buildTeam}
          </Link>
          <Link href="/blog" className="btn-ghost">
            Blog
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/cart" className="relative text-dark-300 hover:text-white p-2 transition-colors" title={t.nav.cart}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </Link>
              <Link href="/login" className="text-dark-300 hover:text-white hidden sm:block text-sm transition-colors">
                {t.nav.signIn}
              </Link>
              <Link href="/signup" className="btn-primary text-sm py-2 px-4">
                {t.nav.signUp}
              </Link>
            </div>
          )}
          <LanguageSwitcher />
        </div>

        {/* Mobile Menu - Simplified */}
        <div className="flex md:hidden items-center gap-3">
          <Link href="/cart" className="relative text-dark-300 hover:text-white p-2 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </Link>
          <Link href="/wizard" className="text-accent-400 hover:text-accent-300 p-2 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </Link>
          {user ? (
            <Link href="/dashboard" className="text-dark-300 hover:text-white p-2 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          ) : (
            <Link href="/login" className="text-dark-300 hover:text-white p-2 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
