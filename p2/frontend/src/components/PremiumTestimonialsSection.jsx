import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

const TestimonialCard = ({ name, role, company, content, rating, avatar, index, isFeatured }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  return (
      <div
      className={`relative transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${isFeatured ? 'lg:scale-105 lg:z-10' : ''}`}
    >
      {/* Quote mark watermark */}
      <div className="absolute -top-4 -left-4 text-8xl text-brand-primary/5 font-serif pointer-events-none">"</div>

      {/* Card */}
      <div className="relative bg-white/5 backdrop-blur-xl rounded-xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 h-full hover:shadow-2xl card-premium">
        {/* Stars */}
        <div className="flex gap-1 mb-4">
          {[...Array(rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-brand-accent text-brand-accent" />
          ))}
        </div>

        {/* Content */}
        <p className="text-white mb-6 leading-relaxed italic">{content}</p>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

        {/* Author */}
        <div className="flex items-center gap-4">
          {/* Avatar with gradient */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 ${avatar.bg}`}>
            {avatar.initials}
          </div>
          <div>
            <div className="font-semibold text-white">{name}</div>
            <div className="text-sm text-text-secondary">{role} at {company}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PremiumTestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Software Engineer',
      company: 'Google',
      content: 'Intrex helped me identify my weak points in technical interviews. The real-time feedback was invaluable. I landed my dream role at Google!',
      rating: 5,
      avatar: { initials: 'SC', bg: 'bg-gradient-to-br from-brand-primary to-brand-secondary' },
    },
    {
      name: 'Marcus Johnson',
      role: 'Product Manager',
      company: 'Meta',
      content: 'The AI analysis is incredibly accurate. It caught things I never would have noticed about my communication style. Highly recommend!',
      rating: 5,
      avatar: { initials: 'MJ', bg: 'bg-gradient-to-br from-brand-secondary to-brand-success' },
      isFeatured: true,
    },
    {
      name: 'Priya Patel',
      role: 'Data Scientist',
      company: 'Amazon',
      content: 'From struggling with interviews to acing them. The progress tracking feature kept me motivated throughout my preparation.',
      rating: 5,
      avatar: { initials: 'PP', bg: 'bg-gradient-to-br from-brand-success to-brand-primary' },
    },
    {
      name: 'Alex Rodriguez',
      role: 'UX Designer',
      company: 'Apple',
      content: 'The personalized coaching recommendations were spot-on. I improved my confidence score by 40% in just two weeks!',
      rating: 5,
      avatar: { initials: 'AR', bg: 'bg-gradient-to-br from-brand-accent to-brand-secondary' },
    },
  ];

  return (
    <section className="relative py-24 bg-bg-secondary">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            Loved by Top Performers
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Join thousands of professionals who've mastered their interviews with Intrex.
          </p>
        </div>

        {/* Testimonials grid - asymmetric layout */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              {...testimonial}
              index={index}
            />
          ))}
        </div>

        {/* Stats section */}
        <div className="mt-16 pt-16 border-t border-white/10">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-mono font-bold text-brand-primary mb-2">5,000+</div>
              <div className="text-text-secondary">Successful Interviews</div>
            </div>
            <div>
              <div className="text-4xl font-mono font-bold text-brand-secondary mb-2">94%</div>
              <div className="text-text-secondary">Success Rate</div>
            </div>
            <div>
              <div className="text-4xl font-mono font-bold text-brand-success mb-2">38%</div>
              <div className="text-text-secondary">Average Improvement</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PremiumTestimonialsSection;
