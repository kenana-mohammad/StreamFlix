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
        const originalRequest = error.config as any;

        // Only attempt refresh once per request (prevent infinite loop)
        if (error.response?.status === 401 && !originalRequest._retried) {
          originalRequest._retried = true;
          try {
            await this.refreshToken();
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed — user is not logged in, just reject silently
            this.clearProfileToken();
            return Promise.reject(error);
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

  // Expose the raw axios client for direct authenticated requests
  get axiosClient() {
    return this.client;
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
    const response = await this.client.get('/users/get-my-profile');
    return response.data.data || response.data;
  }

  async updateUser(data: any) {
    const response = await this.client.put('/users/update-my-profile', data);
    return response.data.data || response.data;
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
    const response = await this.client.get('/contents/client', { params });
    return response.data.data || response.data;
  }

  // Get movies specifically from movies endpoint
  async getAllMovies() {
    const response = await this.client.get('/movies/client');
    return response.data.data || response.data;
  }

  // Get single movie by ID
  async getMovieById(movieId: string) {
    try {
      const response = await this.client.get(`/movies/client/${movieId}`);
      return response.data.data || response.data;
    } catch (error) {
      // Fallback to series endpoint
      console.warn('Movie endpoint failed, trying series:', error);
      const response = await this.client.get(`/series/client/${movieId}`);
      return response.data.data || response.data;
    }
  }

  // Get series specifically from series endpoint
  async getAllSeries() {
    const response = await this.client.get('/series/client');
    return response.data.data || response.data;
  }

  // Get single series by ID
  async getSeriesById(seriesId: string) {
    try {
      const response = await this.client.get(`/series/client/${seriesId}`);
      return response.data.data || response.data;
    } catch (error) {
      // Fallback to movies endpoint
      console.warn('Series endpoint failed, trying movies:', error);
      const response = await this.client.get(`/movies/client/${seriesId}`);
      return response.data.data || response.data;
    }
  }

  async getTopRatedContent() {
    const response = await this.client.get('/contents/top-rated');
    return response.data.data || response.data;
  }

  async getContentById(contentId: string) {
    // Try movie endpoint → series endpoint → generic contents endpoint
    try {
      const response = await this.client.get(`/movies/client/${contentId}`);
      return response.data.data || response.data;
    } catch {
      try {
        const response = await this.client.get(`/series/client/${contentId}`);
        return response.data.data || response.data;
      } catch {
        const response = await this.client.get(`/contents/client/${contentId}`);
        return response.data.data || response.data;
      }
    }
  }

  // Get content details - same smart fallback approach
  async getContentDetailsSmart(contentId: string) {
    return this.getContentById(contentId);
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

  async getMyRatingForContent(contentId: string) {
    return (await this.client.get(`/ratings/${contentId}/my-rating`)).data;
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

  // ==================== ADMIN / UPLOAD ====================
  async uploadVideo(file: File, onProgress?: (pct: number) => void) {
    const form = new FormData();
    form.append('video', file);
    const response = await this.client.post('/admin/upload/video', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
    return response.data.data || response.data;
  }

  async uploadPoster(file: File, onProgress?: (pct: number) => void) {
    const form = new FormData();
    form.append('poster', file);
    const response = await this.client.post('/admin/upload/poster', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
    return response.data.data || response.data;
  }

  async deleteUploadedFile(public_id: string, resource_type: 'video' | 'image') {
    const response = await this.client.delete('/admin/upload', { data: { public_id, resource_type } });
    return response.data.data || response.data;
  }

  async getUploadSignature(folder: 'videos' | 'posters', fileType: string) {
    const response = await this.client.post('/admin/upload/signature', { folder, fileType });
    return response.data.data || response.data;
  }

  // ==================== ADMIN / CONTENT MANAGEMENT ====================
  // Movies
  async adminCreateMovie(data: any) {
    const response = await this.client.post('/movies/admin', data);
    return response.data.data || response.data;
  }
  async adminGetMovies() {
    const response = await this.client.get('/movies/admin');
    return response.data.data || response.data;
  }
  async adminUpdateMovie(id: string, data: any) {
    const response = await this.client.put(`/movies/admin/${id}`, data);
    return response.data.data || response.data;
  }
  async adminDeleteMovie(id: string) {
    const response = await this.client.delete(`/movies/admin/${id}`);
    return response.data.data || response.data;
  }

  // Series
  async adminCreateSeries(data: any) {
    const response = await this.client.post('/series/admin', data);
    return response.data.data || response.data;
  }
  async adminGetSeries() {
    const response = await this.client.get('/series/admin');
    return response.data.data || response.data;
  }
  async adminGetSeriesById(id: string) {
    const response = await this.client.get(`/series/admin/${id}`);
    return response.data.data || response.data;
  }
  async adminUpdateSeries(id: string, data: any) {
    const response = await this.client.put(`/series/admin/${id}`, data);
    return response.data.data || response.data;
  }
  async adminDeleteSeries(id: string) {
    const response = await this.client.delete(`/series/admin/${id}`);
    return response.data.data || response.data;
  }

  // Seasons
  async adminCreateSeason(seriesId: string, data: any) {
    const response = await this.client.post(`/seasons/admin/${seriesId}`, data);
    return response.data.data || response.data;
  }
  async adminGetSeasonsBySeries(seriesId: string) {
    const response = await this.client.get(`/seasons/series/${seriesId}`);
    return response.data.data || response.data;
  }
  async adminUpdateSeason(id: string, data: any) {
    const response = await this.client.put(`/seasons/admin/${id}`, data);
    return response.data.data || response.data;
  }
  async adminDeleteSeason(id: string) {
    const response = await this.client.delete(`/seasons/admin/${id}`);
    return response.data.data || response.data;
  }

  // Episodes
  async adminCreateEpisode(seasonId: string, data: any) {
    const response = await this.client.post(`/episodes/admin/season/${seasonId}`, data);
    return response.data.data || response.data;
  }
  async adminGetEpisodesBySeason(seasonId: string) {
    const response = await this.client.get(`/episodes/season/${seasonId}`);
    return response.data.data || response.data;
  }
  async getEpisodeById(episodeId: string) {
    const response = await this.client.get(`/episodes/${episodeId}`);
    return response.data.data || response.data;
  }
  async adminUpdateEpisode(id: string, data: any) {
    const response = await this.client.put(`/episodes/admin/${id}`, data);
    return response.data.data || response.data;
  }
  async adminDeleteEpisode(id: string) {
    const response = await this.client.delete(`/episodes/admin/${id}`);
    return response.data.data || response.data;
  }

  // Cast (admin)
  async adminGetCast() {
    const response = await this.client.get('/cast');
    return response.data.data || response.data;
  }

  // ==================== ADMIN / DASHBOARD ====================
  async getDashboardStats() {
    const response = await this.client.get('/dashboard');
    return response.data.data || response.data;
  }

  async getDashboardRecentRatings() {
    const response = await this.client.get('/dashboard/ratings/recent');
    return response.data.data || response.data;
  }

  async getAdminUsers(query?: string) {
    const response = await this.client.get('/admin/users', { params: query ? { query } : {} });
    return response.data.data || response.data;
  }

  async getAdminUserById(userId: string) {
    const response = await this.client.get(`/admin/users/${userId}`);
    return response.data.data || response.data;
  }

  async updateAdminUserStatus(userId: string, status: 'active' | 'deactivated') {
    const response = await this.client.put(`/admin/users/update-status/${userId}`, { status });
    return response.data.data || response.data;
  }

  async createContentManager(data: { name: string; email: string; password: string; phone?: string }) {
    const response = await this.client.post('/admin/users/create/content-manager', data);
    return response.data.data || response.data;
  }

  async getAdminAnalytics() {
    const response = await this.client.get('/admin/analytics');
    return response.data.data || response.data;
  }

  async getAdminSubscriptions() {
    const response = await this.client.get('/admin/subscriptions');
    return response.data.data || response.data;
  }

  async getAdminRatings() {
    const response = await this.client.get('/admin/ratings');
    return response.data.data || response.data;
  }
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
