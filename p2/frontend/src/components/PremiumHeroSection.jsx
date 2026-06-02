import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Upload, CheckCircle, Zap } from 'lucide-react';

const CountUpNumber = ({ target, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
};

const RadarPulse = () => (
  <div className="relative w-4 h-4">
    <div className="absolute inset-0 bg-brand-success rounded-full" />
    <div className="absolute inset-0 bg-brand-success rounded-full animate-radar-pulse" />
    <div className="absolute inset-0 bg-brand-success rounded-full animate-radar-pulse" style={{ animationDelay: '0.5s' }} />
  </div>
);

const PremiumHeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center bg-bg-primary pt-12 pb-16 overflow-hidden">
      {/* Subtle gradient orb */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl" style={{ animation: 'float 8s ease-in-out infinite' }} />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className={`text-center lg:text-left transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Role Tags */}
            <div className="flex flex-wrap gap-2 mb-8 justify-center lg:justify-start">
              {['Software Engineering', 'Data Science', 'Product Management'].map((role) => (
                <span
                  key={role}
                  className="px-3 py-1.5 bg-white/5 text-text-secondary rounded-full text-sm border border-white/10 hover:border-brand-primary hover:bg-brand-primary/10 transition-all duration-300 hover:text-white"
                >
                  {role}
                </span>
              ))}
            </div>

            {/* Headline with animated AI gradient */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold mb-6 text-white leading-tight">
              Master Every Interview
              <br />
              with <span className="bg-gradient-ai bg-clip-text text-transparent">AI</span>-Powered Analytics
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-text-secondary mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Real-time performance tracking, instant feedback, and data-driven insights to land your dream role.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Link to="/live-interview">
                <button className="btn-primary flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  <span>Start Free Session</span>
                </button>
              </Link>

              <Link to="/upload">
                <button className="btn-outline flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  <span>Upload Recording</span>
                </button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start text-sm text-text-secondary mb-8">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border-l-2 border-brand-success">
                <CheckCircle className="w-4 h-4 text-brand-success" />
                <span>Free first session</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border-l-2 border-brand-primary">
                <CheckCircle className="w-4 h-4 text-brand-primary" />
                <span>No signup required</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border-l-2 border-brand-secondary">
                <CheckCircle className="w-4 h-4 text-brand-secondary" />
                <span>Instant AI feedback</span>
              </div>
            </div>

            {/* Stats with counter animation */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
              <div className="text-center lg:text-left">
                <div className="text-4xl font-mono font-bold text-brand-primary mb-1">
                  <CountUpNumber target={5000} />+
                </div>
                <div className="text-sm text-text-secondary">Mock Sessions</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-4xl font-mono font-bold text-brand-secondary mb-1">
                  <CountUpNumber target={38} />%
                </div>
                <div className="text-sm text-text-secondary">Improvement</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-4xl font-mono font-bold text-brand-success mb-1">
                  <CountUpNumber target={94} />%
                </div>
                <div className="text-sm text-text-secondary">Success Rate</div>
              </div>
            </div>
          </div>

          {/* Right Content - Premium AI Widget */}
          <div className={`hidden lg:block transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="relative">
              {/* Card */}
              <div className="relative bg-bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 shadow-2xl">
                {/* Progress bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-t-2xl" />

                {/* AI Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">AI Interviewer</div>
                    <div className="text-sm text-text-secondary flex items-center gap-2">
                      <RadarPulse />
                      Live Analysis Active
                    </div>
                  </div>
                </div>

                {/* Question with typing animation */}
                <div className="bg-white/5 rounded-lg p-4 mb-4 border border-white/10">
                  <div className="text-xs text-brand-secondary mb-2 uppercase font-mono font-semibold">Current Question</div>
                  <div className="text-white font-serif text-lg">
                    Tell me about your most impactful project...
                    <span className="animate-pulse">|</span>
                  </div>
                </div>

                {/* Scores */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10 hover:border-brand-primary/50 transition-all">
                    <div className="text-3xl font-mono font-bold text-brand-primary">95</div>
                    <div className="text-xs text-text-secondary mt-1">Overall</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10 hover:border-brand-secondary/50 transition-all">
                    <div className="text-3xl font-mono font-bold text-brand-secondary">88</div>
                    <div className="text-xs text-text-secondary mt-1">Eye Contact</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10 hover:border-brand-success/50 transition-all">
                    <div className="text-3xl font-mono font-bold text-brand-success">92</div>
                    <div className="text-xs text-text-secondary mt-1">Confidence</div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-brand-success/10 border border-brand-success/30 rounded-full text-xs text-brand-success font-medium">
                    Eye Contact Strong
                  </span>
                  <span className="px-3 py-1 bg-brand-secondary/10 border border-brand-secondary/30 rounded-full text-xs text-brand-secondary font-medium">
                    Confidence High
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PremiumHeroSection;
