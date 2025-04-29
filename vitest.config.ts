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
        'cmd/**',
        'internal/core/entity/**',
        'internal/core/port/**',
        'internal/core/types/**',
        'internal/adapter/**',
      ],
    },
  },
});
