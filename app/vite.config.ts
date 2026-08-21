import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import 'dotenv/config';

// https://vitejs.dev/config/
export default defineConfig({
  clearScreen: false,
  plugins: [react()],
  server: {
    proxy: {
      // string shorthand: http://localhost:5173/foo -> http://localhost:4567/foo
      '/api': process.env.VITE_BACKEND_ADDRESS || 'http://localhost:3000'
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: [
          'import',
          'color-functions',
          'global-builtin',
          'if-function',
          'slash-div'
        ]
      }
    }
  }
});
