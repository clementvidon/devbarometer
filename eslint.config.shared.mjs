import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tsparser from '@typescript-eslint/parser';
import vitest from 'eslint-plugin-vitest';

export default defineConfig([
  {
    ignores: ['node_modules', 'dist', 'public', '**/*.d.ts'],
  },

  {
    files: ['**/*.{js,ts,tsx}'],
    plugins: { js },
    extends: ['js/recommended'],
  },

  {
    files: ['**/*.test.{ts,tsx}'],
    plugins: { vitest },
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: new URL('.', import.meta.url),
      },
      globals: {
        vi: true,
        describe: true,
        test: true,
        expect: true,
        beforeEach: true,
        afterEach: true,
        it: true,
      },
    },
    rules: {},
  },
]);
