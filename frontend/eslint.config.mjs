import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import sharedConfig from '../eslint.config.mjs';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  {
    ignores: ['vite.config.ts'],
  },
  sharedConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
        ecmaVersion: 2020,
      },
      globals: globals.browser,
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs['recommended-type-checked'].rules,
      ...tseslint.configs['strict-type-checked'].rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'zod',
              importNames: ['default'],
              message:
                'Use `import { z } from "zod"` instead of the default import.',
            },
            {
              name: '@devbarometer/shared',
              message:
                'Use explicit shared subpath imports: "@devbarometer/shared/domain", "@devbarometer/shared/dtos", or "@devbarometer/shared/primitives".',
            },
          ],
          patterns: [
            {
              group: ['@devbarometer/shared/*/*'],
              message:
                'Use only published shared subpath barrels, not deep internal shared paths.',
            },
          ],
        },
      ],
    },
  },
]);
