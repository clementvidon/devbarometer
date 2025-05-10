import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTests.ts',
    coverage: {
      reporter: ['text', 'lcov'],
      reportsDirectory: './.coverage',
      provider: 'v8',
      exclude: [''],
    },
  },
});
