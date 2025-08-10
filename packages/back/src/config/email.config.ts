import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  },
  
  from: process.env.SMTP_FROM || 'noreply@aiquizapp.com',
  
  templates: {
    welcome: 'welcome',
    resetPassword: 'reset-password',
    quizCompleted: 'quiz-completed',
  },
}));