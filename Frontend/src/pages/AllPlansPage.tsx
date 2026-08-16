import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/lib/useToast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AllPlansPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated } = useAuth();

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError('');

      const plansData = await apiClient.getActivePlans();
      const plans = Array.isArray(plansData) ? plansData : (plansData?.data || []);
      setPlans(plans);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load plans';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId: string) => {
    navigate(`/plan-details/${planId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center pt-24">
          <div className="text-center">
            <Loader size={40} className="text-brand-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading plans...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-gray-400 text-lg">
              Start streaming unlimited movies and series
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-8 p-4 bg-error-500/10 border border-error-500/30 rounded-lg flex gap-3">
              <AlertCircle size={20} className="text-error-500 flex-shrink-0 mt-0.5" />
              <p className="text-error-400 text-sm">{error}</p>
            </div>
          )}

          {/* Plans Grid */}
          {plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {plans.map((plan) => (
                <div
                  key={plan._id}
                  className={`relative rounded-2xl overflow-hidden transition-all duration-300 border ${
                    plan.highlighted
                      ? 'border-brand-500 bg-gradient-to-b from-brand-500/20 to-ink-850 shadow-lg shadow-brand-500/20 scale-105'
                      : 'border-ink-600 bg-ink-850 hover:border-brand-500 hover:shadow-lg hover:shadow-brand-500/10'
                  }`}
                >
                  {/* Recommended Badge */}
                  {plan.highlighted && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-pink-500"></div>
                  )}

                  <div className="p-6 sm:p-8">
                    {plan.highlighted && (
                      <div className="mb-4 flex items-center justify-center">
                        <span className="px-4 py-1.5 rounded-full bg-brand-500 text-white text-xs font-bold">
                          MOST POPULAR
                        </span>
                      </div>
                    )}

                    {/* Plan Name */}
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
                      {plan.name}
                    </h3>

                    {/* Price */}
                    <div className="text-center mb-6">
                      <div className="text-4xl sm:text-5xl font-bold text-brand-500 mb-1">
                        ${plan.price}
                      </div>
                      <p className="text-gray-400 text-sm">/month</p>
                    </div>

                    {/* Description */}
                    {plan.description && (
                      <p className="text-center text-gray-300 text-sm mb-6 min-h-[40px]">
                        {plan.description}
                      </p>
                    )}

                    {/* Features */}
                    <ul className="space-y-3 mb-8 py-6 border-y border-ink-600">
                      {plan.quality && (
                        <li className="flex items-center gap-3">
                          <Check size={18} className="text-success-500 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{plan.quality} Quality</span>
                        </li>
                      )}
                      {plan.maxDevices && (
                        <li className="flex items-center gap-3">
                          <Check size={18} className="text-success-500 flex-shrink-0" />
                          <span className="text-sm text-gray-300">
                            Watch on {plan.maxDevices} device{plan.maxDevices > 1 ? 's' : ''}
                          </span>
                        </li>
                      )}
                      {plan.maxProfiles && (
                        <li className="flex items-center gap-3">
                          <Check size={18} className="text-success-500 flex-shrink-0" />
                          <span className="text-sm text-gray-300">
                            {plan.maxProfiles} profile{plan.maxProfiles > 1 ? 's' : ''}
                          </span>
                        </li>
                      )}
                      {plan.isLimited && plan.maxMovies > 0 && (
                        <li className="flex items-center gap-3">
                          <Check size={18} className="text-success-500 flex-shrink-0" />
                          <span className="text-sm text-gray-300">Up to {plan.maxMovies} movies</span>
                        </li>
                      )}
                      {plan.isLimited && plan.maxSeries > 0 && (
                        <li className="flex items-center gap-3">
                          <Check size={18} className="text-success-500 flex-shrink-0" />
                          <span className="text-sm text-gray-300">Up to {plan.maxSeries} series</span>
                        </li>
                      )}
                      {!plan.isLimited && (
                        <>
                          <li className="flex items-center gap-3">
                            <Check size={18} className="text-success-500 flex-shrink-0" />
                            <span className="text-sm text-gray-300">Unlimited movies</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <Check size={18} className="text-success-500 flex-shrink-0" />
                            <span className="text-sm text-gray-300">Unlimited series</span>
                          </li>
                        </>
                      )}
                      <li className="flex items-center gap-3">
                        <Check size={18} className="text-success-500 flex-shrink-0" />
                        <span className="text-sm text-gray-300">Ad-free streaming</span>
                      </li>
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleSelectPlan(plan._id)}
                      className={`w-full py-3 rounded-lg font-bold transition-all text-base ${
                        plan.highlighted
                          ? 'bg-gradient-to-r from-brand-500 to-pink-500 hover:from-brand-600 hover:to-pink-600 text-white shadow-lg hover:shadow-brand-500/50'
                          : 'bg-ink-700 hover:bg-ink-600 text-white border border-ink-600 hover:border-brand-500'
                      }`}
                    >
                      {isAuthenticated ? 'Select Plan' : 'Get Started'}
                    </button>

                    {/* Note */}
                    <p className="text-xs text-gray-500 text-center mt-4">
                      Cancel anytime • No hidden fees
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle size={40} className="text-gray-500 mb-4" />
              <p className="text-gray-400 text-lg">No plans available</p>
            </div>
          )}

          {/* Comparison Info */}
          <div className="mt-16 pt-16 border-t border-ink-700">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-8 text-center">
              <p className="text-blue-300 mb-4">
                <strong>New to StreamFlix?</strong> All plans include a free trial period.
              </p>
              <p className="text-blue-400 text-sm">
                You can upgrade, downgrade, or cancel your subscription anytime without penalties.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
