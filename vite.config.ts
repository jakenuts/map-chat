import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'leaflet', 
      '@turf/helpers',
      '@turf/length',
      '@turf/area',
      '@turf/buffer'
    ],
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          leaflet: ['leaflet', 'react-leaflet'],
          turf: ['@turf/helpers', '@turf/length', '@turf/area', '@turf/buffer'],
        },
      },
    },
  },
  // Handle Leaflet marker images
  assetsInclude: ['**/*.png'],
  publicDir: 'public',
});
