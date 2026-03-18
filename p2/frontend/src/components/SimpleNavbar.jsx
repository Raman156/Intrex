import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Menu, X, User, LogIn } from 'lucide-react';
import { getAuthToken } from '../utils/authStorage';

const SimpleNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const token = getAuthToken();
    setIsLoggedIn(!!token);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all ${
      scrolled ? 'bg-slate-900/95 border-b border-slate-800 shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* UI audit fix: Standardized navbar height for better mobile UX */}
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Intrex</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                isActive('/') ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Home
            </Link>
            <Link
              to="/live-interview"
              className={`text-sm font-medium transition-colors flex items-center gap-2 ${
                isActive('/live-interview') ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Live Interview
              <span className="px-2 py-0.5 bg-violet-600 text-white text-[10px] font-bold rounded-full">
                AI
              </span>
            </Link>
            <Link
              to="/upload"
              className={`text-sm font-medium transition-colors ${
                isActive('/upload') ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Upload
            </Link>
            <Link
              to="/dashboard"
              className={`text-sm font-medium transition-colors ${
                isActive('/dashboard') ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Dashboard
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <Link to="/profile">
                <button className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg text-sm hover:bg-slate-700 transition-colors flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </button>
              </Link>
            ) : (
              <Link to="/firebase-login">
                <button className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg text-sm hover:bg-slate-700 transition-colors flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Login
                </button>
              </Link>
            )}
            <Link to="/live-interview">
              <button className="px-5 py-2 bg-violet-600 text-white rounded-lg font-semibold text-sm hover:bg-violet-700 transition-colors">
                Start Now
              </button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800">
          {/* UI audit fix: Improved mobile menu spacing for better touch targets */}
          <div className="px-4 py-6 space-y-4">
            <Link
              to="/"
              className={`block px-4 py-2 rounded-lg text-sm ${
                isActive('/') ? 'bg-slate-800 text-white' : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/live-interview"
              className={`block px-4 py-2 rounded-lg text-sm ${
                isActive('/live-interview') ? 'bg-slate-800 text-white' : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setIsOpen(false)}
            >
              Live Interview
            </Link>
            <Link
              to="/upload"
              className={`block px-4 py-2 rounded-lg text-sm ${
                isActive('/upload') ? 'bg-slate-800 text-white' : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setIsOpen(false)}
            >
              Upload
            </Link>
            <Link
              to="/dashboard"
              className={`block px-4 py-2 rounded-lg text-sm ${
                isActive('/dashboard') ? 'bg-slate-800 text-white' : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            
            <div className="pt-3 space-y-2 border-t border-slate-800">
              {isLoggedIn ? (
                <Link to="/profile" onClick={() => setIsOpen(false)}>
                  <button className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg text-sm">
                    Profile
                  </button>
                </Link>
              ) : (
                <Link to="/firebase-login" onClick={() => setIsOpen(false)}>
                  <button className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg text-sm">
                    Login
                  </button>
                </Link>
              )}
              <Link to="/live-interview" onClick={() => setIsOpen(false)}>
                <button className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg font-semibold text-sm">
                  Start Now
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default SimpleNavbar;
