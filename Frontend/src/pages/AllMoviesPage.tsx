import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Loader, AlertCircle, Heart } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useProfile } from '@/lib/profileContext';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/lib/useToast';
import { normalizeContentArray } from '@/lib/utils';
import ContentCard from '@/components/ContentCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AllMoviesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const { profileToken } = useProfile();

  const [allContent, setAllContent] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // جلب الأفلام من endpoint محدد (أفضل من generic content)
      const moviesData = await apiClient.getAllMovies();
      const normalizedMovies = normalizeContentArray(Array.isArray(moviesData) ? moviesData : (moviesData || []));
      setAllContent(normalizedMovies);

      // جلب الأنواع
      const genresRes = await apiClient.getGenres();
      const genresData = Array.isArray(genresRes) ? genresRes : (genresRes?.data || []);
      setGenres(genresData);

      // جلب المفضلة إذا كان المستخدم مسجل دخول
      if (isAuthenticated && profileToken) {
        try {
          const favRes = await apiClient.getFavorites();
          const favData = Array.isArray(favRes) ? favRes : (favRes?.data || favRes);
          const favIds = Array.isArray(favData) ? favData.map((f: any) => f.contentId?._id || f._id || f.contentId) : [];
          setFavorites(favIds);
        } catch (err) {
          console.error('Failed to load favorites:', err);
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load movies';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredContent = (() => {
    let result = allContent;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }

    if (selectedGenre !== 'all') {
      result = result.filter((item) =>
        item.genres?.some((g: any) => g.genreId?._id === selectedGenre || g._id === selectedGenre)
      );
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (sortBy === 'popularity') {
      result.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
    }

    return result;
  })();

  const handleToggleFavorite = async (contentId: string) => {
    if (!isAuthenticated || !profileToken) {
      toast.error('Please login to add favorites');
      navigate('/login');
      return;
    }

    try {
      if (favorites.includes(contentId)) {
        await apiClient.removeFromFavorites(contentId);
        setFavorites(favorites.filter((id) => id !== contentId));
        toast.success('Removed from favorites');
      } else {
        await apiClient.addToFavorites(contentId);
        setFavorites([...favorites, contentId]);
        toast.success('Added to favorites');
      }
    } catch (err: any) {
      toast.error('Failed to update favorites');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center pt-24">
          <div className="text-center">
            <Loader size={40} className="text-brand-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading movies...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-12">
        <div className="px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">All Movies</h1>
            <p className="text-gray-400">Browse all available movies</p>
          </div>

          {/* Search & Filters */}
          <div className="space-y-4 mb-8">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-ink-800 border border-ink-600 text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none"
              />
            </div>

            {/* Genre & Sort */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Genre</label>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-ink-800 border border-ink-600 text-white focus:border-brand-500 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Genres</option>
                  {genres.map((genre) => (
                    <option key={genre._id} value={genre._id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-ink-800 border border-ink-600 text-white focus:border-brand-500 focus:outline-none cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="rating">Top Rated</option>
                  <option value="popularity">Most Popular</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-error-500/10 border border-error-500/30 rounded-lg flex gap-3">
              <AlertCircle size={20} className="text-error-500 flex-shrink-0 mt-0.5" />
              <p className="text-error-400 text-sm">{error}</p>
            </div>
          )}

          {/* Content Grid */}
          {filteredContent.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
                {filteredContent.map((item) => (
                  <div key={item._id} className="relative group">
                    <div
                      onClick={() => navigate(`/content-details/${item._id}`)}
                      className="cursor-pointer"
                    >
                      <ContentCard content={item} />
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(item._id);
                      }}
                      className="absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-brand-500/80 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                      title={favorites.includes(item._id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart
                        size={18}
                        className={
                          favorites.includes(item._id)
                            ? 'fill-red-500 text-red-500'
                            : 'text-white'
                        }
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="text-center text-gray-400">
                Showing {filteredContent.length} movie{filteredContent.length !== 1 ? 's' : ''}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle size={40} className="text-gray-500 mb-4" />
              <p className="text-gray-400 text-lg">No movies found</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
