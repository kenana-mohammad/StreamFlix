import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/lib/useToast';
import { useProfile } from '@/lib/profileContext';
import { apiClient } from '@/lib/apiClient';
import { getInitials } from '@/lib/utils';
import ProfilePINModal from '@/components/ProfilePINModal';
import { useNavigate } from 'react-router-dom';

const AVATAR_COLORS = [
  '#ff3b2f', '#3b82f6', '#22c55e', '#f59e0b',
  '#ec4899', '#8b5cf6', '#06b6d4', '#f97316',
];

export default function ProfilesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { setProfileToken, setCurrentProfile } = useProfile();

  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [managing, setManaging] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedProfileForPin, setSelectedProfileForPin] = useState<any>(null);
  const [pinError, setPinError] = useState('');
  const [submittingPin, setSubmittingPin] = useState(false);

  // Add Profile state
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileIsKids, setNewProfileIsKids] = useState(false);
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [addingProfile, setAddingProfile] = useState(false);

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getProfiles();
      const profilesData = Array.isArray(response) ? response : (response?.data || []);
      setProfiles(profilesData);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to load profiles';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProfile = async (profile: any) => {
    if (managing) return;

    try {
      setSubmittingPin(true);
      // Check if profile has PIN - only if profile.pin exists and is not null/empty
      const hasPIN = profile.pin && profile.pin !== null && profile.pin !== '';

      if (hasPIN) {
        // Show PIN modal
        setSelectedProfileForPin(profile);
        setSubmittingPin(false);
      } else {
        // No PIN required, select directly
        const response = await apiClient.selectProfile(profile._id);
        const responseData = response.data || response;
        const selectedProfile = responseData.profile || responseData;
        const token = responseData.token || responseData.profileToken;
        
        if (!token) {
          throw new Error('No profile token received');
        }
        
        setProfileToken(token);
        setCurrentProfile(selectedProfile);
        toast.success(`Welcome to ${selectedProfile.name}!`);
        
        // Check if there's a pending plan subscription
        const redirectToPlan = sessionStorage.getItem('redirectToPlan');
        if (redirectToPlan) {
          sessionStorage.removeItem('redirectToPlan');
          navigate(`/subscription?planId=${redirectToPlan}`);
        } else {
          navigate('/');
        }
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to select profile';
      toast.error(msg);
      setSubmittingPin(false);
    }
  };

  const handlePINSubmit = async (pin: string) => {
    try {
      setSubmittingPin(true);
      setPinError('');

      const response = await apiClient.selectProfile(selectedProfileForPin._id, pin);
      const responseData = response.data || response;
      const selectedProfile = responseData.profile || responseData;
      const token = responseData.token || responseData.profileToken;

      if (!token) {
        throw new Error('No profile token received');
      }

      setProfileToken(token);
      setCurrentProfile(selectedProfile);
      setSelectedProfileForPin(null);
      toast.success(`Welcome to ${selectedProfile.name}!`);
      
      // Check if there's a pending plan subscription
      const redirectToPlan = sessionStorage.getItem('redirectToPlan');
      if (redirectToPlan) {
        sessionStorage.removeItem('redirectToPlan');
        navigate(`/subscription?planId=${redirectToPlan}`);
      } else {
        navigate('/');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Invalid PIN';
      setPinError(msg);
    } finally {
      setSubmittingPin(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      toast.error('Please enter a profile name');
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
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to create profile';
      toast.error(msg);
    } finally {
      setAddingProfile(false);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    try {
      await apiClient.deleteProfile(profileId);
      toast.success('Profile deleted successfully');
      await loadProfiles();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to delete profile';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading profiles...</p>
        </div>
      </div>
    );
  }

  const primaryProfile = profiles.find((p) => p.primaryProfile);
  const secondaryProfiles = profiles.filter((p) => !p.primaryProfile);
  const canAddMore = profiles.length < 6;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 bg-ink-950">
      <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2 text-center">
        {managing ? 'Manage Profiles' : "Who's watching?"}
      </h1>
      <p className="text-gray-400 mb-12 text-center max-w-md">
        {managing ? 'Add, edit, or remove your profiles' : 'Select a profile to start streaming'}
      </p>

      <div className="flex flex-wrap items-start justify-center gap-6 sm:gap-8 max-w-4xl">
        {/* Primary Profile */}
        {primaryProfile && (
          <div key={primaryProfile._id} className="flex flex-col items-center group">
            <div className="relative">
              <button
                onClick={() => handleSelectProfile(primaryProfile)}
                disabled={submittingPin}
                className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden transition-all hover:ring-4 hover:ring-white/30 disabled:opacity-50"
                style={{ backgroundColor: primaryProfile.avatar || '#ff3b2f' }}
              >
                <div className="w-full h-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold">
                  {getInitials(primaryProfile.name)}
                </div>
              </button>

              {primaryProfile.isPinProtected && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
                  <Lock size={12} className="text-white" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <p className="text-gray-300 font-medium text-sm sm:text-base">{primaryProfile.name}</p>
              <ShieldCheck size={14} className="text-gold-500" />
            </div>

            {managing && (
              <button
                onClick={() => handleDeleteProfile(primaryProfile._id)}
                className="text-xs text-gray-400 hover:text-error-500 transition-colors mt-2"
                title="Primary profile cannot be deleted"
                disabled
              >
                <span className="text-gray-500 text-xs">Primary (locked)</span>
              </button>
            )}
          </div>
        )}

        {/* Secondary Profiles */}
        {secondaryProfiles.map((profile) => (
          <div key={profile._id} className="flex flex-col items-center group">
            <div className="relative">
              <button
                onClick={() => handleSelectProfile(profile)}
                disabled={submittingPin}
                className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden transition-all hover:ring-4 hover:ring-white/30 disabled:opacity-50"
                style={{ backgroundColor: profile.avatar || '#3b82f6' }}
              >
                <div className="w-full h-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold">
                  {getInitials(profile.name)}
                </div>
                {profile.isKids && (
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] bg-white/20 text-white font-bold">
                    KIDS
                  </span>
                )}
              </button>

              {profile.isPinProtected && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
                  <Lock size={12} className="text-white" />
                </div>
              )}
            </div>

            <p className="text-gray-300 font-medium text-sm sm:text-base mt-3">{profile.name}</p>

            {managing && (
              <button
                onClick={() => handleDeleteProfile(profile._id)}
                className="text-xs text-gray-400 hover:text-error-500 transition-colors mt-2 flex items-center gap-1"
              >
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>
        ))}

        {/* Add Profile Button */}
        {canAddMore && managing && (
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

      <div className="mt-12 flex gap-4">
        <button
          onClick={() => setManaging(!managing)}
          className="px-6 py-2.5 border border-ink-500 text-gray-300 hover:border-white hover:text-white rounded-md font-medium transition-all"
        >
          {managing ? 'Done' : 'Manage Profiles'}
        </button>
        <button
          onClick={async () => {
            try {
              await apiClient.logout();
              toast.success('Logged out successfully');
              // Use window.location for hard redirect to ensure clean state
              window.location.href = '/login';
            } catch (err) {
              toast.error('Error logging out');
            }
          }}
          className="px-6 py-2.5 border border-error-500 text-error-400 hover:border-error-400 hover:text-error-300 rounded-md font-medium transition-all"
        >
          Logout
        </button>
      </div>

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
                  className="input-field"
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
                disabled={addingProfile || !newProfileName.trim()}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingProfile ? 'Creating...' : 'Create Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      {selectedProfileForPin && (
        <ProfilePINModal
          profileName={selectedProfileForPin.name}
          onSubmit={handlePINSubmit}
          onCancel={() => {
            setSelectedProfileForPin(null);
            setPinError('');
          }}
          isLoading={submittingPin}
          error={pinError}
        />
      )}
    </div>
  );
}
