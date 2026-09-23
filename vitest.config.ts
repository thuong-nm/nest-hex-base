import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vite enables `development` only when NODE_ENV is not production; pin it so `#src/*`
  // always resolves to src/ instead of dist/.
  ssr: { resolve: { conditions: ['development', 'module', 'node'] } },
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.spec.ts'],
  },
});
