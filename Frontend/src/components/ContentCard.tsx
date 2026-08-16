import { Play, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { useProfile } from '@/lib/profileContext';
import type { Content } from '@/types';

interface Props {
  content: Content;
  variant?: 'default' | 'wide' | 'continue';
  progress?: number;
}

export default function ContentCard({ content, variant = 'default', progress = 0 }: Props) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { profileToken } = useProfile();
  
  const contentId = content._id || content.id;
  const isLoggedIn = isAuthenticated && profileToken;
  
  // استخدم الـ public route للضيوف، والـ protected route للمسجلين
  const detailsRoute = isLoggedIn ? `/content/${contentId}` : `/content-details/${contentId}`;

  if (!contentId) return null;

  if (variant === 'continue') {
    const pct = Math.min((progress / (content.duration || 1)) * 100, 100);
    return (
      <div
        onClick={() => navigate(detailsRoute)}
        className="relative group cursor-pointer flex-shrink-0 w-[280px] sm:w-[320px] rounded-lg overflow-hidden card-shadow transition-transform duration-300 hover:scale-105 hover:z-10"
      >
        <div className="aspect-video bg-ink-800">
          <img src={content.backdropUrl || content.posterUrl} alt={content.title} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-semibold text-sm mb-1 truncate">{content.title}</p>
          <div className="h-1 bg-ink-600 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="absolute top-2 right-2 w-9 h-9 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play size={16} className="text-white fill-white" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(detailsRoute)}
      className={`relative group cursor-pointer flex-shrink-0 rounded-lg overflow-hidden card-shadow transition-all duration-300 hover:scale-105 hover:z-10 ${
        variant === 'wide' ? 'w-[300px] sm:w-[340px]' : 'w-[160px] sm:w-[180px]'
      }`}
    >
      <div className={variant === 'wide' ? 'aspect-video' : 'aspect-[2/3]'}>
        <img
          src={variant === 'wide' ? (content.backdropUrl || content.posterUrl) : content.posterUrl}
          alt={content.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />

      {content.isNew && (
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500 text-white">NEW</span>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform">
        <p className="text-white font-semibold text-sm mb-1 truncate">{content.title}</p>
        <div className="flex items-center gap-2 text-xs text-gray-300">
          {content.averageRating && (
            <span className="flex items-center gap-1">
              <Star size={11} className="text-gold-500 fill-gold-500" />
              {content.averageRating.toFixed(1)}
            </span>
          )}
          {content.year && <span>{content.year}</span>}
          {content.ageRating && <span className="px-1 border border-gray-500 rounded text-[10px]">{content.ageRating}</span>}
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="w-12 h-12 rounded-full glass flex items-center justify-center">
          <Play size={20} className="text-white fill-white ml-0.5" />
        </div>
      </div>
    </div>
  );
}
