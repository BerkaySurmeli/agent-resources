import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  initials: string;
  isDeveloper: boolean;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
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
      } catch (err) {
        console.error('Failed to parse saved user:', err);
        // Clear invalid data
        removeLocalStorage('ar-user');
        removeLocalStorage('ar-token');
      }
    }
    
    setIsLoading(false);
  }, []);

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

  const signup = async (email: string, password: string, name: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
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
  };

  const updateProfile = async (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      if (data.name && !data.initials) {
        updated.initials = getInitials(data.name);
      }
      setUser(updated);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateProfile }}>
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
