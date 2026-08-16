import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader, AlertCircle, Check, ChevronLeft, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/lib/useToast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PlanDetailsPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated } = useAuth();

  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlanDetails();
  }, [planId]);

  const loadPlanDetails = async () => {
    try {
      setLoading(true);
      setError('');

      if (!planId) {
        throw new Error('Plan ID not found');
      }

      const planData = await apiClient.getPlanById(planId);
      const plan = planData && typeof planData === 'object' && !Array.isArray(planData) 
        ? planData 
        : (Array.isArray(planData) ? planData[0] : null);
      
      if (!plan) {
        throw new Error('Plan data is empty');
      }
      
      setPlan(plan);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load plan details';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      // Store the plan ID for later and redirect to login
      sessionStorage.setItem('selectedPlanId', planId || '');
      sessionStorage.setItem('selectedPlanName', plan?.name || '');
      navigate(`/login?redirect=/subscription?planId=${planId}`);
      return;
    }
    
    // User is authenticated, go to subscription/checkout form
    navigate(`/subscription?planId=${planId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center pt-24">
          <div className="text-center">
            <Loader size={40} className="text-brand-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading plan details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!plan || error) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16">
          <div className="px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto w-full">
            <button
              onClick={() => navigate('/plans')}
              className="flex items-center gap-2 text-brand-500 hover:text-brand-400 mb-8 transition-colors"
            >
              <ChevronLeft size={20} />
              <span>Back to Plans</span>
            </button>

            <div className="p-6 bg-error-500/10 border border-error-500/30 rounded-lg flex gap-4">
              <AlertCircle size={24} className="text-error-500 flex-shrink-0" />
              <div>
                <h3 className="text-error-400 font-bold mb-2">Error Loading Plan</h3>
                <p className="text-error-300 text-sm mb-4">{error}</p>
                <button
                  onClick={() => loadPlanDetails()}
                  className="px-4 py-2 bg-error-500 hover:bg-error-600 text-white rounded-lg text-sm font-semibold transition-all"
                >
                  Retry
                </button>
              </div>
            </div>
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
        <div className="px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto w-full">
          {/* Back Button */}
          <button
            onClick={() => navigate('/plans')}
            className="flex items-center gap-2 text-brand-500 hover:text-brand-400 mb-12 transition-colors"
          >
            <ChevronLeft size={20} />
            <span>Back to Plans</span>
          </button>

          {/* Main Card */}
          <div className="rounded-2xl overflow-hidden border border-ink-600 bg-gradient-to-b from-ink-850 to-ink-900 shadow-2xl">
            {/* Header */}
            <div className="relative p-8 sm:p-12 bg-gradient-to-r from-brand-500/10 to-pink-500/10 border-b border-ink-600">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                    {plan.name}
                  </h1>
                  {plan.description && (
                    <p className="text-gray-300 text-lg max-w-2xl">
                      {plan.description}
                    </p>
                  )}
                </div>
                {plan.highlighted && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/20 border border-brand-500/50 text-brand-300">
                    <Sparkles size={16} />
                    <span className="text-sm font-bold">POPULAR</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-8 sm:p-12">
              {/* Price Section */}
              <div className="mb-12 p-8 bg-ink-800 rounded-xl border border-ink-600">
                <p className="text-gray-400 text-sm mb-2">MONTHLY PRICE</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-brand-500">
                    ${plan.price}
                  </span>
                  <span className="text-gray-400">/month</span>
                </div>
                <p className="text-gray-500 text-sm mt-4">
                  Billed monthly • Cancel anytime
                </p>
              </div>

              {/* Features Grid */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-8">What's Included</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Quality */}
                  <div className="flex gap-4 p-6 bg-ink-800 rounded-lg border border-ink-600">
                    <Check size={24} className="text-success-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-white mb-1">Video Quality</h3>
                      <p className="text-gray-400 text-sm">{plan.quality} streaming quality</p>
                    </div>
                  </div>

                  {/* Devices */}
                  <div className="flex gap-4 p-6 bg-ink-800 rounded-lg border border-ink-600">
                    <Check size={24} className="text-success-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-white mb-1">Multiple Devices</h3>
                      <p className="text-gray-400 text-sm">
                        Watch on up to {plan.maxDevices} device{plan.maxDevices > 1 ? 's' : ''} simultaneously
                      </p>
                    </div>
                  </div>

                  {/* Profiles */}
                  <div className="flex gap-4 p-6 bg-ink-800 rounded-lg border border-ink-600">
                    <Check size={24} className="text-success-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-white mb-1">Profiles</h3>
                      <p className="text-gray-400 text-sm">
                        Create {plan.maxProfiles} profile{plan.maxProfiles > 1 ? 's' : ''} for personalized experience
                      </p>
                    </div>
                  </div>

                  {/* Content Access */}
                  <div className="flex gap-4 p-6 bg-ink-800 rounded-lg border border-ink-600">
                    <Check size={24} className="text-success-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-white mb-1">Content Library</h3>
                      {plan.isLimited ? (
                        <p className="text-gray-400 text-sm">
                          {plan.maxMovies > 0 ? `Up to ${plan.maxMovies} movies` : 'Limited movies'} • 
                          {plan.maxSeries > 0 ? ` Up to ${plan.maxSeries} series` : ' Limited series'}
                        </p>
                      ) : (
                        <p className="text-gray-400 text-sm">
                          Unlimited movies & series access
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ad-Free */}
                  <div className="flex gap-4 p-6 bg-ink-800 rounded-lg border border-ink-600">
                    <Check size={24} className="text-success-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-white mb-1">Ad-Free Streaming</h3>
                      <p className="text-gray-400 text-sm">Enjoy uninterrupted viewing without advertisements</p>
                    </div>
                  </div>

                  {/* Offline Download - Always included */}
                  <div className="flex gap-4 p-6 bg-ink-800 rounded-lg border border-ink-600">
                    <Check size={24} className="text-success-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-white mb-1">Offline Access</h3>
                      <p className="text-gray-400 text-sm">Download content to watch offline</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Duration Info */}
              <div className="mb-12 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300">
                  <strong>Subscription Duration:</strong> {plan.duration} day{plan.duration > 1 ? 's' : ''} per billing cycle
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSubscribe}
                  className="flex-1 py-4 px-8 bg-gradient-to-r from-brand-500 to-pink-500 hover:from-brand-600 hover:to-pink-600 text-white rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-brand-500/50"
                >
                  {isAuthenticated ? 'Subscribe Now' : 'Sign In to Subscribe'}
                </button>
                <button
                  onClick={() => navigate('/plans')}
                  className="flex-1 py-4 px-8 bg-ink-700 hover:bg-ink-600 text-white rounded-lg font-bold text-lg transition-all border border-ink-600 hover:border-brand-500"
                >
                  View Other Plans
                </button>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-500 mb-2">Instant</div>
              <p className="text-gray-400">Activation after payment</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-500 mb-2">24/7</div>
              <p className="text-gray-400">Customer support available</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-500 mb-2">Flexible</div>
              <p className="text-gray-400">Cancel anytime, no penalties</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
