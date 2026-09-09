// @ts-check
import { defineConfig } from 'eslint/config';
import reactPlugin from 'eslint-plugin-react';
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
  reactPlugin.configs.flat.recommended,
  reactHooks.configs.flat.recommended,
  reactQuery.configs['flat/recommended'],
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    rules: {
      '@tanstack/query/exhaustive-deps': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },
);
