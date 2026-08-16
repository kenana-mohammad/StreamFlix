import { apiClient } from '@/lib/apiClient';

export const collectionsService = {
  // ==================== FAVORITES ====================
  async getFavorites() {
    return apiClient.getFavorites();
  },

  async addToFavorites(contentId: string) {
    return apiClient.addToFavorites(contentId);
  },

  async removeFromFavorites(contentId: string) {
    return apiClient.removeFromFavorites(contentId);
  },

  // ==================== WATCHLIST ====================
  async getWatchlist() {
    return apiClient.getWatchlist();
  },

  async addToWatchlist(contentId: string) {
    return apiClient.addToWatchlist(contentId);
  },

  async removeFromWatchlist(contentId: string) {
    return apiClient.removeFromWatchlist(contentId);
  },

  // ==================== HELPER METHODS ====================
  async checkIfFavorite(contentId: string) {
    try {
      const favorites = await this.getFavorites();
      return favorites.data?.some((f: any) => f.contentId === contentId) || false;
    } catch {
      return false;
    }
  },

  async checkIfInWatchlist(contentId: string) {
    try {
      const watchlist = await this.getWatchlist();
      return watchlist.data?.some((w: any) => w.contentId === contentId) || false;
    } catch {
      return false;
    }
  },

  async toggleFavorite(contentId: string) {
    const isFavorite = await this.checkIfFavorite(contentId);
    if (isFavorite) {
      return this.removeFromFavorites(contentId);
    } else {
      return this.addToFavorites(contentId);
    }
  },

  async toggleWatchlist(contentId: string) {
    const isInWatchlist = await this.checkIfInWatchlist(contentId);
    if (isInWatchlist) {
      return this.removeFromWatchlist(contentId);
    } else {
      return this.addToWatchlist(contentId);
    }
  },
};
