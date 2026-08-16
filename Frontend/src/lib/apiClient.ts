import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private profileToken: string | null = null;
  private deviceId: string;

  constructor() {
    // Initialize device ID
    this.deviceId = this.getOrCreateDeviceId();

    this.client = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': this.deviceId,
      },
    });

    // Request interceptor - إضافة Profile Token و Device ID
    this.client.interceptors.request.use((config) => {
      if (this.profileToken) {
        config.headers.Authorization = `Bearer ${this.profileToken}`;
      }
      config.headers['x-device-id'] = this.deviceId;
      return config;
    });

    // Response interceptor - معالجة الأخطاء
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<any>) => {
        if (error.response?.status === 401) {
          try {
            await this.refreshToken();
            if (error.config) {
              return this.client(error.config);
            }
          } catch (refreshError) {
            this.clearProfileToken();
            window.location.href = '/login';
          }
        }
        
        // Handle Profile Token expiration (403 with profile-related error)
        if (error.response?.status === 403) {
          const errorMsg = error.response.data?.message || '';
          if (errorMsg.includes('profile') || errorMsg.includes('Profile')) {
            this.clearProfileToken();
            window.location.href = '/profiles';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  setProfileToken(token: string) {
    this.profileToken = token;
  }

  clearProfileToken() {
    this.profileToken = null;
  }

  getProfileToken(): string | null {
    return this.profileToken;
  }

  // ==================== AUTH ====================
  async register(data: { name: string; email: string; phone: string; password: string }) {
    const response = await this.client.post('/auth/register', data);
    // Backend returns {success, message, data: {user, profile}}
    // Extract just the data object
    return response.data.data || response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    // Backend returns {success, message, data: {userObj, deviceId}}
    return response.data.data || response.data;
  }

  async logout() {
    this.clearProfileToken();
    return (await this.client.post('/auth/logout')).data;
  }

  async refreshToken() {
    return (await this.client.put('/auth/refresh-token')).data;
  }

  async changePassword(oldPassword: string, newPassword: string) {
    return (await this.client.put('/auth/change-password', { oldPassword, newPassword })).data;
  }

  // ==================== USERS ====================
  async getCurrentUser() {
    return (await this.client.get('/users')).data;
  }

  async updateUser(data: any) {
    return (await this.client.put('/users', data)).data;
  }

  // ==================== PROFILES ====================
  
  // جلب جميع البروفايلات للمستخدم الحالي
  async getProfiles(query?: string) {
    const response = await this.client.get('/users/profiles');
    return response.data.data || response.data;
  }

  // إنشاء بروفايل جديد
  async createProfile(data: { name: string; avatar?: string; pin?: string; isKids?: boolean; minAge?: number }) {
    const response = await this.client.post('/users/profiles', data);
    return response.data.data || response.data;
  }

  // اختيار البروفايل والحصول على Profile Token
  async selectProfile(profileId: string, pin?: string) {
    const response = await this.client.post(`/users/profiles/select/${profileId}`, { pin });
    return response.data.data || response.data;
  }

  // التحقق من PIN
  async verifyProfilePin(profileId: string, pin: string) {
    return (await this.client.post(`/users/profiles/verify-pin/${profileId}`, { pin })).data;
  }

  // إضافة PIN للبروفايل
  async addProfilePin(profileId: string, pin: string) {
    return (await this.client.put(`/users/profiles/add-pin/${profileId}`, { pin })).data;
  }

  // تغيير PIN الموجود
  async changeProfilePin(profileId: string, oldPin: string, newPin: string) {
    return (await this.client.put(`/users/profiles/change-pin/${profileId}`, { oldPin, newPin })).data;
  }

  // تحديث بيانات البروفايل (اسم، صورة، إلخ)
  async updateProfile(profileId: string, data: any) {
    return (await this.client.put(`/users/profiles/update-profile/${profileId}`, data)).data;
  }

  // تحديث البروفايل الحالي (باستخدام Profile Token)
  async updateMyProfile(data: any) {
    return (await this.client.put('/users/profiles/me/update', data)).data;
  }

  // حذف بروفايل فرعي
  async deleteProfile(profileId: string) {
    return (await this.client.delete(`/users/profiles/${profileId}`)).data;
  }

  // ==================== CONTENT ====================
  async getHomeContent() {
    const response = await this.client.get('/home');
    return response.data.data || response.data;
  }

  // Get all content (generic - movies + series combined)
  async getClientContents(params?: any) {
    const response = await this.client.get('/content/client', { params });
    return response.data.data || response.data;
  }

  // Get movies specifically from movies endpoint
  async getAllMovies() {
    const response = await this.client.get('/movies/client');
    return response.data.data || response.data;
  }

  // Get single movie by ID - using Movie endpoint
  async getMovieById(movieId: string) {
    try {
      const response = await this.client.get(`/movies/client/${movieId}`);
      return response.data.data || response.data;
    } catch (error) {
      // Fallback to generic content endpoint if movie endpoint fails
      console.warn('Movie endpoint failed, trying generic endpoint:', error);
      const response = await this.client.get(`/content/client/${movieId}`);
      return response.data.data || response.data;
    }
  }

  // Get series specifically from series endpoint
  async getAllSeries() {
    const response = await this.client.get('/series/client');
    return response.data.data || response.data;
  }

  // Get single series by ID - using Series endpoint
  async getSeriesById(seriesId: string) {
    try {
      const response = await this.client.get(`/series/client/${seriesId}`);
      return response.data.data || response.data;
    } catch (error) {
      // Fallback to generic content endpoint if series endpoint fails
      console.warn('Series endpoint failed, trying generic endpoint:', error);
      const response = await this.client.get(`/content/client/${seriesId}`);
      return response.data.data || response.data;
    }
  }

  async getTopRatedContent() {
    const response = await this.client.get('/content/top-rated');
    return response.data.data || response.data;
  }

  async getContentById(contentId: string) {
    try {
      const response = await this.client.get(`/content/client/${contentId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to fetch content:', error);
      throw error;
    }
  }

  // Get content details - uses generic content endpoint for best compatibility
  async getContentDetailsSmart(contentId: string) {
    try {
      const response = await this.client.get(`/content/client/${contentId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to fetch content:', error);
      throw error;
    }
  }

  // ==================== WATCHLIST ====================
  async getWatchlist() {
    return (await this.client.get('/profiles/watchlists')).data;
  }

  async addToWatchlist(contentId: string) {
    return (await this.client.post('/profiles/watchlists', { contentId })).data;
  }

  async removeFromWatchlist(contentId: string) {
    return (await this.client.delete(`/profiles/watchlists/${contentId}`)).data;
  }

  // ==================== FAVORITES ====================
  async getFavorites() {
    return (await this.client.get('/profiles/favorites')).data;
  }

  async addToFavorites(contentId: string) {
    return (await this.client.post('/profiles/favorites', { contentId })).data;
  }

  async removeFromFavorites(contentId: string) {
    return (await this.client.delete(`/profiles/favorites/${contentId}`)).data;
  }

  // ==================== WATCH HISTORY ====================
  async getWatchHistory() {
    return (await this.client.get('/watch/history')).data;
  }

  async saveWatchProgress(data: any) {
    return (await this.client.post('/watch/history', data)).data;
  }

  async deleteWatchHistoryItem(contentId: string) {
    return (await this.client.delete(`/watch/history/${contentId}`)).data;
  }

  // ==================== RATINGS ====================
  async getMyRatings() {
    return (await this.client.get('/ratings/my-ratings')).data;
  }

  async addOrUpdateRating(contentId: string, data: any) {
    return (await this.client.post(`/ratings/${contentId}`, data)).data;
  }

  async getContentRatings(contentId: string) {
    return (await this.client.get(`/ratings/${contentId}/all`)).data;
  }

  // ==================== PLANS ====================
  async getPlans() {
    const response = await this.client.get('/plans');
    return response.data.data || response.data;
  }

  async getActivePlans() {
    const response = await this.client.get('/plans/active');
    return response.data.data || response.data;
  }

  async getPlanById(planId: string) {
    const response = await this.client.get(`/plans/${planId}`);
    return response.data.data || response.data;
  }

  // ==================== SUBSCRIPTIONS ====================
  async getMySubscriptions() {
    const response = await this.client.get('/subscriptions/my-subscriptions');
    return response.data.data || response.data;
  }

  async createSubscription(planId: string, data: { autoRenew?: boolean; notes?: string; paymentMethod?: string; currency?: string } = {}) {
    // Backend expects: POST /subscriptions/:planId with body {autoRenew, notes, paymentMethod, currency}
    // userId is extracted from auth middleware automatically
    const response = await this.client.post(`/subscriptions/${planId}`, {
      autoRenew: data.autoRenew ?? false,
      notes: data.notes ?? '',
      paymentMethod: data.paymentMethod ?? 'visa',
      currency: data.currency ?? 'USD'
    });
    return response.data.data || response.data;
  }

  async upgradeSubscription(planId: string, data: { autoRenew?: boolean; notes?: string; paymentMethod?: string; currency?: string } = {}) {
    return (await this.client.post(`/subscriptions/upgrade-subscription/${planId}`, data)).data;
  }

  async cancelSubscription(subscriptionId: string) {
    return (await this.client.put(`/subscriptions/cancel-subscription/${subscriptionId}`)).data;
  }

  async getConsumptionSummary() {
    return (await this.client.get('/subscriptions/consumption')).data;
  }

  // ==================== DEVICES ====================
  async getMyDevices() {
    return (await this.client.get('/devices/get-my-devices')).data;
  }

  async deleteDevice(deviceId: string) {
    return (await this.client.delete(`/devices/delete-device/${deviceId}`)).data;
  }

  // ==================== RECOMMENDATIONS ====================
  async getRecommendations() {
    return (await this.client.get('/recommendation/profiles/recommendations')).data;
  }

  // ==================== GENRES ====================
  async getGenres() {
    return (await this.client.get('/genres')).data;
  }

  // ==================== BROWSER / SEARCH ====================
  async searchContent(query: string) {
    return (await this.client.get('/content/client', { 
      params: { search: query } 
    })).data;
  }

  async filterContent(params: any) {
    return (await this.client.get('/content/client', { params })).data;
  }
}

export const apiClient = new ApiClient();
