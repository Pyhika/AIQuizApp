import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  name: process.env.APP_NAME || 'AIQuizApp',
  port: parseInt(process.env.PORT || '3000', 10),
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
    path: process.env.SWAGGER_PATH || 'api-docs',
  },
  
  fileUpload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['.pdf', '.txt', '.docx', '.jpg', '.jpeg', '.png'],
  },
  
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_S3_REGION,
    },
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: process.env.LOG_FORMAT || 'json',
  },
  
  sentry: {
    dsn: process.env.SENTRY_DSN,
    enabled: !!process.env.SENTRY_DSN,
  },
}));