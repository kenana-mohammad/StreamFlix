import { useState, useEffect } from 'react';
import { useProfile } from '@/lib/profileContext';
import { useApp } from '@/store';
import { apiClient } from '@/lib/apiClient';
import { useNavigate } from 'react-router-dom';
import ContentCard from '@/components/ContentCard';
import { Bookmark, Heart, History as HistoryIcon, AlertCircle, Loader } from 'lucide-react';

interface Props { mode: 'watchlist' | 'favorites' | 'history'; }

const config = {
  watchlist: { title: 'My Watchlist', icon: Bookmark, empty: 'Your watchlist is empty', emptySub: 'Add movies and shows to watch later' },
  favorites: { title: 'Favorites', icon: Heart, empty: 'No favorites yet', emptySub: 'Tap the heart on any title to add it here' },
  history: { title: 'Watch History', icon: HistoryIcon, empty: 'No watch history', emptySub: 'Start watching to see your history here' },
};

export default function CollectionPage({ mode }: Props) {
  const navigate = useNavigate();
  const { profileToken } = useProfile();
  const { openContent, showToast } = useApp();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cfg = config[mode];
  const Icon = cfg.icon;

  useEffect(() => {
    if (!profileToken) {
      navigate('/profiles');
      return;
    }
    loadData();
  }, [profileToken, mode]);

  const loadData = async () => {
    try {
      setLoading(true);
      let data: any = [];

      if (mode === 'watchlist') {
        const res = await apiClient.getWatchlist();
        const resData = Array.isArray(res) ? res : (res?.data || res);
        // الـ Watchlist يمكن يرجع { contentId: {...} } أو مباشرة الـ content
        data = Array.isArray(resData) ? resData.map((item: any) => item.contentId || item) : [];
      } else if (mode === 'favorites') {
        const res = await apiClient.getFavorites();
        const resData = Array.isArray(res) ? res : (res?.data || res);
        // الـ Favorites يرجع { contentId: {...} }
        data = Array.isArray(resData) ? resData.map((item: any) => item.contentId || item) : [];
      } else {
        const res = await apiClient.getWatchHistory();
        const resData = Array.isArray(res) ? res : (res?.data || res);
        // الـ Watch History يرجع { contentId: {...}, watchedDuration, ... }
        data = Array.isArray(resData) ? resData.map((item: any) => item.contentId || item) : [];
      }

      // تصفية العناصر الفارغة
      data = data.filter((item: any) => item && item._id);
      
      setItems(data);
      setError('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || `Failed to load ${mode}`;
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!profileToken) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading {mode}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="px-4 sm:px-6 lg:px-12">
        <div className="flex items-center gap-3 mb-8">
          <Icon size={28} className="text-brand-500" />
          <h1 className="text-3xl font-bold text-white">{cfg.title}</h1>
          {items.length > 0 && (
            <span className="text-gray-400 text-lg">({items.length})</span>
          )}
        </div>

        {error && (
          <div className="bg-error-500/10 border border-error-500/30 rounded-lg p-4 flex gap-3 mb-6">
            <AlertCircle size={20} className="text-error-500 flex-shrink-0 mt-0.5" />
            <p className="text-error-400 text-sm">{error}</p>
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-ink-800 flex items-center justify-center mb-4">
              <Icon size={36} className="text-gray-600" />
            </div>
            <p className="text-xl text-gray-400 mb-2">{cfg.empty}</p>
            <p className="text-sm text-gray-500">{cfg.emptySub}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((c) => (
              <ContentCard key={c._id || c.id} content={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
