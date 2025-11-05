import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import checker from 'vite-plugin-checker';

export default defineConfig({
  clearScreen: false,
  publicDir: 'public',
  base: './',
  
  plugins: [
    react(),
    checker({ typescript: true })
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, './frontend'),
    },
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV !== 'production',
    assetsDir: 'assets',
    target: 'esnext',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        rules: resolve(__dirname, 'rules.html'),
        shortcuts: resolve(__dirname, 'shortcuts.html'),
        layers: resolve(__dirname, 'layersview.html'),
        'theme-colors': resolve(__dirname, 'theme-colors.html'),
        'zoom-effects': resolve(__dirname, 'zoom-effects.html'),
        'layer-order-zoom': resolve(__dirname, 'layer-order-zoom.html')
      }
    },
    chunkSizeWarningLimit: 2000,
  },

  server: {
    port: 1420,
    strictPort: true,
    host: 'localhost',
    watch: {
      ignored: ["**/src-tauri/**"]
    },
    fs: {
      strict: true,
      allow: ['..'],
    }
  },

  optimizeDeps: {
    exclude: ['@tauri-apps/api']
  },

  envPrefix: ['VITE_', 'TAURI_'],

  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'process.env.PLATFORM': '"tauri"'
  },
  json: {
    stringify: true
  }
}); 