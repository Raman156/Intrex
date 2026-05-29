import './utils/silenceConsole'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import './index.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

if (!googleClientId) {
  console.warn('VITE_GOOGLE_CLIENT_ID is missing. Google OAuth is disabled.')
}

const appTree = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  googleClientId
    ? <GoogleOAuthProvider clientId={googleClientId}>{appTree}</GoogleOAuthProvider>
    : appTree
)
