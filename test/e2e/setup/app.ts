import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

export interface TestApp {
  app: INestApplication;
  http: () => ReturnType<typeof request>;
  reset: () => Promise<void>;
  close: () => Promise<void>;
}

/**
 * Boots the real AppModule with the same configureApp() as main.ts. Imports are dynamic so a
 * spec can adjust process.env first (config is validated when app.module is first imported).
 */
export async function createTestApp(): Promise<TestApp> {
  const [{ AppModule }, { configureApp }, { PrismaService }] = await Promise.all([
    import('#src/app.module.js'),
    import('#src/shared/infrastructure/http/configure-app.js'),
    import('#src/shared/infrastructure/database/prisma.service.js'),
  ]);
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ bufferLogs: true });
  configureApp(app);
  await app.init();
  const prisma = app.get(PrismaService);

  return {
    app,
    http: () => request(app.getHttpServer()),
    reset: async () => {
      await prisma.$executeRawUnsafe('TRUNCATE TABLE refresh_tokens, users');
    },
    close: () => app.close(),
  };
}
