import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 80,
    host: true
  },
  format: 'iife',
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
})