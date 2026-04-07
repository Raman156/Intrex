import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const devHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Required for Firebase Google popup to work
  'Cross-Origin-Opener-Policy': 'unsafe-none',
  'Cross-Origin-Embedder-Policy': 'unsafe-none',
  'Content-Security-Policy': [
    "default-src 'self'",
    "img-src 'self' data: https: blob:",
    "media-src 'self' blob:",
    "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "frame-src https://*.firebaseapp.com https://accounts.google.com https://*.google.com",
    "worker-src 'self' blob:",
    "connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 ws://localhost:8000 ws://127.0.0.1:8000 ws://localhost:5173 ws://127.0.0.1:5173 https://*.googleapis.com https://*.google.com https://firebaseinstallations.googleapis.com https://www.googletagmanager.com",
  ].join('; '),
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: devHeaders,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    headers: {
      ...devHeaders,
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    },
  },
})
