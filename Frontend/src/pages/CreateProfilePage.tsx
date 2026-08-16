import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, X, AlertCircle, Loader } from 'lucide-react';
import { useToast } from '@/lib/useToast';
import { apiClient } from '@/lib/apiClient';
import { getInitials } from '@/lib/utils';

const AVATAR_COLORS = [
  '#ff3b2f', '#3b82f6', '#22c55e', '#f59e0b',
  '#ec4899', '#8b5cf6', '#06b6d4', '#f97316',
];

export default function CreateProfilePage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [profiles, setProfiles] = useState<any[]>([]);
  const [maxProfiles, setMaxProfiles] = useState<number>(6); // Default
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Add Profile state
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileIsKids, setNewProfileIsKids] = useState(false);
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [addingProfile, setAddingProfile] = useState(false);

  // Load existing profiles and get max profiles from subscription
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);

      // Get profiles
      const profilesRes = await apiClient.getProfiles();
      const profilesData = Array.isArray(profilesRes) ? profilesRes : (profilesRes?.data || []);
      setProfiles(profilesData);

      // Get subscription to know maxProfiles
      try {
        const subsRes = await apiClient.getMySubscriptions();
        const subscriptions = Array.isArray(subsRes) ? subsRes : (subsRes?.data || []);
        
        if (subscriptions.length > 0) {
          const activeSub = subscriptions.find((s: any) => s.status === 'active');
          if (activeSub && activeSub.planId?.maxProfiles) {
            setMaxProfiles(activeSub.planId.maxProfiles);
          }
        }
      } catch (err) {
        console.error('Failed to load subscription:', err);
        // Default to 6 if fails
        setMaxProfiles(6);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to load profiles';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      toast.error('Please enter a profile name');
      return;
    }

    if (profiles.length >= maxProfiles) {
      toast.error(`You have reached the maximum number of profiles (${maxProfiles})`);
      return;
    }

    try {
      setAddingProfile(true);
      await apiClient.createProfile({
        name: newProfileName.trim(),
        isKids: newProfileIsKids,
        avatar: selectedColor,
      });

      toast.success('Profile created successfully');
      setAdding(false);
      setNewProfileName('');
      setNewProfileIsKids(false);
      setSelectedColor(AVATAR_COLORS[0]);
      await loadProfiles();
      
      // If this was the first profile created, close the modal so user can continue
      // They'll see the continue button if they have at least the primary + this new one
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to create profile';
      toast.error(msg);
    } finally {
      setAddingProfile(false);
    }
  };

  const canAddMore = profiles.length < maxProfiles;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950">
        <div className="text-center">
          <Loader size={40} className="text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 bg-ink-950">
      <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2 text-center">
        Create Your Profiles
      </h1>
      <p className="text-gray-400 mb-12 text-center max-w-md">
        Set up {maxProfiles} profile{maxProfiles !== 1 ? 's' : ''} for your household
      </p>

      <div className="flex flex-wrap items-start justify-center gap-6 sm:gap-8 max-w-4xl mb-12">
        {/* Existing Profiles */}
        {profiles.map((profile) => (
          <div key={profile._id} className="flex flex-col items-center">
            <div className="relative">
              <div
                className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden transition-all hover:ring-4 hover:ring-white/30"
                style={{ backgroundColor: profile.avatar || '#ff3b2f' }}
              >
                <div className="w-full h-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold">
                  {getInitials(profile.name)}
                </div>
              </div>
              {profile.primaryProfile && (
                <div className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-gold-500 text-white text-xs font-bold">
                  Primary
                </div>
              )}
            </div>
            <p className="text-gray-300 font-medium text-sm sm:text-base mt-3">{profile.name}</p>
          </div>
        ))}

        {/* Add Profile Button */}
        {canAddMore && (
          <div className="flex flex-col items-center">
            <button
              onClick={() => setAdding(true)}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg border-2 border-dashed border-ink-500 flex items-center justify-center text-gray-500 hover:border-white hover:text-white transition-all"
            >
              <Plus size={40} />
            </button>
            <p className="text-gray-400 font-medium text-sm sm:text-base mt-3">Add Profile</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mb-8 px-4 sm:px-6 lg:px-0 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg max-w-md">
        <p className="text-blue-300 text-sm">
          <strong>Profiles Created:</strong> {profiles.length} / {maxProfiles}
        </p>
        {canAddMore && (
          <p className="text-blue-400 text-sm mt-2">
            You can add {maxProfiles - profiles.length} more profile{maxProfiles - profiles.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Continue Button */}
      <button
        onClick={() => {
          // Check if there's a pending plan subscription
          const redirectToPlan = sessionStorage.getItem('redirectToPlan');
          if (redirectToPlan) {
            sessionStorage.removeItem('redirectToPlan');
            navigate(`/subscription?planId=${redirectToPlan}`);
          } else {
            navigate('/profiles');
          }
        }}
        disabled={profiles.length === 0}
        className="px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold transition-all disabled:opacity-50"
      >
        Continue to Profile Selection
      </button>

      {/* Add Profile Modal */}
      {adding && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setAdding(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-ink-850 rounded-2xl p-6 border border-ink-600 shadow-2xl animate-scaleIn"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create New Profile</h2>
              <button
                onClick={() => setAdding(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Profile Name</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="e.g., Kids, Family"
                  className="w-full px-4 py-2.5 rounded-lg bg-ink-800 border border-ink-600 text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none"
                  autoFocus
                  disabled={addingProfile}
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Avatar Color</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        selectedColor === color ? 'ring-2 ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newProfileIsKids}
                  onChange={(e) => setNewProfileIsKids(e.target.checked)}
                  className="w-5 h-5 rounded accent-brand-500"
                  disabled={addingProfile}
                />
                <span className="text-gray-300 text-sm">Kids profile (age-restricted content)</span>
              </label>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-2">
                <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-300">
                  Secondary profiles will have access to all content unless the main profile restricts it.
                </p>
              </div>

              <button
                onClick={handleCreateProfile}
                disabled={addingProfile || !newProfileName.trim() || profiles.length >= maxProfiles}
                className="w-full px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingProfile ? 'Creating...' : 'Create Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
