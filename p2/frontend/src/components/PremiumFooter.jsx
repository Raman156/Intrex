import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Linkedin, Twitter, Github, ArrowRight } from 'lucide-react';

const PremiumFooter = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Twitter, href: 'https://x.com/PaayushSha44087', label: 'X (Twitter)', external: true },
    { icon: Linkedin, href: 'https://www.linkedin.com/in/utkarsh-rai-698a57220/', label: 'LinkedIn', external: true },
    { icon: Github, href: 'https://github.com/Raman156/fyp', label: 'GitHub', external: true },
    { icon: Mail, href: 'mailto:sharmapaayush@gmail.com', label: 'Email' },
  ];

  const footerLinks = {
    Product: [
      { label: 'Live Interview', href: '/live-interview' },
      { label: 'Upload Recording', href: '/upload' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Pricing', href: '/pricing' },
    ],
    Company: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: 'https://www.blogger.com/u/1/profile/07512910352667443882', external: true },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: 'https://www.linkedin.com/in/utkarsh-rai-698a57220/', external: true },
    ],
    Legal: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Security', href: '/security' },
      { label: 'Cookies', href: '/cookies' },
    ],
  };

  return (
    <footer className="relative bg-bg-primary border-t border-white/10">
      {/* CTA Strip */}
      <div className="relative bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-serif font-bold text-white mb-2">
                Ready to ace your next interview?
              </h3>
              <p className="text-text-secondary">
                Start your free session today and see the difference AI-powered coaching makes.
              </p>
            </div>
            <Link to="/live-interview">
              <button className="btn-primary flex items-center gap-2 whitespace-nowrap">
                <span>Start Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-white">I</span>
              </div>
              <span className="text-lg font-serif font-bold text-white">Intrex</span>
            </Link>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              Master every interview with AI-powered analytics and real-time feedback.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    {...(social.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    aria-label={social.label}
                    className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:text-white hover:border-brand-primary hover:bg-brand-primary/10 hover:scale-110 transition-all duration-300 group"
                  >
                    <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-white mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-white transition-colors duration-300 text-sm relative group inline-block"
                      >
                        {link.label}
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-primary group-hover:w-full transition-all duration-300" />
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-text-secondary hover:text-white transition-colors duration-300 text-sm relative group inline-block"
                      >
                        {link.label}
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-primary group-hover:w-full transition-all duration-300" />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-text-secondary text-sm">
            © {currentYear} Intrex. Made with precision for ambitious professionals.
          </p>
          <div className="flex items-center gap-6 text-sm text-text-secondary">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <a
              href="https://www.linkedin.com/in/utkarsh-rai-698a57220/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >Contact</a>
          </div>
        </div>
      </div>

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-4 mix-blend-overlay pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
      }} />
    </footer>
  );
};

export default PremiumFooter;
