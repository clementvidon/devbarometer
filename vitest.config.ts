import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: './vitest.setup.ts',
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text'],
      provider: 'v8',
      exclude: [
        'src/llm/ai.ts',
        'src/llm/types.ts',
        'index.ts',
        'vitest.config.ts',
        'eslint.config.js',
      ],
    },
  },
});
