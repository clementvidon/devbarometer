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
    rules: {
      'import/extensions': [
        'warn',
        'ignorePackages',
        { js: 'always', ts: 'always', tsx: 'always' },
      ],
      'no-unused-vars': ['warn', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
      }],
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
