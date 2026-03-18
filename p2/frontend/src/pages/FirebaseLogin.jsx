import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, Home } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../config/firebase'
import { useAuth } from '../context/AuthContext'

const FirebaseLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!auth) {
        throw new Error('Firebase authentication is not configured. Please set Firebase environment variables.')
      }
      console.log('Attempting email login with:', email)
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log('Login successful:', result.user.email)
      navigate('/dashboard')
    } catch (err) {
      console.error('Login error:', err.code, err.message)
      const errorMessage = getFirebaseErrorMessage(err.code)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)

    try {
      if (!auth) {
        throw new Error('Firebase authentication is not configured. Please set Firebase environment variables.')
      }
      console.log('Attempting Google login')
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      console.log('Google login successful:', result.user.email)
      navigate('/dashboard')
    } catch (err) {
      console.error('Google login error:', err.code, err.message)
      const errorMessage = getFirebaseErrorMessage(err.code)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getFirebaseErrorMessage = (code) => {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email. Please sign up first.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/too-many-requests': 'Too many login attempts. Please try again later.',
      'auth/popup-closed-by-user': 'Google login was cancelled.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
    }
    return errorMessages[code] || 'Login failed. Please try again.'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-7xl">
        <div className="flex justify-end mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-gray-200 hover:bg-slate-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Side - Form */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="space-y-8"
          >
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                I
              </div>
              <span className="text-xl font-bold text-white">Intrex</span>
            </div>

            {/* Header */}
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
                Welcome back
              </h1>
              <p className="text-lg text-gray-300 leading-relaxed">
                Sign in to your account and continue mastering your interview skills with AI-powered practice.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleEmailLogin} className="space-y-6">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Login failed</p>
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-semibold text-white mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-700 text-white placeholder-gray-400"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-semibold text-white mb-3">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-700 text-white placeholder-gray-400"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Remember & Forgot */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-between"
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded border-slate-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Remember me</span>
                </label>
                <Link
                  to="#"
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="relative"
            >
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-400 font-medium">
                  Or continue with
                </span>
              </div>
            </motion.div>

            {/* Google Sign-In Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full px-6 py-3 bg-slate-700 border-2 border-slate-600 text-white rounded-xl font-semibold hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="white"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="white"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="white"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="white"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Sign in with Google</span>
            </motion.button>

            {/* Sign Up Link */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center text-gray-400"
            >
              Don't have an account?{' '}
              <Link
                to="/firebase-signup"
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              >
                Create one
              </Link>
            </motion.p>
          </motion.div>

          {/* Right Side - Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="hidden md:flex flex-col items-center justify-center"
          >
            <div className="relative w-full max-w-md h-full min-h-96">
              {/* Animated Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-purple-500/20 rounded-3xl blur-3xl opacity-50 animate-pulse"></div>

              {/* Main Card */}
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-700 rounded-3xl p-12 border border-slate-600/50 shadow-2xl h-full flex flex-col items-center justify-center">
                <div className="flex flex-col items-center justify-center space-y-8 w-full">
                  {/* Central Icon with Animation */}
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full blur-xl opacity-30"></div>
                    <div className="relative w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-5xl shadow-xl">
                      🎯
                    </div>
                  </motion.div>

                  {/* Floating Elements */}
                  <motion.div
                    animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute top-8 left-8 w-16 h-16 bg-slate-700 rounded-full border-2 border-slate-600 flex items-center justify-center text-2xl shadow-lg"
                  >
                    📊
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                    className="absolute top-12 right-8 w-14 h-14 bg-slate-700 rounded-full border-2 border-slate-600 flex items-center justify-center text-xl shadow-lg"
                  >
                    ✨
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                    className="absolute bottom-12 left-12 w-14 h-14 bg-slate-700 rounded-full border-2 border-slate-600 flex items-center justify-center text-xl shadow-lg"
                  >
                    🚀
                  </motion.div>

                  {/* Text Content */}
                  <div className="text-center mt-8 relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-3">
                      Master Your Interviews
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      Practice with AI-powered feedback and real-time emotion detection
                    </p>
                  </div>

                  {/* Feature List */}
                  <div className="w-full space-y-3 mt-8 relative z-10">
                    {[
                      { icon: '🎬', text: 'Real-time emotion detection' },
                      { icon: '🤖', text: 'AI-powered feedback' },
                      { icon: '📈', text: 'Performance analytics' },
                    ].map((feature, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + idx * 0.1 }}
                        className="flex items-center gap-3 bg-slate-700/60 backdrop-blur-sm rounded-lg p-3 border border-slate-600/40"
                      >
                        <span className="text-lg">{feature.icon}</span>
                        <span className="text-sm font-medium text-gray-300">
                          {feature.text}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="w-full grid grid-cols-3 gap-3 mt-8 relative z-10">
                    {[
                      { label: 'Users', value: '10K+' },
                      { label: 'Interviews', value: '50K+' },
                      { label: 'Success', value: '95%' },
                    ].map((stat, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.1 + idx * 0.1 }}
                        className="text-center bg-slate-700/60 backdrop-blur-sm rounded-lg p-3 border border-slate-600/40"
                      >
                        <p className="text-lg font-bold text-blue-400">{stat.value}</p>
                        <p className="text-xs text-gray-400">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default FirebaseLogin
