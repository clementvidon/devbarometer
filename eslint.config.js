import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import vitest from 'eslint-plugin-vitest';

export default defineConfig([
  { ignores: ['node_modules', 'public'] },

  // JS config
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { js },
    extends: ['js/recommended'],
  },

  // TS config
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './backend/tsconfig.json',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'warn',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },

  // Vitest config
  {
    files: ['**/*.test.{ts,tsx}'],
    plugins: { vitest },
    languageOptions: {
      parserOptions: {
        project: './backend/tsconfig.json',
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
