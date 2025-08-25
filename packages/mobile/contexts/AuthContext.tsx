import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import { AuthService, User } from '../services/authService';
import { useAuthStore } from './useAuthStore';
import { tokenRefreshManager } from '../services/tokenRefreshManager';
import { eventEmitter, AuthEvents } from '../services/eventEmitter';
import { router } from 'expo-router';

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
    initializeAuth();
    
    // トークン期限切れイベントをリッスン
    const unsubscribeTokenExpired = eventEmitter.on(AuthEvents.TOKEN_EXPIRED, handleTokenExpired);
    const unsubscribeSessionExpired = eventEmitter.on(AuthEvents.SESSION_EXPIRED, handleSessionExpired);
    
    // クリーンアップ
    return () => {
      tokenRefreshManager.cleanup();
      unsubscribeTokenExpired();
      unsubscribeSessionExpired();
    };
  }, []);
  
  const initializeAuth = async () => {
    await checkAuthStatus();
    // トークンリフレッシュマネージャーを初期化
    await tokenRefreshManager.initialize();
  };
  
  const handleTokenExpired = (data: { reason: string }) => {
    console.log('トークンの有効期限が切れました:', data.reason);
    // 自動ログアウト
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    Alert.alert(
      'セッション期限切れ',
      '認証の有効期限が切れました。再度ログインしてください。',
      [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
    );
  };
  
  const handleSessionExpired = () => {
    console.log('セッションの有効期限が切れました');
    // 必要に応じて追加の処理
  };

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
      
      // トークンリフレッシュマネージャーをセットアップ
      await tokenRefreshManager.setupToken(
        response.access_token,
        response.refresh_token
      );
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
      
      // トークンリフレッシュマネージャーをセットアップ
      await tokenRefreshManager.setupToken(
        response.access_token,
        response.refresh_token
      );
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
      
      // トークンリフレッシュマネージャーをクリーンアップ
      tokenRefreshManager.cleanup();
      
      // ログイン画面にリダイレクト
      router.replace('/auth/login');
    } catch (error) {
      console.log('ログアウトエラー:', error);
      // エラーがあってもログアウト状態にする
      setIsAuthenticated(false);
      setUser(null);
      await setToken(null);
      tokenRefreshManager.cleanup();
      router.replace('/auth/login');
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
