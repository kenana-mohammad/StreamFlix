import { apiClient } from '@/lib/apiClient';

export const subscriptionService = {
  // ==================== PLANS ====================
  async getPlans() {
    return apiClient.getPlans();
  },

  async getActivePlans() {
    return apiClient.getActivePlans();
  },

  // ==================== SUBSCRIPTIONS ====================
  async getMySubscriptions() {
    return apiClient.getMySubscriptions();
  },

  async createSubscription(planId: string) {
    return apiClient.createSubscription(planId);
  },

  async upgradeSubscription(planId: string) {
    return apiClient.upgradeSubscription(planId);
  },

  async cancelSubscription(subscriptionId: string) {
    return apiClient.cancelSubscription(subscriptionId);
  },

  // ==================== CONSUMPTION ====================
  async getConsumptionSummary() {
    return apiClient.getConsumptionSummary();
  },

  // ==================== HELPER METHODS ====================
  async getActiveSubscription() {
    try {
      const subs = await this.getMySubscriptions();
      return subs.data?.find((s: any) => s.status === 'active') || null;
    } catch {
      return null;
    }
  },

  async getPlanDetails(planId: string) {
    try {
      const plans = await this.getPlans();
      return plans.data?.find((p: any) => p._id === planId) || null;
    } catch {
      return null;
    }
  },

  async canUpgrade(currentPlanId: string, newPlanId: string) {
    try {
      const plans = await this.getPlans();
      const current = plans.data?.find((p: any) => p._id === currentPlanId);
      const newPlan = plans.data?.find((p: any) => p._id === newPlanId);
      if (!current || !newPlan) return false;
      // يمكن الترقية إذا كان السعر أعلى
      return newPlan.price > current.price;
    } catch {
      return false;
    }
  },

  async getSubscriptionStatus() {
    try {
      const activeSub = await this.getActiveSubscription();
      if (!activeSub) return { hasActive: false, daysRemaining: 0 };
      
      const endDate = new Date(activeSub.endDate);
      const today = new Date();
      const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return { hasActive: true, daysRemaining, subscription: activeSub };
    } catch {
      return { hasActive: false, daysRemaining: 0 };
    }
  },
};
