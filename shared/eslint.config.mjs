// @ts-check
import { defineConfig } from 'eslint/config';

import baseConfig from '../eslint.config.base.mjs';

export default defineConfig(
  {
    ignores: ['eslint.config.mjs', 'dist'],
  },
  baseConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
