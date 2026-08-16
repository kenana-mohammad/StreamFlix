import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Loader, AlertCircle, MessageCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/lib/useToast';
import { apiClient } from '@/lib/apiClient';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface ContentRating {
  _id: string;
  contentId: {
    _id: string;
    title: string;
    poster: string;
    type: 'movie' | 'series';
    releaseYear?: number;
  };
  averageRating: number;
  totalRatings: number;
  ratings: Array<{
    _id: string;
    rating: number;
    review?: string;
    createdAt: string;
  }>;
}

export default function ContentRatingsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [contentList, setContentList] = useState<ContentRating[]>([]);
  const [filteredList, setFilteredList] = useState<ContentRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContent, setSelectedContent] = useState<ContentRating | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'series'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'count'>('rating');

  useEffect(() => {
    loadAllContent();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [contentList, filterType, sortBy]);

  const loadAllContent = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiClient.getClientContents();
      const allContent = Array.isArray(response) ? response : (response?.data || response);
      
      if (Array.isArray(allContent)) {
        const contentWithRatings = await Promise.all(
          allContent.map(async (content) => {
            try {
              const ratingsRes = await apiClient.getContentRatings(content._id);
              const ratingsData = Array.isArray(ratingsRes) ? ratingsRes : (ratingsRes?.data || ratingsRes);
              return {
                _id: content._id,
                contentId: {
                  _id: content._id,
                  title: content.title,
                  poster: content.poster,
                  type: content.type,
                  releaseYear: content.releaseYear,
                },
                averageRating: ratingsData.averageRating || 0,
                totalRatings: ratingsData.totalRatings || 0,
                ratings: ratingsData.ratings || [],
              };
            } catch (err) {
              return {
                _id: content._id,
                contentId: {
                  _id: content._id,
                  title: content.title,
                  poster: content.poster,
                  type: content.type,
                  releaseYear: content.releaseYear,
                },
                averageRating: 0,
                totalRatings: 0,
                ratings: [],
              };
            }
          })
        );
        
        setContentList(contentWithRatings);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load ratings';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = contentList;

    if (filterType !== 'all') {
      filtered = filtered.filter((item) => item.contentId.type === filterType);
    }

    if (sortBy === 'rating') {
      filtered = [...filtered].sort((a, b) => b.averageRating - a.averageRating);
    } else if (sortBy === 'count') {
      filtered = [...filtered].sort((a, b) => b.totalRatings - a.totalRatings);
    }

    setFilteredList(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center pt-24">
          <div className="text-center">
            <Loader size={48} className="text-brand-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Loading content ratings...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-12">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-full bg-brand-500/20 hover:bg-brand-500/40 flex items-center justify-center transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">Content Ratings</h1>
              <p className="text-gray-400 flex items-center gap-2">
                <TrendingUp size={18} />
                Discover what people think about our content
              </p>
            </div>
          </div>

          {/* Filters & Sort */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 bg-ink-900/50 p-4 rounded-lg border border-ink-700">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-2 font-semibold">Filter by Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'movie' | 'series')}
                className="w-full px-4 py-2.5 bg-ink-800 border border-ink-600 rounded-lg text-white font-semibold hover:border-brand-500 transition-colors"
              >
                <option value="all">All Content</option>
                <option value="movie">Movies Only</option>
                <option value="series">Series Only</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-2 font-semibold">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'rating' | 'count')}
                className="w-full px-4 py-2.5 bg-ink-800 border border-ink-600 rounded-lg text-white font-semibold hover:border-brand-500 transition-colors"
              >
                <option value="rating">Highest Rating</option>
                <option value="count">Most Rated</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={loadAllContent}
                className="w-full px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold transition-all"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-8 p-6 bg-error-500/10 border border-error-500/30 rounded-xl flex gap-4 items-start">
              <AlertCircle size={24} className="text-error-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-error-400 font-semibold mb-2">{error}</p>
                <button
                  onClick={loadAllContent}
                  className="px-4 py-2 bg-error-500 hover:bg-error-600 text-white rounded-lg text-sm font-semibold transition-all"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Content Grid */}
          {filteredList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredList.map((item) => (
                <div
                  key={item._id}
                  onClick={() => setSelectedContent(item)}
                  className="group bg-gradient-to-br from-ink-850 to-ink-900 border border-ink-600 hover:border-brand-500 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/20"
                >
                  {/* Poster */}
                  <div className="relative w-full aspect-[2/3] overflow-hidden bg-ink-800">
                    <img
                      src={item.contentId.poster}
                      alt={item.contentId.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>

                  {/* Content Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold text-white line-clamp-2 flex-1">{item.contentId.title}</h3>
                      <span className="px-2.5 py-1 bg-brand-500/20 text-brand-300 text-xs font-bold rounded whitespace-nowrap">
                        {item.contentId.type === 'movie' ? '🎬 Movie' : '📺 Series'}
                      </span>
                    </div>

                    {item.contentId.releaseYear && (
                      <p className="text-xs text-gray-500 mb-3">{item.contentId.releaseYear}</p>
                    )}

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={
                              star <= Math.round(item.averageRating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-600'
                            }
                          />
                        ))}
                      </div>
                      <span className="text-yellow-400 font-bold">{item.averageRating.toFixed(1)}</span>
                      <span className="text-gray-500 text-xs">({item.totalRatings})</span>
                    </div>

                    {/* View Details */}
                    <div className="flex items-center gap-2 text-brand-400 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity pt-2 border-t border-ink-700">
                      <MessageCircle size={14} />
                      View All Reviews
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <Star size={64} className="text-gray-600 mx-auto mb-6" />
              <p className="text-gray-400 text-2xl font-semibold mb-3">No ratings found</p>
              <p className="text-gray-500 text-lg">No content matches your filters</p>
            </div>
          )}
        </div>
      </main>

      {/* Content Details Modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ink-900 border border-ink-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-ink-900/95 backdrop-blur border-b border-ink-700 p-6 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedContent.contentId.title}</h2>
                <p className="text-gray-400 text-sm">
                  {selectedContent.contentId.type === 'movie' ? '🎬 Movie' : '📺 Series'} • {selectedContent.contentId.releaseYear}
                </p>
              </div>
              <button
                onClick={() => setSelectedContent(null)}
                className="text-gray-400 hover:text-white transition-colors text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Overall Rating */}
              <div className="mb-8 p-6 bg-gradient-to-r from-brand-500/10 to-pink-500/10 rounded-lg border border-brand-500/20">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Overall Rating</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={24}
                            className={
                              star <= Math.round(selectedContent.averageRating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-600'
                            }
                          />
                        ))}
                      </div>
                      <span className="text-yellow-400 font-bold text-2xl">
                        {selectedContent.averageRating.toFixed(1)}/5
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{selectedContent.totalRatings}</p>
                    <p className="text-gray-400 text-sm">Rating{selectedContent.totalRatings !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <h3 className="text-xl font-bold text-white mb-4">User Reviews</h3>
              <div className="space-y-4">
                {selectedContent.ratings && selectedContent.ratings.length > 0 ? (
                  selectedContent.ratings.slice(0, 10).map((review) => (
                    <div key={review._id} className="bg-ink-800/50 p-4 rounded-lg border border-ink-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
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
                        <span className="text-xs text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.review && (
                        <p className="text-gray-300 text-sm leading-relaxed">{review.review}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No reviews yet</p>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div className="p-6 border-t border-ink-700">
              <button
                onClick={() => setSelectedContent(null)}
                className="w-full px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
