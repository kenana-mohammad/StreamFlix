import type { Content, Genre, CastMember } from '@/types';
import { genres, castMembers } from '@/data';

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return `${count}`;
}

export function getGenreName(id: string): string {
  return genres.find((g) => g.id === id)?.name ?? '';
}

export function getGenreNames(ids: string[]): string[] {
  return ids.map(getGenreName).filter(Boolean);
}

export function getCastMembers(ids: string[]): CastMember[] {
  return ids.map((id) => castMembers.find((c) => c.id === id)).filter(Boolean) as CastMember[];
}

export function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function filterContent(
  items: Content[],
  opts: { genre?: string; type?: string; search?: string; sort?: string }
): Content[] {
  let result = [...items];
  if (opts.genre && opts.genre !== 'all') {
    result = result.filter((c) => c.genres.includes(opts.genre!));
  }
  if (opts.type && opts.type !== 'all') {
    result = result.filter((c) => c.type === opts.type);
  }
  if (opts.search) {
    const q = opts.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        getGenreNames(c.genres).some((g) => g.toLowerCase().includes(q))
    );
  }
  switch (opts.sort) {
    case 'rating':
      result.sort((a, b) => b.averageRating - a.averageRating);
      break;
    case 'newest':
      result.sort((a, b) => b.year - a.year);
      break;
    case 'popular':
      result.sort((a, b) => b.viewsCount - a.viewsCount);
      break;
    case 'a-z':
      result.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }
  return result;
}

export function getRecommendations(
  allContent: Content[],
  watchedContentIds: string[],
  favoriteGenres: string[],
  limit = 10
): Content[] {
  if (favoriteGenres.length === 0) {
    return [...allContent]
      .filter((c) => !watchedContentIds.includes(c.id))
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit);
  }
  const recommended = allContent
    .filter((c) => !watchedContentIds.includes(c.id))
    .filter((c) => c.genres.some((g) => favoriteGenres.includes(g)))
    .sort((a, b) => b.averageRating - a.averageRating || b.viewsCount - a.viewsCount)
    .slice(0, limit);
  if (recommended.length === 0) {
    return [...allContent]
      .filter((c) => !watchedContentIds.includes(c.id))
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit);
  }
  return recommended;
}


/**
 * Normalize content data from different API formats
 * Handles:
 * - Movie/Series format: { _id, contentId: {...}, duration/videoUrl, totalSeasons, genres[], casts[] }
 * - Content format: { _id, title, poster, type, genres[], casts[] }
 */
export function normalizeContent(item: any): any {
  if (!item) return null;

  // If it has contentId (Movie/Series format), use nested data
  if (item.contentId && typeof item.contentId === 'object') {
    const contentData = item.contentId;
    return {
      _id: item._id,
      id: item._id,
      contentId: contentData._id || contentData.id,
      title: contentData.title,
      description: contentData.description || '',
      // Both posterUrl and poster so any component works
      poster: contentData.poster,
      posterUrl: contentData.poster,
      backdropUrl: contentData.poster, // fallback — no backdrop field in backend
      type: contentData.type?.toLowerCase(),
      ageRating: contentData.ageRating,
      trailerUrl: contentData.trailerUrl,
      releaseYear: contentData.releaseYear,
      year: contentData.releaseYear,   // ContentCard reads 'year'
      status: contentData.status,
      averageRating: contentData.averageRating || 0,
      ratingCount: contentData.ratingCount || 0,
      viewsCount: contentData.viewsCount || 0,
      publishAt: contentData.publishAt,
      // Normalize genres — after getMovies/getSeries they are populated objects {_id, name}
      genres: Array.isArray(item.genres) ? item.genres.map((g: any) => {
        // Could be a Genre doc {_id, name} or a ContentGenre link {genreId: {...}}
        if (g && g.genreId && typeof g.genreId === 'object') {
          return { _id: g.genreId._id, name: g.genreId.name };
        }
        return { _id: g._id || g.id, name: g.name || '' };
      }) : [],
      // Normalize casts
      casts: Array.isArray(item.casts) ? item.casts.map((c: any) => ({
        _id: c._id || c.id,
        actor: c.actor || c,
        characterName: c.characterName
      })) : [],
      // Movie-specific fields
      duration: item.duration,
      videoUrl: item.videoUrl,
      // Series-specific fields
      totalSeasons: item.totalSeasons,
      seasons: item.seasons,
    };
  }

  // Direct content format (generic /contents/client endpoint — no nesting)
  return {
    _id: item._id || item.id,
    id: item._id || item.id,
    title: item.title,
    description: item.description || '',
    poster: item.poster,
    posterUrl: item.poster,
    backdropUrl: item.poster,
    type: item.type?.toLowerCase(),
    ageRating: item.ageRating,
    trailerUrl: item.trailerUrl,
    releaseYear: item.releaseYear,
    year: item.releaseYear,
    status: item.status,
    averageRating: item.averageRating || 0,
    ratingCount: item.ratingCount || 0,
    viewsCount: item.viewsCount || 0,
    publishAt: item.publishAt,
    genres: Array.isArray(item.genres) ? item.genres.map((g: any) => ({
      _id: g._id || g.id,
      name: g.name || g
    })) : [],
    casts: Array.isArray(item.casts) ? item.casts.map((c: any) => ({
      _id: c._id || c.id,
      actor: c.actor || c,
      characterName: c.characterName
    })) : [],
    duration: item.duration,
    videoUrl: item.videoUrl,
    totalSeasons: item.totalSeasons,
    seasons: item.seasons,
  };
}

/**
 * Normalize array of content items
 */
export function normalizeContentArray(items: any[]): any[] {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeContent).filter(Boolean);
}
