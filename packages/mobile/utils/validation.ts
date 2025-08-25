// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength check
export const getPasswordStrength = (password: string): {
  strength: 'weak' | 'medium' | 'strong';
  score: number;
  feedback: string[];
} => {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('8文字以上にしてください');
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('小文字を含めてください');
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('大文字を含めてください');
  }

  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('数字を含めてください');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('特殊文字を含めてください');
  }

  let strength: 'weak' | 'medium' | 'strong';
  if (score <= 2) {
    strength = 'weak';
  } else if (score <= 4) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }

  return { strength, score, feedback };
};

// Username validation
export const validateUsername = (username: string): {
  isValid: boolean;
  error?: string;
} => {
  if (username.length < 3) {
    return { isValid: false, error: 'ユーザー名は3文字以上で入力してください' };
  }
  
  if (username.length > 20) {
    return { isValid: false, error: 'ユーザー名は20文字以内で入力してください' };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { isValid: false, error: 'ユーザー名は英数字、ハイフン、アンダースコアのみ使用できます' };
  }
  
  return { isValid: true };
};