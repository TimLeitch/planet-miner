import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' so the build works both locally and under /planet-miner/ on GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: './',
});
