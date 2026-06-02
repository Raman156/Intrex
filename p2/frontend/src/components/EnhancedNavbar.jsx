import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogIn } from 'lucide-react';
import { getAuthToken } from '../utils/authStorage';

const EnhancedNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const token = getAuthToken();
    setIsLoggedIn(!!token);
  }, [location]);

  useEffect(() => {
    let rafId = 0;

    const updateScrolledState = () => {
      const nextScrolled = window.scrollY > 20;
      setScrolled((current) => (current === nextScrolled ? current : nextScrolled));
      rafId = 0;
    };

    const handleScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateScrolledState);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-bg-primary/95 backdrop-blur-xl border-b border-white/5 shadow-lg' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 mr-4 lg:mr-8 hover:opacity-80 transition-opacity group shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center group-hover:shadow-glow-purple transition-shadow">
                <span className="text-lg font-bold text-white">I</span>
              </div>
              <span className="text-xl font-serif font-bold text-white hidden sm:inline">Intrex</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-10">
              <Link
                to="/"
                className={`text-sm font-medium transition-all relative group ${
                  isActive('/') ? 'text-white' : 'text-text-secondary hover:text-white'
                }`}
              >
                Home
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-primary group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                to="/live-interview"
                className={`text-sm font-medium transition-all relative group flex items-center gap-2 ${
                  isActive('/live-interview') ? 'text-white' : 'text-text-secondary hover:text-white'
                }`}
              >
                Live Interview
                <span className="px-2 py-0.5 bg-brand-success/20 text-brand-success text-[10px] font-bold rounded-full border border-brand-success/40">
                  LIVE
                </span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-primary group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                to="/upload"
                className={`text-sm font-medium transition-all relative group ${
                  isActive('/upload') ? 'text-white' : 'text-text-secondary hover:text-white'
                }`}
              >
                Upload
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-primary group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                to="/resume-builder"
                className={`text-sm font-medium transition-all relative group ${
                  isActive('/resume-builder') ? 'text-white' : 'text-text-secondary hover:text-white'
                }`}
              >
                Resume Builder
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-primary group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-all relative group ${
                  isActive('/dashboard') ? 'text-white' : 'text-text-secondary hover:text-white'
                }`}
              >
                Dashboard
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-primary group-hover:w-full transition-all duration-300" />
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {isLoggedIn ? (
                <Link to="/profile">
                  <button className="btn-outline flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                </Link>
              ) : (
                <Link to="/firebase-login">
                  <button className="btn-outline flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </button>
                </Link>
              )}
              <Link to="/live-interview">
                <button className="btn-primary">
                  Start Now
                </button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-text-secondary hover:text-white transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden bg-bg-primary/95 backdrop-blur-xl border-t border-white/5 animate-fade-up">
            <div className="px-4 py-4 space-y-3">
              <Link
                to="/"
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/') 
                    ? 'bg-brand-primary/20 text-white' 
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/live-interview"
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/live-interview') 
                    ? 'bg-brand-primary/20 text-white' 
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Live Interview
              </Link>
              <Link
                to="/upload"
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/upload') 
                    ? 'bg-brand-primary/20 text-white' 
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Upload
              </Link>
              <Link
                to="/resume-builder"
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/resume-builder') 
                    ? 'bg-brand-primary/20 text-white' 
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Resume Builder
              </Link>
              <Link
                to="/dashboard"
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/dashboard') 
                    ? 'bg-brand-primary/20 text-white' 
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
              
              <div className="pt-3 space-y-2 border-t border-white/5">
                {isLoggedIn ? (
                  <Link to="/profile" onClick={() => setIsOpen(false)}>
                    <button className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-all">
                      Profile
                    </button>
                  </Link>
                ) : (
                  <Link to="/firebase-login" onClick={() => setIsOpen(false)}>
                    <button className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-all">
                      Login
                    </button>
                  </Link>
                )}
                <Link to="/live-interview" onClick={() => setIsOpen(false)}>
                  <button className="w-full px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg font-semibold text-sm transition-all">
                    Start Now
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default EnhancedNavbar;
