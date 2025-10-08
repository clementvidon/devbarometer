import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'lcov'],
      reportsDirectory: './.coverage',
      provider: 'v8',
      exclude: [
        'domain/entities/**',
        'domain/value-objects/**',
        'application/ports/**',
      ],
    },
  },
});
