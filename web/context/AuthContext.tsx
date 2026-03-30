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
  login: (email: string, password: string) => Promise<void>;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }
    
    try {
      const saved = localStorage.getItem('ar-user');
      const token = localStorage.getItem('ar-token');
      
      if (saved && token) {
        const parsedUser = JSON.parse(saved);
        setUser(parsedUser);
      }
    } catch (err) {
      console.error('Failed to parse saved user:', err);
      // Don't clear on parse error - might be temporary
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage when user changes (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (user) {
      localStorage.setItem('ar-user', JSON.stringify(user));
    } else {
      // Only clear if we have a user to begin with (not on initial load)
      const hasExistingUser = localStorage.getItem('ar-user');
      if (hasExistingUser) {
        localStorage.removeItem('ar-user');
        localStorage.removeItem('ar-token');
      }
    }
  }, [user]);

  const login = async (email: string, password: string) => {
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
    console.log('Login response:', data);
    
    const userData = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name || email.split('@')[0],
      initials: getInitials(data.user.name || email.split('@')[0]),
      isDeveloper: data.user.is_developer,
      isVerified: data.user.is_verified,
    };
    
    // Save to localStorage BEFORE setting state
    localStorage.setItem('ar-token', data.access_token);
    localStorage.setItem('ar-user', JSON.stringify(userData));
    
    console.log('Setting user:', userData);
    setUser(userData);
  };

  const signup = async (email: string, password: string, name: string) => {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

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
    
    // Save to localStorage BEFORE setting state
    localStorage.setItem('ar-token', data.access_token);
    localStorage.setItem('ar-user', JSON.stringify(userData));
    
    setUser(userData);
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
