import { useEffect } from 'react';
import { X, Play } from 'lucide-react';
import { useApp } from '@/store';

export default function ContentModal() {
  const { selectedContent, closeContent } = useApp();

  useEffect(() => {
    if (selectedContent) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [selectedContent]);

  if (!selectedContent) return null;
  const c = selectedContent;

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto" onClick={closeContent}>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fadeIn" />
      <div className="relative min-h-screen flex items-start justify-center p-0 sm:p-4 lg:p-8">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl bg-ink-850 sm:rounded-xl overflow-hidden shadow-2xl animate-scaleIn my-0 sm:my-4"
        >
          <div className="relative aspect-video bg-ink-800">
            <img src={c.backdropUrl || c.posterUrl} alt={c.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-850 via-ink-850/40 to-transparent" />
            <button
              onClick={closeContent}
              className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-white" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{c.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
                {c.year && <span className="text-gray-300">{c.year}</span>}
                {c.ageRating && <span className="px-1.5 py-0.5 border border-gray-400 rounded text-xs text-gray-300">{c.ageRating}</span>}
                {c.type && <span className="text-gray-300 capitalize">{c.type}</span>}
              </div>
              <button className="btn-primary">
                <Play size={20} className="fill-white" /> Watch Now
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <p className="text-gray-300 leading-relaxed mb-4">{c.description}</p>
            
            {c.genres && c.genres.length > 0 && (
              <div className="text-sm">
                <span className="text-gray-500">Genres: </span>
                <span className="text-gray-300">{c.genres.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
