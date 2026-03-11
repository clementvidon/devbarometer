import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import sharedConfig from '../eslint.config.mjs';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  {
    ignores: ['drizzle.config.ts'],
  },
  sharedConfig,
  {
    files: ['src/**/*.ts'],
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
              group: [
                './entities/*',
                '../entities/*',
                '../domain/entities/*',
                '../../domain/entities/*',
                '@/domain/entities/*',
              ],
              message:
                'Import backend entities via the barrel (e.g. "../entity" or "../domain/entity").',
            },
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
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
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
    },
  },
  {
    files: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },
]);
