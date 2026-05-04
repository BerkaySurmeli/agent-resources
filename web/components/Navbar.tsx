import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Logo from './Logo';
import CartIcon from './CartIcon';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    window.location.href = '/';
  };

  const navLink = (href: string, label: string) => {
    const active = router.pathname === href || (href !== '/' && router.pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={`text-sm font-medium transition-colors ${
          active ? 'text-ink-900' : 'text-ink-500 hover:text-ink-800'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 bg-cream-100/90 backdrop-blur-md border-b border-cream-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo variant="full" size="md" textClassName="text-ink-900 group-hover:text-terra-500 transition-colors" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            {navLink('/listings', 'Listings')}
            {navLink('/blog', 'Blog')}
            {navLink('/wizard', 'Build Your Team')}
            {user?.isDeveloper && navLink('/sell', 'Sell')}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Link href="/cart" className="relative p-2 text-ink-500 hover:text-ink-800 transition-colors">
              <CartIcon />
            </Link>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-ink-500 hover:text-ink-800 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* User / auth */}
            {user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg text-sm font-medium text-ink-700 hover:bg-cream-200 transition-colors"
                >
                  <div className="w-7 h-7 bg-terra-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span>{user.name?.split(' ')[0]}</span>
                  <svg className="w-3.5 h-3.5 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 mt-1.5 w-48 bg-white border border-cream-300 rounded-xl shadow-warm-md z-50 py-1.5 overflow-hidden">
                      <Link href="/dashboard" className="block px-4 py-2.5 text-sm text-ink-700 hover:bg-cream-100 transition-colors" onClick={() => setDropdownOpen(false)}>
                        Dashboard
                      </Link>
                      <Link href="/settings" className="block px-4 py-2.5 text-sm text-ink-700 hover:bg-cream-100 transition-colors" onClick={() => setDropdownOpen(false)}>
                        Settings
                      </Link>
                      <hr className="my-1 border-cream-200" />
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 text-sm text-terra-600 hover:bg-cream-100 transition-colors">
                        Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login" className="text-sm font-medium text-ink-600 hover:text-ink-900 transition-colors px-3 py-1.5">
                  Log in
                </Link>
                <Link href="/signup" className="btn-primary !py-2 !px-4 !text-sm">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-cream-100 border-t border-cream-300 px-4 py-4 space-y-1">
          {[
            { href: '/listings', label: 'Listings' },
            { href: '/blog', label: 'Blog' },
            { href: '/wizard', label: 'Build Your Team' },
            ...(user?.isDeveloper ? [{ href: '/sell', label: 'Sell' }] : []),
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="block text-sm font-medium text-ink-700 hover:text-ink-900 py-2.5 transition-colors" onClick={() => setMobileOpen(false)}>
              {label}
            </Link>
          ))}

          <hr className="border-cream-300 my-2" />

          {user ? (
            <>
              <Link href="/dashboard" className="block text-sm font-medium text-ink-700 py-2.5" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <Link href="/settings" className="block text-sm font-medium text-ink-700 py-2.5" onClick={() => setMobileOpen(false)}>Settings</Link>
              <button onClick={handleLogout} className="block w-full text-left text-sm font-medium text-terra-600 py-2.5">Log out</button>
            </>
          ) : (
            <div className="flex gap-3 pt-1">
              <Link href="/login" className="text-sm font-medium text-ink-700 py-2" onClick={() => setMobileOpen(false)}>Log in</Link>
              <Link href="/signup" className="btn-primary !py-2 !px-4 !text-sm" onClick={() => setMobileOpen(false)}>Sign up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
