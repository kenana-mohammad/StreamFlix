import { apiClient } from '@/lib/apiClient';

export const watchService = {
  // جلب سجل المشاهدة
  async getWatchHistory() {
    return apiClient.getWatchHistory();
  },

  // حفظ تقدم المشاهدة
  async saveWatchProgress(contentId: string, watchedDuration: number, totalDuration: number, completed: boolean = false) {
    return apiClient.saveWatchProgress({
      contentId,
      watchedDuration,
      totalDuration,
      completed,
    });
  },

  // حذف عنصر من السجل
  async deleteHistoryItem(contentId: string) {
    return apiClient.deleteWatchHistoryItem(contentId);
  },

  // جلب المحتوى قيد المشاهدة (لم يكتمل)
  async getContinueWatching() {
    const history = await this.getWatchHistory();
    return history.data?.filter((h: any) => !h.completed) || [];
  },

  // جلب المحتوى المكتمل
  async getCompletedContent() {
    const history = await this.getWatchHistory();
    return history.data?.filter((h: any) => h.completed) || [];
  },
};
