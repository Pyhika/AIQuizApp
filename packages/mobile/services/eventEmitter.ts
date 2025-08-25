type EventListener = (...args: any[]) => void;

class EventEmitter {
  private events: Map<string, Set<EventListener>> = new Map();

  on(event: string, listener: EventListener): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    
    this.events.get(event)!.add(listener);

    // 登録解除関数を返す
    return () => {
      this.off(event, listener);
    };
  }

  off(event: string, listener: EventListener): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.events.delete(event);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  once(event: string, listener: EventListener): () => void {
    const onceListener = (...args: any[]) => {
      this.off(event, onceListener);
      listener(...args);
    };
    
    return this.on(event, onceListener);
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  listenerCount(event: string): number {
    const listeners = this.events.get(event);
    return listeners ? listeners.size : 0;
  }
}

// シングルトンインスタンス
export const eventEmitter = new EventEmitter();

// 認証関連のイベント定義
export const AuthEvents = {
  LOGIN: 'auth:login',
  LOGOUT: 'auth:logout',
  TOKEN_EXPIRED: 'auth:token_expired',
  TOKEN_REFRESHED: 'auth:token_refreshed',
  SESSION_EXPIRED: 'auth:session_expired',
} as const;