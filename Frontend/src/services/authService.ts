import { apiClient } from '@/lib/apiClient';

export const authService = {
  // تسجيل مستخدم جديد
  async register(name: string, email: string, phone: string, password: string) {
    return apiClient.register({ name, email, phone, password });
  },

  // تسجيل الدخول
  async login(email: string, password: string) {
    return apiClient.login(email, password);
  },

  // تسجيل الخروج
  async logout() {
    return apiClient.logout();
  },

  // تحديث الـ Token
  async refreshToken() {
    return apiClient.refreshToken();
  },

  // تغيير كلمة المرور
  async changePassword(oldPassword: string, newPassword: string) {
    return apiClient.changePassword(oldPassword, newPassword);
  },
};
