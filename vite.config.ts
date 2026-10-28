import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' keeps all asset paths relative, so the build works on GitHub Pages
// under any repository name and also when opened from a local static server.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: { output: { manualChunks: { charts: ['recharts'], vendor: ['react', 'react-dom', 'react-router-dom', 'dexie', 'dexie-react-hooks'] } } },
  },
  test: { environment: 'node' },
} as any);
