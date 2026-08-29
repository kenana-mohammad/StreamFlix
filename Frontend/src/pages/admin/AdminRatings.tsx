import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/lib/useToast';

export default function AdminRatings() {
  const navigate = useNavigate();
  const toast = useToast();

  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true); setError('');
      const res = await apiClient.getDashboardRecentRatings();
      setRatings(Array.isArray(res) ? res : (res?.data || []));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load ratings');
    } finally { setLoading(false); }
  };

  const Stars = ({ value }: { value: number }) => (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} size={12} className={s <= Math.round(value / 2) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'} />
      ))}
      <span className="ml-1.5 text-yellow-400 font-semibold text-sm">{value}/10</span>
    </div>
  );

  return (
    <div className="min-h-screen pt-6 pb-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
      <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Recent Ratings</h1>
          <p className="text-gray-400 text-sm mt-1">Last 10 ratings across all content</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-ink-600 text-gray-400 hover:border-brand-500 hover:text-white transition-all text-sm disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && <div className="mb-4 flex items-center gap-2 text-red-400 text-sm"><AlertCircle size={15} />{error}</div>}

      {loading ? (
        <div className="flex justify-center py-20"><Loader size={36} className="text-brand-500 animate-spin" /></div>
      ) : ratings.length === 0 ? (
        <div className="glass rounded-xl border border-ink-600 p-10 text-center text-gray-500">No ratings yet.</div>
      ) : (
        <div className="space-y-3">
          {ratings.map((r: any, i: number) => (
            <div key={r._id || i} className="glass rounded-xl border border-ink-600 p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-semibold">{r.contentId?.title || 'Unknown content'}</p>
                  </div>
                  <p className="text-gray-400 text-sm">By profile: <span className="text-gray-300">{r.profileId?.name || '—'}</span></p>
                  {r.review && <p className="text-gray-400 text-sm mt-2 italic">"{r.review}"</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Stars value={r.rating} />
                  <p className="text-gray-600 text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
