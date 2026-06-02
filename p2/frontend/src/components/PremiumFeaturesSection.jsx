import React from 'react';
import { Brain, Zap, TrendingUp, BarChart3 } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, accentColor }) => {
  return (
    <div className="relative">
      {/* Card */}
      <div className="relative bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group-hover:translate-y-[-4px] group-hover:shadow-2xl">
        {/* Icon container */}
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ${accentColor}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <h3 className="text-lg font-serif font-semibold text-white mb-2">{title}</h3>
        <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

const PremiumFeaturesSection = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced machine learning analyzes your performance across 50+ metrics in real-time.',
      accentColor: 'bg-gradient-to-br from-brand-primary/30 to-brand-primary/10',
    },
    {
      icon: Zap,
      title: 'Instant Feedback',
      description: 'Get actionable insights immediately after each session to improve faster.',
      accentColor: 'bg-gradient-to-br from-brand-secondary/30 to-brand-secondary/10',
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Visualize your improvement over time with detailed performance graphs.',
      accentColor: 'bg-gradient-to-br from-brand-success/30 to-brand-success/10',
    },
    {
      icon: BarChart3,
      title: 'Detailed Metrics',
      description: 'Track eye contact, confidence, clarity, pacing, and 45+ other metrics.',
      accentColor: 'bg-gradient-to-br from-brand-accent/30 to-brand-accent/10',
    },
  ];

  return (
    <section className="relative py-24 bg-bg-secondary">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Everything you need to ace your interviews and advance your career.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              {...feature}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PremiumFeaturesSection;
