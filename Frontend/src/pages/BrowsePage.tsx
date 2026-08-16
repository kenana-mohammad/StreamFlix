import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Loader, AlertCircle } from 'lucide-react';
import { useProfile } from '@/lib/profileContext';
import { apiClient } from '@/lib/apiClient';
import ContentCard from '@/components/ContentCard';

export default function BrowsePage() {
  const navigate = useNavigate();
  const { profileToken } = useProfile();

  const [allContent, setAllContent] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (!profileToken) {
      navigate('/profiles');
      return;
    }

    loadBrowseData();
  }, [profileToken]);

  const loadBrowseData = async () => {
    try {
      setLoading(true);
      setError('');

      const [contentRes, genresRes] = await Promise.all([
        apiClient.getClientContents(),
        apiClient.getGenres(),
      ]);

      const contentData = Array.isArray(contentRes) ? contentRes : (contentRes?.data || contentRes);
      const genresData = Array.isArray(genresRes) ? genresRes : (genresRes?.data || genresRes);
      
      setAllContent(contentData || []);
      setGenres(genresData || []);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load content';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search content
  const filteredContent = useMemo(() => {
    let result = allContent;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }

    // Genre filter
    if (selectedGenre !== 'all') {
      result = result.filter((item) =>
        item.genres?.some((g: any) => g.genreId._id === selectedGenre)
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      result = result.filter((item) => item.type === selectedType);
    }

    // Sort
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (sortBy === 'popularity') {
      result.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
    }

    return result;
  }, [allContent, searchQuery, selectedGenre, selectedType, sortBy]);

  if (!profileToken) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 px-4 sm:px-6 lg:px-12 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-6">Browse</h1>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search movies, series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-ink-800 border border-ink-600 text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Genre Filter */}
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

          {/* Type Filter */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-ink-800 border border-ink-600 text-white focus:border-brand-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="movie">Movies</option>
              <option value="series">Series</option>
            </select>
          </div>

          {/* Sort */}
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

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-error-500/10 border border-error-500/30 rounded-lg flex gap-3">
          <AlertCircle size={20} className="text-error-500 flex-shrink-0 mt-0.5" />
          <p className="text-error-400 text-sm">{error}</p>
        </div>
      )}

      {/* Content Grid */}
      {filteredContent.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredContent.map((content) => (
            <div
              key={content._id}
              onClick={() => navigate(`/content/${content._id}`)}
              className="cursor-pointer"
            >
              <ContentCard content={content} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle size={40} className="text-gray-500 mb-4" />
          <p className="text-gray-400 text-lg">No content found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Results Count */}
      <div className="mt-8 text-center text-gray-400">
        {filteredContent.length > 0 && (
          <p>Showing {filteredContent.length} result{filteredContent.length !== 1 ? 's' : ''}</p>
        )}
      </div>
    </div>
  );
}
