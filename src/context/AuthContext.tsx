import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authAPI } from '../services/api';

// ========================
// Types
// ========================
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'donor' | 'hospital';
  bloodGroup?: string;
  phone?: string;
  organizationName?: string;
  isActive: boolean;
  donationCount?: number;
  lastLogin?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
  bloodGroup?: string;
  phone?: string;
  organizationName?: string;
}

// ========================
// Context
// ========================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ========================
// Provider
// ========================
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vp_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('vp_access_token')
  );
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Verify token on initial load
  useEffect(() => {
    const verifyAuth = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const { data } = await authAPI.getMe();
        const userData = data.data;
        setUser(userData);
        localStorage.setItem('vp_user', JSON.stringify(userData));
      } catch {
        // Token invalid, clear auth
        setUser(null);
        setToken(null);
        localStorage.removeItem('vp_access_token');
        localStorage.removeItem('vp_user');
      } finally {
        setIsLoading(false);
      }
    };
    verifyAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authAPI.login(email, password);
    const { user: userData, accessToken } = data.data;
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('vp_access_token', accessToken);
    localStorage.setItem('vp_user', JSON.stringify(userData));
  }, []);

  const register = useCallback(async (registerData: RegisterData) => {
    const { data } = await authAPI.register(registerData);
    const { user: userData, accessToken } = data.data;
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('vp_access_token', accessToken);
    localStorage.setItem('vp_user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Continue even if API call fails
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('vp_access_token');
    localStorage.removeItem('vp_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ========================
// Hook
// ========================
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
