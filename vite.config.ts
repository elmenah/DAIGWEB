import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      tslib: path.resolve(__dirname, 'node_modules/tslib/tslib.es6.mjs'),
    },
  },
  build: {
    cssMinify: false,
  },
})
