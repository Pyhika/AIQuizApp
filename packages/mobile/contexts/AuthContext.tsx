import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthService, User } from '../services/authService';
import { useAuthStore } from './useAuthStore';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { setToken, hydrate } = useAuthStore.getState();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      await hydrate();
      const authenticated = await AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const profile = await AuthService.getProfile();
        setUser(profile);
      }
    } catch (error) {
      console.log('認証状態の確認エラー:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await AuthService.login({ email, password });
      setIsAuthenticated(true);
      setUser(response.user);
      await setToken(response.access_token);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => {
    try {
      const response = await AuthService.register(data);
      setIsAuthenticated(true);
      setUser(response.user);
      await setToken(response.access_token);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setIsAuthenticated(false);
      setUser(null);
      await setToken(null);
    } catch (error) {
      console.log('ログアウトエラー:', error);
      // エラーがあってもログアウト状態にする
      setIsAuthenticated(false);
      setUser(null);
      await setToken(null);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
