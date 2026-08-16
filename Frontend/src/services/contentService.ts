import { apiClient } from '@/lib/apiClient';

export const contentService = {
  // جلب محتوى الصفحة الرئيسية
  async getHomeContent() {
    return apiClient.getHomeContent();
  },

  // جلب جميع المحتويات (مع فلاتر)
  async getClientContents(params?: any) {
    return apiClient.getClientContents(params);
  },

  // جلب المحتوى الأعلى تقييماً
  async getTopRatedContent() {
    return apiClient.getTopRatedContent();
  },

  // جلب تفاصيل محتوى معين
  async getContentById(contentId: string) {
    return apiClient.getContentById(contentId);
  },

  // البحث عن محتوى
  async searchContent(query: string, type?: string, genre?: string) {
    return this.getClientContents({ search: query, type, genre });
  },

  // جلب محتوى حسب النوع
  async getContentByType(type: 'movie' | 'series') {
    return this.getClientContents({ type });
  },

  // جلب محتوى حسب النوع
  async getContentByGenre(genreId: string) {
    return this.getClientContents({ genre: genreId });
  },
};
