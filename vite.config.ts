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
          // Vendor chunks for third-party libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react', '@headlessui/react'],
          'vendor-utils': ['date-fns', 'uuid'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-pdf': ['html2canvas'],
          'vendor-qr': ['qrcode', 'qr-scanner'],
          
          // Feature-based chunks - using specific files instead of directories
          'feature-registration': [
            './src/components/registration/RegistrationForm.tsx'
          ],
          'feature-admin': [
            './src/components/admin/AdminPanel.tsx'
          ],
          'feature-scanner': [
            './src/components/scanner/QRScanner.tsx'
          ],
          'feature-map': [
            './src/components/map/MapView.tsx'
          ]
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `js/[name]-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || ['asset'];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Increased limit for better control
    target: 'es2015',
    minify: 'esbuild'
  },
  server: {
    hmr: {
      overlay: false
    }
  }
});
