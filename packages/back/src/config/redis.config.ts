import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  
  // Connection settings
  retryStrategy: (times: number) => {
    return Math.min(times * 50, 2000);
  },
  
  // Queue specific settings
  queue: {
    host: process.env.QUEUE_REDIS_HOST || process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.QUEUE_REDIS_PORT || process.env.REDIS_PORT, 10) || 6379,
  },
  
  // Session settings
  session: {
    ttl: parseInt(process.env.SESSION_TTL, 10) || 86400,
    secret: process.env.SESSION_SECRET || 'session_secret',
  },
}));