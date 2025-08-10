import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  // Helmet configuration
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  },

  // CORS configuration
  cors: {
    origin: (origin: string, callback: Function) => {
      const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-CSRF-Token'],
    maxAge: 86400,
  },

  // Rate limiting
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60000, // milliseconds
    limit: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    skipIf: (context: any) => {
      // Skip rate limiting for health checks
      return context.req.url === '/health';
    },
  },

  // Throttle configuration (per endpoint)
  throttle: {
    default: {
      ttl: 60000,
      limit: 100,
    },
    auth: {
      ttl: 60000,
      limit: 5, // Strict limit for auth endpoints
    },
    api: {
      ttl: 60000,
      limit: 50,
    },
  },

  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict' as const,
    },
  },

  // CSRF configuration
  csrf: {
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict' as const,
    },
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
    value: (req: any) => req.headers['x-csrf-token'] || req.body._csrf,
  },

  // Password policy
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // Token configuration
  tokens: {
    access: {
      secret: process.env.JWT_SECRET || 'change-this-secret',
      expiresIn: process.env.JWT_EXPIRATION || '15m',
    },
    refresh: {
      secret: process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret',
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    },
    passwordReset: {
      expiresIn: '1h',
    },
    emailVerification: {
      expiresIn: '24h',
    },
  },

  // Input validation
  validation: {
    maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
    maxUrlLength: 2048,
    maxParameterCount: 100,
    forbiddenPatterns: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
    ],
  },

  // Security headers
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },

  // Encryption
  encryption: {
    algorithm: 'aes-256-gcm',
    key: process.env.ENCRYPTION_KEY || 'generate-32-byte-key-for-production',
  },

  // Audit logging
  audit: {
    enabled: process.env.AUDIT_LOGGING === 'true',
    events: [
      'login',
      'logout',
      'password-change',
      'profile-update',
      'quiz-create',
      'quiz-delete',
      'admin-action',
    ],
  },
}));