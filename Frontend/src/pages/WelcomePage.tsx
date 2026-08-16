import { useState, useEffect } from 'react';
import { Play, ChevronDown, Check } from 'lucide-react';
import { useApp, allContent } from '@/store';
import { plans } from '@/data';
import { formatDuration, getGenreNames } from '@/lib/utils';

export default function WelcomePage() {
  const { navigate } = useApp();
  const [heroIdx, setHeroIdx] = useState(0);
  const featured = allContent.filter((c) => c.featured);
  const hero = featured[heroIdx % featured.length];

  useEffect(() => {
    const t = setInterval(() => setHeroIdx((i) => i + 1), 7000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-brand-500 text-3xl font-display tracking-wider">STREAM</span>
            <span className="text-white text-3xl font-display tracking-wider">FLIX</span>
          </div>
          <button onClick={() => navigate('login')} className="btn-primary text-sm px-5 py-2">
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-screen min-h-[700px] flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <img
            key={hero.id}
            src={hero.backdropUrl}
            alt={hero.title}
            className="w-full h-full object-cover animate-kenburns"
          />
          <div className="absolute inset-0 hero-gradient" />
          <div className="absolute inset-0 hero-bottom-gradient" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto pt-16">
          <div key={hero.id} className="animate-slideUp">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
              {hero.title}
            </h1>
            <div className="flex items-center justify-center gap-3 text-sm text-gray-300 mb-4">
              <span className="flex items-center gap-1 text-gold-500 font-semibold">★ {hero.averageRating.toFixed(1)}</span>
              <span>{hero.year}</span>
              <span className="px-1.5 border border-gray-400 rounded text-xs">{hero.ageRating}</span>
              <span>{getGenreNames(hero.genres).join(' • ')}</span>
            </div>
            <p className="text-gray-200 text-base sm:text-lg mb-8 max-w-2xl mx-auto line-clamp-3">
              {hero.description}
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-2xl sm:text-3xl font-bold text-white">
              Unlimited movies, TV shows, and more.
            </p>
            <p className="text-lg text-gray-300">
              Watch anywhere. Cancel anytime.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <button onClick={() => navigate('register')} className="btn-primary text-lg px-8 py-4">
                Get Started
              </button>
              <button onClick={() => navigate('login')} className="btn-outline text-lg px-8 py-4">
                Sign In
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === heroIdx % featured.length ? 'w-8 bg-brand-500' : 'w-2 bg-white/40'}`}
            />
          ))}
        </div>
      </section>

      {/* Feature sections */}
      <FeatureSection
        title="Enjoy on your TV."
        subtitle="Watch on Smart TVs, PlayStation, Xbox, Chromecast, Apple TV, Blu-ray players, and more."
        image="https://images.pexels.com/photos/7991402/pexels-photo-7991402.jpeg?auto=compress&cs=tinysrgb&h=600&w=900"
        reverse={false}
      />
      <FeatureSection
        title="Download your shows to watch offline."
        subtitle="Save your favorites easily and always have something to watch."
        image="https://images.pexels.com/photos/8107900/pexels-photo-8107900.jpeg?auto=compress&cs=tinysrgb&h=600&w=900"
        reverse={true}
      />
      <FeatureSection
        title="Watch everywhere."
        subtitle="Stream unlimited movies and TV shows on your phone, tablet, laptop, and TV."
        image="https://images.pexels.com/photos/8108481/pexels-photo-8108481.jpeg?auto=compress&cs=tinysrgb&h=600&w=900"
        reverse={false}
      />

      {/* Plans */}
      <section className="py-20 px-4 sm:px-6 lg:px-12 bg-ink-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
            Choose the plan that's right for you
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Join StreamFlix with one of our flexible plans. No extra costs, no contracts.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 transition-all ${
                  plan.highlighted
                    ? 'bg-gradient-to-b from-brand-500/20 to-ink-850 border-2 border-brand-500 scale-105'
                    : 'bg-ink-850 border border-ink-600'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-bold">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-3xl font-bold text-white mb-1">${plan.price}<span className="text-base font-normal text-gray-400">/mo</span></p>
                <p className="text-sm text-gray-400 mb-4">{plan.description}</p>
                <ul className="space-y-2 mb-6">
                  {[
                    `${plan.resolution} ${plan.quality} quality`,
                    `Watch on ${plan.maxDevices} device${plan.maxDevices > 1 ? 's' : ''} at a time`,
                    `${plan.maxProfiles} profiles`,
                    plan.moviesLimit > 0 ? `${plan.moviesLimit} movies included` : 'Unlimited movies',
                    plan.seriesLimit > 0 ? `${plan.seriesLimit} series included` : 'Unlimited series',
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check size={16} className="text-success-500 flex-shrink-0" /> {feat}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('register')}
                  className={`w-full py-3 rounded-md font-semibold transition-colors ${
                    plan.highlighted ? 'bg-brand-500 text-white hover:bg-brand-600' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Choose {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {[
              { q: 'What is StreamFlix?', a: 'StreamFlix is a subscription-based streaming service that allows members to watch TV shows and movies on an internet-connected device.' },
              { q: 'How much does StreamFlix cost?', a: 'Watch StreamFlix on your smartphone, tablet, Smart TV, laptop, or streaming device, all for one fixed monthly fee. Plans range from $8.99 to $17.99 a month.' },
              { q: 'Where can I watch?', a: 'Watch anywhere, anytime. Sign in with your StreamFlix account to watch instantly on the web or on any internet-connected device that offers the StreamFlix app.' },
              { q: 'What can I watch on StreamFlix?', a: 'StreamFlix has an extensive library of feature films, documentaries, series, and original content. Watch as much as you want, anytime you want.' },
              { q: 'Can I create multiple profiles?', a: 'Yes. StreamFlix lets you create up to 6 profiles per account, each with its own watchlist, history, and preferences. Kids profiles are also available.' },
            ].map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-12 bg-ink-950 border-t border-ink-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <p className="text-gray-500 text-sm mb-3">Company</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>About</li><li>Jobs</li><li>News</li><li>Press</li>
              </ul>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-3">Support</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Help Center</li><li>Contact Us</li><li>FAQ</li><li>Account</li>
              </ul>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-3">Legal</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Privacy Policy</li><li>Terms of Use</li><li>Cookie Preferences</li><li>Corporate Info</li>
              </ul>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-3">Media</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Media Center</li><li>Investor Relations</li><li>Ways to Watch</li><li>Gift Cards</li>
              </ul>
            </div>
          </div>
          <p className="text-gray-600 text-sm">© 2025 StreamFlix. Made with passion. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureSection({ title, subtitle, image, reverse }: { title: string; subtitle: string; image: string; reverse: boolean }) {
  return (
    <section className={`py-16 px-4 sm:px-6 lg:px-12 flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 max-w-[1400px] mx-auto`}>
      <div className="flex-1 text-center md:text-left">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{title}</h2>
        <p className="text-lg text-gray-300">{subtitle}</p>
      </div>
      <div className="flex-1 relative">
        <div className="aspect-video rounded-xl overflow-hidden card-shadow">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      </div>
    </section>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-ink-850 rounded-lg overflow-hidden border border-ink-700">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-ink-800 transition-colors"
      >
        <span className="text-lg font-medium text-white">{q}</span>
        <ChevronDown size={22} className={`text-white transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 text-gray-300 animate-slideUp">{a}</div>
      )}
    </div>
  );
}
