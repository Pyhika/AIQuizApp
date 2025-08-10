import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class TokenBlacklistService implements OnModuleDestroy {
  private redis: Redis;
  private readonly PREFIX = 'blacklist:';
  private readonly REFRESH_PREFIX = 'refresh:';

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('redis.host'),
      port: this.configService.get('redis.port'),
      password: this.configService.get('redis.password'),
      db: this.configService.get('redis.db') || 1, // Use separate DB for tokens
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  /**
   * Add a token to the blacklist
   */
  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    const key = `${this.PREFIX}${token}`;
    await this.redis.setex(key, expiresIn, 'blacklisted');
  }

  /**
   * Check if a token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const key = `${this.PREFIX}${token}`;
    const result = await this.redis.get(key);
    return result === 'blacklisted';
  }

  /**
   * Store refresh token
   */
  async storeRefreshToken(
    userId: string,
    refreshToken: string,
    expiresIn: number
  ): Promise<void> {
    const key = `${this.REFRESH_PREFIX}${userId}`;
    await this.redis.setex(key, expiresIn, refreshToken);
  }

  /**
   * Get refresh token for user
   */
  async getRefreshToken(userId: string): Promise<string | null> {
    const key = `${this.REFRESH_PREFIX}${userId}`;
    return await this.redis.get(key);
  }

  /**
   * Revoke refresh token for user
   */
  async revokeRefreshToken(userId: string): Promise<void> {
    const key = `${this.REFRESH_PREFIX}${userId}`;
    await this.redis.del(key);
  }

  /**
   * Revoke all tokens for a user (e.g., on password change)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    // Get all tokens for this user (would need to maintain a separate index)
    const pattern = `${this.PREFIX}user:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }

    // Also revoke refresh token
    await this.revokeRefreshToken(userId);
  }

  /**
   * Clean up expired tokens (can be run periodically)
   */
  async cleanup(): Promise<number> {
    // Redis automatically removes expired keys, but we can force cleanup
    const pattern = `${this.PREFIX}*`;
    const keys = await this.redis.keys(pattern);
    let cleaned = 0;

    for (const key of keys) {
      const ttl = await this.redis.ttl(key);
      if (ttl === -1) {
        // Key exists but has no expiration (shouldn't happen)
        await this.redis.del(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}