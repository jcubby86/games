import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import 'dotenv/config';

// https://vitejs.dev/config/
export default defineConfig({
  clearScreen: false,
  plugins: [react()],
  server: {
    proxy: {
      '/api': process.env.VITE_BACKEND_ADDRESS || 'http://localhost:3000',
      '/socket.io': {
        target: process.env.VITE_BACKEND_ADDRESS || 'http://localhost:3000',
        ws: true
      }
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
