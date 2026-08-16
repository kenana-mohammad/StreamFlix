import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Star, AlertCircle, Loader, Heart, Eye, Calendar, Tag, Plus, Clock, Users } from 'lucide-react';
import { useToast } from '@/lib/useToast';
import { apiClient } from '@/lib/apiClient';
import { normalizeContent } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PublicContentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [content, setContent] = useState<any>(null);
  const [ratings, setRatings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }
    loadContentDetails();
  }, [id]);

  const loadContentDetails = async () => {
    try {
      setLoading(true);
      setError('');

      // جلب تفاصيل المحتوى باستخدام الـ smart fetch
      const rawData = await apiClient.getContentDetailsSmart(id!);
      const normalizedContent = normalizeContent(rawData);
      setContent(normalizedContent);

      // جلب التقييمات
      try {
        const ratingsRes = await apiClient.getContentRatings(id!);
        const ratingsData = Array.isArray(ratingsRes) ? ratingsRes : (ratingsRes?.data || ratingsRes);
        setRatings(ratingsData);
      } catch (err) {
        console.error('Failed to load ratings:', err);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load content';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center pt-24">
          <div className="text-center">
            <Loader size={48} className="text-brand-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Loading content details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center pt-24">
          <div className="text-center max-w-md">
            <AlertCircle size={48} className="text-error-500 mx-auto mb-4" />
            <p className="text-error-400 text-lg font-semibold mb-6">{error || 'Content not found'}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold transition-all"
            >
              Back to Home
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isMovie = content.type === 'movie';
  const isSeries = content.type === 'series';

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-brand-400 hover:text-brand-300 font-semibold mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
            {/* Left: Poster */}
            <div className="lg:col-span-1">
              <div className="sticky top-32">
                {content.poster && (
                  <img
                    src={content.poster}
                    alt={content.title}
                    className="w-full rounded-xl shadow-2xl object-cover aspect-[2/3]"
                  />
                )}

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-brand-500 to-pink-500 hover:from-brand-600 hover:to-pink-600 text-white rounded-lg font-bold transition-all shadow-lg"
                  >
                    <Play size={20} />
                    Watch Now
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => navigate('/login')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-ink-800 hover:bg-ink-700 text-gray-300 rounded-lg font-semibold transition-all border border-ink-600"
                    >
                      <Plus size={18} />
                      <span className="text-sm">My List</span>
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-ink-800 hover:bg-ink-700 text-gray-300 rounded-lg font-semibold transition-all border border-ink-600"
                    >
                      <Heart size={18} />
                      <span className="text-sm">Favorite</span>
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 text-center pt-2">
                    Sign in to add to your list or rate this content
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Details */}
            <div className="lg:col-span-2">
              {/* Title & Type */}
              <div className="mb-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
                    {content.title}
                  </h1>
                  <span className="px-3 py-1.5 bg-brand-500/20 text-brand-300 text-xs font-bold rounded-full whitespace-nowrap">
                    {isMovie ? '🎬 Movie' : isSeries ? '📺 Series' : '📺 Show'}
                  </span>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
                  {content.releaseYear && (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-brand-500" />
                      {content.releaseYear}
                    </div>
                  )}
                  {content.ageRating && (
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-brand-500" />
                      {content.ageRating}
                    </div>
                  )}
                  {isMovie && content.duration && (
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-brand-500" />
                      {content.duration}
                    </div>
                  )}
                  {isSeries && content.totalSeasons && (
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-brand-500" />
                      {content.totalSeasons} Season{content.totalSeasons !== 1 ? 's' : ''}
                    </div>
                  )}
                  {content.viewsCount !== undefined && (
                    <div className="flex items-center gap-2">
                      <Eye size={16} className="text-brand-500" />
                      {content.viewsCount.toLocaleString()} views
                    </div>
                  )}
                </div>
              </div>

              {/* Rating */}
              {(content.averageRating || ratings?.averageRating) && (
                <div className="mb-8 p-6 bg-gradient-to-r from-brand-500/10 to-pink-500/10 rounded-lg border border-brand-500/20">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={24}
                          className={
                            star <= Math.round(content.averageRating || ratings?.averageRating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }
                        />
                      ))}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-400">
                        {(content.averageRating || ratings?.averageRating || 0).toFixed(1)}/5
                      </p>
                      <p className="text-sm text-gray-400">
                        Based on {content.ratingCount || ratings?.totalRatings || 0} ratings
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Genres */}
              {content.genres && content.genres.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {content.genres.map((genre: any) => (
                      <span
                        key={genre._id || genre.name}
                        className="px-4 py-1.5 bg-ink-800 border border-ink-600 rounded-full text-sm text-gray-300 font-medium"
                      >
                        {genre.name || genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {content.description && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-white mb-3">Overview</h3>
                  <p className="text-gray-300 leading-relaxed text-base">
                    {content.description}
                  </p>
                </div>
              )}

              {/* Cast */}
              {content.casts && content.casts.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Cast</h3>
                  <div className="flex flex-wrap gap-2">
                    {content.casts.slice(0, 8).map((cast: any) => (
                      <span
                        key={cast._id}
                        className="px-3 py-1 bg-ink-800 border border-ink-600 rounded-full text-sm text-gray-300 font-medium"
                      >
                        {cast.actor?.name || cast.characterName || 'Actor'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-6 p-6 bg-ink-900/50 rounded-lg border border-ink-700">
                {content.releaseYear && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Release Year</p>
                    <p className="text-lg font-bold text-white">{content.releaseYear}</p>
                  </div>
                )}
                {content.ageRating && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Age Rating</p>
                    <p className="text-lg font-bold text-white">{content.ageRating}</p>
                  </div>
                )}
                {isMovie && content.duration && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Duration</p>
                    <p className="text-lg font-bold text-white">{content.duration}</p>
                  </div>
                )}
                {isSeries && content.totalSeasons && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Seasons</p>
                    <p className="text-lg font-bold text-white">{content.totalSeasons}</p>
                  </div>
                )}
                {content.viewsCount !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Views</p>
                    <p className="text-lg font-bold text-white">{content.viewsCount.toLocaleString()}</p>
                  </div>
                )}
                {content.type && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Type</p>
                    <p className="text-lg font-bold text-white">
                      {isMovie ? '🎬 Movie' : isSeries ? '📺 Series' : '📺 Show'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          {ratings?.ratings && ratings.ratings.length > 0 && (
            <div className="mt-16 pt-16 border-t border-ink-700">
              <h2 className="text-3xl font-bold text-white mb-8">User Reviews</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ratings.ratings.slice(0, 6).map((review: any) => (
                  <div key={review._id} className="p-6 bg-ink-900/50 rounded-lg border border-ink-700">
                    <div className="flex items-center gap-2 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={
                            star <= Math.round(review.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }
                        />
                      ))}
                      <span className="text-yellow-400 font-bold ml-1">{review.rating.toFixed(1)}</span>
                    </div>
                    {review.review && (
                      <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                        {review.review}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-3">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>

              {ratings.ratings.length > 6 && (
                <button
                  onClick={() => navigate('/ratings')}
                  className="mt-8 w-full px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold transition-all"
                >
                  View All Reviews
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
