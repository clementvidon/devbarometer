import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  base: '/devbarometer/',
  plugins: [react()],
  server: {
    proxy: {
      '/report': 'http://localhost:3000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Exemple : séparer React du reste
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
});
