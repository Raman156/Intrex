import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Dev CSP intentionally allows inline scripts for Vite React refresh preamble.
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https: blob:; media-src 'self' blob:; script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 ws://localhost:5173 ws://127.0.0.1:5173 https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://www.googleapis.com"
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: securityHeaders,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  preview: {
    headers: {
      ...securityHeaders,
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    }
  }
})
