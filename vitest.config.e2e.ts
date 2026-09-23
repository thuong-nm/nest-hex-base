import { defineConfig } from 'vitest/config';

export default defineConfig({
  // See vitest.config.ts.
  ssr: { resolve: { conditions: ['development', 'module', 'node'] } },
  test: {
    globals: true,
    root: './',
    include: ['test/e2e/**/*.e2e-spec.ts'],
    globalSetup: ['test/e2e/setup/global-setup.ts'],
    setupFiles: ['test/e2e/setup/env.ts'],
    // One Postgres container is shared by all files; run them sequentially to keep data isolated.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
