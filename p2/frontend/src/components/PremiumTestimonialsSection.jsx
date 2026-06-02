import React from 'react';
import { Star } from 'lucide-react';

const TestimonialCard = ({ name, role, company, content, rating, avatar }) => {
  return (
    <div className="relative">
      {/* Card */}
      <div className="relative bg-white/5 backdrop-blur-xl rounded-xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 h-full hover:shadow-lg">
        {/* Stars */}
        <div className="flex gap-1 mb-4">
          {[...Array(rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-brand-accent text-brand-accent" />
          ))}
        </div>

        {/* Content */}
        <p className="text-white mb-6 leading-relaxed">{content}</p>

        {/* Divider */}
        <div className="h-px bg-white/10 mb-6" />

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
      content: 'Intrex helped me identify my weak points in technical interviews. The real-time feedback was invaluable, and I landed my dream role!',
      rating: 5,
      avatar: { initials: 'SC', bg: 'bg-gradient-to-br from-brand-primary to-brand-secondary' },
    },
    {
      name: 'Marcus Johnson',
      role: 'Product Manager',
      company: 'Meta',
      content: 'The AI analysis is incredibly accurate. It caught communication patterns I never would have noticed on my own.',
      rating: 5,
      avatar: { initials: 'MJ', bg: 'bg-gradient-to-br from-brand-secondary to-brand-success' },
    },
    {
      name: 'Priya Patel',
      role: 'Data Scientist',
      company: 'Amazon',
      content: 'From struggling with interviews to acing them. The progress tracking kept me motivated throughout my preparation.',
      rating: 5,
      avatar: { initials: 'PP', bg: 'bg-gradient-to-br from-brand-success to-brand-primary' },
    },
  ];

  return (
    <section className="relative py-24 bg-bg-secondary">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            Trusted by Top Performers
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Join thousands of professionals who've mastered their interviews.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.name}
              {...testimonial}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PremiumTestimonialsSection;
