import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'https://s07xmw60-5000.inc1.devtunnels.ms',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
