import React from 'react';
import { Link } from 'react-router-dom';
import EnhancedNavbar from '../components/EnhancedNavbar';
import PremiumHeroSection from '../components/PremiumHeroSection';
import PremiumFeaturesSection from '../components/PremiumFeaturesSection';
import PremiumHowItWorks from '../components/PremiumHowItWorks';
import PremiumTestimonialsSection from '../components/PremiumTestimonialsSection';
import PremiumFooter from '../components/PremiumFooter';

const PremiumLanding = () => {
  return (
    <div className="min-h-screen bg-bg-primary">
      <EnhancedNavbar />
      <PremiumHeroSection />
      <PremiumFeaturesSection />
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-2xl shadow-slate-950/10 lg:grid-cols-[1.5fr_1fr] lg:p-12">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-brand-primary">New</p>
              <h2 className="mt-4 text-4xl font-serif font-bold text-white sm:text-5xl">
                Resume Builder for every interview prep session.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Create, optimize, and export your resume from within Intrex. Use AI-powered job description matching and ATS scoring to land the right role.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/resume-builder"
                  className="inline-flex items-center justify-center rounded-2xl bg-brand-primary px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-brand-primary/90"
                >
                  Try Resume Builder
                </Link>
                <Link
                  to="/enhanced-resume-upload"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Explore Resume Upload
                </Link>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950 p-6 shadow-xl">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Resume Builder</p>
              <h3 className="mt-4 text-2xl font-semibold text-white">Optimize your story in minutes</h3>
              <ul className="mt-6 space-y-3 text-slate-300">
                <li>Generate polished resume drafts instantly</li>
                <li>Match roles with job description analysis</li>
                <li>Download in TXT, MD, HTML, or JSON</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <PremiumHowItWorks />
      <PremiumTestimonialsSection />
      <PremiumFooter />
    </div>
  );
};

export default PremiumLanding;
