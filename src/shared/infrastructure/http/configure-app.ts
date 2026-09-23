import { type INestApplication, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppConfigService } from '../config/app-config.service.js';
import { setupSwagger } from './swagger/setup-swagger.js';

export const API_PREFIX = 'api';

/**
 * App-level setup that cannot live in a module. Called by main.ts and by e2e tests so both run
 * the same pipeline.
 */
export function configureApp(app: INestApplication): void {
  const config = app.get(AppConfigService);

  app.useLogger(app.get(Logger));
  // Swagger UI relies on inline scripts, which helmet's default CSP blocks.
  app.use(helmet({ contentSecurityPolicy: config.get('SWAGGER_ENABLED') ? false : undefined }));

  const origins = config.get('CORS_ORIGINS');
  app.enableCors({
    origin: origins.includes('*') ? true : origins,
    credentials: !origins.includes('*'),
    exposedHeaders: ['Content-Language', 'X-Request-Id'],
  });

  app.setGlobalPrefix(API_PREFIX, { exclude: ['health'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.enableShutdownHooks();

  if (config.get('SWAGGER_ENABLED')) setupSwagger(app, config.get('SUPPORTED_LANGS'));
}
