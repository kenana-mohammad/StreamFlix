import { apiClient } from '@/lib/apiClient';

export const userService = {
  // جلب بيانات المستخدم الحالي
  async getCurrentUser() {
    return apiClient.getCurrentUser();
  },

  // تحديث بيانات المستخدم
  async updateUser(name?: string, email?: string, phone?: string) {
    return apiClient.updateUser({ name, email, phone });
  },

  // ==================== DEVICES ====================
  async getMyDevices() {
    return apiClient.getMyDevices();
  },

  async deleteDevice(deviceId: string) {
    return apiClient.deleteDevice(deviceId);
  },

  // ==================== RECOMMENDATIONS ====================
  async getRecommendations() {
    return apiClient.getRecommendations();
  },

  // ==================== GENRES ====================
  async getGenres() {
    return apiClient.getGenres();
  },
};
