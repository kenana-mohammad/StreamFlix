import { Play, Info, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Content } from '@/types';

interface HeroBannerProps {
  content: Content | null;
  loading?: boolean;
  onPlayClick?: () => void;
}

export default function HeroBanner({ content, loading = false, onPlayClick }: HeroBannerProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="relative w-full h-screen max-h-[600px] sm:max-h-[700px] bg-ink-950 overflow-hidden rounded-lg">
        <div className="skeleton w-full h-full" />
      </div>
    );
  }

  if (!content) {
    return null;
  }

  const handlePlayClick = () => {
    if (onPlayClick) {
      onPlayClick();
    } else {
      navigate(`/watch/${content._id || content.id}`);
    }
  };

  const backdropImage = content.backdropUrl || content.poster;
  const title = content.title || '';
  const description = content.description || content.synopsis || '';
  const year = content.releaseYear || content.year;
  const rating = content.averageRating || 0;
  const ageRating = content.ageRating || 'PG-13';
  
  // استخرج أسماء الـ genres من المصفوفة
  let genreNames: string[] = [];
  if (content.genres && Array.isArray(content.genres)) {
    genreNames = content.genres.slice(0, 3).map((g: any) => {
      if (typeof g === 'string') return g;
      if (g.genreId) return g.genreId.name || g.genreId;
      if (g.name) return g.name;
      return '';
    }).filter(Boolean);
  } else if (content.genres && typeof content.genres === 'object') {
    genreNames = Object.values(content.genres).slice(0, 3).filter(Boolean);
  }

  return (
    <div className="relative w-full h-auto overflow-hidden rounded-lg card-shadow group">
      {/* Background Image */}
      <div className="relative w-full aspect-video sm:aspect-auto sm:h-[600px] bg-ink-900">
        <img
          src={backdropImage}
          alt={title}
          className="w-full h-full object-cover"
        />

        {/* Gradient Overlays */}
        {/* Left to Right Gradient */}
        <div className="hero-gradient absolute inset-0" />

        {/* Bottom Gradient */}
        <div className="hero-bottom-gradient absolute inset-0" />

        {/* Additional overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/80 via-ink-950/40 to-transparent" />
      </div>

      {/* Content Section */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 lg:p-12">
        <div className="max-w-3xl">
          {/* Title */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 line-clamp-2 font-bebas tracking-wide">
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-6 sm:mb-8 text-xs sm:text-sm">
            {/* Release Year */}
            {year && (
              <span className="text-gray-400 flex items-center gap-1">
                📅 {year}
              </span>
            )}

            {/* Age Rating */}
            <span className="px-2 sm:px-3 py-0.5 rounded border border-gray-500 text-gray-300 font-semibold">
              {ageRating}
            </span>

            {/* Rating/Score */}
            {rating > 0 && (
              <span className="flex items-center gap-1 text-gray-300">
                ⭐ {rating.toFixed(1)}
              </span>
            )}

            {/* Genres */}
            {genreNames.length > 0 && (
              <span className="text-gray-400">
                {genreNames.join(', ')}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Watch Now Button */}
            <button
              onClick={handlePlayClick}
              className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 text-sm sm:text-base group/btn"
            >
              <Play size={18} className="group-hover/btn:scale-110 transition-transform" />
              Watch Now
            </button>

            {/* More Info Button */}
            <button
              onClick={() => navigate(`/content/${content._id || content.id}`)}
              className="btn-outline flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 text-sm sm:text-base"
            >
              <Info size={18} />
              More Info
            </button>

            {/* Add to Watchlist Button (Ghost) */}
            <button
              className="btn-ghost flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 text-sm sm:text-base"
              title="Add to My List"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">My List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right side accent (subtle pink glow) */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full filter blur-3xl -z-10" />
    </div>
  );
}
