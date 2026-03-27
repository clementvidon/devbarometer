import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import vitest from '@vitest/eslint-plugin'
import { defineConfig } from 'eslint/config';
import globals from 'globals';

import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/public/**',
      '**/.coverage/**',
      '**/*.d.ts',
      'vitest.config.ts',
    ],
  },
  {
    files: ['**/*.{js,ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: [
          path.resolve(__dirname, 'frontend/tsconfig.json'),
          path.resolve(__dirname, 'backend/tsconfig.json'),
          path.resolve(__dirname, 'shared/tsconfig.json'),
        ],
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      js,
      import: importPlugin,
      '@typescript-eslint': tseslint,
    },
    settings: {
      'import/resolver': {
        node: { extensions: ['.ts', '.tsx', '.js', '.jsx'] },
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'import/extensions': [
        'error',
        'ignorePackages',
        { js: 'always', ts: 'never', tsx: 'never' },
      ],
      'import/no-duplicates': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
    },
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: [
          path.resolve(__dirname, 'frontend/tsconfig.json'),
          path.resolve(__dirname, 'backend/tsconfig.json'),
          path.resolve(__dirname, 'shared/tsconfig.json'),
        ],
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.node,
        vi: true,
        describe: true,
        test: true,
        expect: true,
        beforeEach: true,
        afterEach: true,
        it: true,
      },
    },
  },
]);
