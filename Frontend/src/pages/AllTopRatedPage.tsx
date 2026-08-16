import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader, AlertCircle, Heart, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useProfile } from '@/lib/profileContext';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/lib/useToast';
import { normalizeContentArray } from '@/lib/utils';
import ContentCard from '@/components/ContentCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AllTopRatedPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const { profileToken } = useProfile();

  const [allContent, setAllContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // جلب أعلى محتوى تقييم
      const contentData = await apiClient.getTopRatedContent();
      const normalizedContent = normalizeContentArray(Array.isArray(contentData) ? contentData : (contentData || []));
      setAllContent(normalizedContent);

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
      const msg = err?.response?.data?.message || 'Failed to load top rated content';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredContent = searchQuery.trim()
    ? allContent.filter((item) => {
        const query = searchQuery.toLowerCase();
        return item.title?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query);
      })
    : allContent;

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
            <p className="text-gray-400">Loading top rated content...</p>
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
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp size={32} className="text-brand-500" />
              <h1 className="text-4xl font-bold text-white">Top Rated</h1>
            </div>
            <p className="text-gray-400">Most popular and highest-rated content</p>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-ink-800 border border-ink-600 text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none"
            />
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
                Showing {filteredContent.length} item{filteredContent.length !== 1 ? 's' : ''}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle size={40} className="text-gray-500 mb-4" />
              <p className="text-gray-400 text-lg">No content found</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
