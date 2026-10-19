import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,          // escucha en la red local (necesario para túneles)
    allowedHosts: true,  // permite dominios de túnel (ngrok/cloudflared/localtunnel)
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      tslib: path.resolve(__dirname, 'node_modules/tslib/tslib.es6.mjs'),
    },
  },
  optimizeDeps: {
    include: ['xlsx-js-style'],
  },
  build: {
    cssMinify: true,
  },
})
