import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SanitizationPipe implements PipeTransform {
  private forbiddenPatterns: RegExp[];

  constructor(private configService: ConfigService) {
    this.forbiddenPatterns = this.configService.get('security.validation.forbiddenPatterns') || [];
  }

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'body' || metadata.type === 'query' || metadata.type === 'param') {
      return this.sanitize(value);
    }
    return value;
  }

  private sanitize(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitize(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          // Sanitize the key itself
          const sanitizedKey = this.sanitizeString(key);
          if (sanitizedKey !== key) {
            throw new BadRequestException(`Invalid key detected: ${key}`);
          }
          sanitized[key] = this.sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  }

  private sanitizeString(str: string): string {
    if (!str) return str;

    // Check for forbidden patterns
    for (const pattern of this.forbiddenPatterns) {
      if (pattern.test(str)) {
        throw new BadRequestException('Potentially malicious input detected');
      }
    }

    // Remove null bytes
    let sanitized = str.replace(/\0/g, '');

    // Encode HTML entities
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    // Remove dangerous protocols
    sanitized = sanitized.replace(/javascript:/gi, '')
      .replace(/data:text\/html/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/file:/gi, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Check URL length
    if (sanitized.match(/^https?:\/\//) && sanitized.length > this.configService.get('security.validation.maxUrlLength')) {
      throw new BadRequestException('URL exceeds maximum allowed length');
    }

    return sanitized;
  }
}