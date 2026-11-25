import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` keeps asset paths relative so the build works on GitHub Pages or any static host.
export default defineConfig({
  base: './',
  plugins: [react()],
  // three.js (3D loss surfaces) is ~840 kB but lazy-loaded only when the 3D view is opened.
  build: { chunkSizeWarningLimit: 900 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
