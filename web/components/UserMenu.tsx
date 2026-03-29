import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/login" className="text-slate-600 hover:text-slate-900">
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
      <Link 
        href="/dashboard" 
        className="text-slate-600 hover:text-slate-900 text-sm font-medium"
      >
        Dashboard
      </Link>
      <Link 
        href="/sell" 
        className="text-slate-600 hover:text-slate-900 text-sm font-medium"
      >
        Sell
      </Link>
      <Link href="/profile" className="flex items-center gap-2">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user.initials}
          </div>
        )}
      </Link>
    </div>
  );
}
