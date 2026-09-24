import { inject } from 'vitest';

// Runs before each e2e file is imported. Real env vars take precedence over .env in
// @nestjs/config, so these override a developer's local .env.
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: inject('databaseUrl'),
  LOG_LEVEL: 'silent',
  SWAGGER_ENABLED: 'false',
  CORS_ORIGINS: '*',
  DEFAULT_LANG: 'en',
  SUPPORTED_LANGS: 'en,vi',
  JWT_ACCESS_SECRET: 'e2e-secret-that-is-at-least-32-characters-long',
  JWT_ACCESS_TTL_SECONDS: '900',
  REFRESH_TOKEN_TTL_SECONDS: '3600',
  AUTH_THROTTLE_TTL_MS: '60000',
  AUTH_THROTTLE_LIMIT: '1000',
});
