import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
  build: {
    target: 'es2019',
    cssMinify: true,
    rollupOptions: {
      output: {
        // React rarely changes between deploys — split it into its own
        // long-cacheable chunk so app-code edits don't invalidate it.
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
});
