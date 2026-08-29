import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Loader, AlertCircle, UserCheck, UserX, RefreshCw, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/lib/useToast';

export default function AdminUsers() {
  const navigate = useNavigate();
  const toast = useToast();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<any>(null);
  const [expandLoading, setExpandLoading] = useState(false);

  // Create content manager modal
  const [showCreate, setShowCreate] = useState(false);
  const [cmName, setCmName] = useState('');
  const [cmEmail, setCmEmail] = useState('');
  const [cmPassword, setCmPassword] = useState('');
  const [cmPhone, setCmPhone] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async (q?: string) => {
    try {
      setLoading(true); setError('');
      const res = await apiClient.getAdminUsers(q);
      setUsers(Array.isArray(res) ? res : (res?.data || []));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load users');
    } finally { setLoading(false); }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(search.trim() || undefined);
  };

  const handleToggleStatus = async (userId: string, current: string) => {
    const newStatus = current === 'active' ? 'deactivated' : 'active';
    try {
      setUpdating(userId);
      await apiClient.updateAdminUserStatus(userId, newStatus as any);
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    } finally { setUpdating(null); }
  };

  const handleExpand = async (userId: string) => {
    if (expanded === userId) { setExpanded(null); setExpandedData(null); return; }
    try {
      setExpanded(userId); setExpandLoading(true);
      const res = await apiClient.getAdminUserById(userId);
      setExpandedData(res);
    } catch (err: any) {
      toast.error('Failed to load user details');
      setExpanded(null);
    } finally { setExpandLoading(false); }
  };

  const handleCreateCM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmName || !cmEmail || !cmPassword) { toast.error('Name, email and password are required'); return; }
    try {
      setCreating(true);
      await apiClient.createContentManager({ name: cmName, email: cmEmail, password: cmPassword, phone: cmPhone || undefined });
      toast.success('Content manager created');
      setShowCreate(false); setCmName(''); setCmEmail(''); setCmPassword(''); setCmPhone('');
      loadUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create content manager');
    } finally { setCreating(false); }
  };

  const statusBadge = (status: string) => status === 'active'
    ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/25">Active</span>
    : <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/25">Inactive</span>;

  const roleBadge = (role: string) => {
    const map: Record<string, string> = { super_admin: 'bg-brand-500/20 text-brand-300', content_manager: 'bg-purple-500/20 text-purple-300', user: 'bg-gray-500/15 text-gray-400' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border border-white/10 ${map[role] || map.user}`}>{role.replace('_', ' ')}</span>;
  };

  return (
    <div className="min-h-screen pt-6 pb-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
      <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 text-sm mt-1">{users.length} user{users.length !== 1 ? 's' : ''} found</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
          <Plus size={16} /> New Content Manager
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-ink-800 border border-ink-600 text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none text-sm" />
        </div>
        <button type="submit" className="px-4 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-all">Search</button>
        {search && <button type="button" onClick={() => { setSearch(''); loadUsers(); }} className="px-3 py-2.5 rounded-lg border border-ink-600 text-gray-400 hover:text-white text-sm transition-all">Clear</button>}
      </form>

      {error && <div className="mb-4 flex items-center gap-2 text-red-400 text-sm"><AlertCircle size={15} />{error}</div>}

      {loading ? (
        <div className="flex justify-center py-20"><Loader size={36} className="text-brand-500 animate-spin" /></div>
      ) : (
        <div className="glass rounded-xl border border-ink-600 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/60 border-b border-ink-700">
              <tr>
                <th className="text-left text-gray-400 px-5 py-3 font-medium">Name</th>
                <th className="text-left text-gray-400 px-5 py-3 font-medium hidden sm:table-cell">Email</th>
                <th className="text-left text-gray-400 px-5 py-3 font-medium">Role</th>
                <th className="text-left text-gray-400 px-5 py-3 font-medium">Status</th>
                <th className="text-left text-gray-400 px-5 py-3 font-medium hidden md:table-cell">Joined</th>
                <th className="text-right text-gray-400 px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-500">No users found</td></tr>
              )}
              {users.map((u: any) => (
                <>
                  <tr key={u._id} className="border-b border-ink-800/50 hover:bg-ink-800/20 transition-colors">
                    <td className="px-5 py-3 text-white font-medium">{u.name}</td>
                    <td className="px-5 py-3 text-gray-400 hidden sm:table-cell">{u.email}</td>
                    <td className="px-5 py-3">{roleBadge(u.role)}</td>
                    <td className="px-5 py-3">{statusBadge(u.status)}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs hidden md:table-cell">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(u._id, u.status)}
                          disabled={!!updating || u.role === 'super_admin'}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 ${
                            u.status === 'active'
                              ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                              : 'bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20'
                          }`}
                        >
                          {updating === u._id ? <Loader size={12} className="animate-spin" /> : u.status === 'active' ? <UserX size={12} /> : <UserCheck size={12} />}
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => handleExpand(u._id)} className="p-1.5 rounded-lg border border-ink-600 text-gray-400 hover:text-white transition-all">
                          {expanded === u._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === u._id && (
                    <tr key={`${u._id}-detail`} className="bg-ink-900/40 border-b border-ink-800/50">
                      <td colSpan={6} className="px-5 py-4">
                        {expandLoading ? (
                          <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader size={14} className="animate-spin" /> Loading details…</div>
                        ) : expandedData ? (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div><p className="text-gray-500 text-xs mb-1">Phone</p><p className="text-gray-300">{expandedData.data?.phone || '—'}</p></div>
                            <div><p className="text-gray-500 text-xs mb-1">Profiles</p><p className="text-gray-300">{expandedData.profileCount ?? 0}</p></div>
                            <div><p className="text-gray-500 text-xs mb-1">Last Login</p><p className="text-gray-300">{expandedData.data?.lastLogin ? new Date(expandedData.data.lastLogin).toLocaleDateString() : '—'}</p></div>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Content Manager Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-ink-850 rounded-2xl border border-ink-600 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink-700">
              <h2 className="text-lg font-bold text-white">Create Content Manager</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateCM} className="p-6 space-y-4">
              {[
                { label: 'Full Name *', value: cmName, set: setCmName, type: 'text', placeholder: 'John Doe' },
                { label: 'Email *', value: cmEmail, set: setCmEmail, type: 'email', placeholder: 'john@example.com' },
                { label: 'Password *', value: cmPassword, set: setCmPassword, type: 'password', placeholder: '••••••••' },
                { label: 'Phone', value: cmPhone, set: setCmPhone, type: 'tel', placeholder: '+1234567890' },
              ].map(({ label, value, set, type, placeholder }) => (
                <div key={label}>
                  <label className="text-sm text-gray-400 mb-1.5 block">{label}</label>
                  <input type={type} value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder}
                    className="w-full px-4 py-2.5 rounded-lg bg-ink-800 border border-ink-600 text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none text-sm" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-ink-600 text-gray-400 hover:text-white text-sm transition-all">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 btn-primary text-sm disabled:opacity-50">
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
