import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
          Sign In
        </Link>
        <Link 
          href="/signup" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Developer features - shown to all users */}
      <Link
        href="/sell"
        className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
      >
        List an Item
      </Link>
      
      {/* Dropdown menu for user */}
      <div className="relative group">
        <button className="flex items-center gap-2">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border border-gray-700"
            />
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user.initials}
            </div>
          )}
        </button>
        
        {/* Dropdown */}
        <div className="absolute end-0 top-full mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <div className="py-2">
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              Profile
            </Link>
            <Link
              href="/dashboard"
              className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              Developer Dashboard
            </Link>
            <hr className="my-2 border-gray-700" />
            <button
              onClick={logout}
              className="block w-full text-start px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
