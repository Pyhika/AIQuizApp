import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenBlacklistService } from '../services/token-blacklist.service';

@Injectable()
export class EnhancedJwtAuthGuard extends AuthGuard('jwt') {
  constructor(private tokenBlacklistService: TokenBlacklistService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, run the default JWT validation
    const result = await super.canActivate(context);
    if (!result) {
      return false;
    }

    // Get the request and extract the token
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    // Check if token is blacklisted
    const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Additional security checks
    this.performSecurityChecks(request);

    return true;
  }

  private extractTokenFromHeader(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }

  private performSecurityChecks(request: any): void {
    // Check for suspicious patterns
    const userAgent = request.headers['user-agent'];
    if (!userAgent) {
      throw new UnauthorizedException('User agent required');
    }

    // Check for IP consistency (optional - can store IP in JWT)
    // This could be implemented with session management

    // Check for request anomalies
    const referer = request.headers['referer'];
    const origin = request.headers['origin'];

    // Add more security checks as needed
  }
}
