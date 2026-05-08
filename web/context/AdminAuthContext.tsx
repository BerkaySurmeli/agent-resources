import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { API_URL } from '../lib/api';

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  isMasterAdmin: boolean;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AdminUser>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

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

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  // Initialize with null, will load from localStorage after mount
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // This effect runs once on mount (client-side only)
  useEffect(() => {
    setIsClient(true);
    
    // Load admin from localStorage
    const saved = getLocalStorage('ar-admin');
    const token = getLocalStorage('ar-admin-token');
    
    if (saved && token) {
      try {
        const parsedAdmin = JSON.parse(saved);
        setAdmin(parsedAdmin);
      } catch {
        removeLocalStorage('ar-admin');
        removeLocalStorage('ar-admin-token');
      }
    }
    
    setIsLoading(false);
  }, []);

  // Save admin to localStorage whenever it changes
  useEffect(() => {
    if (!isClient) return;
    
    if (admin) {
      setLocalStorage('ar-admin', JSON.stringify(admin));
    } else {
      // Check if we had an admin before clearing
      const hadAdmin = getLocalStorage('ar-admin');
      if (hadAdmin) {
        removeLocalStorage('ar-admin');
        removeLocalStorage('ar-admin-token');
      }
    }
  }, [admin, isClient]);

  const login = async (email: string, password: string): Promise<AdminUser> => {
    const response = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Admin login failed');
    }

    const data = await response.json();
    
    const adminData: AdminUser = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      isMasterAdmin: data.user.is_master_admin,
    };
    
    // Save to localStorage
    setLocalStorage('ar-admin-token', data.access_token);
    setLocalStorage('ar-admin', JSON.stringify(adminData));
    
    // Update state
    setAdmin(adminData);
    
    // Return admin data for immediate use
    return adminData;
  };

  const logout = () => {
    removeLocalStorage('ar-admin');
    removeLocalStorage('ar-admin-token');
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
