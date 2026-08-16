import { apiClient } from '@/lib/apiClient';

export const adminService = {
  // ==================== DASHBOARD ====================
  async getDashboardData() {
    try {
      // Try the main dashboard endpoint
      return (await (apiClient as any).client?.get('/admin/analytics/')).data;
    } catch (err) {
      // Fallback - return mock data
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        totalRevenue: 0,
        topContent: [],
      };
    }
  },

  async getRecentRatings() {
    try {
      return (await (apiClient as any).client?.get('/admin/analytics/ratings/recent')).data;
    } catch (err) {
      return [];
    }
  },

  // ==================== USERS MANAGEMENT ====================
  async getUsers() {
    try {
      return (await (apiClient as any).client?.get('/admin/users/')).data;
    } catch (err) {
      return [];
    }
  },

  async getUserStats() {
    try {
      return (await (apiClient as any).client?.get('/admin/users/stats')).data;
    } catch (err) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
      };
    }
  },

  // ==================== CONTENT MANAGEMENT ====================
  async getContentStats() {
    try {
      return (await (apiClient as any).client?.get('/admin/content/stats')).data;
    } catch (err) {
      return {
        totalContent: 0,
        moviesCount: 0,
        seriesCount: 0,
        averageRating: 0,
      };
    }
  },

  // ==================== SUBSCRIPTIONS MANAGEMENT ====================
  async getSubscriptionStats() {
    try {
      return (await (apiClient as any).client?.get('/admin/subscriptions/stats')).data;
    } catch (err) {
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        canceledThisMonth: 0,
        monthlyRevenue: 0,
      };
    }
  },

  async getSubscriptions() {
    try {
      return (await (apiClient as any).client?.get('/admin/subscriptions/')).data;
    } catch (err) {
      return [];
    }
  },

  // ==================== RATINGS MANAGEMENT ====================
  async getRatingsStats() {
    try {
      return (await (apiClient as any).client?.get('/admin/ratings/stats')).data;
    } catch (err) {
      return {
        totalRatings: 0,
        averageRating: 0,
        topRatedContent: [],
      };
    }
  },

  async getRatings() {
    try {
      return (await (apiClient as any).client?.get('/admin/ratings/')).data;
    } catch (err) {
      return [];
    }
  },

  // ==================== PLANS MANAGEMENT ====================
  async getPlanStats() {
    try {
      return (await (apiClient as any).client?.get('/admin/plans/stats')).data;
    } catch (err) {
      return {
        totalPlans: 0,
        populerPlan: '',
        revenue: 0,
      };
    }
  },

  async getPlans() {
    try {
      return (await (apiClient as any).client?.get('/admin/plans/')).data;
    } catch (err) {
      return [];
    }
  },

  // ==================== HELPER METHODS ====================
  async checkAdminAccess() {
    try {
      const user = await apiClient.getCurrentUser();
      return (user?.data?.role === 'super_admin' || user?.data?.role === 'content_manager');
    } catch {
      return false;
    }
  },

  async getSystemStats() {
    try {
      const [dash, users, subs, content] = await Promise.all([
        this.getDashboardData(),
        this.getUserStats(),
        this.getSubscriptionStats(),
        this.getContentStats(),
      ]);
      return { dashboard: dash, users, subscriptions: subs, content };
    } catch (err) {
      console.error('Error fetching system stats:', err);
      return null;
    }
  },
};
