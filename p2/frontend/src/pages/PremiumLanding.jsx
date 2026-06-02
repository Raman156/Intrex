import React from 'react';
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
      <PremiumHowItWorks />
      <PremiumTestimonialsSection />
      <PremiumFooter />
    </div>
  );
};

export default PremiumLanding;
