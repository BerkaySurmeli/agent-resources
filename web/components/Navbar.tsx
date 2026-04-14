import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export default function Navbar() {
  const { user, logout } = useAuth();

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
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Listings
            </Link>
            <Link 
              href="/wizard" 
              className="text-sm gradient-flow-text hover:opacity-80 transition-opacity"
            >
              Build Your Team
            </Link>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link 
                  href="/settings" 
                  className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {user.initials}
                  </div>
                  <span className="hidden sm:block">{user.name}</span>
                </Link>
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
    </nav>
  );
}
