import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import vitest from 'eslint-plugin-vitest';
import globals from 'globals';

export default defineConfig([
  { ignores: ['node_modules', 'public', 'dist'] },

  // JS config
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { js },
    extends: ['js/recommended'],
  },

  // TS config — BACKEND
  {
    files: ['backend/**/*.ts'],
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

  // TS config — FRONTEND
  {
    files: ['frontend/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './frontend/tsconfig.json',
        sourceType: 'module',
        ecmaVersion: 2020,
        globals: globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
    },
  },

  // Vitest config — BACKEND
  {
    files: ['backend/**/*.test.{ts,tsx}'],
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

  // Vitest config — FRONTEND
  {
    files: ['frontend/**/*.test.{ts,tsx}'],
    plugins: { vitest },
    languageOptions: {
      parserOptions: {
        project: './frontend/tsconfig.json',
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
