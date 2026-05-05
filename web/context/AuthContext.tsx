import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { API_URL } from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  avatarUrl?: string;
  initials: string;
  isDeveloper: boolean;
  isVerified?: boolean;
  profileSlug?: string;
  bio?: string;
  website?: string;
  twitter?: string;
  github?: string;
  isPro?: boolean;
  commissionFree?: boolean;
  commissionFreeUntil?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string, name: string, inviteCode?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generate initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Helper to safely get localStorage value
function getLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// Helper to safely set localStorage value
function setLocalStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore errors
  }
}

// Helper to safely remove localStorage value
function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore errors
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize with null, will load from localStorage after mount
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // This effect runs once on mount (client-side only)
  useEffect(() => {
    setIsClient(true);
    
    // Load user from localStorage
    const saved = getLocalStorage('ar-user');
    const token = getLocalStorage('ar-token');
    
    if (saved && token) {
      try {
        const parsedUser = JSON.parse(saved);
        setUser(parsedUser);
      } catch {
        removeLocalStorage('ar-user');
        removeLocalStorage('ar-token');
      }
    }
    
    setIsLoading(false);
  }, []);

  // Listen for storage changes (e.g., when verify-email page updates localStorage)
  useEffect(() => {
    if (!isClient) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ar-user') {
        if (e.newValue) {
          try {
            const parsedUser = JSON.parse(e.newValue);
            setUser(parsedUser);
          } catch {
            // ignore malformed storage event
          }
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isClient]);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (!isClient) return;
    
    if (user) {
      setLocalStorage('ar-user', JSON.stringify(user));
    } else {
      // Check if we had a user before clearing
      const hadUser = getLocalStorage('ar-user');
      if (hadUser) {
        removeLocalStorage('ar-user');
        removeLocalStorage('ar-token');
      }
    }
  }, [user, isClient]);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    
    const userData: User = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name || email.split('@')[0],
      initials: getInitials(data.user.name || email.split('@')[0]),
      isDeveloper: data.user.is_developer,
      isVerified: data.user.is_verified,
    };
    
    // Save to localStorage
    setLocalStorage('ar-token', data.access_token);
    setLocalStorage('ar-user', JSON.stringify(userData));
    
    // Update state
    setUser(userData);
    
    // Return user data for immediate use
    return userData;
  };

  const signup = async (email: string, password: string, name: string, inviteCode?: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, ...(inviteCode ? { invite_code: inviteCode } : {}) }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Signup failed');
      }

      const data = await response.json();

      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || name,
        initials: getInitials(data.user.name || name),
        isDeveloper: data.user.is_developer,
        isVerified: data.user.is_verified,
      };

      // Save to localStorage
      setLocalStorage('ar-token', data.access_token);
      setLocalStorage('ar-user', JSON.stringify(userData));

      // Update state
      setUser(userData);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    removeLocalStorage('ar-token');
    removeLocalStorage('ar-user');
  };

  const updateProfile = async (data: Partial<User>) => {
    const token = getLocalStorage('ar-token');
    if (!token || !user) return;

    const payload: Record<string, string | undefined> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.bio !== undefined) payload.bio = data.bio;
    if (data.website !== undefined) payload.website = data.website;
    if (data.twitter !== undefined) payload.twitter = data.twitter;
    if (data.github !== undefined) payload.github = data.github;
    if (data.profileSlug !== undefined) payload.profile_slug = data.profileSlug;

    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to update profile');
    }

    const saved = await response.json();
    const updated: User = {
      ...user,
      name: saved.name ?? user.name,
      initials: getInitials(saved.name ?? user.name),
      bio: saved.bio ?? user.bio,
      website: saved.website ?? user.website,
      twitter: saved.twitter ?? user.twitter,
      github: saved.github ?? user.github,
      profileSlug: saved.profile_slug ?? user.profileSlug,
      avatarUrl: saved.avatar_url ?? user.avatarUrl,
    };
    setUser(updated);
  };

  const refreshUser = async () => {
    const token = getLocalStorage('ar-token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/auth/validate`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const userData: User = {
          id: data.id,
          email: data.email,
          name: data.name || data.email.split('@')[0],
          initials: getInitials(data.name || data.email.split('@')[0]),
          isDeveloper: data.is_developer,
          isVerified: data.is_verified,
          avatarUrl: data.avatar_url,
          profileSlug: data.profile_slug,
          bio: data.bio,
          website: data.website,
          twitter: data.twitter,
          github: data.github,
          isPro: data.is_pro,
          commissionFree: data.commission_free,
          commissionFreeUntil: data.commission_free_until,
        };
        setUser(userData);
        setLocalStorage('ar-user', JSON.stringify(userData));
      }
    } catch {
      // user remains at current cached state
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
