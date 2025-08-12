interface Environment {
  API_URL: string;
  WS_URL: string;
  ENV: 'development' | 'staging' | 'production';
  DEBUG: boolean;
  SENTRY_DSN?: string;
  GOOGLE_MAPS_API_KEY?: string;
  ONESIGNAL_APP_ID?: string;
  AMPLITUDE_API_KEY?: string;
}

const ENV = {
  development: {
    API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
    WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000',
    ENV: 'development' as const,
    DEBUG: true,
  },
  staging: {
    API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://staging-api.aiquizapp.com',
    WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'wss://staging-api.aiquizapp.com',
    ENV: 'staging' as const,
    DEBUG: true,
    SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
    AMPLITUDE_API_KEY: process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY,
  },
  production: {
    API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.aiquizapp.com',
    WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'wss://api.aiquizapp.com',
    ENV: 'production' as const,
    DEBUG: false,
    SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
    GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    ONESIGNAL_APP_ID: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID,
    AMPLITUDE_API_KEY: process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY,
  },
};

const getEnvironment = (): Environment => {
  const env = process.env.EXPO_PUBLIC_ENV || 'development';

  if (env === 'production') {
    return ENV.production;
  } else if (env === 'staging') {
    return ENV.staging;
  }

  return ENV.development;
};

export const Config = getEnvironment();

// Helper functions
export const isProduction = () => Config.ENV === 'production';
export const isDevelopment = () => Config.ENV === 'development';
export const isStaging = () => Config.ENV === 'staging';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${Config.API_URL}/auth/login`,
  REGISTER: `${Config.API_URL}/auth/register`,
  REFRESH: `${Config.API_URL}/auth/refresh`,
  PROFILE: `${Config.API_URL}/auth/profile`,
  LOGOUT: `${Config.API_URL}/auth/logout`,

  // Quizzes
  QUIZZES: `${Config.API_URL}/quizzes`,
  QUIZ_BY_ID: (id: string) => `${Config.API_URL}/quizzes/${id}`,
  QUIZ_CREATE: `${Config.API_URL}/quizzes`,
  QUIZ_UPDATE: (id: string) => `${Config.API_URL}/quizzes/${id}`,
  QUIZ_DELETE: (id: string) => `${Config.API_URL}/quizzes/${id}`,
  QUIZ_GENERATE: `${Config.API_URL}/quizzes/generate`,

  // Quiz Attempts
  ATTEMPTS: `${Config.API_URL}/quiz-attempts`,
  ATTEMPT_BY_ID: (id: string) => `${Config.API_URL}/quiz-attempts/${id}`,
  ATTEMPT_CREATE: `${Config.API_URL}/quiz-attempts`,
  ATTEMPT_SUBMIT: (id: string) => `${Config.API_URL}/quiz-attempts/${id}/submit`,

  // Learning
  LEARNING_STATS: `${Config.API_URL}/learning/stats`,
  LEARNING_PROGRESS: `${Config.API_URL}/learning/progress`,
  LEARNING_RECOMMENDATIONS: `${Config.API_URL}/learning/recommendations`,

  // AI
  AI_CHAT: `${Config.API_URL}/ai/chat`,
  AI_GENERATE_QUIZ: `${Config.API_URL}/ai/generate-quiz`,
  AI_EXPLAIN: `${Config.API_URL}/ai/explain`,

  // Upload
  UPLOAD_FILE: `${Config.API_URL}/upload/file`,
  UPLOAD_IMAGE: `${Config.API_URL}/upload/image`,
};

export default Config;
