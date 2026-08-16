export type ContentType = 'movie' | 'series';
export type AgeRating = 'G' | 'PG' | 'PG-13' | 'R' | 'TV-14' | 'TV-MA';

export interface Genre {
  id: string;
  name: string;
}

export interface CastMember {
  id: string;
  name: string;
  character: string;
  photo: string;
}

export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  description: string;
  duration: number;
  thumbnail: string;
  videoUrl: string;
}

export interface Season {
  id: string;
  seasonNumber: number;
  title: string;
  episodes: Episode[];
}

export interface Content {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  posterUrl: string;
  backdropUrl: string;
  genres: string[];
  cast: string[];
  ageRating: AgeRating;
  year: number;
  duration: number;
  averageRating: number;
  ratingsCount: number;
  viewsCount: number;
  seasons?: Season[];
  featured?: boolean;
  trending?: boolean;
  isNew?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  quality: string;
  resolution: string;
  maxDevices: number;
  maxProfiles: number;
  moviesLimit: number;
  seriesLimit: number;
  description: string;
  highlighted?: boolean;
}

export interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'canceled' | 'expired';
  startedAt: string;
  renewsAt: string;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  isPrimary: boolean;
  isKids: boolean;
  hasPin: boolean;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'content_manager' | 'user';
  profiles: Profile[];
  subscription?: Subscription;
}

export interface WatchHistoryItem {
  id: string;
  contentId: string;
  profileId: string;
  progressTime: number;
  totalDuration: number;
  completed: boolean;
  updatedAt: string;
}

export interface Rating {
  id: string;
  contentId: string;
  profileId: string;
  score: number;
  review?: string;
  createdAt: string;
}

export interface Device {
  id: string;
  name: string;
  type: 'mobile' | 'tablet' | 'tv' | 'laptop' | 'console';
  lastActive: string;
  location: string;
  current?: boolean;
}

export type AppView =
  | 'welcome'
  | 'login'
  | 'register'
  | 'profiles'
  | 'home'
  | 'browse'
  | 'mylist'
  | 'favorites'
  | 'history'
  | 'plans'
  | 'account'
  | 'devices';
