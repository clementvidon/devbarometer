import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import vitest from 'eslint-plugin-vitest';
import globals from 'globals';

export default defineConfig([
  {
    ignores: ['node_modules', 'public', 'dist'],
  },

  // JS files
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { js },
    extends: ['js/recommended'],
  },

  // TS files
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

  // Vitest files
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
