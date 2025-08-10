import appConfig from './app.config';
import authConfig from './auth.config';
import databaseConfig from './database.config';
import redisConfig from './redis.config';
import { OpenAIConfig } from './openai.config';
import { AnthropicConfig } from './anthropic.config';
import emailConfig from './email.config';

export default [
  appConfig,
  authConfig,
  databaseConfig,
  redisConfig,
  emailConfig,
];

export { OpenAIConfig, AnthropicConfig };
