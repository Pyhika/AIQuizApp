import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import * as session from 'express-session';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private helmet: any;
  private session: any;

  constructor(private configService: ConfigService) {
    // Configure Helmet
    this.helmet = helmet(this.configService.get('security.helmet'));

    // Configure Session
    this.session = session(this.configService.get('security.session'));
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Apply Helmet
    this.helmet(req, res, () => {
      // Apply Session
      this.session(req, res, () => {
        // Add security headers
        const headers = this.configService.get('security.headers');
        Object.keys(headers).forEach(header => {
          res.setHeader(header, headers[header]);
        });

        // Remove sensitive headers
        res.removeHeader('X-Powered-By');
        res.removeHeader('Server');

        // Add request ID for tracking
        req['requestId'] = this.generateRequestId();

        next();
      });
    });
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}