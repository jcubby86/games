// @ts-check
import { defineConfig } from 'eslint/config';

import baseConfig from '../eslint.config.base.mjs';

export default defineConfig(
  {
    ignores: ['eslint.config.mjs', 'dist', 'src/generated/prisma'],
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
