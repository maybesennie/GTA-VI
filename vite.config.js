import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    watch: { ignored: ['**/release/**'] },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: { jsdom: { url: 'http://localhost:5173/' } },
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
  },
})
