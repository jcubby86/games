// @ts-check
import { defineConfig } from 'eslint/config';
import eslintReact from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactQuery from '@tanstack/eslint-plugin-query';

import baseConfig from '../eslint.config.base.mjs';

export default defineConfig(
  {
    ignores: [
      'eslint.config.mjs',
      'dist',
      'src/routeTree.gen.ts',
      'playwright-report',
      'test-results',
    ],
  },
  baseConfig,
  eslintReact.configs['recommended-typescript'],
  reactHooks.configs.flat['recommended-latest'],
  reactQuery.configs['flat/recommended'],
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@tanstack/query/exhaustive-deps': 'off',
    },
  },
);
