import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Plus, Check, Share2, Star, AlertCircle, Loader, Heart } from 'lucide-react';
import { useApp } from '@/store';
import { useProfile } from '@/lib/profileContext';
import { apiClient } from '@/lib/apiClient';
import ContentRow from '@/components/ContentRow';

export default function ContentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openContent, showToast } = useApp();
  const { profileToken } = useProfile();

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [userRating, setUserRating] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [myRating, setMyRating] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [relatedContent, setRelatedContent] = useState<any[]>([]);

  useEffect(() => {
    if (!id || !profileToken) {
      navigate('/profiles');
      return;
    }

    loadContentDetails();
  }, [id, profileToken]);

  const loadContentDetails = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch content details using the ID from the route parameter
      const contentRes = await apiClient.getContentById(id!);
      if (!contentRes) {
        throw new Error('Content not found');
      }
      setContent(contentRes);

      // Fetch all ratings for content
      try {
        const ratingsRes = await apiClient.getContentRatings(id!);
        setRatings(Array.isArray(ratingsRes) ? ratingsRes : (ratingsRes?.data || []));
      } catch (err) {
        // Silent fail - ratings are optional
        console.error('Failed to fetch ratings:', err);
      }

      // Fetch user's rating if exists
      try {
        const userRatingRes = await apiClient.addOrUpdateRating(id!, {});
        setUserRating(userRatingRes);
        if (userRatingRes?.rating) {
          setMyRating(userRatingRes.rating);
          setRatingComment(userRatingRes.review || '');
        }
      } catch {
        // User hasn't rated yet - silent fail
      }

      // Check if in favorites
      try {
        const favoritesRes = await apiClient.getFavorites();
        const favoritesList = Array.isArray(favoritesRes) ? favoritesRes : (favoritesRes?.data || []);
        const isFav = favoritesList.some((fav: any) => fav.contentId?._id === id || fav._id === id);
        setIsFavorite(isFav);
      } catch (err) {
        console.error('Failed to check favorites:', err);
      }

      // Check if in watchlist
      try {
        const watchlistRes = await apiClient.getWatchlist();
        const watchlist = Array.isArray(watchlistRes) ? watchlistRes : (watchlistRes?.data || []);
        const isWatch = watchlist.some((item: any) => item.contentId?._id === id || item._id === id);
        setIsWatchlisted(isWatch);
      } catch (err) {
        console.error('Failed to check watchlist:', err);
      }

      // Fetch related content (same genre)
      try {
        const allContentRes = await apiClient.getClientContents();
        const allContent = Array.isArray(allContentRes) ? allContentRes : (allContentRes?.data || []);
        
        if (contentRes?.genres && Array.isArray(allContent)) {
          const genreIds = contentRes.genres.map((g: any) => {
            return typeof g === 'object' && g.genreId ? 
              (typeof g.genreId === 'object' ? g.genreId._id : g.genreId) : 
              (typeof g === 'string' ? g : null);
          }).filter(Boolean);

          const related = allContent.filter(
            (c: any) => c._id !== id && c.genres?.some((g: any) => {
              const genreId = typeof g === 'object' && g.genreId ? 
                (typeof g.genreId === 'object' ? g.genreId._id : g.genreId) : 
                (typeof g === 'string' ? g : null);
              return genreId && genreIds.includes(genreId);
            })
          );
          setRelatedContent(related.slice(0, 10));
        }
      } catch (err) {
        console.error('Failed to load related content:', err);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load content details';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToFavorites = async () => {
    try {
      if (isFavorite) {
        await apiClient.removeFromFavorites(id!);
        setIsFavorite(false);
        showToast('Removed from favorites', 'success');
      } else {
        await apiClient.addToFavorites(id!);
        setIsFavorite(true);
        showToast('Added to favorites', 'success');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update favorites';
      showToast(msg, 'error');
    }
  };

  const handleAddToWatchlist = async () => {
    try {
      if (isWatchlisted) {
        await apiClient.removeFromWatchlist(id!);
        setIsWatchlisted(false);
        showToast('Removed from watchlist', 'success');
      } else {
        await apiClient.addToWatchlist(id!);
        setIsWatchlisted(true);
        showToast('Added to watchlist', 'success');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update watchlist';
      showToast(msg, 'error');
    }
  };

  const handleSubmitRating = async () => {
    if (!myRating) {
      showToast('Please select a rating', 'error');
      return;
    }

    try {
      setSubmittingRating(true);
      await apiClient.addOrUpdateRating(id!, {
        rating: myRating,  // Changed from 'score' to 'rating'
        review: ratingComment,  // Changed from 'comment' to 'review'
      });
      showToast('Rating submitted successfully', 'success');
      setRatingModalOpen(false);
      loadContentDetails();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit rating';
      showToast(msg, 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (!profileToken) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading content details...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle size={40} className="text-error-500 mx-auto mb-4" />
          <p className="text-error-400 mb-4">{error || 'Content not found'}</p>
          <button onClick={() => navigate('/browse')} className="btn-primary">
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum: number, r: any) => sum + r.score, 0) / ratings.length).toFixed(1)
    : 'N/A';

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Hero Backdrop */}
      <section className="relative h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={content.backdropUrl || content.posterUrl}
            alt={content.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 hero-gradient" />
        </div>

        {/* Back button */}
        <div className="relative z-10 pt-6 px-4 sm:px-6 lg:px-12">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass border border-ink-600 text-white hover:bg-white/10 transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Content Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-12 pb-8">
          <div className="max-w-3xl">
            <div className="flex items-start gap-6 mb-4">
              <img
                src={content.posterUrl}
                alt={content.title}
                className="w-32 h-48 rounded-lg object-cover shadow-2xl"
              />
              <div className="flex-1">
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">{content.title}</h1>
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  {content.releaseYear && (
                    <span className="text-gray-300">{content.releaseYear}</span>
                  )}
                  {content.ageRating && (
                    <span className="px-2 py-1 border border-gray-400 rounded text-xs font-bold text-gray-300">
                      {content.ageRating}
                    </span>
                  )}
                  {content.type && (
                    <span className="px-2 py-1 bg-brand-500/20 border border-brand-500 rounded text-xs font-bold text-brand-300">
                      {content.type.toUpperCase()}
                    </span>
                  )}
                  {content.averageRating && (
                    <span className="flex items-center gap-1 text-gold-500 font-semibold">
                      <Star size={16} className="fill-gold-500" />
                      {content.averageRating.toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="text-gray-300 line-clamp-2">{content.description}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => navigate(`/watch/${id}`)}
                className="btn-primary text-lg px-8 py-3.5 inline-flex items-center gap-2"
              >
                <Play size={22} className="fill-white" />
                Watch Now
              </button>
              <button
                onClick={handleAddToWatchlist}
                className={`btn-ghost px-4 py-2 inline-flex items-center gap-2 ${
                  isWatchlisted ? 'border-brand-500 text-brand-300' : ''
                }`}
              >
                {isWatchlisted ? <Check size={20} /> : <Plus size={20} />}
                {isWatchlisted ? 'In Watchlist' : 'Watchlist'}
              </button>
              <button
                onClick={handleAddToFavorites}
                className={`btn-ghost px-4 py-2 inline-flex items-center gap-2 ${
                  isFavorite ? 'border-error-500 text-error-300' : ''
                }`}
              >
                <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
                {isFavorite ? 'Favorited' : 'Favorite'}
              </button>
              <button className="btn-ghost px-4 py-2 inline-flex items-center gap-2">
                <Share2 size={20} />
                Share
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 sm:px-6 lg:px-12 py-12 max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-6 mb-12 border-b border-ink-600 pb-4">
          <button className="font-semibold text-white border-b-2 border-brand-500 pb-2">
            Overview
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            Episodes
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            Ratings
          </button>
        </div>

        {/* Overview Tab */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Main Info */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Description</h2>
              <p className="text-gray-300 leading-relaxed">{content.description}</p>
            </div>

            {/* Cast */}
            {content.cast && content.cast.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Cast</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {content.cast.map((castItem: any) => (
                    <div key={castItem._id} className="text-center">
                      <div className="w-24 h-32 rounded-lg overflow-hidden mb-2 bg-ink-800 mx-auto">
                        <img
                          src={castItem.castId?.profileImage || 'https://via.placeholder.com/96x128'}
                          alt={castItem.castId?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-sm font-semibold text-white">{castItem.castId?.name}</p>
                      <p className="text-xs text-gray-400">{castItem.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Genres */}
            {content.genres && content.genres.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-3">Genres</h2>
                <div className="flex flex-wrap gap-2">
                  {content.genres.map((genre: any) => (
                    <button
                      key={genre._id}
                      className="px-3 py-1 rounded-full bg-ink-800 border border-ink-600 text-gray-300 hover:border-brand-500 transition-colors"
                    >
                      {genre.genreId?.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div>
            <div className="glass rounded-lg p-6 border border-ink-600 space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Release Year</p>
                <p className="text-lg font-semibold text-white">{content.releaseYear}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Type</p>
                <p className="text-lg font-semibold text-white capitalize">{content.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Rating</p>
                <p className="text-lg font-semibold text-white">{content.ageRating}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Views</p>
                <p className="text-lg font-semibold text-white">{content.viewsCount?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Average Rating</p>
                <p className="text-lg font-semibold text-gold-500">{avgRating} / 5</p>
              </div>
              <button
                onClick={() => setRatingModalOpen(true)}
                className="btn-primary w-full mt-4"
              >
                {myRating ? 'Update Rating' : 'Add Rating'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Related Content */}
      {relatedContent.length > 0 && (
        <ContentRow title="Similar Content" items={relatedContent} />
      )}

      {/* Rating Modal */}
      {ratingModalOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setRatingModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-ink-850 rounded-2xl p-6 border border-ink-600 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Rate This Content</h2>

            {/* Star Rating */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-3">Your Rating</label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setMyRating(star)}
                    className={`text-4xl transition-colors ${
                      star <= myRating ? 'text-gold-500' : 'text-gray-600 hover:text-gold-500'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {myRating > 0 && <p className="text-center text-sm text-gold-400 mt-2">{myRating} / 5</p>}
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Comment (Optional)</label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Share your thoughts about this content..."
                maxLength={500}
                className="w-full h-24 px-3 py-2 rounded-lg bg-ink-800 border border-ink-600 text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{ratingComment.length}/500</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setRatingModalOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-ink-600 text-gray-300 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={submittingRating || !myRating}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {submittingRating ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
