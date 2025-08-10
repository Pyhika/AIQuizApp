import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly TOKEN_LENGTH = 32;
  private readonly COOKIE_NAME = 'csrf-token';
  private readonly HEADER_NAME = 'x-csrf-token';
  private readonly SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for safe methods
    if (this.SAFE_METHODS.includes(req.method)) {
      // Generate and set token for GET requests
      if (req.method === 'GET') {
        this.generateToken(req, res);
      }
      return next();
    }

    // For state-changing requests, validate CSRF token
    if (!this.validateToken(req)) {
      throw new ForbiddenException('Invalid or missing CSRF token');
    }

    next();
  }

  private generateToken(req: Request, res: Response): string {
    const token = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');

    // Store in session
    if (req.session) {
      req.session.csrfToken = token;
    }

    // Set as cookie
    res.cookie(this.COOKIE_NAME, token, {
      httpOnly: false, // Must be readable by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Also set as response header
    res.setHeader('X-CSRF-Token', token);

    return token;
  }

  private validateToken(req: Request): boolean {
    // Get token from session
    const sessionToken = req.session?.csrfToken;
    if (!sessionToken) {
      return false;
    }

    // Get token from request (header or body)
    const requestToken =
      (req.headers[this.HEADER_NAME] as string) ||
      req.body?._csrf ||
      (req.query?._csrf as string);

    if (!requestToken) {
      return false;
    }

    // Timing-safe comparison
    return this.timingSafeEqual(sessionToken, requestToken);
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);

    return crypto.timingSafeEqual(bufferA, bufferB);
  }
}
