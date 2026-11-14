import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const stub = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 20_000,
  },
  resolve: {
    alias: {
      // The route handlers import Worker-only modules; tests substitute small in-memory stand-ins.
      'cloudflare:workers': stub('./tests/stubs/cloudflare-workers.ts'),
    },
  },
});
