import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorks from '../components/HowItWorks';
import TestimonialsSection from '../components/TestimonialsSection';
import Footer from '../components/Footer';

const Landing = () => {
  return (
    <div className="min-h-screen bg-surface-primary">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 rounded-[2rem] border border-slate-200/10 bg-white/5 p-8 shadow-xl shadow-slate-900/10 lg:grid-cols-[1.5fr_1fr] lg:p-12">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-primary">New</p>
              <h2 className="mt-4 text-4xl font-bold text-slate-900 sm:text-5xl">
                Resume Builder is live — build resumes with AI.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Quickly draft a professional resume, compare it to job descriptions, and export in modern formats.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/resume-builder"
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
                >
                  Open Resume Builder
                </Link>
                <Link
                  to="/upload"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Resume Upload
                </Link>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-slate-100 p-6 shadow-lg">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Resume Builder</p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">Create stronger applications</h3>
              <ul className="mt-6 space-y-3 text-slate-600">
                <li>Fast resume creation with structured sections</li>
                <li>Job description matching for better ATS fit</li>
                <li>Export in text, Markdown, HTML, or JSON</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <HowItWorks />
      <TestimonialsSection />
      <Footer />
    </div>
  );
};

export default Landing;
