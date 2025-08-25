import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// API設定
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1秒

// カスタムエラークラス
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'ネットワークに接続できません') {
    super(message);
    this.name = 'NetworkError';
  }
}

// リトライ可能なエラーかどうかを判定
const isRetryableError = (error: any): boolean => {
  if (error instanceof NetworkError) return true;
  if (error instanceof ApiError) {
    return [408, 429, 500, 502, 503, 504].includes(error.statusCode);
  }
  return false;
};

// 指数バックオフによる遅延
const getRetryDelay = (attempt: number): number => {
  return RETRY_DELAY * Math.pow(2, attempt);
};

// トークン管理
class TokenManager {
  private static accessToken: string | null = null;
  private static refreshToken: string | null = null;

  static async getAccessToken(): Promise<string | null> {
    if (!this.accessToken) {
      this.accessToken = await AsyncStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  static async getRefreshToken(): Promise<string | null> {
    if (!this.refreshToken) {
      this.refreshToken = await AsyncStorage.getItem('refreshToken');
    }
    return this.refreshToken;
  }

  static async setTokens(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    await AsyncStorage.setItem('accessToken', accessToken);
    
    if (refreshToken) {
      this.refreshToken = refreshToken;
      await AsyncStorage.setItem('refreshToken', refreshToken);
    }
  }

  static async clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
  }

  static async refreshAccessToken(): Promise<string | null> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new ApiError(response.status, 'トークンの更新に失敗しました');
      }

      const data = await response.json();
      await this.setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch (error) {
      await this.clearTokens();
      throw error;
    }
  }
}

// APIクライアント
export class ApiClient {
  private static instance: ApiClient;

  private constructor() {}

  static getInstance(): ApiClient {
    if (!this.instance) {
      this.instance = new ApiClient();
    }
    return this.instance;
  }

  // ネットワーク状態のチェック
  private async checkNetwork(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected === true;
  }

  // リクエストの実行（リトライロジック付き）
  private async executeRequest(
    url: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<Response> {
    try {
      // ネットワーク接続チェック
      const isConnected = await this.checkNetwork();
      if (!isConnected) {
        throw new NetworkError();
      }

      const response = await fetch(url, options);

      // 401エラーの場合、トークンをリフレッシュして再試行
      if (response.status === 401 && retryCount === 0) {
        const newToken = await TokenManager.refreshAccessToken();
        if (newToken) {
          options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
          };
          return this.executeRequest(url, options, retryCount + 1);
        }
      }

      return response;
    } catch (error) {
      // リトライ可能なエラーの場合
      if (isRetryableError(error) && retryCount < MAX_RETRIES) {
        const delay = getRetryDelay(retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeRequest(url, options, retryCount + 1);
      }
      throw error;
    }
  }

  // 共通のリクエストメソッド
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = await TokenManager.getAccessToken();

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const finalOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await this.executeRequest(url, finalOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errorData.message || `エラーが発生しました (${response.status})`,
          errorData
        );
      }

      // 204 No Content の場合
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError || error instanceof NetworkError) {
        throw error;
      }
      throw new NetworkError('予期しないエラーが発生しました');
    }
  }

  // GET リクエスト
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          searchParams.append(key, params[key].toString());
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  // POST リクエスト
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT リクエスト
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH リクエスト
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE リクエスト
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ファイルアップロード用
  async uploadFile<T>(
    endpoint: string,
    formData: FormData
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = await TokenManager.getAccessToken();

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await this.executeRequest(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errorData.message || `アップロードに失敗しました (${response.status})`,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError || error instanceof NetworkError) {
        throw error;
      }
      throw new NetworkError('ファイルのアップロードに失敗しました');
    }
  }

  // トークン管理メソッドをエクスポート
  setTokens = TokenManager.setTokens.bind(TokenManager);
  clearTokens = TokenManager.clearTokens.bind(TokenManager);
  getAccessToken = TokenManager.getAccessToken.bind(TokenManager);
}

// シングルトンインスタンスをエクスポート
export const apiClient = ApiClient.getInstance();

// 便利なヘルパー関数
export const api = {
  auth: {
    login: (email: string, password: string) => 
      apiClient.post('/auth/login', { email, password }),
    register: (data: any) => 
      apiClient.post('/auth/register', data),
    logout: () => 
      apiClient.post('/auth/logout'),
    profile: () => 
      apiClient.get('/auth/profile'),
    refresh: (refreshToken: string) => 
      apiClient.post('/auth/refresh', { refreshToken }),
  },
  quiz: {
    list: (params?: any) => 
      apiClient.get('/quiz', params),
    get: (id: string) => 
      apiClient.get(`/quiz/${id}`),
    create: (data: any) => 
      apiClient.post('/quiz', data),
    update: (id: string, data: any) => 
      apiClient.put(`/quiz/${id}`, data),
    delete: (id: string) => 
      apiClient.delete(`/quiz/${id}`),
    search: (params: any) => 
      apiClient.get('/quiz/search', params),
    generateFromPdf: (formData: FormData) => 
      apiClient.uploadFile('/quiz/generate/pdf', formData),
    generateFromImage: (formData: FormData) => 
      apiClient.uploadFile('/quiz/generate/image', formData),
    metadata: {
      categories: () => 
        apiClient.get('/quiz/metadata/categories'),
      tags: () => 
        apiClient.get('/quiz/metadata/tags'),
    },
  },
  quizAttempt: {
    create: (data: any) => 
      apiClient.post('/quiz-attempt', data),
    submit: (id: string, data: any) => 
      apiClient.post(`/quiz-attempt/${id}/submit`, data),
    dashboard: (userId: string) => 
      apiClient.get(`/quiz-attempt/dashboard/${userId}`),
    history: (userId: string, limit?: number) => 
      apiClient.get(`/quiz-attempt/history/${userId}`, { limit }),
  },
  ai: {
    chat: (message: string, context?: any) => 
      apiClient.post('/ai/chat', { message, context }),
  },
};