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
    // Force a page refresh to ensure all components update
    window.location.href = '/';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-b border-white/10 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <Logo variant="full" size="md" textClassName="text-white group-hover:text-blue-400 transition-colors" />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/listings"
              className={`text-sm transition-colors ${router.pathname.startsWith('/listings') ? 'text-white font-medium' : 'text-slate-400 hover:text-white'}`}
            >
              Listings
            </Link>
            <Link
              href="/blog"
              className={`text-sm transition-colors ${router.pathname === '/blog' ? 'text-white font-medium' : 'text-slate-400 hover:text-white'}`}
            >
              Blog
            </Link>
            <Link
              href="/wizard"
              className={`text-sm transition-colors ${router.pathname === '/wizard' ? 'text-white font-medium' : 'text-slate-400 hover:text-white'}`}
            >
              Build Your Team
            </Link>
            {user?.isDeveloper && (
              <Link
                href="/sell"
                className={`text-sm transition-colors ${router.pathname === '/sell' ? 'text-white font-medium' : 'text-slate-400 hover:text-white'}`}
              >
                Sell
              </Link>
            )}
          </div>

          {/* Cart & User Section */}
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-slate-300 hover:text-white transition-colors"
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
            <Link href="/cart" className="relative p-2 text-slate-300 hover:text-white transition-colors">
              <CartIcon />
            </Link>
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {user.initials}
                  </div>
                  <span className="hidden sm:block">{user.name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 py-1">
                      <Link 
                        href="/dashboard" 
                        className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        href="/settings" 
                        className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Settings
                      </Link>
                      <div className="border-t border-slate-700 my-1" />
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/login" 
                  className="text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link 
                  href="/signup" 
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-900/95 border-t border-white/10 px-4 py-4 space-y-3">
          <Link href="/listings" className="block text-sm text-slate-300 hover:text-white transition-colors py-2" onClick={() => setMobileOpen(false)}>
            Listings
          </Link>
          <Link href="/blog" className="block text-sm text-slate-300 hover:text-white transition-colors py-2" onClick={() => setMobileOpen(false)}>
            Blog
          </Link>
          <Link href="/wizard" className="block text-sm gradient-flow-text hover:opacity-80 transition-opacity py-2" onClick={() => setMobileOpen(false)}>
            Build Your Team
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="block text-sm text-slate-300 hover:text-white transition-colors py-2" onClick={() => setMobileOpen(false)}>
                Dashboard
              </Link>
              <Link href="/settings" className="block text-sm text-slate-300 hover:text-white transition-colors py-2" onClick={() => setMobileOpen(false)}>
                Settings
              </Link>
              <button onClick={handleLogout} className="block w-full text-left text-sm text-red-400 hover:text-red-300 transition-colors py-2">
                Logout
              </button>
            </>
          ) : (
            <div className="flex gap-3 pt-2">
              <Link href="/login" className="text-sm text-slate-300 hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>
                Log In
              </Link>
              <Link href="/signup" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors" onClick={() => setMobileOpen(false)}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
