import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  plugins: [react()],
  build: {
    outDir: 'assets/dist',
    emptyOutDir: true,
    sourcemap: false,
    lib: {
      entry: resolve(__dirname, 'src/admin/main.tsx'),
      name: 'GusyAdminApp',
      formats: ['iife'],
      fileName: () => 'admin-app.js'
    },
    rollupOptions: {
      external: ['@wordpress/element', '@wordpress/api-fetch', '@wordpress/i18n'],
      output: {
        globals: {
          '@wordpress/element': 'wp.element',
          '@wordpress/api-fetch': 'wp.apiFetch',
          '@wordpress/i18n': 'wp.i18n'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'admin-app.css';
          }

          return '[name][extname]';
        }
      }
    }
  }
});
