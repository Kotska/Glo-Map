import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 80,
    host: true
  },
  format: 'iife'
})