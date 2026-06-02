import React from 'react';
import { Upload, Play, BarChart3, Trophy } from 'lucide-react';

const StepCard = ({ number, icon: Icon, title, description, accentColor }) => {
  return (
    <div className="relative">
      {/* Card */}
      <div className="relative bg-white/5 backdrop-blur-xl rounded-xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 h-full">
        {/* Number circle with gradient */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${accentColor}`}>
          <span className="text-2xl font-mono font-bold text-white">{number}</span>
        </div>

        {/* Icon */}
        <div className="mb-4">
          <Icon className="w-8 h-8 text-white" />
        </div>

        {/* Content */}
        <h3 className="text-xl font-serif font-semibold text-white mb-3">{title}</h3>
        <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

const PremiumHowItWorks = () => {
  const steps = [
    {
      number: '1',
      icon: Upload,
      title: 'Upload or Go Live',
      description: 'Start a live interview session or upload a recording of your practice interview.',
      accentColor: 'bg-gradient-to-br from-brand-primary/30 to-brand-primary/10',
    },
    {
      number: '2',
      icon: Play,
      title: 'AI Analysis',
      description: 'Our AI analyzes your performance across 50+ metrics including body language and speech patterns.',
      accentColor: 'bg-gradient-to-br from-brand-secondary/30 to-brand-secondary/10',
    },
    {
      number: '3',
      icon: BarChart3,
      title: 'Get Insights',
      description: 'Receive detailed feedback with actionable recommendations to improve your performance.',
      accentColor: 'bg-gradient-to-br from-brand-success/30 to-brand-success/10',
    },
    {
      number: '4',
      icon: Trophy,
      title: 'Track Progress',
      description: 'Monitor your improvement over time and prepare with confidence for your real interview.',
      accentColor: 'bg-gradient-to-br from-brand-accent/30 to-brand-accent/10',
    },
  ];

  return (
    <section className="relative py-24 bg-bg-primary">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Four simple steps to master your interview skills.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <StepCard
              key={index}
              {...step}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PremiumHowItWorks;
