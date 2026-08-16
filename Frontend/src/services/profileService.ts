import { apiClient } from '@/lib/apiClient';

export const profileService = {
  // جلب جميع البروفايلات
  async getProfiles() {
    return apiClient.getProfiles();
  },

  // إنشاء بروفايل جديد
  async createProfile(name: string, avatar?: string, isKids?: boolean, minAge?: number) {
    return apiClient.createProfile({ name, avatar, isKids, minAge });
  },

  // اختيار بروفايل
  async selectProfile(profileId: string, pin?: string) {
    return apiClient.selectProfile(profileId, pin);
  },

  // التحقق من PIN
  async verifyProfilePin(profileId: string, pin: string) {
    return apiClient.verifyProfilePin(profileId, pin);
  },

  // إضافة PIN
  async addProfilePin(profileId: string, pin: string) {
    return apiClient.addProfilePin(profileId, pin);
  },

  // تغيير PIN
  async changeProfilePin(profileId: string, oldPin: string, newPin: string) {
    return apiClient.changeProfilePin(profileId, oldPin, newPin);
  },

  // تحديث بيانات البروفايل
  async updateProfile(profileId: string, data: any) {
    return apiClient.updateProfile(profileId, data);
  },

  // تحديث البروفايل الحالي (مع Profile Token)
  async updateMyProfile(data: any) {
    return apiClient.updateMyProfile(data);
  },

  // حذف بروفايل
  async deleteProfile(profileId: string) {
    return apiClient.deleteProfile(profileId);
  },
};
