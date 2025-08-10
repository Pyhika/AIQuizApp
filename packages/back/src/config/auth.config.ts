import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwt: {
    secret: process.env.JWT_SECRET || 'jwt_secret',
    expiration: process.env.JWT_EXPIRATION || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '30d',
  },
  
  bcrypt: {
    saltRounds: 10,
  },
  
  session: {
    secret: process.env.SESSION_SECRET || 'session_secret',
    ttl: parseInt(process.env.SESSION_TTL, 10) || 86400,
  },
  
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
    },
  },
}));