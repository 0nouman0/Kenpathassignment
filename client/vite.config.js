import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Inline (empty) PostCSS config so a stray postcss.config.* in a parent folder is ignored.
  css: { postcss: {} },
  server: {
    port: 5173,
    // The API runs on :4000. Proxying keeps everything same-origin, so the login cookie just works.
    proxy: { '/api': 'http://localhost:4000' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    globals: true,
  },
})
