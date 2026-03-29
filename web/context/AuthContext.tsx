import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  initials: string;
  isDeveloper: boolean;
  verified: boolean;
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

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ar-user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {}
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('ar-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ar-user');
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    // TODO: Replace with actual API call
    // For now, simulate login
    const mockUser: User = {
      id: '1',
      email,
      name: email.split('@')[0],
      initials: getInitials(email.split('@')[0]),
      isDeveloper: true,
      verified: false,
    };
    setUser(mockUser);
  };

  const signup = async (email: string, password: string, name: string) => {
    // TODO: Replace with actual API call
    const mockUser: User = {
      id: Date.now().toString(),
      email,
      name,
      initials: getInitials(name),
      isDeveloper: true,
      verified: false,
    };
    setUser(mockUser);
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
