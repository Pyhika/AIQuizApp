import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@ValidatorConstraint({ name: 'StrongPassword', async: false })
@Injectable()
export class StrongPasswordValidator implements ValidatorConstraintInterface {
  constructor(private configService: ConfigService) {}

  validate(password: string, args: ValidationArguments) {
    if (!password) return false;

    const config = this.configService.get('security.password');

    // Check minimum length
    if (password.length < config.minLength) {
      return false;
    }

    // Check for uppercase letters
    if (config.requireUppercase && !/[A-Z]/.test(password)) {
      return false;
    }

    // Check for lowercase letters
    if (config.requireLowercase && !/[a-z]/.test(password)) {
      return false;
    }

    // Check for numbers
    if (config.requireNumbers && !/\d/.test(password)) {
      return false;
    }

    // Check for special characters
    if (config.requireSpecialChars) {
      const specialCharsRegex = new RegExp(
        `[${config.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`,
      );
      if (!specialCharsRegex.test(password)) {
        return false;
      }
    }

    // Check for common passwords
    const commonPasswords = [
      'password',
      '12345678',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      '1234567890',
    ];

    if (
      commonPasswords.some((common) => password.toLowerCase().includes(common))
    ) {
      return false;
    }

    // Check for sequential characters
    if (/(.)\1{2,}/.test(password)) {
      return false; // No more than 2 repeated characters
    }

    // Check for keyboard patterns
    const keyboardPatterns = [
      'qwerty',
      'asdfgh',
      'zxcvbn',
      '123456',
      'qwertyuiop',
    ];
    if (
      keyboardPatterns.some((pattern) =>
        password.toLowerCase().includes(pattern),
      )
    ) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const config = this.configService.get('security.password');
    return `Password must be at least ${config.minLength} characters long and contain uppercase letters, lowercase letters, numbers, and special characters (${config.specialChars}). Avoid common passwords and patterns.`;
  }
}

// Helper function to check password strength
export function calculatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  // Length
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  else if (password.length < 12)
    feedback.push('Consider using a longer password');

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Add special characters');

  // Patterns
  if (!/(.)\1{2,}/.test(password)) score += 1;
  else feedback.push('Avoid repeated characters');

  // Dictionary words (simplified check)
  if (!/^[a-zA-Z]+$/.test(password) || password.length < 8) score += 1;
  else feedback.push('Avoid dictionary words');

  return {
    score: Math.min(score, 10),
    feedback,
  };
}
