// ==================== USER & PROFILE ====================

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'content_manager' | 'super_admin';
  status: 'active' | 'suspended' | 'deactivated' | 'banned';
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  _id: string;
  userId: string;
  name: string;
  avatar?: string;
  pin?: string;
  isPinProtected: boolean;
  isKids: boolean;
  minAge?: number;
  primaryProfile: boolean;
  status: 'active' | 'suspended' | 'deactivated' | 'banned';
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  _id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== CONTENT ====================

export interface Genre {
  _id: string;
  name: string;
  description?: string;
}

export interface ContentGenre {
  _id: string;
  contentId: string;
  genreId: Genre;
}

export interface Cast {
  _id: string;
  name: string;
  profileImage?: string;
  bio?: string;
}

export interface ContentCast {
  _id: string;
  contentId: string;
  castId: Cast;
  role: string;
}

export type ContentType = 'movie' | 'series';
export type ContentStatus = 'draft' | 'published' | 'archived';
export type AgeRating = 'G' | 'PG' | 'PG-13' | 'R' | '18+' | 'NC-17';

export interface Content {
  _id: string;
  title: string;
  description: string;
  type: ContentType;
  poster: string;
  backdropUrl?: string;
  ageRating: AgeRating;
  trailerUrl?: string;
  releaseYear: number;
  year?: number;
  viewsCount: number;
  averageRating: number;
  ratingCount: number;
  status: ContentStatus;
  publishAt?: string;
  genres?: ContentGenre[];
  cast?: ContentCast[];
  createdAt: string;
  updatedAt: string;
  posterUrl?: string;
  isNew?: boolean;
}

export interface Movie extends Content {
  duration: number;
  videoUrl: string;
}

export interface Season {
  _id: string;
  seriesId: string;
  seasonNumber: number;
  description?: string;
  episodeCount: number;
  releaseYear: number;
  posterUrl?: string;
}

export interface Episode {
  _id: string;
  seasonId: string;
  episodeNumber: number;
  title: string;
  description?: string;
  duration: number;
  videoUrl: string;
  thumbnailUrl?: string;
  releaseDate: string;
}

export interface Series extends Content {
  seasonCount: number;
  totalEpisodes: number;
}

// ==================== RATINGS ====================

export interface Rating {
  _id: string;
  userId: string;
  contentId: string;
  score: number; // 1-5
  comment?: string;
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== SUBSCRIPTIONS & PLANS ====================

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending' | 'upgraded';
export type Quality = '480p' | '720p' | '1080p' | '4k';

export interface Plan {
  _id: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // in days
  maxDevices: number;
  maxProfiles: number;
  quality: Quality;
  isActive: boolean;
  isLimited: boolean;
  maxMovies: number;
  maxSeries: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  _id: string;
  userId: string;
  planId: Plan;
  startDate: string;
  endDate: string;
  startDateFormatted?: string;
  endDateFormatted?: string;
  status: SubscriptionStatus;
  autoRenew: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionConsumption {
  _id: string;
  subscriptionId: string;
  contentId: string;
  type: 'movie' | 'series';
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== WATCH HISTORY & COLLECTIONS ====================

export interface WatchHistory {
  _id: string;
  profileId: string;
  contentId: string;
  watchedAt: string;
  watchedDuration: number; // in seconds
  totalDuration: number; // in seconds
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string; // TTL 365 days
}

export interface Favorite {
  _id: string;
  profileId: string;
  contentId: Content;
  createdAt: string;
  updatedAt: string;
}

export interface Watchlist {
  _id: string;
  profileId: string;
  contentId: Content;
  addedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== HOME & RECOMMENDATIONS ====================

export interface HomeContent {
  featured: Content[];
  trending: Content[];
  newReleases: Content[];
  topRated: Content[];
}

export interface Recommendation {
  _id: string;
  profileId: string;
  contentId: Content;
  score: number;
  reason: string; // 'based on watch history', 'similar to favorites', etc
  createdAt: string;
  updatedAt: string;
}

// ==================== ADMIN & ANALYTICS ====================

export interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalRevenue: number;
  topContent: Content[];
}

export interface UserAnalytics {
  _id: string;
  userId: string;
  loginCount: number;
  watchDuration: number;
  favoriteCount: number;
  lastActivity: string;
}

// ==================== API RESPONSES ====================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ProfileResponse {
  profile: Profile;
  token: string; // Profile Token
}

// ==================== UI TYPES ====================

export type AppView =
  | 'welcome'
  | 'login'
  | 'register'
  | 'profiles'
  | 'home'
  | 'browse'
  | 'content'
  | 'watch'
  | 'favorites'
  | 'watchlist'
  | 'history'
  | 'plans'
  | 'subscription'
  | 'recommendations'
  | 'account'
  | 'devices'
  | 'admin'
  | 'admin-dashboard'
  | 'admin-analytics'
  | 'admin-users'
  | 'admin-content'
  | 'admin-plans'
  | 'admin-subscriptions'
  | 'admin-ratings';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
}

export interface FilterParams {
  type?: ContentType;
  genre?: string;
  year?: number;
  rating?: number;
  ageRating?: AgeRating;
  sort?: 'recent' | 'trending' | 'toprated' | 'mostviewed';
  search?: string;
}
