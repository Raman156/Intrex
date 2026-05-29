import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getAnalytics, isSupported } from 'firebase/analytics'

// Your Firebase configuration
// Get this from Firebase Console > Project Settings
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// measurementId is optional (Analytics only)
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']

import { debugWarn, debugError, debugLog } from '../utils/logger'

const missingKeys = requiredKeys.filter((key) => {
  const value = firebaseConfig[key]
  if (!value || value === 'undefined') {
    debugWarn(`Missing Firebase config: ${key}`)
    return true
  }
  return false
})

const isConfigValid = missingKeys.length === 0

export const isFirebaseConfigured = isConfigValid
export const missingFirebaseKeys = missingKeys

// Initialize Firebase
let app = null
let auth = null
let analytics = null

try {
  if (!isConfigValid) {
    debugError(
      `❌ Firebase configuration incomplete. Missing: ${missingKeys.join(', ')}. ` +
      'Authentication features are disabled until env vars are configured.'
    )
  } else {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)

    // Set persistence to LOCAL so user stays logged in
    setPersistence(auth, browserLocalPersistence)
      .catch((error) => {
        debugError('Error setting persistence:', error)
      })

    debugLog('✅ Firebase initialized successfully')
  }
} catch (error) {
  debugError('❌ Firebase initialization error:', error)
  debugError('Please ensure all Firebase environment variables are set correctly in .env.local')
}

export { auth, analytics }
export default app
