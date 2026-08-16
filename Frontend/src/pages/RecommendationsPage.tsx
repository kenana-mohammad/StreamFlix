import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, AlertCircle } from 'lucide-react';
import { useProfile } from '@/lib/profileContext';
import { apiClient } from '@/lib/apiClient';
import ContentRow from '@/components/ContentRow';

export default function RecommendationsPage() {
  const navigate = useNavigate();
  const { profileToken } = useProfile();

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profileToken) {
      navigate('/profiles');
      return;
    }

    loadRecommendations();
  }, [profileToken]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiClient.getRecommendations();
      const recsData = Array.isArray(response) ? response : (response?.data || response);
      setRecommendations(recsData || []);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load recommendations';
      setError(msg);
    } finally {
      setLoading(false);
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
          <p className="text-gray-400">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 px-4 sm:px-6 lg:px-12 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Recommended For You</h1>
        <p className="text-gray-400">Based on your watch history and preferences</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-500/10 border border-error-500/30 rounded-lg flex gap-3">
          <AlertCircle size={20} className="text-error-500 flex-shrink-0 mt-0.5" />
          <p className="text-error-400 text-sm">{error}</p>
        </div>
      )}

      {recommendations.length > 0 ? (
        <ContentRow title="Personalized Picks" items={recommendations} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle size={40} className="text-gray-500 mb-4" />
          <p className="text-gray-400 text-lg">No recommendations yet</p>
          <p className="text-gray-500 text-sm mt-2">Start watching content to get personalized recommendations</p>
          <button
            onClick={() => navigate('/browse')}
            className="btn-primary mt-6"
          >
            Browse Content
          </button>
        </div>
      )}
    </div>
  );
}
