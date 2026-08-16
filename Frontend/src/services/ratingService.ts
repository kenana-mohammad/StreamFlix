import { apiClient } from '@/lib/apiClient';

export const ratingService = {
  // جلب تقييمات المستخدم
  async getMyRatings() {
    return apiClient.getMyRatings();
  },

  // إضافة أو تحديث تقييم
  async addOrUpdateRating(contentId: string, rating: number, review?: string) {
    return apiClient.addOrUpdateRating(contentId, {
      rating,
      review: review || '',
    });
  },

  // جلب جميع تقييمات محتوى معين
  async getContentRatings(contentId: string) {
    return apiClient.getContentRatings(contentId);
  },

  // جلب تقييم المستخدم لمحتوى معين
  async getUserRatingForContent(contentId: string) {
    try {
      const myRatings = await this.getMyRatings();
      const rating = myRatings.data?.find((r: any) => r.contentId === contentId);
      return rating || null;
    } catch {
      return null;
    }
  },

  // حساب متوسط التقييمات
  async getAverageRating(contentId: string) {
    try {
      const ratings = await this.getContentRatings(contentId);
      if (!ratings.data || ratings.data.length === 0) return 0;
      const sum = ratings.data.reduce((acc: number, r: any) => acc + r.rating, 0);
      return sum / ratings.data.length;
    } catch {
      return 0;
    }
  },
};
