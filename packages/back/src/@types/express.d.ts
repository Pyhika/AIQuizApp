import 'express';
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    csrfToken?: string;
    userId?: string;
  }
}

declare module 'express' {
  interface Request {
    user?: {
      id: string;
      userId?: string;
      email: string;
      sub?: string;
    } & any;
    session?: {
      csrfToken?: string;
      userId?: string;
      [key: string]: any;
    };
    requestId?: string;
  }
}