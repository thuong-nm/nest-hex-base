import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Seeds need decorator metadata (Nest DI), which tsx/esbuild cannot emit, so they run through the Nest CLI build.
    seed: 'pnpm seed:admin',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
