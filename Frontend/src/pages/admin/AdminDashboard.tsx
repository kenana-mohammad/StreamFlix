import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Film, Tv, Layers, PlayCircle, CreditCard,
  Star, TrendingUp, RefreshCw, AlertCircle, Loader,
  ChevronRight, UserCheck, UserX, Upload,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/lib/useToast';

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string; value: number | string; icon: any; color: string; sub?: string;
}) {
  return (
    <div className="glass rounded-xl border border-ink-600 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
        <p className="text-sm text-gray-400">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Nav card ───────────────────────────────────────────────────────────────
function NavCard({
  label, desc, icon: Icon, color, path,
}: {
  label: string; desc: string; icon: any; color: string; path: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className="glass rounded-xl border border-ink-600 p-5 text-left hover:border-brand-500/50 hover:bg-brand-500/5 transition-all group"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-white font-semibold group-hover:text-brand-300 transition-colors">{label}</p>
      <p className="text-xs text-gray-500 mt-1">{desc}</p>
      <ChevronRight size={16} className="text-gray-600 group-hover:text-brand-400 mt-2 transition-colors" />
    </button>
  );
}

export default function AdminDashboard() {
  const toast = useToast();

  const [stats, setStats] = useState<any>(null);
  const [recentRatings, setRecentRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async (silent = false) => {
    try {
      silent ? setRefreshing(true) : setLoading(true);
      setError('');

      const [statsRes, ratingsRes] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getDashboardRecentRatings(),
      ]);

      setStats(statsRes);
      setRecentRatings(Array.isArray(ratingsRes) ? ratingsRes : (ratingsRes?.data || []));
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load dashboard data';
      setError(msg);
      if (silent) toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-red-400 font-semibold mb-2">{error}</p>
          <button onClick={() => load()} className="btn-primary px-6 py-2">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6 pb-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">StreamFlix platform overview</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-ink-600 text-gray-400 hover:border-brand-500 hover:text-white transition-all text-sm disabled:opacity-50"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error banner (non-fatal) */}
      {error && stats && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/25 rounded-lg text-red-400 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ── Stats grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Users"    value={stats?.users}       icon={Users}      color="bg-blue-600/80"    sub={`${stats?.activeUsers ?? 0} active`} />
        <StatCard label="Active Users"   value={stats?.activeUsers} icon={UserCheck}  color="bg-green-600/80"   />
        <StatCard label="Movies"         value={stats?.movies}      icon={Film}       color="bg-purple-600/80"  />
        <StatCard label="Series"         value={stats?.series}      icon={Tv}         color="bg-pink-600/80"    />
        <StatCard label="Seasons"        value={stats?.seasons}     icon={Layers}     color="bg-yellow-600/80"  />
        <StatCard label="Episodes"       value={stats?.episodes}    icon={PlayCircle} color="bg-orange-600/80"  />
        <StatCard label="Plans"          value={stats?.plans}       icon={CreditCard} color="bg-cyan-600/80"    />
        <StatCard label="Inactive Users" value={(stats?.users ?? 0) - (stats?.activeUsers ?? 0)} icon={UserX} color="bg-red-600/80" />
      </div>

      {/* ── Navigation cards ───────────────────────────────────────────── */}
      <h2 className="text-xl font-bold text-white mb-4">Management</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        <NavCard label="Users"         desc="View and manage user accounts"    icon={Users}      color="bg-blue-600/80"    path="/admin/users" />
        <NavCard label="Analytics"     desc="Platform usage and stats"         icon={TrendingUp} color="bg-green-600/80"   path="/admin/analytics" />
        <NavCard label="Content"       desc="Movies and series management"     icon={Film}       color="bg-purple-600/80"  path="/admin/content" />
        <NavCard label="Plans"         desc="Subscription plan management"     icon={CreditCard} color="bg-cyan-600/80"    path="/admin/plans" />
        <NavCard label="Subscriptions" desc="User subscription overview"       icon={Layers}     color="bg-yellow-600/80"  path="/admin/subscriptions" />
        <NavCard label="Ratings"       desc="Recent ratings and reviews"       icon={Star}       color="bg-orange-600/80"  path="/admin/ratings" />
        <NavCard label="Upload"        desc="Upload videos and poster images"  icon={Upload}     color="bg-pink-600/80"    path="/admin/upload" />
      </div>

      {/* ── Recent Ratings ─────────────────────────────────────────────── */}
      <h2 className="text-xl font-bold text-white mb-4">Recent Ratings</h2>
      {recentRatings.length === 0 ? (
        <div className="glass rounded-xl border border-ink-600 p-8 text-center text-gray-500">
          No ratings yet.
        </div>
      ) : (
        <div className="glass rounded-xl border border-ink-600 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/60 border-b border-ink-700">
              <tr>
                <th className="text-left text-gray-400 px-5 py-3 font-medium">Content</th>
                <th className="text-left text-gray-400 px-5 py-3 font-medium">Profile</th>
                <th className="text-left text-gray-400 px-5 py-3 font-medium">Rating</th>
                <th className="text-left text-gray-400 px-5 py-3 font-medium hidden sm:table-cell">Review</th>
                <th className="text-left text-gray-400 px-5 py-3 font-medium hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentRatings.map((r: any, i: number) => (
                <tr key={r._id || i} className="border-b border-ink-800/50 hover:bg-ink-800/30 transition-colors">
                  <td className="px-5 py-3 text-white font-medium">
                    {r.contentId?.title || '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-300">
                    {r.profileId?.name || '—'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <Star size={13} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-yellow-400 font-semibold">{r.rating ?? '—'}</span>
                      <span className="text-gray-600 text-xs">/10</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-400 hidden sm:table-cell max-w-xs truncate">
                    {r.review || <span className="text-gray-600 italic">No review</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs hidden md:table-cell">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
