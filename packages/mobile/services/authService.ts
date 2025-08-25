import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, api, ApiError, NetworkError } from './api';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: User;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  private static USER_KEY = 'auth_user';

  static async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.auth.register(data) as AuthResponse;
      
      // トークンとユーザー情報を保存
      await apiClient.setTokens(response.access_token, response.refresh_token);
      await this.storeUser(response.user);
      
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.data?.message || error.message);
      }
      if (error instanceof NetworkError) {
        throw new Error('ネットワークエラー: インターネット接続を確認してください');
      }
      throw new Error('登録に失敗しました');
    }
  }

  static async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.auth.login(data.email, data.password) as AuthResponse;
      
      // トークンとユーザー情報を保存
      await apiClient.setTokens(response.access_token, response.refresh_token);
      await this.storeUser(response.user);
      
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.statusCode === 401) {
          throw new Error('メールアドレスまたはパスワードが正しくありません');
        }
        throw new Error(error.data?.message || error.message);
      }
      if (error instanceof NetworkError) {
        throw new Error('ネットワークエラー: インターネット接続を確認してください');
      }
      throw new Error('ログインに失敗しました');
    }
  }

  static async logout(): Promise<void> {
    try {
      await api.auth.logout();
    } catch (error) {
      console.log('ログアウトエラー:', error);
    } finally {
      // ローカルストレージをクリア
      await apiClient.clearTokens();
      await AsyncStorage.removeItem(this.USER_KEY);
    }
  }

  static async getProfile(): Promise<User> {
    try {
      const user = await api.auth.profile() as User;
      await this.storeUser(user);
      return user;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        await this.logout();
        throw new Error('認証が無効です。再度ログインしてください');
      }
      if (error instanceof NetworkError) {
        // オフライン時はローカルのユーザー情報を返す
        const localUser = await this.getStoredUser();
        if (localUser) {
          return localUser;
        }
        throw new Error('ネットワークエラー: インターネット接続を確認してください');
      }
      throw new Error('プロフィールの取得に失敗しました');
    }
  }

  static async getToken(): Promise<string | null> {
    return await apiClient.getAccessToken();
  }

  static async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  static async getStoredUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  private static async storeUser(user: User): Promise<void> {
    await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }
}
