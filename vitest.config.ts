import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: './vitest.setup.ts',
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text'],
      provider: 'v8',
    },
  },
});
