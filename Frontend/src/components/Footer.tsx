import { Mail, MapPin, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Browse', path: '/browse' },
    { label: 'Plans', path: '/plans' },
    { label: 'Ratings', path: '/ratings' },
  ];

  const accountLinks = [
    { label: 'Account Settings', path: '/account' },
    { label: 'Subscription', path: '/subscription' },
    { label: 'Devices', path: '/devices' },
  ];

  const legalLinks = [
    { label: 'Terms of Service', path: '#' },
    { label: 'Privacy Policy', path: '#' },
    { label: 'Cookie Policy', path: '#' },
  ];

  const socialLinks = [
    { name: 'Instagram', url: '#', icon: '📷' },
    { name: 'Facebook', url: '#', icon: '👍' },
    { name: 'Twitter/X', url: '#', icon: '𝕏' },
    { name: 'YouTube', url: '#', icon: '▶️' },
  ];

  return (
    <footer className="bg-ink-950 border-t border-ink-800 mt-16">
      {/* Main Footer Content */}
      <div className="px-4 sm:px-6 lg:px-12 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          {/* Footer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1 mb-4"
              >
                <span className="text-brand-500 text-2xl font-bold tracking-wider">STREAM</span>
                <span className="text-white text-2xl font-bold tracking-wider">FLIX</span>
              </button>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Your unlimited streaming destination for movies, series, and premium entertainment.
              </p>
              {/* Contact Info */}
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-start gap-3">
                  <Mail size={16} className="text-brand-500 mt-0.5 flex-shrink-0" />
                  <span>support@streamflix.com</span>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={16} className="text-brand-500 mt-0.5 flex-shrink-0" />
                  <span>+1 (555) 123-4567</span>
                </div>
              </div>
            </div>

            {/* Browse Section */}
            <div>
              <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wide">Browse</h3>
              <ul className="space-y-3">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <button
                      onClick={() => navigate(link.path)}
                      className="text-gray-400 hover:text-brand-500 transition-colors text-sm"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => navigate('/recommendations')}
                    className="text-gray-400 hover:text-brand-500 transition-colors text-sm"
                  >
                    Recommendations
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/favorites')}
                    className="text-gray-400 hover:text-brand-500 transition-colors text-sm"
                  >
                    My Favorites
                  </button>
                </li>
              </ul>
            </div>

            {/* Account Section */}
            <div>
              <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wide">Account</h3>
              <ul className="space-y-3">
                {accountLinks.map((link) => (
                  <li key={link.path}>
                    <button
                      onClick={() => navigate(link.path)}
                      className="text-gray-400 hover:text-brand-500 transition-colors text-sm"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-gray-400 hover:text-brand-500 transition-colors text-sm"
                  >
                    Sign In
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal Section */}
            <div>
              <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wide">Legal</h3>
              <ul className="space-y-3">
                {legalLinks.map((link) => (
                  <li key={link.path}>
                    <a
                      href={link.path}
                      className="text-gray-400 hover:text-brand-500 transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social Section */}
            <div>
              <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wide">Follow Us</h3>
              <div className="flex gap-3 mb-6">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    title={social.name}
                    className="w-10 h-10 rounded-lg bg-ink-800 hover:bg-brand-500/20 border border-ink-600 hover:border-brand-500 flex items-center justify-center text-lg transition-all"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-ink-600 to-transparent mb-8" />

          {/* Bottom Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <p>
              © {currentYear} <span className="text-brand-500 font-semibold">StreamFlix</span>. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-brand-500 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-brand-500 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-brand-500 transition-colors">
                Cookies
              </a>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-8 border-t border-ink-800">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Made with</span>
              <span className="text-red-500">❤️</span>
              <span>by the StreamFlix Team</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
