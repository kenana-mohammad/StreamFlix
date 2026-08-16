import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, AlertCircle, Users, Film, CreditCard, BarChart3 } from 'lucide-react';
import { useToast } from '@/lib/useToast';
import { useProfile } from '@/lib/profileContext';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { profileToken } = useProfile();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profileToken) {
      navigate('/profiles');
      return;
    }

    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [profileToken, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      toast.error('Admin dashboard is not yet implemented for Phase 1');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load dashboard data';
      setError(msg);
      toast.error(msg);
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
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 px-4 sm:px-6 lg:px-12 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">This page will be implemented in Phase 2</p>

        {error && (
          <div className="mt-6 p-4 bg-error-500/10 border border-error-500/30 rounded-lg flex gap-3">
            <AlertCircle size={20} className="text-error-500 flex-shrink-0 mt-0.5" />
            <p className="text-error-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
