import AsyncStorage from '@react-native-async-storage/async-storage';

// EXPO_PUBLIC_API_URL を優先。未設定時はローカル開発デフォルトにフォールバック
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  access_token: string;
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
  private static TOKEN_KEY = 'auth_token';

  static async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || '登録に失敗しました');
    }

    const authResponse: AuthResponse = await response.json();
    await this.storeToken(authResponse.access_token);
    return authResponse;
  }

  static async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'ログインに失敗しました');
    }

    const authResponse: AuthResponse = await response.json();
    await this.storeToken(authResponse.access_token);
    return authResponse;
  }

  static async logout(): Promise<void> {
    await AsyncStorage.removeItem(this.TOKEN_KEY);
    // バックエンドのログアウトエンドポイントを呼ぶ（オプション）
    const token = await this.getToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.log('ログアウトエラー:', error);
      }
    }
  }

  static async getProfile(): Promise<User> {
    const token = await this.getToken();
    if (!token) {
      throw new Error('認証トークンがありません');
    }

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.logout();
        throw new Error('認証が無効です');
      }
      throw new Error('プロフィールの取得に失敗しました');
    }

    return await response.json();
  }

  static async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(this.TOKEN_KEY);
  }

  static async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  private static async storeToken(token: string): Promise<void> {
    await AsyncStorage.setItem(this.TOKEN_KEY, token);
  }
}
