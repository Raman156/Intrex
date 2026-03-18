import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Menu, X, User, LogIn, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PolishedNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();
  const location = useLocation();

  const isLoggedIn = !!user;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Add Escape key support for mobile menu
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/live-interview', label: 'Live Interview', badge: true },
    { path: '/upload', label: 'Upload' },
    { path: '/dashboard', label: 'Dashboard' }
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-slate-900/90 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20' 
          : 'bg-transparent border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group flex-shrink-0">
            <motion.div
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="relative w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold text-white group-hover:text-violet-400 transition-colors">
              Intrex
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="relative px-4 py-2 group"
              >
                <span className={`text-sm font-medium transition-colors relative z-10 flex items-center space-x-2 ${
                  isActive(link.path) ? 'text-white' : 'text-gray-400 group-hover:text-white'
                }`}>
                  <span>{link.label}</span>
                  {link.badge && (
                    <motion.span
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="px-2 py-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-[10px] font-bold rounded-full shadow-lg shadow-violet-500/30"
                    >
                      AI
                    </motion.span>
                  )}
                </span>
                {isActive(link.path) && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 bg-white/5 rounded-lg border border-white/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3 flex-shrink-0">
            {isLoggedIn ? (
              <Link to="/profile">
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg font-medium text-sm hover:bg-white/10 hover:border-white/20 transition-all flex items-center space-x-2 backdrop-blur-sm"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </motion.button>
              </Link>
            ) : (
              <Link to="/firebase-login">
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg font-medium text-sm hover:bg-white/10 hover:border-white/20 transition-all flex items-center space-x-2 backdrop-blur-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </motion.button>
              </Link>
            )}
            <Link to="/live-interview">
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg font-semibold text-sm shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>Start Now</span>
              </motion.button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isOpen}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-white/10"
          >
            <div className="px-4 py-6 space-y-3">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Link
                    to={link.path}
                    className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive(link.path)
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{link.label}</span>
                      {link.badge && (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-[10px] font-bold rounded-full">
                          AI
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
              
              <div className="pt-4 space-y-3 border-t border-white/10">
                {!loading && isLoggedIn ? (
                  <Link to="/profile" onClick={() => setIsOpen(false)}>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg font-medium text-sm hover:bg-white/10 transition-all flex items-center justify-center space-x-2"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </motion.button>
                  </Link>
                ) : (
                  <Link to="/firebase-login" onClick={() => setIsOpen(false)}>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg font-medium text-sm hover:bg-white/10 transition-all flex items-center justify-center space-x-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Login</span>
                    </motion.button>
                  </Link>
                )}
                <Link to="/live-interview" onClick={() => setIsOpen(false)}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg font-semibold text-sm shadow-lg shadow-violet-500/30 flex items-center justify-center space-x-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Start Now</span>
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default PolishedNavbar;
