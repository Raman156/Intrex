import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const root = document.getElementById('root')
console.log('Root element:', root)

const appTree = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

ReactDOM.createRoot(root).render(
  googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>
      {appTree}
    </GoogleOAuthProvider>
  ) : (
    appTree
  ),
)

// Guard OAuth provider to avoid hard-failing render when client ID is missing.
const rootTree = googleClientId.trim()
  ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        {appTree}
      </GoogleOAuthProvider>
    )
  : appTree

if (!googleClientId.trim()) {
  console.warn('VITE_GOOGLE_CLIENT_ID is missing. Google OAuth is disabled.')
}

ReactDOM.createRoot(document.getElementById('root')).render(rootTree)
