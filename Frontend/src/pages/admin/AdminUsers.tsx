import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/lib/profileContext';
import { ArrowLeft } from 'lucide-react';

export default function AdminUsers() {
  const navigate = useNavigate();
  const { profileToken } = useProfile();

  if (!profileToken) return null;

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8"
        >
          <ArrowLeft size={18} /> Back to Admin
        </button>

        <h1 className="text-3xl font-bold text-white mb-8">User Management</h1>

        <div className="glass rounded-xl border border-ink-600 p-8 text-center">
          <p className="text-gray-400 mb-4">Users module is coming soon</p>
          <p className="text-gray-500 text-sm">This section will allow you to manage user accounts, view statistics, and handle user support.</p>
        </div>
      </div>
    </div>
  );
}
