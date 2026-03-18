import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { login, googleLogin } from '../api/api';
import { setAuthToken } from '../utils/authStorage';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(email, password);
      setAuthToken(response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Force page reload to update AuthContext
      window.location.href = '/dashboard';
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : err?.message;
      setError(message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const token = credentialResponse.credential || credentialResponse.id_token;
      if (!token) {
        throw new Error('Google Sign-In token not received. Please try again.');
      }
      console.log('Google token received:', token ? 'Yes' : 'No');
      
      const response = await googleLogin(token);
      console.log('Backend response:', response);
      
      setAuthToken(response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      console.log('Navigating to dashboard...');
      
      // Force page reload to update AuthContext
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Google login error:', err);
      const detail = err?.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : err?.message;
      setError(message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    if (!googleClientId) {
      return;
    }

    if (window.google && googleButtonRef.current) {
      try {
        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleSuccess,
          auto_select: false, // Disable auto-select to show account picker
          cancel_on_tap_outside: false,
        });
        
        // Disable One Tap to force button click
        window.google.accounts.id.cancel();
        
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          size: 'large',
          text: 'signin_with',
          theme: 'filled_black',
          logo_alignment: 'left',
          width: '100%',
        });
      } catch (err) {
        console.error('Google Sign-In initialization error:', err);
      }
    }
  }, [googleClientId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-7xl">
        <div className="flex justify-end mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
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
              <span className="text-xl font-bold text-gray-900">Intrex</span>
            </div>

            {/* Header */}
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 leading-tight">
                Welcome back
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Sign in to your account and continue mastering your interview skills with AI-powered practice.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Login failed</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-500"
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
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-500"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Remember me</span>
                </label>
                <Link
                  to="#"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
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
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-600 font-medium">
                  Or continue with
                </span>
              </div>
            </motion.div>

            {/* Google Sign-In */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <div
                ref={googleButtonRef}
                className="flex justify-center"
              ></div>

              {!googleClientId && (
                <p className="text-xs text-center text-amber-600">
                  Google Sign-In is not configured. Set VITE_GOOGLE_CLIENT_ID to enable it.
                </p>
              )}
              
              {/* Account switch hint */}
              <p className="text-xs text-center text-gray-500">
                Wrong account? <a 
                  href="https://accounts.google.com/Logout" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Sign out of Google
                </a> first, then try again.
              </p>
            </motion.div>

            {/* Sign Up Link */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center text-gray-600"
            >
              Don't have an account?{' '}
              <Link
                to="/firebase-signup"
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
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
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 rounded-3xl blur-3xl opacity-50 animate-pulse"></div>

              {/* Main Card */}
              <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-12 border border-blue-200/60 shadow-2xl h-full flex flex-col items-center justify-center">
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
                    className="absolute top-8 left-8 w-16 h-16 bg-white rounded-full border-2 border-blue-200 flex items-center justify-center text-2xl shadow-lg"
                  >
                    📊
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                    className="absolute top-12 right-8 w-14 h-14 bg-white rounded-full border-2 border-blue-200 flex items-center justify-center text-xl shadow-lg"
                  >
                    ✨
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                    className="absolute bottom-12 left-12 w-14 h-14 bg-white rounded-full border-2 border-blue-200 flex items-center justify-center text-xl shadow-lg"
                  >
                    🚀
                  </motion.div>

                  {/* Text Content */}
                  <div className="text-center mt-8 relative z-10">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Master Your Interviews
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
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
                        className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/40"
                      >
                        <span className="text-lg">{feature.icon}</span>
                        <span className="text-sm font-medium text-gray-700">
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
                        className="text-center bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/40"
                      >
                        <p className="text-lg font-bold text-blue-600">{stat.value}</p>
                        <p className="text-xs text-gray-600">{stat.label}</p>
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
  );
};

export default Login;
