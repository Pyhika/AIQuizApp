import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';
import { eventEmitter, AuthEvents } from './eventEmitter';

interface TokenInfo {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

class TokenRefreshManager {
  private static instance: TokenRefreshManager;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private tokenExpiryTimer: ReturnType<typeof setTimeout> | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): TokenRefreshManager {
    if (!this.instance) {
      this.instance = new TokenRefreshManager();
    }
    return this.instance;
  }

  // トークンの有効期限を解析
  private parseTokenExpiry(token: string): number | null {
    try {
      // JWTトークンのペイロードを解析
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      
      // exp（有効期限）フィールドを取得
      if (payload.exp) {
        return payload.exp * 1000; // UNIXタイムスタンプをミリ秒に変換
      }
      
      // iatとexpiresInから計算
      if (payload.iat && payload.expiresIn) {
        return (payload.iat + payload.expiresIn) * 1000;
      }
      
      return null;
    } catch (error) {
      console.error('トークンの解析に失敗しました:', error);
      return null;
    }
  }

  // トークンをセットアップ（リフレッシュタイマーの設定を含む）
  async setupToken(accessToken: string, refreshToken?: string): Promise<void> {
    // 既存のタイマーをクリア
    this.clearTimers();

    // トークンを保存
    await apiClient.setTokens(accessToken, refreshToken);

    // 有効期限を解析
    const expiresAt = this.parseTokenExpiry(accessToken);
    
    if (expiresAt) {
      // トークン情報を保存
      const tokenInfo: TokenInfo = {
        accessToken,
        refreshToken,
        expiresAt
      };
      await AsyncStorage.setItem('tokenInfo', JSON.stringify(tokenInfo));

      // リフレッシュタイマーを設定
      this.scheduleTokenRefresh(expiresAt);
      
      // 有効期限切れタイマーを設定
      this.scheduleTokenExpiry(expiresAt);
    }
  }

  // トークンリフレッシュのスケジューリング
  private scheduleTokenRefresh(expiresAt: number): void {
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    
    // 有効期限の5分前にリフレッシュ（最小1分前）
    const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60 * 1000);
    
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
    }
  }

  // トークン有効期限切れのスケジューリング
  private scheduleTokenExpiry(expiresAt: number): void {
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    
    if (timeUntilExpiry > 0) {
      this.tokenExpiryTimer = setTimeout(() => {
        this.handleTokenExpiry();
      }, timeUntilExpiry);
    }
  }

  // トークンのリフレッシュ
  async refreshToken(): Promise<void> {
    // すでにリフレッシュ中の場合は既存のPromiseを返す
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    
    this.refreshPromise = (async () => {
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('リフレッシュトークンがありません');
        }

        // APIを呼び出してトークンをリフレッシュ
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          throw new Error('トークンのリフレッシュに失敗しました');
        }

        const data = await response.json();
        
        // 新しいトークンをセットアップ
        await this.setupToken(data.accessToken || data.access_token, data.refreshToken || data.refresh_token);
        
        console.log('トークンを正常にリフレッシュしました');
        
        // トークンリフレッシュイベントを発火
        eventEmitter.emit(AuthEvents.TOKEN_REFRESHED);
      } catch (error) {
        console.error('トークンのリフレッシュに失敗しました:', error);
        // リフレッシュに失敗した場合はログアウト
        await this.handleTokenExpiry();
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // トークン有効期限切れの処理
  private async handleTokenExpiry(): Promise<void> {
    console.log('トークンの有効期限が切れました');
    
    // タイマーをクリア
    this.clearTimers();
    
    // トークンをクリア
    await apiClient.clearTokens();
    await AsyncStorage.removeItem('tokenInfo');
    await AsyncStorage.removeItem('auth_user');
    
    // トークン期限切れイベントを発火
    eventEmitter.emit(AuthEvents.TOKEN_EXPIRED, { reason: 'token_expired' });
    
    // セッション期限切れイベントを発火
    eventEmitter.emit(AuthEvents.SESSION_EXPIRED);
  }

  // アプリ起動時の初期化
  async initialize(): Promise<void> {
    try {
      const tokenInfoStr = await AsyncStorage.getItem('tokenInfo');
      
      if (tokenInfoStr) {
        const tokenInfo: TokenInfo = JSON.parse(tokenInfoStr);
        
        if (tokenInfo.expiresAt) {
          const now = Date.now();
          
          if (tokenInfo.expiresAt > now) {
            // トークンがまだ有効な場合
            this.scheduleTokenRefresh(tokenInfo.expiresAt);
            this.scheduleTokenExpiry(tokenInfo.expiresAt);
            
            // 有効期限まで5分以内の場合は即座にリフレッシュ
            if (tokenInfo.expiresAt - now < 5 * 60 * 1000 && tokenInfo.refreshToken) {
              await this.refreshToken();
            }
          } else {
            // トークンが期限切れの場合
            if (tokenInfo.refreshToken) {
              // リフレッシュトークンがある場合は更新を試みる
              await this.refreshToken();
            } else {
              // リフレッシュトークンがない場合はクリア
              await this.handleTokenExpiry();
            }
          }
        }
      }
    } catch (error) {
      console.error('トークンマネージャーの初期化に失敗しました:', error);
    }
  }

  // タイマーのクリア
  private clearTimers(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer);
      this.tokenExpiryTimer = null;
    }
  }

  // クリーンアップ
  cleanup(): void {
    this.clearTimers();
  }
}

export const tokenRefreshManager = TokenRefreshManager.getInstance();