import js from '@eslint/js';
import tsparser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import vitest from 'eslint-plugin-vitest';
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
    plugins: { js, import: importPlugin },
    extends: ['js/recommended'],
    settings: {
      'import/resolver': {
        node: { extensions: ['.ts', '.tsx', '.js', '.jsx'] },
      },
    },
    rules: {
      'import/extensions': [
        'error',
        'ignorePackages',
        { js: 'always', ts: 'never', tsx: 'never' },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    plugins: { vitest },
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
  {
    files: ['frontend/src/**/*.{ts,tsx}', 'backend/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@devbarometer/shared/*/*'],
              message:
                'Use the published barrels (e.g. "@devbarometer/shared") instead of deep internal paths.',
            },
          ],
        },
      ],
    },
  },
]);
