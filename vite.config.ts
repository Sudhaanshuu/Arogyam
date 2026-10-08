import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-agora': ['agora-rtc-react', 'agora-rtc-sdk-ng'],
          'vendor-leaflet': ['leaflet', 'react-leaflet'],
          'vendor-motion': ['framer-motion'],
          'vendor-ui': ['lucide-react', 'react-hot-toast', 'swiper'],
          'vendor-db': ['@supabase/supabase-js'],
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
});
