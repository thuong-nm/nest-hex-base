/**
 * Creates the first ADMIN from ADMIN_EMAIL / ADMIN_PASSWORD. Idempotent: re-running promotes and
 * re-enables that user but never changes their password.
 *
 * Runs through the Nest CLI (`pnpm seed:admin`) rather than tsx because DI needs decorator
 * metadata, which esbuild-based runners do not emit. In a production image: `node dist/seeds/seed-admin.js`.
 */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from '../app.module.js';
import { UsersFacade } from '../modules/users/index.js';
import { AppConfigService } from '../shared/infrastructure/config/app-config.service.js';

const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: true });
app.useLogger(app.get(PinoLogger));
const logger = new Logger('SeedAdmin');

try {
  const config = app.get(AppConfigService);
  const email = config.get('ADMIN_EMAIL');
  const password = config.get('ADMIN_PASSWORD');
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed the admin user.');
  }

  const result = await app.get(UsersFacade).ensureAdmin({ email, password, name: 'Administrator' });
  logger.log(
    result.created
      ? `Admin ${email} created (${result.userId}).`
      : `Admin ${email} already existed (${result.userId}); ensured ADMIN role and ACTIVE status.`,
  );
} catch (error) {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await app.close();
}
