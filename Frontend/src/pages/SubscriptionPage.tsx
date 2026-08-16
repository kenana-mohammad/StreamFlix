import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader, AlertCircle, CheckCircle, Clock, X, CreditCard } from 'lucide-react';
import { useApp } from '@/store';
import { useProfile } from '@/lib/profileContext';
import { useAuth } from '@/lib/authContext';
import { apiClient } from '@/lib/apiClient';

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useApp();
  const { profileToken } = useProfile();
  const { isAuthenticated } = useAuth();

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  
  // Checkout form state
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState({
    autoRenew: true,
    notes: '',
    paymentMethod: 'visa',
    currency: 'USD'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profileToken) {
      navigate('/profiles');
      return;
    }

    loadData();
  }, [profileToken]);

  // Check if we're in checkout flow
  useEffect(() => {
    const planId = searchParams.get('planId');
    if (planId) {
      setSelectedPlanId(planId);
      setShowCheckoutForm(true);
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [subsRes, plansRes] = await Promise.all([
        apiClient.getMySubscriptions(),
        apiClient.getPlans(),
      ]);

      setSubscriptions(Array.isArray(subsRes) ? subsRes : (subsRes?.data || []));
      setPlans(Array.isArray(plansRes) ? plansRes : (plansRes?.data || []));
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load subscription data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setSubmitting(true);
      await apiClient.createSubscription(planId, checkoutData);
      showToast('Subscription created successfully!', 'success');
      
      // Check if user has profiles
      try {
        const profilesRes = await apiClient.getProfiles();
        const profiles = Array.isArray(profilesRes) ? profilesRes : (profilesRes?.data || []);
        
        if (profiles.length === 0) {
          // No profiles - redirect to create profile page
          navigate('/create-profile');
        } else {
          // Has profiles - go back to subscription list
          setShowCheckoutForm(false);
          setSelectedPlanId(null);
          await loadData();
        }
      } catch (profileErr) {
        // If getting profiles fails, just reload the subscription data
        setShowCheckoutForm(false);
        setSelectedPlanId(null);
        await loadData();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create subscription';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (subscriptionId: string) => {
    if (!window.confirm('Are you sure you want to cancel this subscription? This action cannot be undone.')) {
      return;
    }

    try {
      setCancellingId(subscriptionId);
      await apiClient.cancelSubscription(subscriptionId);
      showToast('Subscription cancelled successfully', 'success');
      await loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to cancel subscription';
      showToast(msg, 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-green-400';
      case 'expired':
        return 'text-error-400';
      case 'cancelled':
        return 'text-gray-400';
      case 'pending':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const isExpired = (endDate: string) => new Date(endDate) < new Date();
  const daysRemaining = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  if (!profileToken) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  // Checkout Form View
  if (showCheckoutForm && selectedPlanId) {
    const selectedPlan = plans.find(p => p._id === selectedPlanId);
    
    if (!selectedPlan) {
      return (
        <div className="min-h-screen bg-ink-950 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle size={48} className="text-error-500 mx-auto mb-4" />
            <p className="text-error-400 mb-6">Plan not found</p>
            <button
              onClick={() => setShowCheckoutForm(false)}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold"
            >
              Back to Subscriptions
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-ink-950 px-4 sm:px-6 lg:px-12 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Complete Subscription</h1>
            <button
              onClick={() => {
                setShowCheckoutForm(false);
                setSelectedPlanId(null);
              }}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          {/* Main Checkout Card */}
          <div className="bg-ink-850 border border-ink-600 rounded-lg p-8 mb-6">
            {/* Plan Summary */}
            <div className="bg-gradient-to-r from-brand-500/10 to-pink-500/10 rounded-lg p-6 mb-8 border border-brand-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedPlan.name}</h2>
                  <p className="text-gray-400">{selectedPlan.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-brand-500">${selectedPlan.price}</p>
                  <p className="text-gray-400 text-sm">/month</p>
                </div>
              </div>
            </div>

            {/* Checkout Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSubscribe(selectedPlanId);
            }} className="space-y-6">
              {/* Payment Method */}
              <div>
                <label className="block text-white font-semibold mb-3">Payment Method</label>
                <select
                  value={checkoutData.paymentMethod}
                  onChange={(e) => setCheckoutData({ ...checkoutData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-3 bg-ink-700 text-white border border-ink-600 rounded-lg focus:border-brand-500 focus:outline-none"
                >
                  <option value="visa">Visa Card</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="amex">American Express</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-white font-semibold mb-3">Currency</label>
                <select
                  value={checkoutData.currency}
                  onChange={(e) => setCheckoutData({ ...checkoutData, currency: e.target.value })}
                  className="w-full px-4 py-3 bg-ink-700 text-white border border-ink-600 rounded-lg focus:border-brand-500 focus:outline-none"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="AED">AED - UAE Dirham</option>
                </select>
              </div>

              {/* Auto Renew */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkoutData.autoRenew}
                    onChange={(e) => setCheckoutData({ ...checkoutData, autoRenew: e.target.checked })}
                    className="w-5 h-5 accent-brand-500"
                  />
                  <span className="text-white font-semibold">Auto-renew subscription</span>
                </label>
                <p className="text-gray-400 text-sm mt-2 ml-8">
                  Your subscription will automatically renew each billing cycle
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-white font-semibold mb-3">Notes (Optional)</label>
                <textarea
                  value={checkoutData.notes}
                  onChange={(e) => setCheckoutData({ ...checkoutData, notes: e.target.value })}
                  placeholder="Add any notes about your subscription..."
                  rows={4}
                  className="w-full px-4 py-3 bg-ink-700 text-white border border-ink-600 rounded-lg focus:border-brand-500 focus:outline-none placeholder-gray-500"
                />
              </div>

              {/* Terms */}
              <div className="bg-ink-700/50 p-4 rounded-lg border border-ink-600">
                <p className="text-gray-400 text-sm">
                  By clicking "Complete Subscription", you agree to our Terms of Service and authorize the charge to your payment method.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckoutForm(false);
                    setSelectedPlanId(null);
                  }}
                  className="flex-1 px-6 py-3 bg-ink-700 hover:bg-ink-600 text-white rounded-lg font-bold transition-all border border-ink-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-500 to-pink-500 hover:from-brand-600 hover:to-pink-600 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Complete Subscription
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Regular Subscriptions View (rest of the file continues below...)

  return (
    <div className="min-h-screen bg-ink-950 px-4 sm:px-6 lg:px-12 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Subscription</h1>
          <p className="text-gray-400">Manage your subscription and view your plan details</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-error-500/10 border border-error-500/30 rounded-lg flex gap-3">
            <AlertCircle size={20} className="text-error-500 flex-shrink-0 mt-0.5" />
            <p className="text-error-400 text-sm">{error}</p>
          </div>
        )}

        {/* Current Subscriptions */}
        {subscriptions.length > 0 ? (
          <div className="space-y-6 mb-12">
            {subscriptions.map((subscription) => (
              <div key={subscription._id} className="bg-ink-850 border border-ink-600 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{subscription.planId?.name}</h2>
                    <p className="text-gray-400">{subscription.planId?.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusColor(subscription.status)}`}>
                    {subscription.status}
                  </span>
                </div>

                {/* Plan Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-ink-800 rounded p-4">
                    <p className="text-sm text-gray-400 mb-1">Price</p>
                    <p className="text-xl font-bold text-white">${subscription.planId?.price}/month</p>
                  </div>
                  <div className="bg-ink-800 rounded p-4">
                    <p className="text-sm text-gray-400 mb-1">Devices</p>
                    <p className="text-xl font-bold text-white">{subscription.planId?.maxDevices}</p>
                  </div>
                  <div className="bg-ink-800 rounded p-4">
                    <p className="text-sm text-gray-400 mb-1">Profiles</p>
                    <p className="text-xl font-bold text-white">{subscription.planId?.maxProfiles}</p>
                  </div>
                </div>

                {/* Features */}
                {subscription.planId && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-3">Plan Features:</p>
                    <ul className="space-y-2 text-gray-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-500" />
                        {subscription.planId.quality} Quality
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-500" />
                        {subscription.planId.maxProfiles} Profiles
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-500" />
                        {subscription.planId.maxDevices} Simultaneous Devices
                      </li>
                      {subscription.planId.maxMovies > 0 && (
                        <li className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-green-500" />
                          Up to {subscription.planId.maxMovies} Movies
                        </li>
                      )}
                      {subscription.planId.maxSeries > 0 && (
                        <li className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-green-500" />
                          Up to {subscription.planId.maxSeries} Series
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Dates */}
                <div className="bg-ink-800 rounded p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 mb-1">Start Date</p>
                      <p className="text-white font-semibold">
                        {new Date(subscription.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">End Date</p>
                      <p className="text-white font-semibold">
                        {new Date(subscription.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Days Remaining / Status */}
                {subscription.status?.toLowerCase() === 'active' && !isExpired(subscription.endDate) && (
                  <div className="bg-brand-500/10 border border-brand-500/30 rounded p-4 mb-6 flex gap-3">
                    <Clock size={20} className="text-brand-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-brand-300 font-semibold">{daysRemaining(subscription.endDate)} Days Remaining</p>
                      <p className="text-brand-400 text-sm">Your subscription renews on {new Date(subscription.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  {subscription.status?.toLowerCase() === 'active' && (
                    <>
                      <button
                        onClick={() => navigate('/plans')}
                        className="flex-1 btn-primary"
                      >
                        Upgrade Plan
                      </button>
                      <button
                        onClick={() => handleCancel(subscription._id)}
                        disabled={cancellingId === subscription._id}
                        className="flex-1 px-4 py-2 rounded-lg border border-error-500 text-error-400 hover:bg-error-500/10 transition-colors disabled:opacity-50"
                      >
                        {cancellingId === subscription._id ? 'Cancelling...' : 'Cancel Subscription'}
                      </button>
                    </>
                  )}
                  {subscription.status?.toLowerCase() === 'expired' && (
                    <button
                      onClick={() => navigate('/plans')}
                      className="btn-primary w-full"
                    >
                      Renew Subscription
                    </button>
                  )}
                  {subscription.status?.toLowerCase() === 'cancelled' && (
                    <button
                      onClick={() => navigate('/plans')}
                      className="btn-primary w-full"
                    >
                      Subscribe Again
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-ink-850 border border-ink-600 rounded-lg p-12 text-center mb-12">
            <p className="text-gray-400 text-lg mb-4">You don't have an active subscription</p>
            <button onClick={() => navigate('/plans')} className="btn-primary">
              View Plans
            </button>
          </div>
        )}

        {/* Available Plans */}
        {plans.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Available Plans</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.filter(p => p.isActive).map((plan) => (
                <div key={plan._id} className="bg-ink-850 border border-ink-600 rounded-lg p-6 hover:border-brand-500 transition-colors">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  <div className="text-3xl font-bold text-brand-500 mb-6">
                    ${plan.price}
                    <span className="text-sm text-gray-400">/month</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPlanId(plan._id);
                      setShowCheckoutForm(true);
                    }}
                    className="btn-primary w-full"
                  >
                    Subscribe
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
